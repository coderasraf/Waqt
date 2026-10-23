@file:androidx.annotation.OptIn(markerClass = [androidx.media3.common.util.UnstableApi::class])

package com.coderashraf.waqt

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.coderashraf.waqt.core.Text
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaController
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * The bundled Quran's facts (surah lengths, reciters) and the files kept on
 * the phone: downloaded recitations, word timings and tafsir.
 */
object QuranFiles {
    private var meta: JSONObject? = null

    @Synchronized
    fun meta(ctx: Context): JSONObject = meta ?: JSONObject(ctx.assets.open("quran/meta.json").bufferedReader().use { it.readText() }).also { meta = it }

    fun verses(ctx: Context, s: Int): Int = meta(ctx).getJSONArray("chapters").getJSONObject(s - 1).getInt("verses")

    fun reciter(ctx: Context, id: Int): JSONObject {
        val all = meta(ctx).getJSONArray("reciters")
        for (i in 0 until all.length()) if (all.getJSONObject(i).getInt("id") == id) return all.getJSONObject(i)
        return all.getJSONObject(0)
    }

    /** One translation of a whole surah, from the bundled text. */
    fun translation(ctx: Context, id: Int, s: Int): JSONArray =
        JSONArray(ctx.assets.open("quran/t/$id/${pad(s)}.json").bufferedReader().use { it.readText() })

    fun pad(n: Int) = n.toString().padStart(3, '0')
    private fun url(pattern: String, s: Int, v: Int) = pattern.replace("{s}", pad(s)).replace("{v}", pad(v))

    private fun dir(ctx: Context, key: String) = File(ctx.filesDir, "qaudio/$key")
    private fun file(ctx: Context, key: String, s: Int, v: Int) = File(dir(ctx, key), "${pad(s)}${pad(v)}.mp3")

    /** A verse's recitation: the downloaded copy if there is one. */
    fun recitation(ctx: Context, reciter: JSONObject, s: Int, v: Int): Uri {
        val f = file(ctx, "r${reciter.getInt("id")}", s, v)
        return if (f.exists()) Uri.fromFile(f) else Uri.parse(url(reciter.getString("url"), s, v))
    }

    /** The human English reading of a verse's meaning. */
    fun english(ctx: Context, s: Int, v: Int): Uri {
        val f = file(ctx, "en", s, v)
        return if (f.exists()) Uri.fromFile(f) else Uri.parse(url(meta(ctx).getJSONObject("english_audio").getString("url"), s, v))
    }

    @Volatile var cancelled = false

    /** Saves a surah's recitation (and the English reading) for offline listening. */
    fun download(ctx: Context, rid: Int, s: Int, withEnglish: Boolean, progress: (Int, Int) -> Unit) {
        cancelled = false
        val reciter = reciter(ctx, rid)
        val n = verses(ctx, s)
        val jobs = (1..n).map { v -> Triple("r$rid", url(reciter.getString("url"), s, v), v) } +
            if (withEnglish) (1..n).map { v -> Triple("en", url(meta(ctx).getJSONObject("english_audio").getString("url"), s, v), v) } else emptyList()
        segments(ctx, rid, s)
        jobs.forEachIndexed { i, (key, link, v) ->
            if (cancelled) error("cancelled")
            val target = file(ctx, key, s, v)
            if (!target.exists()) fetch(link, target)
            progress(i + 1, jobs.size)
        }
    }

    private fun fetch(link: String, target: File) {
        target.parentFile?.mkdirs()
        val part = File(target.path + ".part")
        val c = URL(link).openConnection() as HttpURLConnection
        c.connectTimeout = 15_000; c.readTimeout = 30_000
        c.instanceFollowRedirects = true
        c.setRequestProperty("User-Agent", "Waqt-Android")
        try {
            if (c.responseCode !in 200..299) error("the server answered ${c.responseCode}")
            c.inputStream.use { input -> part.outputStream().use { input.copyTo(it) } }
        } finally { c.disconnect() }
        if (part.length() < 1000) { part.delete(); error("the download was incomplete") }
        part.renameTo(target)
    }

