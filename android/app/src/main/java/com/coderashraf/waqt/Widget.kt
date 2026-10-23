package com.coderashraf.waqt

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import com.coderashraf.waqt.core.Bangla
import com.coderashraf.waqt.core.Config
import com.coderashraf.waqt.core.Hijri
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Text
import org.json.JSONArray
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Home-screen widgets: the next prayer with a live countdown (a native
 * Chronometer, so it ticks without waking the app), the Hijri and Bangla
 * dates, and today's five times; a small next-prayer widget; the ayah and
 * the Name of Allah of the day; Sehri and Iftar; and the Hijri date. All are
 * refreshed by the alarm chain at every prayer time, and every half hour.
 */
class NextPrayerWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        Repo.init(ctx)
        Widget.updateAll(ctx)
    }
}
class SmallPrayerWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { Repo.init(ctx); Widget.updateAll(ctx) }
}
class VerseWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { Repo.init(ctx); Widget.updateAll(ctx) }
}
class NameWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { Repo.init(ctx); Widget.updateAll(ctx) }
}
class FastWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { Repo.init(ctx); Widget.updateAll(ctx) }
}
class HijriWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { Repo.init(ctx); Widget.updateAll(ctx) }
}

object Widget {
    private val TIME_IDS = intArrayOf(R.id.w_t0, R.id.w_t1, R.id.w_t2, R.id.w_t3, R.id.w_t4)

    /// Short verses that fit the widget, one a day in turn.
    private val VERSES = listOf("1:5", "2:45", "2:152", "2:153", "3:8", "3:31", "3:92", "3:139", "3:200", "4:28", "6:162", "9:51", "9:129", "10:62", "13:28", "15:9",
        "16:128", "18:10", "20:25", "23:118", "25:63", "28:24", "29:69", "33:41", "35:15", "40:60", "42:19", "47:7", "49:10", "50:16", "51:56", "55:13", "87:14",
        "93:3", "93:5", "94:5", "94:6", "97:3", "103:2", "112:1")
    private val MONTHS_BN = listOf("জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর")
    private val DAYS_BN = listOf("সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি", "রবি")
    private var names: JSONArray? = null

    /** Each kind: its provider, how it is drawn, and its size (dp) in the in-app gallery. */
    class Kind(val cls: Class<*>, val make: (Context) -> RemoteViews, val w: Int, val h: Int)
    val KINDS = linkedMapOf(
        "next" to Kind(NextPrayerWidget::class.java, ::build, 340, 150), "small" to Kind(SmallPrayerWidget::class.java, ::small, 160, 160),
        "verse" to Kind(VerseWidget::class.java, ::verse, 340, 170), "name" to Kind(NameWidget::class.java, ::name, 160, 160),
        "fast" to Kind(FastWidget::class.java, ::fast, 340, 84), "hijri" to Kind(HijriWidget::class.java, ::hijri, 250, 84))

    fun updateAll(ctx: Context) {
        val mgr = AppWidgetManager.getInstance(ctx)
        for (k in KINDS.values) {
            val ids = mgr.getAppWidgetIds(ComponentName(ctx, k.cls))
            if (ids.isEmpty()) continue
            // One widget's trouble (a missing file, say) must not stop the others.
            runCatching { mgr.updateAppWidget(ids, k.make(ctx)) }
        }
    }

