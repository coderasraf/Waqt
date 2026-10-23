package com.coderashraf.waqt.core

import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZoneOffset
import kotlin.math.roundToLong

/** Settings + a date → exact moments (Unix ms) in the location's time zone. */
class Day(
    val date: LocalDate,
    val tzOffsetMin: Int,
    val fajr: Long, val sunrise: Long, val dhuhr: Long, val asr: Long, val maghrib: Long, val isha: Long,
    val sunset: Long, val imsak: Long, val ishraq: Long, val zawal: Long, val midnight: Long, val lastThird: Long,
) {
    val friday get() = date.dayOfWeek == DayOfWeek.FRIDAY

    fun get(key: String): Long = when (key) {
        "fajr" -> fajr; "sunrise" -> sunrise; "dhuhr" -> dhuhr; "asr" -> asr
        "maghrib" -> maghrib; "isha" -> isha; "imsak" -> imsak; else -> 0
    }
}

object Schedule {
    val KEYS = listOf("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")

    fun zone(cfg: Config): ZoneId {
        val tz = cfg.location.optString("timezone", "")
        return if (tz.isEmpty()) ZoneId.systemDefault() else runCatching { ZoneId.of(tz) }.getOrDefault(ZoneId.systemDefault())
    }

    fun calendar(cfg: Config) = Hijri.Cal(cfg.calc.optString("hijri_rule", "sighting"), cfg.calc.optInt("hijri_offset"), cfg.lat, cfg.lng)

    fun localDate(cfg: Config, nowMs: Long): LocalDate = Instant.ofEpochMilli(nowMs).atZone(zone(cfg)).toLocalDate()

    fun day(cfg: Config, date: LocalDate): Day {
        val z = zone(cfg)
        val off = z.rules.getOffset(date.atTime(LocalTime.NOON)).totalSeconds
        val l = cfg.location
        val c = cfg.calc
        val t = Prayer.compute(date, cfg.lat, cfg.lng, l.optDouble("elevation", 0.0), off / 3600.0,
            c.optString("method", "karachi"), c.optString("asr", "hanafi"), c.optString("high_lat", "angle_based"))
        val midnightUtc = date.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        val o = c.optJSONObject("offsets") ?: org.json.JSONObject()
        fun ms(h: Double, adjust: Int): Long {
            val raw = midnightUtc + ((h * 3600.0 - off) * 1000.0).toLong() + adjust * 60_000L
            return (raw / 60_000.0).roundToLong() * 60_000L
        }
        val fajr = ms(t.fajr, o.optInt("fajr"))
        val sunrise = ms(t.sunrise, o.optInt("sunrise"))
        val dhuhr = ms(t.dhuhr, o.optInt("dhuhr"))
        return Day(
            date, off / 60,
            fajr, sunrise, dhuhr, ms(t.asr, o.optInt("asr")), ms(t.maghrib, o.optInt("maghrib")), ms(t.isha, o.optInt("isha")),
            ms(t.sunset, 0), fajr - c.optInt("imsak_minutes") * 60_000L, sunrise + 15 * 60_000L, dhuhr - 6 * 60_000L,
            ms(t.midnight, 0), ms(t.lastThird, 0),
        )
    }

    data class Moment(val key: String, val at: Long)

    /** The current prayer (null between sunrise and Dhuhr) and the next one. */
    fun currentAndNext(cfg: Config, nowMs: Long): Pair<Moment?, Moment> {
        val today = localDate(cfg, nowMs)
        val list = mutableListOf<Moment>()
        for (d in listOf(today.minusDays(1), today, today.plusDays(1))) {
            val day = day(cfg, d)
            for (k in KEYS) list += Moment(k, day.get(k))
        }
        list.sortBy { it.at }
        val current = list.lastOrNull { it.at <= nowMs }?.takeIf { it.key != "sunrise" }
        val next = list.firstOrNull { it.at > nowMs && it.key != "sunrise" } ?: Moment("fajr", nowMs)
        return current to next
    }
}
