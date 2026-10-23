package com.coderashraf.waqt.core

import java.time.LocalTime

/** Everything that should sound, notify or act on a day. */
object Alerts {
    enum class Kind { ADHAN, REMINDER, SUNRISE_WARNING, SEHRI, JUMUAH, TAHAJJUD, AZKAR_MORNING, AZKAR_EVENING, QURAN_GOAL, LEAVE, SILENT_ON, SILENT_OFF, REFRESH }

    data class Due(val key: String, val at: Long, val kind: Kind, val prayer: String = "", val minutes: Int = 0, val extra: Long = 0) {
        /** Alarms that must ring exactly even in deep sleep (use setAlarmClock). */
        val critical get() = kind == Kind.ADHAN || kind == Kind.SEHRI
    }

    /**
     * The jamaat (iqamah) time for a prayer at the user's mosque: a number
     * of minutes after the adhan, or a fixed "HH:MM". On Fridays, Dhuhr uses
     * the Jumu'ah setting. Null when not set.
     */
    fun jamaatAt(cfg: Config, day: Day, prayer: String): Long? {
        val jam = cfg.phone.optJSONObject("jamaat") ?: return null
        val key = if (prayer == "dhuhr" && day.friday && jam.has("jumuah") && jam.opt("jumuah").toString() !in listOf("0", "")) "jumuah" else prayer
        val v = jam.opt(key)?.toString()?.trim().orEmpty()
        if (v.isEmpty() || v == "0") return null
        v.toIntOrNull()?.let { return if (it > 0) day.get(prayer) + it * 60_000L else null }
        val t = runCatching { LocalTime.parse(if (v.length == 4) "0$v" else v) }.getOrNull() ?: return null
        val zone = Schedule.zone(cfg)
        return day.date.atTime(t).atZone(zone).toInstant().toEpochMilli()
    }

    fun forDay(cfg: Config, day: Day): List<Due> {
        val date = day.date
        val out = mutableListOf<Due>()
        for (p in Config.PRAYERS) {
            val a = cfg.prayer(p)
            val mode = a.optString("mode", "adhan")
            // The widget refreshes at every prayer time, whatever the mode.
            out += Due("$date|$p|refresh", day.get(p), Kind.REFRESH, p)
            if (mode == "off") continue
            out += Due("$date|$p|adhan", day.get(p), Kind.ADHAN, p)
            val rem = a.optInt("reminder")
            if (rem > 0) out += Due("$date|$p|reminder", day.get(p) - rem * 60_000L, Kind.REMINDER, p, rem)
        }
        out += Due("$date|sunrise|refresh", day.sunrise, Kind.REFRESH, "sunrise")

        val al = cfg.alerts
        val warn = al.optInt("sunrise_warning")
        if (warn > 0) out += Due("$date|sunrise-warning", day.sunrise - warn * 60_000L, Kind.SUNRISE_WARNING, "fajr", warn)
        val ramadan = Schedule.calendar(cfg).fromGregorian(date).month == 9
        val sehri = al.optString("sehri", "ramadan")
        if (sehri == "always" || (sehri == "ramadan" && ramadan)) {
            val m = al.optInt("sehri_minutes", 45)
            out += Due("$date|sehri", day.imsak - m * 60_000L, Kind.SEHRI, "fajr", m)
        }
        if (al.optBoolean("jumuah", true) && day.friday) out += Due("$date|jumuah", day.dhuhr - 2 * 3_600_000L, Kind.JUMUAH, "dhuhr")
        if (al.optBoolean("tahajjud")) out += Due("$date|tahajjud", day.lastThird, Kind.TAHAJJUD)
        // The daily Quran reading reminder, at the time the user chose ("HH:MM").
        al.optString("quran_time").takeIf { it.length >= 4 }?.let { v ->
            runCatching { LocalTime.parse(if (v.length == 4) "0$v" else v) }.getOrNull()?.let { tm ->
                out += Due("$date|quran", date.atTime(tm).atZone(Schedule.zone(cfg)).toInstant().toEpochMilli(), Kind.QURAN_GOAL)
            }
        }
        // Morning adhkar after Fajr (before sunrise), evening adhkar after Asr.
        if (al.optBoolean("azkar", true)) {
            out += Due("$date|azkar-m", minOf(day.fajr + 15 * 60_000L, day.sunrise - 10 * 60_000L), Kind.AZKAR_MORNING, "fajr")
            out += Due("$date|azkar-e", day.asr + 15 * 60_000L, Kind.AZKAR_EVENING, "asr")
        }

        // Phone extras: leave-for-the-mosque reminders and silencing the phone
        // for the jamaat.
        val ph = cfg.phone
        val walk = ph.optInt("walk_minutes")
        val silent = ph.optBoolean("auto_silent")
        for (p in Config.PRAYERS) {
            val jamaat = jamaatAt(cfg, day, p)
            if (jamaat != null && walk > 0) {
                out += Due("$date|$p|leave", jamaat - (walk + ph.optInt("leave_before")) * 60_000L, Kind.LEAVE, p, walk, jamaat)
            }
            if (silent) {
                val start = jamaat ?: (day.get(p) + ph.optInt("silent_after", 5) * 60_000L)
                val end = start + ph.optInt("silent_minutes", 25) * 60_000L
                out += Due("$date|$p|silent-on", start, Kind.SILENT_ON, p)
                out += Due("$date|$p|silent-off", end, Kind.SILENT_OFF, p)
            }
        }
        return out
    }
}
