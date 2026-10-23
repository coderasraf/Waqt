package com.coderashraf.waqt.core

import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import kotlin.math.floor
import kotlin.math.sin

/**
 * The Hijri calendar, from the real new moon (Meeus' algorithm) by one of
 * three rules, plus a day offset. A port of the desktop app's hijri.rs.
 */
data class HijriDate(val year: Int, val month: Int, val day: Int)

object Hijri {
    val MONTHS_EN = listOf("Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah")
    val MONTHS_BN = listOf("মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ")
    val MONTHS_AR = listOf("مُحَرَّم", "صَفَر", "رَبِيع الأَوَّل", "رَبِيع الآخِر", "جُمَادَى الأُولَى", "جُمَادَى الآخِرَة", "رَجَب", "شَعْبَان", "رَمَضَان", "شَوَّال", "ذُو القَعْدَة", "ذُو الحِجَّة")

    /** Hours a crescent must have at local sunset to count as seen. */
    private const val SIGHTING_HOURS = 20.0
    private const val MAKKAH_LAT = 21.4225
    private const val MAKKAH_LNG = 39.8262
    /** Month index (year * 12 + month - 1) begun by new moon k = 0: Shawwal 1420. */
    private const val K0_MONTH = 1420L * 12 + 9

    private fun dsin(d: Double) = sin(Math.toRadians(d))

    /**
     * Month starts announced by Bangladesh's National Moon Sighting
     * Committee (month index year*12+month-1 → first day), published in
     * the app's hijri.json. They replace the prediction for those months
     * when the user's calendar follows Bangladesh's sighting.
     */
    @Volatile var bangladesh: Map<Long, LocalDate> = emptyMap()

    /** Parses hijri.json's "months": {"1448-05": "2026-10-13", ...}. */
    fun parseOverrides(json: org.json.JSONObject): Map<Long, LocalDate> {
        val months = json.optJSONObject("months") ?: return emptyMap()
        val out = HashMap<Long, LocalDate>()
        for (k in months.keys()) {
            val (y, m) = k.split("-").map { it.toLong() }
            runCatching { out[y * 12 + m - 1] = LocalDate.parse(months.getString(k)) }
        }
        return out
    }

    /** Julian Ephemeris Day of new moon number k (k = 0 is 6 Jan 2000). */
    fun newMoonJde(kk: Long): Double {
        val k = kk.toDouble()
        val t = k / 1236.85
        val t2 = t * t; val t3 = t2 * t; val t4 = t3 * t
        val jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.000000150 * t3 + 0.00000000073 * t4
        val e = 1 - 0.002516 * t - 0.0000074 * t2
        val m = 2.5534 + 29.10535670 * k - 0.0000014 * t2 - 0.00000011 * t3
        val mp = 201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4
        val f = 160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4
        val om = 124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3
        val c = -0.40720 * dsin(mp) + 0.17241 * e * dsin(m) + 0.01608 * dsin(2 * mp) + 0.01039 * dsin(2 * f) +
            0.00739 * e * dsin(mp - m) - 0.00514 * e * dsin(mp + m) + 0.00208 * e * e * dsin(2 * m) -
            0.00111 * dsin(mp - 2 * f) - 0.00057 * dsin(mp + 2 * f) + 0.00056 * e * dsin(2 * mp + m) -
            0.00042 * dsin(3 * mp) + 0.00042 * e * dsin(m + 2 * f) + 0.00038 * e * dsin(m - 2 * f) -
            0.00024 * e * dsin(2 * mp - m) - 0.00017 * dsin(om) - 0.00007 * dsin(mp + 2 * m) +
            0.00004 * dsin(2 * mp - 2 * f) + 0.00004 * dsin(3 * m) + 0.00003 * dsin(mp + m - 2 * f) +
            0.00003 * dsin(2 * mp + 2 * f) - 0.00003 * dsin(mp + m + 2 * f) + 0.00003 * dsin(mp - m + 2 * f) -
            0.00002 * dsin(mp - m - 2 * f) - 0.00002 * dsin(3 * mp + m) + 0.00002 * dsin(4 * mp)
        return jde + c
    }

    fun newMoonMs(k: Long): Long = ((newMoonJde(k) - 2440587.5) * 86_400_000.0).toLong()

    private fun msToDate(ms: Long): LocalDate = Instant.ofEpochMilli(ms).atZone(ZoneOffset.UTC).toLocalDate()

    private fun sunsetMs(date: LocalDate, lat: Double, lng: Double): Long {
        val t = Prayer.compute(date, lat, lng, 0.0, 0.0, "karachi", "standard", "angle_based")
        return date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() + (t.sunset * 3_600_000.0).toLong()
    }

    data class EventDef(val month: Int, val day: Int, val key: String, val kind: String, val en: String, val bn: String, val ar: String, val noteEn: String, val noteBn: String)