    /** Which surahs are saved for a reciter, and how much room they take. */
    fun downloads(ctx: Context, rid: Int): JSONObject {
        val files = dir(ctx, "r$rid").listFiles()?.filter { it.name.endsWith(".mp3") }.orEmpty()
        val en = dir(ctx, "en").listFiles()?.filter { it.name.endsWith(".mp3") }.orEmpty()
        val bySurah = files.groupBy { it.name.take(3).toInt() }
        val enBySurah = en.groupBy { it.name.take(3).toInt() }
        val list = JSONArray()
        for ((s, fs) in bySurah.toSortedMap()) {
            list.put(JSONObject().put("s", s).put("have", fs.size).put("total", verses(ctx, s)).put("en", enBySurah[s]?.size ?: 0))
        }
        val bytes = files.sumOf { it.length() } + en.sumOf { it.length() }
        return JSONObject().put("surahs", list).put("bytes", bytes)
    }

    fun delete(ctx: Context, rid: Int, s: Int) {
        val prefix = if (s > 0) pad(s) else ""
        for (key in listOf("r$rid", "en")) {
            dir(ctx, key).listFiles()?.filter { it.name.startsWith(prefix) }?.forEach { it.delete() }
        }
    }

    /** Word timings for a reciter's surah: [[word, startMs, endMs], …] per verse. */
    fun segments(ctx: Context, rid: Int, s: Int): JSONObject {
        val f = File(ctx.filesDir, "qseg/r$rid/${pad(s)}.json")
        if (f.exists()) return JSONObject(f.readText())
        val out = JSONObject()
        var page = 1
        while (true) {
            val j = Net.getJson("https://api.quran.com/api/v4/recitations/$rid/by_chapter/$s?fields=segments&per_page=50&page=$page")
            val files = j.getJSONArray("audio_files")
            for (i in 0 until files.length()) {
                val a = files.getJSONObject(i)
                val v = a.getString("verse_key").substringAfter(':')
                val segs = a.optJSONArray("segments") ?: JSONArray()
                val clean = JSONArray()
                for (k in 0 until segs.length()) {
                    val x = segs.getJSONArray(k)
                    if (x.length() < 3) continue
                    clean.put(JSONArray().put(x.getInt(x.length() - 3)).put(x.getInt(x.length() - 2)).put(x.getInt(x.length() - 1)))
                }
                out.put(v, clean)
            }
            val next = j.optJSONObject("pagination")?.opt("next_page")
            if (next == null || next == JSONObject.NULL) break
            page++
        }
        f.parentFile?.mkdirs()
        f.writeText(out.toString())
        return out
    }

    /** A verse's tafsir from Quran.com, kept after the first read. */
    fun tafsir(ctx: Context, id: Int, key: String): String {
        val f = File(ctx.filesDir, "qtafsir/$id/${key.replace(':', '_')}.html")
        if (f.exists()) return f.readText()
        val t = Net.getJson("https://api.quran.com/api/v4/tafsirs/$id/by_ayah/$key").getJSONObject("tafsir").optString("text")
        f.parentFile?.mkdirs()
        f.writeText(t)
        return t
    }
}

/**
 * The Quran audiobook: each verse recited, optionally followed by its
 * meaning (a human English reading, or the phone's own voice reading the
 * chosen English or Bengali translation). It runs in a media session, so it
 * keeps playing with the screen off and shows lock-screen controls.
 *
 * The queue is fed a few verses ahead, so the phone's voice has time to
 * prepare the meaning before it's needed. Main thread only, except [feed].
 */
object QuranPlayer {
    private val main = Handler(Looper.getMainLooper())
    private val worker = Executors.newSingleThreadExecutor()
    private lateinit var app: Context
    private var exo: ExoPlayer? = null
    private var cache: SimpleCache? = null
    private var controller: ListenableFuture<MediaController>? = null

