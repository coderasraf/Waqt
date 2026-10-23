package com.coderashraf.waqt.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

class CoreTest {
    private fun hm(h: Double): String {
        val m = Math.floor(Prayer.fixHour(h) * 60 + 0.5).toInt()
        return "%02d:%02d".format(m / 60, m % 60)
    }

    @Test fun dhakaMatchesAladhan() {
        // api.aladhan.com, 23 Oct 2026, Dhaka, Karachi + Hanafi.
        val t = Prayer.compute(LocalDate.of(2026, 10, 23), 23.8103, 90.4125, 0.0, 6.0, "karachi", "hanafi", "angle_based")
        assertEquals(listOf("04:43", "05:59", "11:43", "15:49", "17:26", "18:42"), listOf(t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha).map(::hm))
        assertEquals("23:43", hm(t.midnight))
    }

    @Test fun scheduleUsesLocationZone() {
        val cfg = Config(Config.defaults())
        val day = Schedule.day(cfg, LocalDate.of(2026, 10, 23))
        assertEquals(360, day.tzOffsetMin)
        val local = Instant.ofEpochMilli(day.fajr).atOffset(ZoneOffset.ofHours(6))
        assertEquals("04:43", "%02d:%02d".format(local.hour, local.minute))
        assertTrue(day.friday)
    }

    @Test fun currentAndNext() {
        val cfg = Config(Config.defaults())
        val day = Schedule.day(cfg, LocalDate.of(2026, 10, 23))
        val (cur, next) = Schedule.currentAndNext(cfg, day.asr + 60_000)
        assertEquals("asr", cur!!.key); assertEquals("maghrib", next.key)
        val (cur2, next2) = Schedule.currentAndNext(cfg, day.sunrise + 60_000)
        assertEquals(null, cur2); assertEquals("dhuhr", next2.key)
    }

    @Test fun ummAlQuraMatchesAladhan() {
        val c = Hijri.Cal("umm_al_qura", 0, 23.8103, 90.4125)
        assertEquals(HijriDate(1448, 5, 12), c.fromGregorian(LocalDate.of(2026, 10, 23)))
        assertEquals(HijriDate(1448, 3, 1), c.fromGregorian(LocalDate.of(2026, 8, 14)))
        assertEquals(HijriDate(1448, 2, 2), c.fromGregorian(LocalDate.of(2026, 7, 16)))
    }

    @Test fun sightingMatchesBangladesh() {
        val c = Hijri.Cal("sighting", 0, 23.8103, 90.4125)
        assertEquals(HijriDate(1447, 9, 1), c.fromGregorian(LocalDate.of(2026, 2, 19)))
        assertEquals(HijriDate(1447, 10, 1), c.fromGregorian(LocalDate.of(2026, 3, 21)))
        assertEquals(HijriDate(1448, 2, 1), c.fromGregorian(LocalDate.of(2026, 7, 16)))
        // Bangladesh's Eid al-Adha 1447 was 28 May 2026.
        assertEquals(HijriDate(1447, 12, 10), c.fromGregorian(LocalDate.of(2026, 5, 28)))
    }

    @Test fun roundTrips() {
        for (rule in listOf("sighting", "umm_al_qura", "arithmetic")) for (off in -1..1) {
            val c = Hijri.Cal(rule, off, 23.8103, 90.4125)
            var d = LocalDate.of(2025, 1, 1)
            repeat(120) {
                assertEquals("$rule $off $d", d, c.toGregorian(c.fromGregorian(d)))
                d = d.plusDays(7)
            }
        }
    }

    @Test fun qiblaAndMoon() {
        assertEquals(277.5, Astro.qiblaBearing(23.8103, 90.4125), 1.0)
        val full = LocalDate.of(2026, 10, 26).atTime(4, 0).toInstant(ZoneOffset.UTC).toEpochMilli()
        assertTrue(Astro.moonPhase(full).illumination > 0.97)
    }

    @Test fun announcedMonthStartsWin() {
        // The model predicts 19 Apr 2026 for Dhul Qadah 1447; Bangladesh's
        // committee announced 20 Apr (moon not sighted).
        val plain = Hijri.Cal("sighting", 0, 23.8103, 90.4125)
        assertEquals(HijriDate(1447, 11, 1), plain.fromGregorian(LocalDate.of(2026, 4, 19)))
        val ann = Hijri.parseOverrides(org.json.JSONObject("""{"months": {"1447-11": "2026-04-20"}}"""))
        val c = Hijri.Cal("sighting", 0, 23.8103, 90.4125, ann)
        assertEquals(HijriDate(1447, 10, 30), c.fromGregorian(LocalDate.of(2026, 4, 19)))
        assertEquals(HijriDate(1447, 11, 1), c.fromGregorian(LocalDate.of(2026, 4, 20)))
        assertEquals(LocalDate.of(2026, 4, 20), c.toGregorian(HijriDate(1447, 11, 1)))
    }
}
