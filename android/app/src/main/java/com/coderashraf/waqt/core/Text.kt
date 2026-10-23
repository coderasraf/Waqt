package com.coderashraf.waqt.core

/** Words said outside the app window (notifications, widget), EN and BN. */
object Text {
    fun prayer(key: String, lang: String, friday: Boolean = false): String {
        val bn = lang == "bn"
        return when (key) {
            "fajr" -> if (bn) "ফজর" else "Fajr"
            "sunrise" -> if (bn) "সূর্যোদয়" else "Sunrise"
            "dhuhr" -> if (friday) (if (bn) "জুমা" else "Jumu'ah") else (if (bn) "যোহর" else "Dhuhr")
            "asr" -> if (bn) "আসর" else "Asr"
            "maghrib" -> if (bn) "মাগরিব" else "Maghrib"
            "isha" -> if (bn) "এশা" else "Isha"
            else -> key
        }
    }

    fun arabic(key: String, friday: Boolean = false): String = when (key) {
        "fajr" -> "الفجر"; "sunrise" -> "الشروق"; "dhuhr" -> if (friday) "الجمعة" else "الظهر"
        "asr" -> "العصر"; "maghrib" -> "المغرب"; "isha" -> "العشاء"; else -> ""
    }

    fun digits(s: String, bangla: Boolean): String =
        if (!bangla) s else s.map { if (it in '0'..'9') '০' + (it - '0') else it }.joinToString("")

    fun time(ms: Long, offsetMin: Int, clock: Int, lang: String, bnDigits: Boolean): String {
        val local = Math.floorMod(Math.floorDiv(ms, 60_000L) + offsetMin, 1440L).toInt()
        val h = local / 60; val m = local % 60
        val s = if (clock == 24) "%02d:%02d".format(h, m) else {
            val h12 = if (h % 12 == 0) 12 else h % 12
            if (lang == "bn") {
                val part = when (h) { in 0..3 -> "রাত"; in 4..5 -> "ভোর"; in 6..11 -> "সকাল"; in 12..14 -> "দুপুর"; in 15..17 -> "বিকাল"; in 18..19 -> "সন্ধ্যা"; else -> "রাত" }
                "$part $h12:%02d".format(m)
            } else "$h12:%02d ${if (h < 12) "AM" else "PM"}".format(m)
        }
        return digits(s, lang == "bn" && bnDigits)
    }

    fun t(cfg: Config, ms: Long, offsetMin: Int) = time(ms, offsetMin, cfg.clock, cfg.language, cfg.banglaDigits)
    fun n(cfg: Config, v: Int) = digits(v.toString(), cfg.language == "bn" && cfg.banglaDigits)
}