    /** What to play, as the page asked. */
    private class Plan(j: JSONObject, ctx: Context) {
        val reciter: JSONObject = QuranFiles.reciter(ctx, j.optInt("reciter", 7))
        val surah = j.optInt("s", 1)
        val from = j.optInt("v", 1)
        val to = j.optInt("to", 0)
        val repeat = j.optInt("repeat", 1).coerceIn(1, 99)
        var loops = j.optInt("loop", 0)
        val gap = j.optInt("gap", 0)
        val meaning: String = j.optString("meaning", "")
        val en = j.optInt("en", 20)
        val bn = j.optInt("bn", 161)
        var next = j.optBoolean("next", true)
        val title: String = j.optString("title", "")
    }

    private var plan: Plan? = null
    private var cursorS = 0
    private var cursorV = 0
    private var unitsQueued = 0
    private var feeding = false
    private var generation = 0
    private var gapPending: Runnable? = null
    private var sleepAt = 0L
    private val sleeper = Runnable { exo?.pause(); sleepAt = 0 }
    @Volatile var lastError: String? = null
    private val artwork by lazy { runCatching { app.assets.open("web/logo.png").use { it.readBytes() } }.getOrNull() }

    fun player(ctx: Context): ExoPlayer {
        exo?.let { return it }
        app = ctx.applicationContext
        val c = cache ?: SimpleCache(File(app.cacheDir, "quran-audio"), LeastRecentlyUsedCacheEvictor(300L * 1024 * 1024), StandaloneDatabaseProvider(app)).also { cache = it }
        val http = DefaultHttpDataSource.Factory().setUserAgent("Waqt-Android").setAllowCrossProtocolRedirects(true)
        val cached = CacheDataSource.Factory().setCache(c).setUpstreamDataSourceFactory(http).setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
        val p = ExoPlayer.Builder(app)
            .setMediaSourceFactory(DefaultMediaSourceFactory(DefaultDataSource.Factory(app, cached)))
            .setAudioAttributes(AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_SPEECH).build(), true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_NETWORK)
            .build()
        p.addListener(object : Player.Listener {
            override fun onMediaItemTransition(item: MediaItem?, reason: Int) {
                pump()
                trim()
                val g = plan?.gap ?: 0
                val id = parse(item)
                if (g > 0 && reason == Player.MEDIA_ITEM_TRANSITION_REASON_AUTO && id != null && id.kind == "ar" && id.rep == 0) {
                    p.pause()
                    val r = Runnable { gapPending = null; p.play() }
                    gapPending = r
                    main.postDelayed(r, g.toLong())
                }
            }

            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED && cursorS == 0 && !feeding) plan = null
            }

