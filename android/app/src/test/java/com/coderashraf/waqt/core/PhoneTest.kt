package com.coderashraf.waqt.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class PhoneTest {
    @Test fun banglaCalendar() {
        // Dates fixed by the 2019 revision of the Bangla calendar.
        assertEquals(Bangla.Date(1433, 1, 1), Bangla.from(LocalDate.of(2026, 4, 14)))
        assertEquals(Bangla.Date(1433, 7, 7), Bangla.from(LocalDate.of(2026, 10, 23)))
        assertEquals(Bangla.Date(1433, 9, 1), Bangla.from(LocalDate.of(2026, 12, 16)))   // Victory Day: 1 Poush
        assertEquals(Bangla.Date(1433, 11, 8), Bangla.from(LocalDate.of(2027, 2, 21)))   // 21 February: 8 Falgun
        assertEquals(Bangla.Date(1433, 12, 12), Bangla.from(LocalDate.of(2027, 3, 26)))  // Independence Day: 12 Chaitra
        assertEquals(Bangla.Date(1433, 12, 30), Bangla.from(LocalDate.of(2027, 4, 13)))
    }

    @Test fun jamaatAndSilence() {
        val cfg = Config(Config.defaults())
        cfg.phone.getJSONObject("jamaat").put("asr", 15).put("isha", "19:30").put("jumuah", "13:15")
        cfg.phone.put("auto_silent", true).put("walk_minutes", 10)
        val day = Schedule.day(cfg, LocalDate.of(2026, 10, 23)) // a Friday
        assertEquals(day.asr + 15 * 60_000L, Alerts.jamaatAt(cfg, day, "asr"))
        assertEquals(LocalDate.of(2026, 10, 23).atTime(19, 30).atZone(java.time.ZoneId.of("Asia/Dhaka")).toInstant().toEpochMilli(), Alerts.jamaatAt(cfg, day, "isha"))
        assertEquals(LocalDate.of(2026, 10, 23).atTime(13, 15).atZone(java.time.ZoneId.of("Asia/Dhaka")).toInstant().toEpochMilli(), Alerts.jamaatAt(cfg, day, "dhuhr"))
        assertEquals(null, Alerts.jamaatAt(cfg, day, "fajr"))
        val dues = Alerts.forDay(cfg, day)
        val keys = dues.map { it.key.substringAfter('|') }
        assertTrue(keys.containsAll(listOf("asr|leave", "isha|leave", "dhuhr|leave", "asr|silent-on", "asr|silent-off", "fajr|silent-on", "jumuah")))
        val leave = dues.first { it.key.endsWith("asr|leave") }
        assertEquals(day.asr + 5 * 60_000L, leave.at) // 15 min after adhan, minus 10 min walk
    }

    @Test fun offModeKeepsWidgetRefresh() {
        val cfg = Config(Config.defaults())
        cfg.prayer("isha").put("mode", "off")
        val keys = Alerts.forDay(cfg, Schedule.day(cfg, LocalDate.of(2026, 10, 23))).map { it.key.substringAfter('|') }
        assertTrue("isha|refresh" in keys)
        assertTrue("isha|adhan" !in keys)
    }
}
