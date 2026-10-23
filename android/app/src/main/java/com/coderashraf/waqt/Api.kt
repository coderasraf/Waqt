package com.coderashraf.waqt

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.coderashraf.waqt.core.Astro
import com.coderashraf.waqt.core.Bangla
import com.coderashraf.waqt.core.Config
import com.coderashraf.waqt.core.Hijri
import com.coderashraf.waqt.core.HijriDate
import com.coderashraf.waqt.core.Prayer
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Day
import com.coderashraf.waqt.core.Store
import com.coderashraf.waqt.core.Text
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.LocalDate

/**
 * The same `/api/...` endpoints the desktop app's Rust server answers, so
 * the shared interface runs unchanged; plus phone-only ones (health check,
 * travel, location, file pickers). Answers are JSON; errors carry `error`.
 */
class Api(private val ctx: Context, private val host: Host) {
    /** What only the visible window can do. */
    interface Host {
        fun startActivity(intents: List<Intent>): Boolean
        fun requestPermission(permission: String, done: (Boolean) -> Unit)
        fun pickAudio(done: (Uri?) -> Unit)
        fun createDocument(name: String, mime: String, done: (Uri?) -> Unit)
        fun currentLocation(done: (android.location.Location?) -> Unit)
        fun js(code: String)
    }

    private val main = android.os.Handler(android.os.Looper.getMainLooper())
    @Volatile private var downloading = false

    class HttpError(val status: Int, message: String) : Exception(message)

    private val cfg get() = Repo.cfg
    private val store get() = Repo.store