    /** A widget drawn through the real RemoteViews inflater, as a PNG data URL. Main thread. */
    fun preview(ctx: Context, kind: String): String {
        val k = KINDS.getValue(kind)
        val dp = ctx.resources.displayMetrics.density
        val w = (k.w * dp).toInt(); val h = (k.h * dp).toInt()
        val box = android.widget.FrameLayout(ctx)
        val v = k.make(ctx).apply(ctx, box)
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY))
        v.layout(0, 0, w, h)
        val bmp = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888)
        v.draw(android.graphics.Canvas(bmp))
        val out = java.io.ByteArrayOutputStream()
        bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
        bmp.recycle()
        return "data:image/png;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
    }

    /** Which kinds are already on the home screen. */
    fun placed(ctx: Context): List<String> {
        val mgr = AppWidgetManager.getInstance(ctx)
        return KINDS.filter { mgr.getAppWidgetIds(ComponentName(ctx, it.value.cls)).isNotEmpty() }.keys.toList()
    }

    /** Asks the launcher to place a widget; false if it can't. */
    fun pin(ctx: Context, kind: String): Boolean {
        val mgr = AppWidgetManager.getInstance(ctx)
        val k = KINDS[kind] ?: return false
        return mgr.isRequestPinAppWidgetSupported && mgr.requestPinAppWidget(ComponentName(ctx, k.cls), null, null)
    }

    private fun bn() = Repo.cfg.language == "bn"
    private fun num(s: String) = Text.digits(s, bn() && Repo.cfg.banglaDigits)
    /// A time without "AM" or the Bengali part of the day, where space is short.
    private fun bare(t: String) = t.replace(" AM", "").replace(" PM", "").replace(Regex("^(ভোর|সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত) "), "")
    private fun today(): LocalDate = Schedule.localDate(Repo.cfg, System.currentTimeMillis())

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

    /** The next prayer and its countdown, for a small square. */
    fun small(ctx: Context): RemoteViews {
        val cfg = Repo.cfg
        val now = System.currentTimeMillis()
        val (_, next) = Schedule.currentAndNext(cfg, now)
        val nextDay = Schedule.day(cfg, Schedule.localDate(cfg, next.at))
        return RemoteViews(ctx.packageName, R.layout.widget_small).apply {
            setTextViewText(R.id.s_label, if (bn()) "পরবর্তী নামাজ" else "Next prayer")
            setTextViewText(R.id.s_name, Text.prayer(next.key, cfg.language, nextDay.friday))
            setTextViewText(R.id.s_arabic, Text.arabic(next.key, nextDay.friday))
            setTextViewText(R.id.s_at, Text.t(cfg, next.at, nextDay.tzOffsetMin))
            setChronometer(R.id.s_count, SystemClock.elapsedRealtime() + (next.at - now), null, true)
            setChronometerCountDown(R.id.s_count, true)
            setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx))
        }
    }

    /** The ayah of the day: Arabic, its meaning, and where it is. */
    fun verse(ctx: Context): RemoteViews {
        val ref = VERSES[Math.floorMod(today().toEpochDay(), VERSES.size.toLong()).toInt()]
        val (s, n) = ref.split(":").map { it.toInt() }
        val file = "%03d".format(s)
        val words = JSONArray(ctx.assets.open("quran/ar/$file.json").bufferedReader().use { it.readText() }).getJSONObject(n - 1).getJSONArray("u")
        val ar = (0 until words.length()).joinToString(" ") { words.getString(it).replace(Regex("\\{[a-z_]+\\|([^}]*)\\}"), "$1") }
        val mean = QuranFiles.translation(ctx, if (bn()) 161 else 20, s).optString(n - 1)
            .replace(Regex("<sup[^>]*>.*?</sup>"), "").replace(Regex("<[^>]+>"), "").trim()
        val ch = QuranFiles.meta(ctx).getJSONArray("chapters").getJSONObject(s - 1)
        return RemoteViews(ctx.packageName, R.layout.widget_verse).apply {
            setTextViewText(R.id.v_label, if (bn()) "আজকের আয়াত" else "Ayah of the day")
            setTextViewText(R.id.v_ref, num("${ch.optString(if (bn()) "bn" else "en")} $ref"))
            setTextViewText(R.id.v_ar, ar)
            setTextViewText(R.id.v_mean, mean)
            setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx, "quran/$s/$n"))
        }
    }

    /** The Name of Allah of the day, the same one the app shows. */
    fun name(ctx: Context): RemoteViews {
        val all = names ?: JSONArray(ctx.assets.open("web/names.json").bufferedReader().use { it.readText() }).also { names = it }
        val x = all.getJSONArray(Math.floorMod(today().toEpochDay(), all.length().toLong()).toInt())
        return RemoteViews(ctx.packageName, R.layout.widget_name).apply {
            setTextViewText(R.id.n_label, if (bn()) "আল্লাহর নাম" else "Name of Allah")
            setTextViewText(R.id.n_ar, x.getString(0))
            setTextViewText(R.id.n_tr, if (bn()) x.getString(3) else x.getString(1))
            setTextViewText(R.id.n_mean, if (bn()) x.getString(4) else x.getString(2))
            setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx, "names"))
        }
    }

    /** Today's Sehri and Iftar (tomorrow's, once Iftar has passed), counting down to the next. */
    fun fast(ctx: Context): RemoteViews {
        val cfg = Repo.cfg
        val now = System.currentTimeMillis()
        val today = today()
        val d0 = Schedule.day(cfg, today)
        val d = if (now >= d0.maghrib) Schedule.day(cfg, today.plusDays(1)) else d0
        val h = Schedule.calendar(cfg).fromGregorian(d.date)
        val sehriNext = now < d.imsak
        val v = RemoteViews(ctx.packageName, R.layout.widget_fast)
        v.setTextViewText(R.id.f_label, if (bn()) "সাহরি ও ইফতার" else "Sehri & Iftar")
        v.setTextViewText(R.id.f_day, when {
            h.month == 9 -> num(if (bn()) "রমজান · ${h.day}তম দিন" else "Ramadan · day ${h.day}")
            d.date == today -> if (bn()) "আজকের রোজা" else "Today's fast"
            else -> if (bn()) "আগামীকালের রোজা" else "Tomorrow's fast"
        })
        v.setTextViewText(R.id.f_s_label, if (bn()) "সাহরি শেষ" else "Sehri ends")
        v.setTextViewText(R.id.f_i_label, if (bn()) "ইফতার" else "Iftar")
        v.setTextViewText(R.id.f_s_time, bare(Text.t(cfg, d.imsak, d.tzOffsetMin)))
        v.setTextViewText(R.id.f_i_time, bare(Text.t(cfg, d.maghrib, d.tzOffsetMin)))
        // The countdown sits under whichever comes next.
        val (on, off) = if (sehriNext) R.id.f_s_count to R.id.f_i_count else R.id.f_i_count to R.id.f_s_count
        v.setViewVisibility(on, View.VISIBLE)
        v.setViewVisibility(off, View.GONE)
        v.setChronometer(on, SystemClock.elapsedRealtime() + ((if (sehriNext) d.imsak else d.maghrib) - now), null, true)
        v.setChronometerCountDown(on, true)
        v.setTextColor(R.id.f_s_time, if (sehriNext) 0xFFF3C66B.toInt() else 0xFFFFFFFF.toInt())
        v.setTextColor(R.id.f_i_time, if (sehriNext) 0xFFFFFFFF.toInt() else 0xFFF3C66B.toInt())
        v.setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx, "ramadan"))
        return v
    }

    /** The Hijri date (turning at Maghrib if the user chose so), with the Bangla and Gregorian dates. */
    fun hijri(ctx: Context): RemoteViews {
        val cfg = Repo.cfg
        val now = System.currentTimeMillis()
        val today = today()
        val d0 = Schedule.day(cfg, today)
        val hDate = if (cfg.calc.optBoolean("hijri_at_maghrib") && now >= d0.maghrib) today.plusDays(1) else today
        val h = Schedule.calendar(cfg).fromGregorian(hDate)
        val b = Bangla.from(today)
        val month = (if (bn()) Hijri.MONTHS_BN else Hijri.MONTHS_EN)[h.month - 1]
        val greg = if (bn()) "${DAYS_BN[today.dayOfWeek.value - 1]} ${today.dayOfMonth} ${MONTHS_BN[today.monthValue - 1]}"
            else today.format(DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH))
        return RemoteViews(ctx.packageName, R.layout.widget_hijri).apply {
            setTextViewText(R.id.h_day, num("${h.day}"))
            setTextViewText(R.id.h_month, num("$month ${h.year}"))
            setTextViewText(R.id.h_other, num("${b.day} ${(if (bn()) Bangla.MONTHS_BN else Bangla.MONTHS_EN)[b.month - 1]} · $greg"))
            setOnClickPendingIntent(R.id.widget_root, Notifier.openApp(ctx, "calendar"))
        }
    }
}
