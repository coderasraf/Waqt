package com.coderashraf.waqt.core

import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.LocalDate

/**
 * What the user records (prayer tracker, qada, tasbih, mute) plus the
 * phone's own bookkeeping (adhan delivery log, saved ringer mode). The
 * tracker and tasbih use the same shape as the desktop app's state.json.
 */
class Store(private val file: File) {
    val json: JSONObject = runCatching { JSONObject(file.readText()) }.getOrElse { JSONObject() }

    init {
        for (k in listOf("tracker", "tasbih")) if (!json.has(k)) json.put(k, JSONObject())
        val t = json.getJSONObject("tasbih")
        if (!t.has("totals")) t.put("totals", JSONObject())
        if (!t.has("daily")) t.put("daily", JSONObject())
        if (!json.has("deliveries")) json.put("deliveries", JSONArray())
    }

    @Synchronized
    fun save() {
        val tmp = File(file.path + ".tmp")
        tmp.writeText(json.toString())
        if (!tmp.renameTo(file)) { file.delete(); tmp.renameTo(file) }
    }

    val tracker: JSONObject get() = json.getJSONObject("tracker")

    fun day(date: String): IntArray {
        val a = tracker.optJSONArray(date) ?: return IntArray(5)
        return IntArray(5) { a.optInt(it) }
    }

    fun setPrayer(date: String, index: Int, status: Int) {
        if (index !in 0..4 || status !in 0..4) return
        val d = day(date)
        d[index] = status
        if (d.all { it == 0 }) tracker.remove(date) else tracker.put(date, JSONArray(d.toList()))
    }

    var qadaDone: Int
        get() = json.optInt("qada_done")
        set(v) { json.put("qada_done", v) }

    var muted: String?
        get() = json.optString("muted").ifEmpty { null }
        set(v) { if (v == null) json.remove("muted") else json.put("muted", v) }

    fun addTasbih(id: String, date: String, n: Long) {
        val t = json.getJSONObject("tasbih")
        val totals = t.getJSONObject("totals"); val daily = t.getJSONObject("daily")
        totals.put(id, totals.optLong(id) + n)
        daily.put(date, daily.optLong(date) + n)
    }

    /** Keeps the last 30 adhan deliveries: when it was due, when it played. */
    fun logDelivery(key: String, due: Long, played: Long, how: String) {
        val list = json.getJSONArray("deliveries")
        list.put(JSONObject().put("key", key).put("due", due).put("played", played).put("how", how))
        while (list.length() > 30) list.remove(0)
    }

    /** Last processed alert time, so each alert fires once. */
    var lastFired: Long
        get() = json.optLong("last_fired")
        set(v) { json.put("last_fired", v) }

    /** Ringer mode saved by auto-silent, restored afterwards. */
    var savedRinger: Int
        get() = json.optInt("saved_ringer", -1)
        set(v) { json.put("saved_ringer", v) }

    companion object {
        private fun prayed(s: Int) = s in 1..3

        /** Same statistics as the desktop app's store::stats. */
        fun stats(tracker: JSONObject, qadaDone: Int, today: LocalDate): JSONObject {
            fun get(d: LocalDate): IntArray? = tracker.optJSONArray(d.toString())?.let { a -> IntArray(5) { a.optInt(it) } }
            fun full(d: LocalDate) = get(d)?.all { prayed(it) } == true
            var streak = 0
            var d = if (full(today)) today else today.minusDays(1)
            while (full(d)) { streak++; d = d.minusDays(1) }
            var best = 0; var run = 0; var prev: LocalDate? = null
            for (k in tracker.keys().asSequence().sorted()) {
                val date = runCatching { LocalDate.parse(k) }.getOrNull() ?: continue
                if (full(date)) {
                    run = if (prev != null && prev.plusDays(1) == date) run + 1 else 1
                    prev = date; best = maxOf(best, run)
                } else { run = 0; prev = null }
            }
            fun share(days: Int): Double {
                var done = 0; var total = 0
                for (i in 0 until days) get(today.minusDays(i.toLong()))?.let { s -> total += 5; done += s.count { prayed(it) } }
                return if (total == 0) 0.0 else done.toDouble() / total
            }
            val per = DoubleArray(5); var tracked = 0; var jamaah = 0
            for (i in 0 until 30) get(today.minusDays(i.toLong()))?.let { s ->
                tracked++
                s.forEachIndexed { p, v -> if (prayed(v)) per[p] += 1.0; if (v == 2) jamaah++ }
            }
            if (tracked > 0) for (i in per.indices) per[i] /= tracked.toDouble()
            var missed = 0
            for (k in tracker.keys()) tracker.optJSONArray(k)?.let { a -> for (i in 0 until a.length()) if (a.optInt(i) == 4) missed++ }
            return JSONObject()
                .put("streak", streak).put("best_streak", maxOf(best, streak))
                .put("week", share(7)).put("month", share(30))
                .put("per_prayer", JSONArray(per.toList()))
                .put("jamaah_month", jamaah).put("missed_total", missed)
                .put("qada_left", maxOf(0, missed - qadaDone))
        }
    }
}
