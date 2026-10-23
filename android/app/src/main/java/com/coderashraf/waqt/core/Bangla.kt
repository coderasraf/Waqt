package com.coderashraf.waqt.core

import java.time.LocalDate

/**
 * The Bangla calendar (বঙ্গাব্দ) as Bangladesh has used it since the 2019
 * revision: the year begins on 14 April; Boishakh to Ashwin have 31 days,
 * Falgun 29 (30 when the Gregorian year it falls in is a leap year), the
 * rest 30.
 */
object Bangla {
    val MONTHS_BN = listOf("বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র")
    val MONTHS_EN = listOf("Boishakh", "Joishtho", "Asharh", "Srabon", "Bhadro", "Ashwin", "Kartik", "Agrahayan", "Poush", "Magh", "Falgun", "Chaitra")

    data class Date(val year: Int, val month: Int, val day: Int)

    fun from(date: LocalDate): Date {
        val newYear = LocalDate.of(date.year, 4, 14)
        val start = if (date < newYear) newYear.minusYears(1) else newYear
        val year = start.year - 593
        var left = (date.toEpochDay() - start.toEpochDay()).toInt()
        val falgunLong = start.plusYears(1).isLeapYear
        for (m in 0 until 12) {
            val len = when {
                m < 6 -> 31
                m == 10 -> if (falgunLong) 30 else 29
                else -> 30
            }
            if (left < len) return Date(year, m + 1, left + 1)
            left -= len
        }
        return Date(year, 12, 30)
    }
}