    fun handle(method: String, path: String, body: String, reply: (Int, JSONObject) -> Unit) {
        val uri = Uri.parse("https://x$path")
        val q = { k: String -> uri.getQueryParameter(k) }
        val json = if (body.isBlank()) JSONObject() else runCatching { JSONObject(body) }.getOrElse { JSONObject() }
        val ok = { reply(200, JSONObject().put("ok", true)) }
        try {
            when ("$method ${uri.path}") {
                "GET /api/today" -> { Repo.refreshHijri(); reply(200, today()) }
                "GET /api/live" -> reply(200, live())
                "GET /api/month" -> reply(200, month(q("y")?.toIntOrNull(), q("m")?.toIntOrNull()))
                "GET /api/hmonth" -> reply(200, hmonth(q("y")?.toIntOrNull(), q("m")?.toIntOrNull()))
                "GET /api/events" -> reply(200, events())
                "GET /api/qibla" -> reply(200, qibla())
                "GET /api/settings" -> reply(200, settings())
                "PUT /api/settings" -> { Repo.saveConfig(Config(Config.merge(Config.defaults(), json))); ok() }
                "POST /api/prayer-mode" -> {
                    val c = cfg.copy()
                    c.prayer(json.getString("prayer")).put("mode", json.getString("mode"))
                    Repo.saveConfig(c); ok()
                }
                "POST /api/play" -> { AdhanService.start(ctx, "preview", json.optString("sound", "makkah"), false, 0); ok() }
                "POST /api/stop", "POST /api/wake/done" -> { AdhanService.stop(ctx); ok() }
                "POST /api/mute" -> {
                    store.muted = if (json.optBoolean("on")) Repo.today().toString() else null
                    store.save()
                    if (json.optBoolean("on")) AdhanService.stop(ctx)
                    ok()
                }
                "POST /api/sounds/import" -> importSound(reply)
                "POST /api/sounds/delete" -> deleteSound(json.optString("id"), reply)
                "POST /api/sounds/download" -> Thread {
                    try { Sounds.download(ctx, json.optString("id")); reply(200, JSONObject().put("sounds", Sounds.list(ctx))) }
                    catch (e: Exception) { reply(502, err(e.message ?: "download failed")) }
                }.start()
                "GET /api/geo/search" -> Thread { search(q("q").orEmpty(), reply) }.start()
                "GET /api/geo/detect" -> detect(reply)
                "GET /api/ayah" -> Thread {
                    try { reply(200, ayah()) } catch (e: Exception) { reply(502, err(e.message ?: "offline")) }
                }.start()
                "GET /api/tracker" -> reply(200, tracker(q("days")?.toIntOrNull() ?: 182))
                "POST /api/tracker" -> {
                    val date = LocalDate.parse(json.getString("date"))
                    if (date > Repo.today()) throw HttpError(400, "that day hasn't come yet")
                    store.setPrayer(date.toString(), json.getInt("prayer"), json.getInt("status")); store.save()
                    reply(200, JSONObject().put("day", JSONArray(store.day(date.toString()).toList())).put("stats", Store.stats(store.tracker, store.qadaDone, Repo.today())))
                }
                "POST /api/qada" -> {
                    store.qadaDone = maxOf(0, store.qadaDone + json.optInt("delta")); store.save()
                    reply(200, JSONObject().put("stats", Store.stats(store.tracker, store.qadaDone, Repo.today())))
                }
                "GET /api/tasbih" -> reply(200, tasbih())
                "POST /api/tasbih" -> {
                    val n = json.optLong("n")
                    if (n !in 1..10_000) throw HttpError(400, "bad tasbih count")
                    store.addTasbih(json.optString("id").take(40), Repo.today().toString(), n); store.save(); ok()
                }
                "POST /api/export" -> export(json.optInt("y"), json.optInt("m"), reply)
                "GET /api/health" -> reply(200, Health.status(ctx))
                "POST /api/health/fix" -> fix(json.optString("id"), reply)
                "POST /api/health/confirm" -> { store.json.put("oem_confirmed", true); store.save(); reply(200, Health.status(ctx)) }
                "POST /api/health/test" -> {
                    store.json.put("test_at", System.currentTimeMillis() + json.optLong("in", 60) * 1000); store.save()
                    Scheduler.reschedule(ctx); reply(200, Health.status(ctx))
                }
                "GET /api/travel" -> travel(reply)
                "POST /api/travel/home" -> setHome(reply)
                "POST /api/open" -> { host.startActivity(listOf(Intent(Intent.ACTION_VIEW, Uri.parse(json.getString("url"))).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))); ok() }
                "GET /api/show" -> ok()
                "GET /api/quran/state" -> reply(200, quranFile.takeIf { it.exists() }?.let { runCatching { JSONObject(it.readText()) }.getOrNull() } ?: JSONObject())
                "PUT /api/quran/state" -> { quranFile.writeText(json.toString()); ok() }
                "GET /api/quran/segments" -> Thread {
                    try { reply(200, JSONObject().put("v", QuranFiles.segments(ctx, q("r")!!.toInt(), q("s")!!.toInt()))) }
                    catch (e: Exception) { reply(502, err("offline")) }
                }.start()
                "GET /api/quran/tafsir" -> Thread {
                    try { reply(200, JSONObject().put("html", QuranFiles.tafsir(ctx, q("id")!!.toInt(), q("key")!!))) }
                    catch (e: Exception) { reply(502, err("offline")) }
                }.start()
                "GET /api/quran/voices" -> Thread {
                    try { reply(200, QuranPlayer.voices(ctx)) } catch (e: Exception) { reply(200, JSONObject().put("en", false).put("bn", false)) }
                }.start()
                "GET /api/quran/downloads" -> reply(200, QuranFiles.downloads(ctx, q("r")?.toIntOrNull() ?: 7).put("busy", downloading))
                "POST /api/quran/download" -> {
                    if (downloading) throw HttpError(409, "busy")
                    downloading = true
                    val r = json.optInt("r", 7); val s = json.optInt("s", 1)
                    Thread {
                        try {
                            QuranFiles.download(ctx, r, s, json.optBoolean("en")) { d, t -> host.js("window.onQuranDownload&&onQuranDownload($s,$d,$t)") }
                            reply(200, QuranFiles.downloads(ctx, r))
                        } catch (e: Exception) { reply(502, err(e.message ?: "offline")) }
                        finally { downloading = false }
                    }.start()
                }
                "POST /api/quran/download/cancel" -> { QuranFiles.cancelled = true; ok() }
                "POST /api/quran/download/delete" -> { QuranFiles.delete(ctx, json.optInt("r", 7), json.optInt("s", 0)); reply(200, QuranFiles.downloads(ctx, json.optInt("r", 7))) }
                "POST /api/quran/play" -> { main.post { QuranPlayer.play(ctx, json) }; ok() }
                "POST /api/quran/cmd" -> { main.post { QuranPlayer.command(json.optString("cmd")) }; ok() }
                "POST /api/quran/options" -> { main.post { QuranPlayer.options(json) }; ok() }
                "GET /api/quran/player" -> main.post { reply(200, QuranPlayer.state()) }
                "POST /api/quran/share" -> {
                    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, json.optString("text"))
                    host.startActivity(listOf(Intent.createChooser(send, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))); ok()
                }
                "POST /api/quran/voice-install" -> {
                    // Google's voice data screen first (where Bengali is added), else the system TTS settings.
                    val flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    host.startActivity(listOf(Intent(android.speech.tts.TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA).addFlags(flags), Intent("com.android.settings.TTS_SETTINGS").addFlags(flags)))
                    ok()
                }
                "GET /api/hadith/state" -> reply(200, hadithFile.takeIf { it.exists() }?.let { runCatching { JSONObject(it.readText()) }.getOrNull() } ?: JSONObject())
                "PUT /api/hadith/state" -> { hadithFile.writeText(json.toString()); ok() }
                "GET /api/hadith/status" -> reply(200, HadithFiles.status(ctx).put("busy", hadithBusy))
                "POST /api/hadith/ensure" -> Thread {
                    try { HadithFiles.ensure(ctx, json.getString("b"), ints(json.optJSONArray("s")), strings(json.optJSONArray("langs"))); ok() }
                    catch (e: Exception) { reply(502, err("offline")) }
                }.start()
                "POST /api/hadith/download" -> {
                    if (hadithBusy) throw HttpError(409, "busy")
                    hadithBusy = true
                    val b = json.getString("b")
                    Thread {
                        try {
                            HadithFiles.ensure(ctx, b, ints(json.optJSONArray("s")), strings(json.optJSONArray("langs"))) { d, t -> host.js("window.onHadithDownload&&onHadithDownload('$b',$d,$t)") }
                            reply(200, HadithFiles.status(ctx))
                        } catch (e: Exception) { reply(502, err(e.message ?: "offline")) }
                        finally { hadithBusy = false }
                    }.start()
                }
                "POST /api/hadith/download/cancel" -> { HadithFiles.cancelled = true; ok() }
                "POST /api/hadith/delete" -> { HadithFiles.delete(ctx, json.getString("b")); reply(200, HadithFiles.status(ctx)) }
                "POST /api/quran/copy" -> {
                    main.post {
                        val cm = ctx.getSystemService(android.content.ClipboardManager::class.java)
                        cm.setPrimaryClip(android.content.ClipData.newPlainText("Quran", json.optString("text")))
                    }
                    ok()
                }
                else -> throw HttpError(404, "no such endpoint ${uri.path}")
            }
        } catch (e: HttpError) {
            reply(e.status, err(e.message ?: ""))
        } catch (e: Exception) {
            reply(400, err(e.message ?: e.toString()))
        }
    }

    private fun err(msg: String) = JSONObject().put("error", msg)

    /** Quran reading state: bookmarks, last read, reader and player settings. */
    private val quranFile get() = File(ctx.filesDir, "quran.json")
    private val hadithFile get() = File(ctx.filesDir, "hadith.json")
    @Volatile private var hadithBusy = false
    private fun ints(a: JSONArray?) = (0 until (a?.length() ?: 0)).map { a!!.getInt(it) }
    private fun strings(a: JSONArray?) = (0 until (a?.length() ?: 0)).map { a!!.getString(it) }

    // ----- Shapes shared with the desktop app -----

    private fun hijriJson(h: HijriDate) = JSONObject().put("y", h.year).put("m", h.month).put("d", h.day)
        .put("month_en", Hijri.MONTHS_EN[h.month - 1]).put("month_bn", Hijri.MONTHS_BN[h.month - 1]).put("month_ar", Hijri.MONTHS_AR[h.month - 1])

    private fun eventJson(e: Hijri.EventDef) = JSONObject().put("key", e.key).put("kind", e.kind).put("en", e.en).put("bn", e.bn).put("ar", e.ar)
        .put("note_en", e.noteEn).put("note_bn", e.noteBn)

    private fun banglaJson(date: LocalDate) = Bangla.from(date).let { b ->
        JSONObject().put("y", b.year).put("m", b.month).put("d", b.day).put("month_bn", Bangla.MONTHS_BN[b.month - 1]).put("month_en", Bangla.MONTHS_EN[b.month - 1])
    }

    private fun dayJson(cal: Hijri.Cal, d: Day): JSONObject {
        val h = cal.fromGregorian(d.date)
        val times = JSONObject().put("fajr", d.fajr).put("sunrise", d.sunrise).put("dhuhr", d.dhuhr).put("asr", d.asr).put("maghrib", d.maghrib).put("isha", d.isha)
            .put("sunset", d.sunset).put("imsak", d.imsak).put("ishraq", d.ishraq).put("zawal", d.zawal).put("midnight", d.midnight).put("last_third", d.lastThird)
        return JSONObject().put("date", d.date.toString()).put("weekday", d.date.dayOfWeek.value % 7).put("tz_offset", d.tzOffsetMin).put("friday", d.friday)
            .put("times", times).put("hijri", hijriJson(h)).put("bangla", banglaJson(d.date))
            .put("events", JSONArray(Hijri.eventsOn(h).map { eventJson(it) })).put("fasts", JSONArray(Hijri.sunnahFasts(d.date, h)))
    }

    private fun moonJson(ms: Long) = Astro.moonPhase(ms).let { m ->
        JSONObject().put("age", m.age).put("illumination", m.illumination).put("phase", m.phase).put("name", m.name)
    }

    private fun today(): JSONObject {
        val c = cfg
        val now = System.currentTimeMillis()
        val today = Schedule.localDate(c, now)
        val d0 = Schedule.day(c, today); val d1 = Schedule.day(c, today.plusDays(1))
        val (cur, next) = Schedule.currentAndNext(c, now)
        val cal = Schedule.calendar(c)
        val hijriNow = cal.fromGregorian(if (c.calc.optBoolean("hijri_at_maghrib") && now >= d0.maghrib) d1.date else today)
        val hToday = cal.fromGregorian(today)
        val ramadan = if (hToday.month == 9) {
            JSONObject().put("active", true).put("day", hToday.day).put("sehri", if (now < d0.imsak) d0.imsak else d1.imsak).put("iftar", d0.maghrib)
        } else {
            val start = cal.toGregorian(HijriDate(if (hToday.month > 9) hToday.year + 1 else hToday.year, 9, 1))
            JSONObject().put("active", false).put("starts", start.toString()).put("days_left", start.toEpochDay() - today.toEpochDay())
        }
        val upcoming = JSONArray()
        cal.upcoming(today, 400).filter { it.date > today }.take(6).forEach {
            upcoming.put(JSONObject().put("date", it.date.toString()).put("days_left", it.date.toEpochDay() - today.toEpochDay()).put("hijri", hijriJson(it.hijri)).put("event", eventJson(it.event)))
        }
        val moment = { m: Schedule.Moment -> JSONObject().put("key", m.key).put("at", m.at) }
        val health = Health.status(ctx)
        val jamaat = JSONObject()
        for (p in Config.PRAYERS) com.coderashraf.waqt.core.Alerts.jamaatAt(c, d0, p)?.let { jamaat.put(p, it) }
        return JSONObject()
            .put("now", now).put("today", dayJson(cal, d0)).put("tomorrow", dayJson(cal, d1))
            .put("current", cur?.let(moment) ?: JSONObject.NULL).put("next", moment(next))
            .put("hijri_now", hijriJson(hijriNow)).put("bangla", banglaJson(today)).put("ramadan", ramadan).put("upcoming", upcoming)
            .put("moon", moonJson(now))
            .put("qibla", JSONObject().put("bearing", Astro.qiblaBearing(c.lat, c.lng)).put("distance", Astro.qiblaDistance(c.lat, c.lng)))
            .put("location", c.location).put("tracker", JSONArray(store.day(today.toString()).toList()))
            .put("method", Prayer.method(c.calc.optString("method")).name).put("asr", c.calc.optString("asr"))
            .put("health_failing", health.optInt("failing"))
            .put("travel", store.json.optJSONObject("travel") ?: JSONObject.NULL)
            .put("jamaat", jamaat)
    }

    private fun live(): JSONObject {
        val now = System.currentTimeMillis()
        val alert = Repo.alert?.takeIf { now - it.optLong("fired") < 15 * 60_000L }
        return JSONObject().put("now", now).put("playing", Repo.playing ?: JSONObject.NULL).put("alert", alert ?: JSONObject.NULL).put("muted", Repo.mutedToday())
    }

    private fun month(y0: Int?, m0: Int?): JSONObject {
        val today = Repo.today()
        val y = y0 ?: today.year; val m = m0 ?: today.monthValue
        val cal = Schedule.calendar(cfg)
        val days = JSONArray()
        var d = LocalDate.of(y, m, 1)
        while (d.monthValue == m) { days.put(dayJson(cal, Schedule.day(cfg, d))); d = d.plusDays(1) }
        return JSONObject().put("y", y).put("m", m).put("today", today.toString()).put("days", days)
    }

    private fun hmonth(y0: Int?, m0: Int?): JSONObject {
        val cal = Schedule.calendar(cfg)
        val today = Repo.today()
        val ht = cal.fromGregorian(today)
        val y = y0 ?: ht.year; val m = m0 ?: ht.month
        if (m !in 1..12 || y !in 1300..1600) throw HttpError(400, "no such Hijri month")
        val len = cal.monthLength(y, m)
        val first = cal.toGregorian(HijriDate(y, m, 1))
        val days = JSONArray()
        for (dd in 1..len) {
            val h = HijriDate(y, m, dd)
            val g = first.plusDays(dd - 1L)
            val noon = g.atTime(12, 0).toInstant(java.time.ZoneOffset.UTC).toEpochMilli()
            days.put(JSONObject().put("d", dd).put("date", g.toString()).put("weekday", g.dayOfWeek.value % 7).put("today", g == today)
                .put("events", JSONArray(Hijri.eventsOn(h).map { eventJson(it) })).put("fasts", JSONArray(Hijri.sunnahFasts(g, h)))
                .put("moon", moonJson(noon)))
        }
        return JSONObject().put("y", y).put("m", m).put("length", len).put("first", first.toString())
            .put("first_weekday", first.dayOfWeek.value % 7).put("names", hijriJson(HijriDate(y, m, 1))).put("days", days).put("today_hijri", hijriJson(ht))
    }

    private fun events(): JSONObject {
        val today = Repo.today()
        val list = JSONArray()
        Schedule.calendar(cfg).upcoming(today, 385).forEach {
            list.put(JSONObject().put("date", it.date.toString()).put("days_left", it.date.toEpochDay() - today.toEpochDay())
                .put("weekday", it.date.dayOfWeek.value % 7).put("hijri", hijriJson(it.hijri)).put("event", eventJson(it.event)))
        }
        return JSONObject().put("events", list).put("offset", cfg.calc.optInt("hijri_offset"))
    }

    private fun qibla(): JSONObject {
        val c = cfg
        val d = Schedule.day(c, Repo.today())
        val now = System.currentTimeMillis()
        val (alt, az) = Prayer.sunAltAz(now / 86_400_000.0 + 2_440_587.5, c.lat, c.lng)
        val aligns = JSONArray()
        Astro.sunAlignments(c.lat, c.lng, d.sunrise, d.sunset).forEach { aligns.put(JSONObject().put("at", it.at).put("facing", it.facing).put("altitude", it.altitude)) }
        val decl = android.hardware.GeomagneticField(c.lat.toFloat(), c.lng.toFloat(), c.location.optDouble("elevation", 0.0).toFloat(), now).declination
        return JSONObject().put("bearing", Astro.qiblaBearing(c.lat, c.lng)).put("distance", Astro.qiblaDistance(c.lat, c.lng))
            .put("alignments", aligns).put("sun", JSONObject().put("altitude", alt).put("azimuth", az))
            .put("sunrise", d.sunrise).put("sunset", d.sunset).put("tz_offset", d.tzOffsetMin).put("location", c.location)
            .put("declination", decl.toDouble()).put("compass", true)
    }

    private fun settings(): JSONObject {
        val methods = JSONArray(Prayer.METHODS.map { m ->
            val isha = when (val i = m.isha) { is Prayer.Isha.Angle -> "${i.deg}°"; is Prayer.Isha.Minutes -> "${i.min} min" }
            JSONObject().put("id", m.id).put("name", m.name).put("region", m.region).put("fajr", m.fajr).put("isha", isha)
        })
        return JSONObject().put("config", cfg.json).put("methods", methods).put("sounds", Sounds.list(ctx))
            .put("data_dir", "").put("desktop", false).put("android", true).put("family", Health.family())
    }

    private fun importSound(reply: (Int, JSONObject) -> Unit) = host.pickAudio { uri ->
        if (uri == null) { reply(200, JSONObject().put("cancelled", true)); return@pickAudio }
        try {
            val name = (ctx.contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                if (c.moveToFirst()) c.getString(0) else null
            } ?: "adhan.mp3").replace(Regex("[^\\p{L}\\p{N} ._()-]"), "_")
            val target = File(Sounds.dir(ctx), "custom-$name")
            ctx.contentResolver.openInputStream(uri)!!.use { input -> target.outputStream().use { input.copyTo(it) } }
            reply(200, JSONObject().put("id", "custom:$name").put("sounds", Sounds.list(ctx)))
        } catch (e: Exception) { reply(400, err(e.message ?: "could not copy the file")) }
    }

    private fun deleteSound(id: String, reply: (Int, JSONObject) -> Unit) {
        val name = id.removePrefix("custom:")
        if (!id.startsWith("custom:") || name.contains('/') || name.contains("..")) throw HttpError(400, "only your own sounds can be removed")
        File(Sounds.dir(ctx), "custom-$name").delete()
        val c = cfg.copy()
        for (p in Config.PRAYERS) if (c.prayer(p).optString("sound") == id) c.prayer(p).put("sound", Sounds.fallback(p))
        Repo.saveConfig(c)
        reply(200, JSONObject().put("sounds", Sounds.list(ctx)))
    }

    private fun recommend(cc: String): Triple<String, String, String> {
        val (m, a) = when (cc.uppercase()) {
            "BD", "PK", "IN", "AF" -> "karachi" to "hanafi"
            "US", "CA" -> "isna" to "standard"
            "SA", "YE" -> "makkah" to "standard"
            "EG", "SY", "LB", "SD", "LY", "DZ", "IQ", "JO", "PS" -> "egypt" to "standard"
            "AE" -> "dubai" to "standard"; "KW" -> "kuwait" to "standard"; "QA" -> "qatar" to "standard"
            "BH", "OM" -> "gulf" to "standard"
            "MY", "SG", "ID", "BN" -> "singapore" to "standard"
            "TR" -> "turkey" to "hanafi"; "IR" -> "tehran" to "standard"; "FR" -> "france" to "standard"; "RU" -> "russia" to "standard"
            else -> "mwl" to "standard"
        }
        val rule = if (cc.uppercase() in listOf("BD", "PK", "IN", "AF", "LK", "NP", "MA", "GB")) "sighting" else "umm_al_qura"
        return Triple(m, a, rule)
    }

    private fun placeResult(p: JSONObject, cc: String): JSONObject {
        val (m, a, r) = recommend(cc)
        return JSONObject().put("place", p).put("method", m).put("asr", a).put("rule", r)
    }

    private fun search(q: String, reply: (Int, JSONObject) -> Unit) {
        if (q.trim().length < 2) return reply(200, JSONObject().put("results", JSONArray()))
        try {
            val v = Net.getJson("https://geocoding-api.open-meteo.com/v1/search?name=${Net.enc(q.trim())}&count=12&language=${if (cfg.language == "bn") "bn" else "en"}&format=json")
            val out = JSONArray()
            val list = v.optJSONArray("results") ?: JSONArray()
            for (i in 0 until list.length()) {
                val r = list.getJSONObject(i)
                val p = JSONObject().put("name", r.optString("name")).put("region", r.optString("admin2").ifEmpty { r.optString("admin1") })
                    .put("country", r.optString("country")).put("country_code", r.optString("country_code"))
                    .put("lat", r.optDouble("latitude")).put("lng", r.optDouble("longitude")).put("elevation", r.optDouble("elevation", 0.0)).put("timezone", r.optString("timezone"))
                out.put(placeResult(p, r.optString("country_code")))
            }
            reply(200, JSONObject().put("results", out))
        } catch (e: Exception) { reply(502, err(e.message ?: "offline")) }
    }

    /** GPS/network location (coarse), named by reverse geocoding; IP as fallback. */
    private fun detect(reply: (Int, JSONObject) -> Unit) {
        host.requestPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) { granted ->
            if (!granted) return@requestPermission Thread { ipDetect(reply) }.start()
            host.currentLocation { loc ->
                Thread {
                    if (loc == null) return@Thread ipDetect(reply)
                    try {
                        val r = Net.getJson("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.latitude}&longitude=${loc.longitude}&localityLanguage=${if (cfg.language == "bn") "bn" else "en"}")
                        val name = r.optString("city").ifEmpty { r.optString("locality") }.ifEmpty { r.optString("principalSubdivision") }
                        val p = JSONObject().put("name", name).put("region", r.optString("principalSubdivision")).put("country", r.optString("countryName"))
                            .put("country_code", r.optString("countryCode")).put("lat", loc.latitude).put("lng", loc.longitude)
                            .put("elevation", if (loc.hasAltitude()) loc.altitude else 0.0).put("timezone", java.time.ZoneId.systemDefault().id)
                        reply(200, placeResult(p, r.optString("countryCode")))
                    } catch (e: Exception) {
                        val p = JSONObject().put("name", "%.3f, %.3f".format(loc.latitude, loc.longitude)).put("region", "").put("country", "").put("country_code", "")
                            .put("lat", loc.latitude).put("lng", loc.longitude).put("elevation", 0.0).put("timezone", java.time.ZoneId.systemDefault().id)
                        reply(200, placeResult(p, ""))
                    }
                }.start()
            }
        }
    }

    private fun ipDetect(reply: (Int, JSONObject) -> Unit) {
        try {
            val v = Net.getJson("https://ipwho.is/")
            if (!v.optBoolean("success")) throw Exception("could not find your location")
            val p = JSONObject().put("name", v.optString("city")).put("region", v.optString("region")).put("country", v.optString("country"))
                .put("country_code", v.optString("country_code")).put("lat", v.optDouble("latitude")).put("lng", v.optDouble("longitude"))
                .put("elevation", 0.0).put("timezone", v.optJSONObject("timezone")?.optString("id") ?: java.time.ZoneId.systemDefault().id)
            reply(200, placeResult(p, v.optString("country_code")))
        } catch (e: Exception) { reply(502, err(e.message ?: "offline")) }
    }

    private fun ayah(): JSONObject {
        val date = Repo.today()
        val cache = File(ctx.cacheDir, "ayah-$date.json")
        if (cache.exists()) return JSONObject(cache.readText())
        val days = Math.abs(date.toEpochDay() - LocalDate.of(2024, 1, 1).toEpochDay())
        val number = (days * 2_917 % 6_236 + 1).toInt()
        val v = Net.getJson("https://api.alquran.cloud/v1/ayah/$number/editions/quran-uthmani,en.sahih,bn.bengali")
        val d = v.getJSONArray("data")
        val first = d.getJSONObject(0)
        val a = JSONObject().put("date", date.toString()).put("number", number)
            .put("surah", first.getJSONObject("surah").optInt("number")).put("ayah", first.optInt("numberInSurah"))
            .put("surah_en", first.getJSONObject("surah").optString("englishName")).put("surah_ar", first.getJSONObject("surah").optString("name"))
            .put("arabic", d.getJSONObject(0).optString("text")).put("english", d.optJSONObject(1)?.optString("text") ?: "").put("bangla", d.optJSONObject(2)?.optString("text") ?: "")
        cache.writeText(a.toString())
        ctx.cacheDir.listFiles()?.filter { it.name.startsWith("ayah-") && it.name != cache.name }?.forEach { it.delete() }
        return a
    }

    private fun tracker(days: Int): JSONObject {
        val today = Repo.today()
        val out = JSONObject()
        for (i in 0 until days.coerceIn(7, 800)) {
            val d = today.minusDays(i.toLong()).toString()
            store.tracker.optJSONArray(d)?.let { out.put(d, it) }
        }
        return JSONObject().put("today", today.toString()).put("days", out).put("stats", Store.stats(store.tracker, store.qadaDone, today)).put("qada_done", store.qadaDone)
    }

    private fun tasbih(): JSONObject {
        val t = store.json.getJSONObject("tasbih")
        val daily = t.getJSONObject("daily")
        val recent = JSONArray()
        daily.keys().asSequence().sortedDescending().take(30).forEach { recent.put(JSONObject().put("date", it).put("count", daily.optLong(it))) }
        return JSONObject().put("totals", t.getJSONObject("totals")).put("today", daily.optLong(Repo.today().toString())).put("recent", recent)
    }

    private fun export(y: Int, m: Int, reply: (Int, JSONObject) -> Unit) {
        val c = cfg
        val cal = Schedule.calendar(c)
        val sb = StringBuilder("﻿Date,Day,Hijri,Sehri ends,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Isha\n")
        var d = LocalDate.of(y, m, 1)
        while (d.monthValue == m) {
            val day = Schedule.day(c, d)
            val h = cal.fromGregorian(d)
            val t = { ms: Long -> Text.time(ms, day.tzOffsetMin, 24, "en", false) }
            sb.append("$d,${d.dayOfWeek.name.take(3).lowercase().replaceFirstChar { it.uppercase() }},${h.day} ${Hijri.MONTHS_EN[h.month - 1]} ${h.year},${t(day.imsak)},${t(day.fajr)},${t(day.sunrise)},${t(day.dhuhr)},${t(day.asr)},${t(day.maghrib)},${t(day.isha)}\n")
            d = d.plusDays(1)
        }
        val name = "Prayer times ${c.location.optString("name")} ${java.time.Month.of(m).name.lowercase().replaceFirstChar { it.uppercase() }} $y.csv"
        host.createDocument(name, "text/csv") { uri ->
            if (uri == null) return@createDocument reply(200, JSONObject().put("cancelled", true))
            ctx.contentResolver.openOutputStream(uri)!!.use { it.write(sb.toString().toByteArray()) }
            reply(200, JSONObject().put("path", name))
        }
    }

    private fun fix(id: String, reply: (Int, JSONObject) -> Unit) {
        if (id == "notifications" && android.os.Build.VERSION.SDK_INT >= 33) {
            host.requestPermission(android.Manifest.permission.POST_NOTIFICATIONS) { granted ->
                if (!granted) host.startActivity(Health.fixIntents(ctx, id))
                reply(200, Health.status(ctx))
            }
            return
        }
        val opened = host.startActivity(Health.fixIntents(ctx, id))
        reply(200, Health.status(ctx).put("opened", opened))
    }

    // ----- Travel mode (Qasr) -----

    private fun threshold() = if (cfg.calc.optString("asr") == "hanafi") 77.25 else 81.0

    private fun travel(reply: (Int, JSONObject) -> Unit) {
        val home = cfg.phone.optJSONObject("home")
        if (!cfg.phone.optBoolean("travel") || home == null) return reply(200, JSONObject().put("enabled", false))
        val granted = ctx.checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
        if (!granted) return reply(200, JSONObject().put("enabled", true).put("needs_permission", true))
        host.currentLocation { loc ->
            if (loc == null) return@currentLocation reply(200, JSONObject().put("enabled", true).put("unknown", true))
            val dist = Astro.distanceKm(home.getDouble("lat"), home.getDouble("lng"), loc.latitude, loc.longitude)
            val fromSet = Astro.distanceKm(cfg.lat, cfg.lng, loc.latitude, loc.longitude)
            val t = JSONObject().put("enabled", true).put("distance_km", dist).put("threshold_km", threshold())
                .put("traveler", dist >= threshold()).put("home", home).put("lat", loc.latitude).put("lng", loc.longitude)
                .put("away_from_times_km", fromSet).put("checked", System.currentTimeMillis())
            store.json.put("travel", t); store.save()
            reply(200, t)
        }
    }

    private fun setHome(reply: (Int, JSONObject) -> Unit) {
        val c = cfg.copy()
        c.phone.put("home", JSONObject().put("lat", c.lat).put("lng", c.lng).put("name", c.location.optString("name")))
        c.phone.put("travel", true)
        Repo.saveConfig(c)
        store.json.remove("travel"); store.save()
        reply(200, JSONObject().put("ok", true).put("home", c.phone.getJSONObject("home")))
    }
}