            override fun onPlayerError(error: PlaybackException) {
                lastError = if (error.errorCode in 2000..2999) "offline" else (error.message ?: "error")
                // A missing file: move on rather than stop the whole surah.
                if (error.errorCode !in 2000..2999 && p.hasNextMediaItem()) { p.seekToNextMediaItem(); p.prepare(); p.play() }
            }
        })
        exo = p
        return p
    }

    private data class Id(val unit: Int, val s: Int, val v: Int, val kind: String, val rep: Int)
    private fun parse(item: MediaItem?): Id? {
        val parts = item?.mediaId?.split('|') ?: return null
        if (parts.size < 5) return null
        return Id(parts[0].toInt(), parts[1].toInt(), parts[2].toInt(), parts[3], parts[4].toInt())
    }

    /** Starts the audiobook from a verse with the page's options. */
    fun play(ctx: Context, j: JSONObject) {
        val p = player(ctx)
        connect()
        gapPending?.let { main.removeCallbacks(it) }; gapPending = null
        lastError = null
        generation++
        plan = Plan(j, app)
        cursorS = plan!!.surah; cursorV = plan!!.from
        unitsQueued = 0
        feeding = false
        p.stop()
        p.clearMediaItems()
        p.setPlaybackSpeed(j.optDouble("speed", 1.0).toFloat())
        p.playWhenReady = true
        pump()
    }

    /** Live changes from the player screen. */
    fun options(j: JSONObject) {
        val p = exo ?: return
        if (j.has("speed")) p.setPlaybackSpeed(j.getDouble("speed").toFloat())
        if (j.has("sleep")) {
            main.removeCallbacks(sleeper)
            val min = j.getInt("sleep")
            sleepAt = if (min > 0) System.currentTimeMillis() + min * 60_000L else 0
            if (min > 0) main.postDelayed(sleeper, min * 60_000L)
            // -1: stop at the end of this surah.
            if (min == -1) plan?.next = false
        }
    }

    fun command(cmd: String) {
        val p = exo ?: return
        when (cmd) {
            "toggle" -> if (p.isPlaying || gapPending != null) pause() else { if (p.playbackState == Player.STATE_IDLE) p.prepare(); p.play() }
            "pause" -> pause()
            "play" -> { if (p.playbackState == Player.STATE_IDLE) p.prepare(); p.play() }
            "next" -> skipVerse(1)
            "prev" -> skipVerse(-1)
            "stop" -> stop()
        }
    }

    fun pause() {
        gapPending?.let { main.removeCallbacks(it) }; gapPending = null
        exo?.pause()
    }

    /** The adhan comes first. */
    fun pauseForAdhan() = main.post { pause() }

    fun stop() {
        pause()
        generation++
        plan = null; cursorS = 0
        exo?.stop(); exo?.clearMediaItems()
        main.removeCallbacks(sleeper); sleepAt = 0
        controller?.let { MediaController.releaseFuture(it) }
        controller = null
    }

    /** The next or previous verse's recitation (not just the next clip). */
    private fun skipVerse(dir: Int) {
        val p = exo ?: return
        val cur = parse(p.currentMediaItem) ?: return
        if (dir < 0 && p.currentPosition > 2500 && cur.kind == "ar") { p.seekTo(p.currentMediaItemIndex, 0); return }
        var i = p.currentMediaItemIndex + dir
        while (i in 0 until p.mediaItemCount) {
            val id = parse(p.getMediaItemAt(i))
            if (id != null && id.kind == "ar" && id.rep == 0 && id.unit != cur.unit) { p.seekTo(i, 0); p.play(); return }
            i += dir
        }
        // Before the queue: restart from the previous verse.
        if (dir < 0) plan?.let { pl ->
            val (s, v) = if (cur.v > 1) cur.s to cur.v - 1 else if (cur.s > 1) (cur.s - 1) to QuranFiles.verses(app, cur.s - 1) else return
            play(app, JSONObject().put("reciter", pl.reciter.getInt("id")).put("s", s).put("v", v).put("to", pl.to).put("repeat", pl.repeat)
                .put("loop", pl.loops).put("gap", pl.gap).put("meaning", pl.meaning).put("en", pl.en).put("bn", pl.bn).put("next", pl.next).put("speed", p.playbackParameters.speed.toDouble()))
        }
    }

    /** The service owns the notification; binding a controller starts it. */
    private fun connect() {
        if (controller != null) return
        controller = MediaController.Builder(app, SessionToken(app, ComponentName(app, QuranService::class.java))).buildAsync()
    }

    /** Keeps three verses queued ahead of the one playing. */
    private fun pump() {
        val p = exo ?: return
        val pl = plan ?: return
        if (feeding || cursorS == 0) return
        val playing = parse(p.currentMediaItem)?.unit ?: 0
        if (unitsQueued - playing > 3) return
        feeding = true
        val g = generation
        val s = cursorS; val v = cursorV
        advance(pl)
        val unit = unitsQueued++
        worker.execute {
            val items = build(pl, unit, s, v)
            main.post {
                if (g != generation) return@post
                feeding = false
                val wasEnded = p.playbackState == Player.STATE_ENDED || p.mediaItemCount == 0
                val at = p.mediaItemCount
                p.addMediaItems(items)
                if (wasEnded && items.isNotEmpty()) { p.seekTo(at, 0); p.prepare(); p.play() }
                pump()
            }
        }
    }

    private fun advance(pl: Plan) {
        val last = if (cursorS == pl.surah && pl.to > 0) pl.to else QuranFiles.verses(app, cursorS)
        if (cursorV < last) { cursorV++; return }
        if (pl.to > 0 && pl.loops != 0) {
            if (pl.loops > 0) pl.loops--
            cursorS = pl.surah; cursorV = pl.from
        } else if (pl.to == 0 && pl.loops != 0) {
            if (pl.loops > 0) pl.loops--
            cursorV = pl.from
        } else if (pl.next && pl.to == 0 && cursorS < 114) {
            cursorS++; cursorV = 1
        } else {
            cursorS = 0
        }
    }

    /** One verse's clips: the recitation (repeated), then its meaning. Worker thread. */
    private fun build(pl: Plan, unit: Int, s: Int, v: Int): List<MediaItem> {
        val ch = QuranFiles.meta(app).getJSONArray("chapters").getJSONObject(s - 1)
        val lang = Repo.cfg.language
        val name = if (lang == "bn") ch.getString("bn") else ch.getString("en")
        val title = if (lang == "bn") "$name ${Text.digits("$s:$v", true)}" else "$name $s:$v"
        val artist = if (lang == "bn") pl.reciter.optString("name_bn") else pl.reciter.optString("name")
        fun item(kind: String, rep: Int, uri: Uri) = MediaItem.Builder()
            .setMediaId("$unit|$s|$v|$kind|$rep")
            .setUri(uri)
            .setMediaMetadata(MediaMetadata.Builder().setTitle(title).setArtist(artist).setAlbumTitle("Waqt · Quran")
                .apply { artwork?.let { setArtworkData(it, MediaMetadata.PICTURE_TYPE_FRONT_COVER) } }.build())
            .build()
        val out = mutableListOf<MediaItem>()
        repeat(pl.repeat) { r -> out += item("ar", r, QuranFiles.recitation(app, pl.reciter, s, v)) }
        // The meaning: "en" a human English reading, "ent" the phone's English voice, "bn" its Bengali voice.
        val m = pl.meaning.split(',')
        if ("en" in m) out += item("en", 0, QuranFiles.english(app, s, v))
        if ("ent" in m) speak(QuranFiles.translation(app, pl.en, s).optString(v - 1), Locale.US, "en-${pl.en}-$s-$v")?.let { out += item("ent", 0, it) }
        if ("bn" in m) speak(QuranFiles.translation(app, pl.bn, s).optString(v - 1), Locale("bn", "BD"), "bn-${pl.bn}-$s-$v")?.let { out += item("bn", 0, it) }
        return out
    }

    // ----- The phone's voice for the meaning -----
    private var tts: TextToSpeech? = null
    private var ttsOk = false
    private val waiting = HashMap<String, CountDownLatch>()

    private fun tts(): TextToSpeech? {
        tts?.let { return if (ttsOk) it else null }
        val ready = CountDownLatch(1)
        val t = TextToSpeech(app) { status -> ttsOk = status == TextToSpeech.SUCCESS; ready.countDown() }
        ready.await(8, TimeUnit.SECONDS)
        t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String) {}
            override fun onDone(id: String) { synchronized(waiting) { waiting.remove(id) }?.countDown() }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String) { synchronized(waiting) { waiting.remove(id) }?.countDown() }
        })
        tts = t
        return if (ttsOk) t else null
    }

    private fun voice(t: TextToSpeech, locale: Locale): Boolean {
        val tries = if (locale.language == "bn") listOf(locale, Locale("bn", "IN"), Locale("bn")) else listOf(locale, Locale.UK, Locale.ENGLISH)
        return tries.any { t.isLanguageAvailable(it) >= TextToSpeech.LANG_AVAILABLE && t.setLanguage(it) >= TextToSpeech.LANG_AVAILABLE }
    }

    /** Which languages the phone's voice can read. Any thread but main. */
    fun voices(ctx: Context): JSONObject {
        app = ctx.applicationContext
        val t = worker.submit<JSONObject> {
            val e = tts()
            JSONObject().put("en", e != null && voice(e, Locale.US)).put("bn", e != null && voice(e, Locale("bn", "BD")))
        }
        return t.get(15, TimeUnit.SECONDS)
    }

    /** The meaning, spoken into a file the player can queue. Worker thread. */
    private fun speak(text: String, locale: Locale, key: String): Uri? {
        if (text.isBlank()) return null
        val dir = File(app.cacheDir, "qtts").apply { mkdirs() }
        val f = File(dir, "$key.wav")
        if (f.length() > 1000) return Uri.fromFile(f)
        val t = tts() ?: run { lastError = "no_voice"; return null }
        if (!voice(t, locale)) { lastError = if (locale.language == "bn") "no_bn_voice" else "no_voice"; return null }
        val done = CountDownLatch(1)
        synchronized(waiting) { waiting[key] = done }
        val clipped = text.take(TextToSpeech.getMaxSpeechInputLength() - 1)
        t.synthesizeToFile(clipped, Bundle(), f, key)
        done.await(90, TimeUnit.SECONDS)
        // Keep the voice cache small.
        dir.listFiles()?.sortedBy { it.lastModified() }?.dropLast(120)?.forEach { it.delete() }
        return if (f.length() > 1000) Uri.fromFile(f) else null
    }

    private fun trim() {
        val p = exo ?: return
        val i = p.currentMediaItemIndex
        if (i > 30) p.removeMediaItems(0, i - 20)
    }

    /** What the page draws: the verse playing and how far into it. */
    fun state(): JSONObject {
        val p = exo
        val id = parse(p?.currentMediaItem)
        val o = JSONObject().put("active", p != null && plan != null && id != null)
        if (p == null || id == null || plan == null) return o.put("error", lastError)
        return o.put("s", id.s).put("v", id.v).put("kind", id.kind).put("rep", id.rep)
            .put("pos", p.currentPosition).put("dur", p.duration.coerceAtLeast(0))
            .put("playing", p.isPlaying || gapPending != null).put("loading", p.playbackState == Player.STATE_BUFFERING)
            .put("speed", p.playbackParameters.speed.toDouble()).put("reciter", plan!!.reciter.getInt("id"))
            .put("repeat", plan!!.repeat).put("sleep", sleepAt).put("error", lastError)
            .put("from", plan!!.from).put("to", plan!!.to).put("surah", plan!!.surah)
    }

    val active get() = exo != null && plan != null

    fun release() {
        stop()
        exo?.release(); exo = null
    }
}

/** Hosts the audiobook's media session: notification, lock screen, headset buttons. */
class QuranService : MediaSessionService() {
    private var session: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        val open = PendingIntent.getActivity(this, 7, Intent(this, MainActivity::class.java).putExtra("route", "quran/listen").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        session = MediaSession.Builder(this, QuranPlayer.player(this)).setSessionActivity(open).build()
        setMediaNotificationProvider(DefaultMediaNotificationProvider.Builder(this).build().apply { setSmallIcon(R.drawable.ic_stat_waqt) })
    }

    override fun onGetSession(info: MediaSession.ControllerInfo): MediaSession? = session

    override fun onTaskRemoved(rootIntent: Intent?) {
        val p = session?.player
        if (p == null || !p.playWhenReady || p.mediaItemCount == 0) stopSelf()
    }

    override fun onDestroy() {
        session?.release()
        session = null
        // A new session may already be playing again.
        if (!QuranPlayer.active) QuranPlayer.release()
        super.onDestroy()
    }
}
