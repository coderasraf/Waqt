package com.coderashraf.waqt.core

import java.time.LocalDate
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.atan
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/**
 * Prayer times from the sun's position: the PrayTimes.org method used by
 * Aladhan and most apps. A line-for-line port of the desktop app's
 * prayer.rs, checked against the same reference values.
 */
object Prayer {
    sealed class Isha {
        data class Angle(val deg: Double) : Isha()
        data class Minutes(val min: Double) : Isha()
    }

    class Method(
        val id: String,
        val name: String,
        val region: String,
        val fajr: Double,
        val isha: Isha,
        val maghrib: Double = 0.0,
        val jafariMidnight: Boolean = false,
    )

    val METHODS = listOf(
        Method("karachi", "University of Islamic Sciences, Karachi", "Bangladesh, Pakistan, India, Afghanistan", 18.0, Isha.Angle(18.0)),
        Method("mwl", "Muslim World League", "Europe, Far East, parts of the Americas", 18.0, Isha.Angle(17.0)),
        Method("isna", "Islamic Society of North America", "USA, Canada", 15.0, Isha.Angle(15.0)),
        Method("egypt", "Egyptian General Authority of Survey", "Africa, Syria, Lebanon, Malaysia", 19.5, Isha.Angle(17.5)),
        Method("makkah", "Umm al-Qura University, Makkah", "Saudi Arabia", 18.5, Isha.Minutes(90.0)),
        Method("dubai", "Dubai (UAE)", "United Arab Emirates", 18.2, Isha.Angle(18.2)),
        Method("gulf", "Gulf Region", "Gulf countries", 19.5, Isha.Minutes(90.0)),
        Method("kuwait", "Kuwait", "Kuwait", 18.0, Isha.Angle(17.5)),
        Method("qatar", "Qatar", "Qatar", 18.0, Isha.Minutes(90.0)),
        Method("singapore", "Majlis Ugama Islam Singapura", "Singapore, Malaysia, Indonesia", 20.0, Isha.Angle(18.0)),
        Method("turkey", "Diyanet İşleri Başkanlığı", "Turkey", 18.0, Isha.Angle(17.0)),
        Method("tehran", "Institute of Geophysics, Tehran", "Iran", 17.7, Isha.Angle(14.0), 4.5, true),
        Method("jafari", "Shia Ithna-Ashari (Qum)", "Shia communities", 16.0, Isha.Angle(14.0), 4.0, true),
        Method("france", "Union des Organisations Islamiques de France", "France", 12.0, Isha.Angle(12.0)),
        Method("russia", "Spiritual Administration of Muslims of Russia", "Russia", 16.0, Isha.Angle(15.0)),
    )

    fun method(id: String): Method = METHODS.firstOrNull { it.id == id } ?: METHODS[0]

    /** Local clock times in hours (5.5 = 05:30); past 24 means the next day. */
    class DayTimes(
        val fajr: Double, val sunrise: Double, val dhuhr: Double, val asr: Double,
        val sunset: Double, val maghrib: Double, val isha: Double,
        val midnight: Double, val lastThird: Double,
    )

    private fun dsin(d: Double) = sin(Math.toRadians(d))
    private fun dcos(d: Double) = cos(Math.toRadians(d))
    private fun dtan(d: Double) = tan(Math.toRadians(d))
    private fun darcsin(x: Double) = Math.toDegrees(asin(x))
    private fun darccos(x: Double) = Math.toDegrees(acos(x))
    private fun darctan2(y: Double, x: Double) = Math.toDegrees(atan2(y, x))
    private fun darccot(x: Double) = Math.toDegrees(atan(1.0 / x))
    private fun fix(a: Double, b: Double): Double {
        val r = a - b * floor(a / b)
        return if (r < 0) r + b else r
    }
    fun fixAngle(a: Double) = fix(a, 360.0)
    fun fixHour(a: Double) = fix(a, 24.0)

    /** Julian date at 0h UT of a calendar date. */
    fun julian(date: LocalDate): Double {
        var y = date.year.toDouble()
        var m = date.monthValue.toDouble()
        val d = date.dayOfMonth.toDouble()
        if (m <= 2) { y -= 1; m += 12 }
        val a = floor(y / 100)
        val b = 2 - a + floor(a / 4)
        return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + d + b - 1524.5
    }

