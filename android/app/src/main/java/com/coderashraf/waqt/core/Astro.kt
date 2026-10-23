package com.coderashraf.waqt.core

import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/** The Qibla direction, sun alignments with it, and the moon's phase. */
object Astro {
    private const val KAABA_LAT = 21.422487
    private const val KAABA_LNG = 39.826206
    private const val SYNODIC = 29.530588853

    fun qiblaBearing(lat: Double, lng: Double): Double {
        val p1 = Math.toRadians(lat); val p2 = Math.toRadians(KAABA_LAT)
        val dl = Math.toRadians(KAABA_LNG - lng)
        val y = sin(dl) * cos(p2)
        val x = cos(p1) * sin(p2) - sin(p1) * cos(p2) * cos(dl)
        return Prayer.fixAngle(Math.toDegrees(atan2(y, x)))
    }

    fun qiblaDistance(lat: Double, lng: Double): Double {
        val p1 = Math.toRadians(lat); val p2 = Math.toRadians(KAABA_LAT)
        val dp = p2 - p1; val dl = Math.toRadians(KAABA_LNG - lng)
        val a = sin(dp / 2) * sin(dp / 2) + cos(p1) * cos(p2) * sin(dl / 2) * sin(dl / 2)
        return 6371.0 * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    /** Great-circle distance in kilometres between two places. */
    fun distanceKm(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
        val p1 = Math.toRadians(lat1); val p2 = Math.toRadians(lat2)
        val dp = p2 - p1; val dl = Math.toRadians(lng2 - lng1)
        val a = sin(dp / 2) * sin(dp / 2) + cos(p1) * cos(p2) * sin(dl / 2) * sin(dl / 2)
        return 6371.0 * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    data class Align(val at: Long, val facing: Boolean, val altitude: Double)

    /** Moments the sun lines up with the Qibla (or its opposite) while up. */
    fun sunAlignments(lat: Double, lng: Double, startMs: Long, endMs: Long): List<Align> {
        val q = qiblaBearing(lat, lng)
        val opp = Prayer.fixAngle(q + 180)
        fun jd(ms: Long) = ms / 86_400_000.0 + 2_440_587.5
        fun signed(a: Double) = ((a + 540.0) % 360.0) - 180.0
        val out = mutableListOf<Align>()
        var prev: Triple<Double, Double, Double>? = null
        var t = startMs
        while (t <= endMs) {
            val (alt, az) = Prayer.sunAltAz(jd(t), lat, lng)
            val d1 = signed(az - q); val d2 = signed(az - opp)
            prev?.let { (palt, p1, p2) ->
                if (alt > 2 && palt > 2) {
                    if (Math.signum(p1) != Math.signum(d1) && kotlin.math.abs(p1) < 20) out += Align(t, true, alt)
                    if (Math.signum(p2) != Math.signum(d2) && kotlin.math.abs(p2) < 20) out += Align(t, false, alt)
                }
            }
            prev = Triple(alt, d1, d2)
            t += 60_000
        }
        return out
    }

    data class Moon(val age: Double, val illumination: Double, val phase: Double, val name: String)

    fun moonPhase(ms: Long): Moon {
        val jd = ms / 86_400_000.0 + 2_440_587.5
        val age = ((jd - 2_451_550.26) % SYNODIC + SYNODIC) % SYNODIC
        val phase = age / SYNODIC
        val illum = (1 - cos(2 * Math.PI * phase)) / 2
        val name = when {
            phase < 0.0339 || phase >= 0.9661 -> "new_moon"
            phase < 0.2161 -> "waxing_crescent"
            phase < 0.2839 -> "first_quarter"
            phase < 0.4661 -> "waxing_gibbous"
            phase < 0.5339 -> "full_moon"
            phase < 0.7161 -> "waning_gibbous"
            phase < 0.7839 -> "last_quarter"
            else -> "waning_crescent"
        }
        return Moon(age, illum, phase, name)
    }
}
