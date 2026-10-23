package com.coderashraf.waqt.core

import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Settings, in the same JSON shape as the desktop app's config so the
 * shared interface reads and writes them unchanged. Saved values are
 * merged over the defaults, so new settings get sensible values on update.
 */
class Config(val json: JSONObject) {
    val language get() = json.optString("language", "en")
    val clock get() = json.optInt("clock", 12)
    val banglaDigits get() = json.optBoolean("bangla_digits", true)
    val location: JSONObject get() = json.getJSONObject("location")
    val calc: JSONObject get() = json.getJSONObject("calc")
    val adhan: JSONObject get() = json.getJSONObject("adhan")
    val alerts: JSONObject get() = json.getJSONObject("alerts")
    val phone: JSONObject get() = json.getJSONObject("phone")

    val lat get() = location.getDouble("lat")
    val lng get() = location.getDouble("lng")

    fun prayer(key: String): JSONObject = adhan.getJSONObject(key)

    fun copy() = Config(JSONObject(json.toString()))

    companion object {
        val PRAYERS = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")

        /** Defaults: Dhaka, Karachi method, Hanafi Asr, moon-sighting Hijri. */
        fun defaults(): JSONObject = JSONObject(
            """
            {
              "language": "en", "clock": 12, "bangla_digits": true, "onboarded": false,
              "location": {"name": "Dhaka", "country": "Bangladesh", "country_code": "BD", "lat": 23.8103, "lng": 90.4125, "elevation": 0.0, "timezone": "Asia/Dhaka"},
              "calc": {"method": "karachi", "asr": "hanafi", "high_lat": "angle_based",
                       "offsets": {"fajr": 0, "sunrise": 0, "dhuhr": 0, "asr": 0, "maghrib": 0, "isha": 0},
                       "hijri_rule": "sighting", "hijri_offset": 0, "hijri_at_maghrib": false, "imsak_minutes": 0},
              "adhan": {"volume": 80, "fade_in": true, "show_window": true,
                        "fajr": {"mode": "adhan", "sound": "makkah-fajr", "reminder": 0},
                        "dhuhr": {"mode": "adhan", "sound": "makkah", "reminder": 0},
                        "asr": {"mode": "adhan", "sound": "makkah", "reminder": 0},
                        "maghrib": {"mode": "adhan", "sound": "makkah", "reminder": 0},
                        "isha": {"mode": "adhan", "sound": "makkah", "reminder": 0}},
              "alerts": {"sunrise_warning": 20, "sehri": "ramadan", "sehri_minutes": 45, "jumuah": true, "tahajjud": false, "azkar": true, "quran_time": ""},
              "startup": {"autostart": true, "close_to_tray": true},
              "phone": {
                "adhan_in_silent": true,
                "auto_silent": false, "silent_after": 5, "silent_minutes": 25,
                "jamaat": {"fajr": 0, "dhuhr": 0, "asr": 0, "maghrib": 0, "isha": 0, "jumuah": 0},
                "leave_before": 0, "walk_minutes": 10,
                "travel": true, "home": null,
                "fajr_wake": false, "wake_taps": 33,
                "volume_tasbih": true
              }
            }
            """.trimIndent()
        )

        /** Deep-merges `over` onto `base` (objects recursively, values replaced). */
        fun merge(base: JSONObject, over: JSONObject): JSONObject {
            for (k in over.keys()) {
                val v = over.get(k)
                val b = base.opt(k)
                if (v is JSONObject && b is JSONObject) merge(b, v) else base.put(k, v)
            }
            return base
        }

        fun load(file: File): Config {
            val base = defaults()
            if (file.exists()) {
                runCatching { merge(base, JSONObject(file.readText())) }
            }
            return Config(base)
        }

        fun save(file: File, cfg: Config) {
            validate(cfg)
            val tmp = File(file.path + ".tmp")
            tmp.writeText(cfg.json.toString(2))
            if (!tmp.renameTo(file)) {
                file.delete(); tmp.renameTo(file)
            }
        }

        fun validate(cfg: Config) {
            require(cfg.language in listOf("en", "bn")) { "language must be en or bn" }
            require(cfg.clock == 12 || cfg.clock == 24) { "clock must be 12 or 24" }
            require(cfg.lat in -90.0..90.0 && cfg.lng in -180.0..180.0) { "the location's coordinates are out of range" }
            val tz = cfg.location.optString("timezone", "")
            if (tz.isNotEmpty()) require(runCatching { java.time.ZoneId.of(tz) }.isSuccess) { "unknown time zone $tz" }
            require(kotlin.math.abs(cfg.calc.optInt("hijri_offset")) <= 3) { "the Hijri adjustment must be between -3 and 3 days" }
            require(cfg.adhan.optInt("volume") in 0..100) { "volume must be 0 to 100" }
        }

        fun jsonArray(list: List<Any?>) = JSONArray(list)
    }
}
