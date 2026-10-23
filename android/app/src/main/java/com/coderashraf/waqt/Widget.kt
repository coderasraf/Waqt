package com.coderashraf.waqt

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.SystemClock
import android.widget.RemoteViews
import com.coderashraf.waqt.core.Bangla
import com.coderashraf.waqt.core.Config
import com.coderashraf.waqt.core.Hijri
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Text

/**
 * Home-screen widget: the next prayer with a live countdown (a native
 * Chronometer, so it ticks without waking the app), the Hijri and Bangla
 * dates, and today's five times. Refreshed by the alarm chain at every
 * prayer time.
 */
class NextPrayerWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        Repo.init(ctx)
        Widget.updateAll(ctx)
    }
}

object Widget {
    private val TIME_IDS = intArrayOf(R.id.w_t0, R.id.w_t1, R.id.w_t2, R.id.w_t3, R.id.w_t4)

    fun updateAll(ctx: Context) {
        val mgr = AppWidgetManager.getInstance(ctx)
        val ids = mgr.getAppWidgetIds(ComponentName(ctx, NextPrayerWidget::class.java))
        if (ids.isEmpty()) return
        val views = build(ctx)
        mgr.updateAppWidget(ids, views)
    }

    fun build(ctx: Context): RemoteViews {
        val cfg = Repo.cfg
        val lang = cfg.language
        val now = System.currentTimeMillis()
        val today = Schedule.localDate(cfg, now)
        val day = Schedule.day(cfg, today)
        val (_, next) = Schedule.currentAndNext(cfg, now)
        val nextDay = Schedule.day(cfg, Schedule.localDate(cfg, next.at))
        val v = RemoteViews(ctx.packageName, R.layout.widget_next)

        v.setTextViewText(R.id.w_label, if (lang == "bn") "পরবর্তী নামাজ" else "Next prayer")
        v.setTextViewText(R.id.w_name, Text.prayer(next.key, lang, nextDay.friday))
        v.setTextViewText(R.id.w_arabic, Text.arabic(next.key, nextDay.friday))
        v.setTextViewText(R.id.w_at, Text.t(cfg, next.at, nextDay.tzOffsetMin))
        // Chronometer counts down to the next prayer on its own.
        v.setChronometer(R.id.w_count, SystemClock.elapsedRealtime() + (next.at - now), null, true)
        v.setChronometerCountDown(R.id.w_count, true)

        val h = Schedule.calendar(cfg).fromGregorian(today)
        val b = Bangla.from(today)
        val hName = (if (lang == "bn") Hijri.MONTHS_BN else Hijri.MONTHS_EN)[h.month - 1]
        val bName = (if (lang == "bn") Bangla.MONTHS_BN else Bangla.MONTHS_EN)[b.month - 1]
        v.setTextViewText(R.id.w_date, Text.digits("${h.day} $hName · ${b.day} $bName", lang == "bn" && cfg.banglaDigits))

        Config.PRAYERS.forEachIndexed { i, p ->
            val t = Text.time(day.get(p), day.tzOffsetMin, cfg.clock, lang, cfg.banglaDigits).replace(" AM", "").replace(" PM", "")
                .replace(Regex("^(ভোর|সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত) "), "")
            val label = Text.prayer(p, lang, day.friday)
            v.setTextViewText(TIME_IDS[i], "$label\n$t")
            v.setTextColor(TIME_IDS[i], if (p == next.key && next.at == day.get(p)) 0xFFF3C66B.toInt() else 0xDDFFFFFF.toInt())
        }
        v.setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx))
        return v
    }
}
