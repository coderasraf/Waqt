package com.coderashraf.waqt

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * The phone's voice: Arabic for the Noorani Qaida (letter names and syllables
 * are spoken as they are tapped), Bengali and English for the stories. Speaking is serialised on one worker, and
 * each call returns once the sound has finished, so the page can step
 * through a row ("listen and repeat") in time with the voice.
 */
object QaidaVoice {
    private lateinit var app: Context
    private val worker = Executors.newSingleThreadExecutor()
    private var tts: TextToSpeech? = null
    private var ttsOk = false
    private val chosen = HashMap<String, android.speech.tts.Voice>()
    private val waiting = HashMap<String, CountDownLatch>()
    @Volatile private var seq = 0

    private fun tts(): TextToSpeech? {
        tts?.let { return if (ttsOk) it else null }
        val ready = CountDownLatch(1)
        val t = TextToSpeech(app) { status -> ttsOk = status == TextToSpeech.SUCCESS; ready.countDown() }
        ready.await(8, TimeUnit.SECONDS)
        t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String) {}
            override fun onDone(id: String) { synchronized(waiting) { waiting.remove(id) }?.countDown() }
            override fun onStop(id: String, interrupted: Boolean) { synchronized(waiting) { waiting.remove(id) }?.countDown() }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String) { synchronized(waiting) { waiting.remove(id) }?.countDown() }
        })
        tts = t
        return if (ttsOk) t else null
    }

    /// The regions to prefer for each language, best first.
    private val REGIONS = mapOf("ar" to listOf("SA", "EG", "XA", ""), "bn" to listOf("BD", "IN", ""), "en" to listOf("GB", "US", "IN", ""))

    /**
     * Picks the most natural installed voice for the language — the highest
     * quality, in the preferred region, working offline if one does — and
     * remembers it.
     */
    private fun voice(t: TextToSpeech, lang: String): Boolean {
        chosen[lang]?.let { return t.setVoice(it) == TextToSpeech.SUCCESS }
        val regions = REGIONS[lang] ?: listOf("")
        val best = runCatching { t.voices }.getOrNull().orEmpty()
            .filter { it.locale.language == lang && "notInstalled" !in it.features }
            .sortedWith(compareBy<android.speech.tts.Voice>({ it.isNetworkConnectionRequired }, { -it.quality },
                { regions.indexOf(it.locale.country).let { i -> if (i < 0) 99 else i } }))
            .firstOrNull()
        if (best != null && t.setVoice(best) == TextToSpeech.SUCCESS) { chosen[lang] = best; return true }
        // Older engines list no voices: fall back to the language itself.
        return regions.any { r -> val l = Locale(lang, r); t.isLanguageAvailable(l) >= TextToSpeech.LANG_AVAILABLE && t.setLanguage(l) >= TextToSpeech.LANG_AVAILABLE }
    }

    /** Whether the phone can speak the language. Any thread but main. */
    fun available(ctx: Context, lang: String = "ar"): Boolean {
        app = ctx.applicationContext
        return worker.submit<Boolean> { tts()?.let { voice(it, lang) } ?: false }.get(15, TimeUnit.SECONDS)
    }

    /** Says the text; returns null once it has been said, else why it couldn't. */
    fun say(ctx: Context, text: String, rate: Float, lang: String = "ar"): String? {
        app = ctx.applicationContext
        val mine = ++seq
        // Cut off whatever is still sounding, so a quick second tap is heard at once.
        if (ttsOk) tts?.stop()
        return worker.submit<String?> {
            // A newer tap replaces anything still waiting its turn.
            if (mine != seq) return@submit null
            val t = tts() ?: return@submit "no_voice"
            if (!voice(t, lang)) return@submit "no_${lang}_voice"
            val id = "q$mine"
            val done = CountDownLatch(1)
            synchronized(waiting) { waiting[id] = done }
            t.setSpeechRate(rate)
            t.speak(text, TextToSpeech.QUEUE_FLUSH, Bundle(), id)
            // A paragraph of a story can take a minute or two to read.
            done.await(if (text.length > 60) 240L else 15L, TimeUnit.SECONDS)
            null
        }.get(if (text.length > 60) 260L else 30L, TimeUnit.SECONDS)
    }

    fun stop() {
        seq++
        tts?.stop()
    }
}