    /** The sun's declination (degrees) and the equation of time (hours). */
    fun sunPosition(jd: Double): Pair<Double, Double> {
        val d = jd - 2451545.0
        val g = fixAngle(357.529 + 0.98560028 * d)
        val q = fixAngle(280.459 + 0.98564736 * d)
        val l = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g))
        val e = 23.439 - 0.00000036 * d
        val ra = darctan2(dcos(e) * dsin(l), dcos(l)) / 15.0
        val eqt = q / 15.0 - fixHour(ra)
        val decl = darcsin(dsin(e) * dsin(l))
        return decl to eqt
    }

    private class Ctx(val lat: Double, val jdate: Double) {
        fun midDay(time: Double): Double = fixHour(12 - sunPosition(jdate + time).second)

        fun sunAngleTime(angle: Double, time: Double, ccw: Boolean): Double {
            val decl = sunPosition(jdate + time).first
            val noon = midDay(time)
            val t = darccos((-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat))) / 15.0
            return noon + if (ccw) -t else t
        }

        fun asrTime(factor: Double, time: Double): Double {
            val decl = sunPosition(jdate + time).first
            val angle = -darccot(factor + dtan(abs(lat - decl)))
            return sunAngleTime(angle, time, false)
        }
    }

    private fun timeDiff(a: Double, b: Double) = fixHour(b - a)

    /**
     * @param asr "standard" or "hanafi"
     * @param highLat "none", "angle_based", "middle_of_night" or "one_seventh"
     */
    fun compute(date: LocalDate, lat: Double, lng: Double, elevation: Double, tz: Double, methodId: String, asr: String, highLat: String): DayTimes {
        val m = method(methodId)
        val ctx = Ctx(lat, julian(date) - lng / (15.0 * 24.0))
        val riseSet = 0.833 + 0.0347 * sqrt(max(0.0, elevation))
        val factor = if (asr == "hanafi") 2.0 else 1.0
        fun p(h: Double) = h / 24.0

        var fajr = ctx.sunAngleTime(m.fajr, p(5.0), true)
        var sunrise = ctx.sunAngleTime(riseSet, p(6.0), true)
        var dhuhr = ctx.midDay(p(12.0))
        var asrT = ctx.asrTime(factor, p(13.0))
        var sunset = ctx.sunAngleTime(riseSet, p(18.0), false)
        var maghrib = if (m.maghrib > 0) ctx.sunAngleTime(m.maghrib, p(18.0), false) else Double.NaN
        var isha = when (val i = m.isha) {
            is Isha.Angle -> ctx.sunAngleTime(i.deg, p(18.0), false)
            is Isha.Minutes -> Double.NaN
        }

        val shift = tz - lng / 15.0
        fajr += shift; sunrise += shift; dhuhr += shift; asrT += shift; sunset += shift; maghrib += shift; isha += shift

        if (highLat != "none") {
            val night = timeDiff(sunset, sunrise)
            fun part(angle: Double): Double = night * when (highLat) {
                "angle_based" -> angle / 60.0
                "one_seventh" -> 1.0 / 7.0
                else -> 0.5
            }
            val fp = part(m.fajr)
            if (fajr.isNaN() || timeDiff(fajr, sunrise) > fp) fajr = sunrise - fp
            (m.isha as? Isha.Angle)?.let {
                val ip = part(it.deg)
                if (isha.isNaN() || timeDiff(sunset, isha) > ip) isha = sunset + ip
            }
            if (m.maghrib > 0) {
                val mp = part(m.maghrib)
                if (maghrib.isNaN() || timeDiff(sunset, maghrib) > mp) maghrib = sunset + mp
            }
        }
        if (m.maghrib <= 0) maghrib = sunset
        (m.isha as? Isha.Minutes)?.let { isha = maghrib + it.min / 60.0 }

        val midnight = if (m.jafariMidnight) sunset + timeDiff(sunset, fajr) / 2 else sunset + timeDiff(sunset, sunrise) / 2
        val lastThird = maghrib + timeDiff(maghrib, fajr) * 2.0 / 3.0
        return DayTimes(fajr, sunrise, dhuhr, asrT, sunset, maghrib, isha, midnight, lastThird)
    }

    /** The sun's altitude and azimuth (degrees clockwise from north). */
    fun sunAltAz(jdUt: Double, lat: Double, lng: Double): Pair<Double, Double> {
        val (decl, eqt) = sunPosition(jdUt)
        val frac = (jdUt + 0.5) - floor(jdUt + 0.5)
        val utHours = fixHour(frac * 24.0)
        val solar = utHours + lng / 15.0 + eqt
        val h = 15.0 * (solar - 12.0)
        val alt = darcsin(dsin(lat) * dsin(decl) + dcos(lat) * dcos(decl) * dcos(h))
        val az = fixAngle(darctan2(dsin(h), dcos(h) * dsin(lat) - dtan(decl) * dcos(lat)) + 180.0)
        return alt to az
    }
}