    val EVENTS = listOf(
        EventDef(1, 1, "new_year", "day", "Islamic New Year", "হিজরি নববর্ষ", "رأس السنة الهجرية", "The first day of Muharram, one of the four sacred months.", "মুহাররমের প্রথম দিন, চারটি সম্মানিত মাসের একটি।"),
        EventDef(1, 10, "ashura", "fast", "Day of Ashura", "আশুরা", "عاشوراء", "Fasting is recommended, together with the 9th or 11th.", "রোজা রাখা মুস্তাহাব, সাথে ৯ বা ১১ তারিখেও।"),
        EventDef(3, 12, "mawlid", "day", "Mawlid an-Nabi", "ঈদে মিলাদুন্নবী", "المولد النبوي", "Commonly observed as the Prophet's ﷺ birthday; a public holiday in Bangladesh.", "নবীজি ﷺ এর জন্মদিন হিসেবে পালিত হয়; বাংলাদেশে সরকারি ছুটি।"),
        EventDef(7, 27, "miraj", "night", "Isra and Mi'raj", "শবে মেরাজ", "الإسراء والمعراج", "Commemorates the Night Journey. The night begins at Maghrib the evening before.", "মেরাজের রাত। আগের দিন মাগরিব থেকে রাত শুরু।"),
        EventDef(8, 15, "barat", "night", "Mid-Sha'ban (Shab-e-Barat)", "শবে বরাত", "ليلة النصف من شعبان", "The night of the 15th of Sha'ban, beginning at Maghrib the evening before.", "শাবানের ১৫তম রাত; আগের দিন মাগরিব থেকে শুরু।"),
        EventDef(9, 1, "ramadan", "season", "Ramadan begins", "রমজান শুরু", "بداية رمضان", "The month of fasting. Taraweeh begins the night before.", "রোজার মাস। আগের রাত থেকে তারাবিহ শুরু।"),
        EventDef(9, 21, "last_ten", "night", "Last ten nights", "শেষ দশক", "العشر الأواخر", "Seek Laylat al-Qadr in the odd nights: 21, 23, 25, 27, 29.", "বেজোড় রাতগুলোতে লাইলাতুল কদর তালাশ করুন: ২১, ২৩, ২৫, ২৭, ২৯।"),
        EventDef(9, 27, "qadr", "night", "Laylat al-Qadr (27th night)", "শবে কদর", "ليلة القدر", "Better than a thousand months. Widely observed on the 27th night.", "হাজার মাসের চেয়ে উত্তম রাত। সাধারণত ২৭তম রাতে পালিত হয়।"),
        EventDef(10, 1, "eid_fitr", "eid", "Eid al-Fitr", "ঈদুল ফিতর", "عيد الفطر", "Fasting is not allowed today. Pay Zakat al-Fitr before the Eid prayer.", "আজ রোজা রাখা নিষেধ। ঈদের নামাজের আগে ফিতরা আদায় করুন।"),
        EventDef(10, 2, "shawwal6", "fast", "Six days of Shawwal", "শাওয়ালের ছয় রোজা", "ست من شوال", "Fasting six days of Shawwal after Ramadan is like fasting the whole year.", "রমজানের পর শাওয়ালের ছয়টি রোজা সারা বছর রোজার সমান।"),
        EventDef(12, 1, "dhul_hijjah", "season", "First ten days of Dhul Hijjah", "জিলহজের প্রথম দশক", "عشر ذي الحجة", "The best days of the year for good deeds.", "নেক আমলের জন্য বছরের শ্রেষ্ঠ দিন।"),
        EventDef(12, 9, "arafah", "fast", "Day of Arafah", "আরাফার দিন", "يوم عرفة", "Fasting expiates the sins of the past and the coming year (for those not on Hajj).", "রোজা আগের ও পরের বছরের গুনাহের কাফফারা (হাজি ছাড়া অন্যদের জন্য)।"),
        EventDef(12, 10, "eid_adha", "eid", "Eid al-Adha", "ঈদুল আজহা", "عيد الأضحى", "The day of sacrifice. Takbir from Fajr of Arafah until Asr of the 13th.", "কুরবানির দিন। আরাফার ফজর থেকে ১৩ তারিখ আসর পর্যন্ত তাকবির।"),
        EventDef(12, 11, "tashreeq", "day", "Days of Tashreeq", "আইয়ামে তাশরিক", "أيام التشريق", "11th to 13th Dhul Hijjah: days of eating, drinking and remembrance; no fasting.", "১১–১৩ জিলহজ: খাওয়া-দাওয়া ও জিকিরের দিন; রোজা নিষেধ।"),
    )

    fun eventsOn(h: HijriDate) = EVENTS.filter { it.month == h.month && it.day == h.day }

