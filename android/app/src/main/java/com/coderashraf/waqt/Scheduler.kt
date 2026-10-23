package com.coderashraf.waqt

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.app.NotificationManager
import android.os.Build
import com.coderashraf.waqt.core.Alerts
import com.coderashraf.waqt.core.Alerts.Due
import com.coderashraf.waqt.core.Alerts.Kind
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Text
import org.json.JSONObject

/**
 * One alarm at a time: always the next thing due. When it fires, everything
 * due by then is handled once (tracked by `lastFired`) and the next alarm
 * is set. The chain is restarted on boot, time and time-zone changes.
 */
object Scheduler {
    /** Alarms can arrive a little late on some phones; later than this, skip. */
    private const val LATE_LIMIT = 5 * 60_000L

    fun canExact(ctx: Context): Boolean {
        val am = ctx.getSystemService(AlarmManager::class.java)
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
    }

    private fun dues(now: Long): List<Due> {
        val cfg = Repo.cfg
        val today = Schedule.localDate(cfg, now)
        val list = mutableListOf<Due>()
        for (d in listOf(today.minusDays(1), today, today.plusDays(1))) list += Alerts.forDay(cfg, Schedule.day(cfg, d))
        val test = Repo.store.json.optLong("test_at")
        if (test > 0) list += Due("test|adhan", test, Kind.ADHAN, "test")
        return list.sortedBy { it.at }
    }