    fun sunnahFasts(date: LocalDate, h: HijriDate): List<String> {
        val forbidden = (h.month == 10 && h.day == 1) || (h.month == 12 && h.day in 10..13)
        if (forbidden) return emptyList()
        val out = mutableListOf<String>()
        if (h.day in 13..15) out += "white_days"
        when (date.dayOfWeek) {
            DayOfWeek.MONDAY -> out += "monday"
            DayOfWeek.THURSDAY -> out += "thursday"
            else -> {}
        }
        return out
    }

    // ----- Arithmetic calendar -----
    private fun jdn(d: LocalDate): Long = d.toEpochDay() + 2_440_588L

    private fun arithmeticFrom(date: LocalDate): HijriDate {
        var l = jdn(date) - 1_948_440 + 10_632
        val n = (l - 1) / 10_631
        l = l - 10_631 * n + 354
        val j = ((10_985 - l) / 5_316) * ((50 * l) / 17_719) + (l / 5_670) * ((43 * l) / 15_238)
        l = l - ((30 - j) / 15) * ((17_719 * j) / 50) - (j / 16) * ((15_238 * j) / 43) + 29
        val m = (24 * l) / 709
        val d = l - (709 * m) / 24
        val y = 30 * n + j - 30
        return HijriDate(y.toInt(), m.toInt(), d.toInt())
    }

    private fun arithmeticTo(h: HijriDate): LocalDate {
        val y = h.year.toLong(); val m = h.month.toLong(); val d = h.day.toLong()
        val jd = (11 * y + 3) / 30 + 354 * y + 30 * m - (m - 1) / 2 + d + 1_948_440 - 385
        return LocalDate.ofEpochDay(jd - 2_440_588L)
    }

    /** A calendar: rule ("sighting", "umm_al_qura", "arithmetic"), day offset, place. */
    class Cal(val rule: String, val offset: Int, val lat: Double, val lng: Double, private val announced: Map<Long, LocalDate> = emptyMap()) {
        private val starts = HashMap<Long, LocalDate>()

        private fun monthStart(k: Long): LocalDate = starts.getOrPut(k) {
            announced[k + K0_MONTH]?.let { return@getOrPut it }
            val conj = newMoonMs(k)
            if (rule == "umm_al_qura") {
                val d = msToDate(conj + 3 * 3_600_000L)
                if (conj < sunsetMs(d, MAKKAH_LAT, MAKKAH_LNG)) d.plusDays(1) else d.plusDays(2)
            } else {
                val d = msToDate(conj + (lng / 15.0 * 3_600_000.0).toLong())
                var found: LocalDate? = null
                for (i in 0L..2L) {
                    val day = d.plusDays(i)
                    val age = (sunsetMs(day, lat, lng) - conj) / 3_600_000.0
                    if (age >= SIGHTING_HOURS) { found = day.plusDays(1); break }
                }
                found ?: d.plusDays(3)
            }
        }

        fun fromGregorian(date0: LocalDate): HijriDate {
            val date = date0.minusDays(offset.toLong())
            if (rule == "arithmetic") return arithmeticFrom(date)
            val jd = date.toEpochDay() + 2_440_587.5
            var k = floor((jd - 2_451_550.1) / 29.530588853).toLong() + 1
            while (monthStart(k) > date) k--
            while (monthStart(k + 1) <= date) k++
            val index = k + K0_MONTH
            val day = (date.toEpochDay() - monthStart(k).toEpochDay()).toInt() + 1
            return HijriDate(Math.floorDiv(index, 12L).toInt(), Math.floorMod(index, 12L).toInt() + 1, day)
        }

        fun toGregorian(h: HijriDate): LocalDate {
            val base = if (rule == "arithmetic") arithmeticTo(h) else {
                val k = h.year.toLong() * 12 + h.month - 1 - K0_MONTH
                monthStart(k).plusDays(h.day.toLong() - 1)
            }
            return base.plusDays(offset.toLong())
        }

        fun monthLength(year: Int, month: Int): Int {
            val start = toGregorian(HijriDate(year, month, 1))
            val next = if (month == 12) HijriDate(year + 1, 1, 1) else HijriDate(year, month + 1, 1)
            return (toGregorian(next).toEpochDay() - start.toEpochDay()).toInt()
        }

        data class Upcoming(val date: LocalDate, val hijri: HijriDate, val event: EventDef)

        fun upcoming(from: LocalDate, days: Long): List<Upcoming> {
            val out = mutableListOf<Upcoming>()
            var h = fromGregorian(from)
            var d = from
            val end = from.plusDays(days)
            while (d < end) {
                val len = monthLength(h.year, h.month)
                for (e in EVENTS) {
                    if (e.month == h.month && e.day >= h.day && e.day <= len) {
                        val date = d.plusDays((e.day - h.day).toLong())
                        if (date < end) out += Upcoming(date, h.copy(day = e.day), e)
                    }
                }
                d = d.plusDays((len - h.day + 1).toLong())
                h = if (h.month == 12) HijriDate(h.year + 1, 1, 1) else HijriDate(h.year, h.month + 1, 1)
            }
            return out.sortedBy { it.date }
        }
    }
}