    private fun pending(ctx: Context): PendingIntent =
        PendingIntent.getBroadcast(ctx, 1, Intent(ctx, AlarmReceiver::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun reschedule(ctx: Context) {
        val now = System.currentTimeMillis()
        val after = maxOf(now, Repo.store.lastFired)
        val next = dues(now).firstOrNull { it.at > after } ?: return
        val am = ctx.getSystemService(AlarmManager::class.java)
        val pi = pending(ctx)
        am.cancel(pi)
        if (canExact(ctx)) {
            if (next.critical) {
                val show = PendingIntent.getActivity(ctx, 2, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
                am.setAlarmClock(AlarmManager.AlarmClockInfo(next.at, show), pi)
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.at, pi)
            }
        } else {
            // Without the exact-alarm permission Android may delay this; the
            // health check asks the user to allow it.
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.at, pi)
        }
        Repo.store.json.put("next_alarm", JSONObject().put("at", next.at).put("key", next.key).put("exact", canExact(ctx)))
        Repo.store.save()
    }

    /** Called when the alarm fires. */
    fun process(ctx: Context) {
        val now = System.currentTimeMillis()
        val last = Repo.store.lastFired
        val due = dues(now).filter { it.at > last && it.at <= now + 1500 }
        Repo.store.lastFired = now
        Repo.store.save()
        for (d in due) {
            if (now - d.at <= LATE_LIMIT) runCatching { fire(ctx, d) }
        }
        reschedule(ctx)
        Widget.updateAll(ctx)
    }

    private fun fire(ctx: Context, due: Due) {
        val cfg = Repo.cfg
        val day = Schedule.day(cfg, Schedule.localDate(cfg, due.at))
        val bn = cfg.language == "bn"
        val t = { ms: Long -> Text.t(cfg, ms, day.tzOffsetMin) }
        val n = { v: Int -> Text.n(cfg, v) }
        val muted = Repo.mutedToday()
        when (due.kind) {
            Kind.ADHAN -> {
                if (due.prayer == "test") {
                    Repo.store.json.remove("test_at")
                    AdhanService.start(ctx, "test", cfg.prayer("dhuhr").optString("sound", "makkah"), false, due.at)
                    return
                }
                val p = due.prayer
                val mode = cfg.prayer(p).optString("mode", "adhan")
                val ramadan = Schedule.calendar(cfg).fromGregorian(day.date).month == 9
                Repo.alert = JSONObject().put("prayer", p).put("at", due.at).put("friday", day.friday)
                    .put("ramadan", ramadan).put("mode", mode).put("fired", System.currentTimeMillis())
                val wake = p == "fajr" && cfg.phone.optBoolean("fajr_wake")
                if (!muted && (mode == "adhan" || wake)) {
                    AdhanService.start(ctx, p, cfg.prayer(p).optString("sound", Sounds.fallback(p)), wake, due.at)
                } else {
                    val name = Text.prayer(p, cfg.language, day.friday)
                    val title = "$name · ${Text.arabic(p, day.friday)}"
                    val body = if (p == "maghrib" && ramadan) {
                        if (bn) "ইফতারের সময় হয়েছে! মাগরিব ${t(day.maghrib)}" else "Iftar time! Maghrib at ${t(day.maghrib)}"
                    } else if (bn) "$name-এর ওয়াক্ত হয়েছে — ${t(due.at)}" else "It's time for $name — ${t(due.at)}"
                    Notifier.post(ctx, Notifier.ID_PRAYER, if (mode == "chime" && !muted) Notifier.CH_REMINDERS else Notifier.CH_QUIET, title, body)
                    Repo.store.logDelivery(due.key, due.at, System.currentTimeMillis(), mode)
                    Repo.store.save()
                }
            }
            Kind.REMINDER -> {
                val name = Text.prayer(due.prayer, cfg.language, day.friday)
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "$name আসছে", "$name-এর আর ${n(due.minutes)} মিনিট বাকি (${t(day.get(due.prayer))})")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "$name soon", "$name in ${due.minutes} minutes (${t(day.get(due.prayer))})")
            }
            Kind.SUNRISE_WARNING -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "ফজরের সময় শেষ হচ্ছে", "ফজরের ওয়াক্ত শেষ হতে ${n(due.minutes)} মিনিট বাকি — সূর্যোদয় ${t(day.sunrise)}")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "Fajr is ending", "Fajr ends in ${due.minutes} minutes — sunrise at ${t(day.sunrise)}")
            }
            Kind.SEHRI -> {
                if (!muted) AdhanService.start(ctx, "sehri", "short", false, due.at)
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "সাহরির সময়", "সাহরির শেষ সময় ${t(day.imsak)} — আর ${n(due.minutes)} মিনিট")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "Time for Sehri", "Sehri ends at ${t(day.imsak)} — ${due.minutes} minutes left")
            }
            Kind.JUMUAH -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "জুমা মোবারক", "আজ জুমা, ${t(day.dhuhr)}। সূরা কাহফ পড়ুন ও বেশি বেশি দরুদ পাঠ করুন।")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "Jumu'ah Mubarak", "Jumu'ah today at ${t(day.dhuhr)}. Read Surah Al-Kahf and send salawat on the Prophet ﷺ.")
            }
            Kind.TAHAJJUD -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "তাহাজ্জুদ", "রাতের শেষ তৃতীয়াংশ শুরু হয়েছে — তাহাজ্জুদ ও দোয়ার উত্তম সময়।")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "Tahajjud", "The last third of the night has begun — a blessed time for Tahajjud and du'a.")
            }
            Kind.QURAN_GOAL -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "আজকের তিলাওয়াত", "আপনার খতমের আজকের অংশ পড়ার সময়।", "quran/goal")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "Today's Quran reading", "Time for today's portion of your khatm.", "quran/goal")
            }
            Kind.AZKAR_MORNING -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "সকালের যিকির", "সকালের যিকির পড়ার সময় — কয়েক মিনিটেই দিনের সুরক্ষা।", "azkar/s/morning")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "Morning adhkar", "Time for the morning remembrance — a few minutes of protection for the day.", "azkar/s/morning")
            }
            Kind.AZKAR_EVENING -> {
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "সন্ধ্যার যিকির", "সন্ধ্যার যিকির পড়ার সময় — রাতের জন্য সুরক্ষা।", "azkar/s/evening")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_QUIET, "Evening adhkar", "Time for the evening remembrance — protection for the night.", "azkar/s/evening")
            }
            Kind.LEAVE -> {
                val name = Text.prayer(due.prayer, cfg.language, day.friday)
                if (bn) Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "মসজিদে রওনা দিন", "$name-এর জামাত ${t(due.extra)} — হেঁটে ${n(due.minutes)} মিনিট")
                else Notifier.post(ctx, Notifier.ID_REMINDER, Notifier.CH_REMINDERS, "Time to leave for the mosque", "$name jamaat at ${t(due.extra)} — ${due.minutes} min walk")
            }
            Kind.SILENT_ON -> silence(ctx, true, Text.prayer(due.prayer, cfg.language, day.friday))
            Kind.SILENT_OFF -> silence(ctx, false, "")
            Kind.REFRESH -> {}
        }
    }

    /** Puts the phone on vibrate for the jamaat, then restores it. */
    private fun silence(ctx: Context, on: Boolean, name: String) {
        val am = ctx.getSystemService(AudioManager::class.java)
        val store = Repo.store
        runCatching {
            if (on) {
                if (am.ringerMode == AudioManager.RINGER_MODE_NORMAL) {
                    store.savedRinger = AudioManager.RINGER_MODE_NORMAL
                    am.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                    val bn = Repo.cfg.language == "bn"
                    Notifier.post(ctx, Notifier.ID_SILENT, Notifier.CH_QUIET,
                        if (bn) "ফোন ভাইব্রেশনে" else "Phone on vibrate",
                        if (bn) "$name-এর জামাতের জন্য। পরে আবার চালু হবে।" else "For $name jamaat. Sound comes back on automatically.")
                }
            } else if (store.savedRinger >= 0) {
                if (am.ringerMode == AudioManager.RINGER_MODE_VIBRATE) am.ringerMode = store.savedRinger
                store.savedRinger = -1
                ctx.getSystemService(NotificationManager::class.java).cancel(Notifier.ID_SILENT)
            }
        }
        store.save()
    }
}
