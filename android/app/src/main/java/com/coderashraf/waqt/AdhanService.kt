package com.coderashraf.waqt

import android.app.AlarmManager
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Text
import org.json.JSONObject
import kotlin.math.pow

/**
 * Plays the adhan as a foreground service. It runs from the exact alarm,
 * so on Android 14+ it uses the `systemExempted` type that apps holding the
 * exact-alarm permission may use, and the alarm audio stream, which is
 * what Android 17 allows for background audio. It also plays through the
 * phone's silent mode unless the user turned that off.
 */
class AdhanService : Service() {
    private var player: MediaPlayer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var label = ""
    private var dueAt = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Repo.init(this)
        if (intent?.action == ACTION_STOP) {
            stopAdhan(fade = true)
            return START_NOT_STICKY
        }
        label = intent?.getStringExtra("label") ?: "test"
        val sound = intent?.getStringExtra("sound") ?: "makkah"
        val wake = intent?.getBooleanExtra("wake", false) ?: false
        dueAt = intent?.getLongExtra("due", 0L) ?: 0L

        goForeground(notification(wake))
        play(sound, wake)
        return START_NOT_STICKY
    }

    private fun goForeground(n: Notification) {
        if (Build.VERSION.SDK_INT >= 34) {
            val am = getSystemService(AlarmManager::class.java)
            val type = if (am.canScheduleExactAlarms()) ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED else ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            startForeground(Notifier.ID_ADHAN, n, type)
        } else if (Build.VERSION.SDK_INT >= 29) {
            startForeground(Notifier.ID_ADHAN, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(Notifier.ID_ADHAN, n)
        }
    }

    private fun notification(wake: Boolean): Notification {
        val cfg = Repo.cfg
        val bn = cfg.language == "bn"
        val now = System.currentTimeMillis()
        val day = Schedule.day(cfg, Schedule.localDate(cfg, now))
        val (title, body) = when (label) {
            "test" -> (if (bn) "পরীক্ষামূলক আজান" else "Test adhan") to (if (bn) "আজান ঠিকমতো কাজ করছে ✓" else "Your adhan works ✓")
            "sehri" -> (if (bn) "সাহরির সময়" else "Time for Sehri") to (if (bn) "সাহরির শেষ সময় ${Text.t(cfg, day.imsak, day.tzOffsetMin)}" else "Sehri ends at ${Text.t(cfg, day.imsak, day.tzOffsetMin)}")
            else -> {
                val name = Text.prayer(label, cfg.language, day.friday)
                "$name · ${Text.arabic(label, day.friday)}" to when {
                    wake -> if (bn) "ফজরের জন্য উঠুন — থামাতে অ্যাপে তাসবিহ সম্পন্ন করুন" else "Wake up for Fajr — open the app and finish the tasbih to stop"
                    bn -> "$name-এর ওয়াক্ত হয়েছে — ${Text.t(cfg, dueAt.takeIf { it > 0 } ?: now, day.tzOffsetMin)}"
                    else -> "It's time for $name — ${Text.t(cfg, dueAt.takeIf { it > 0 } ?: now, day.tzOffsetMin)}"
                }
            }
        }
        val stop = PendingIntent.getService(this, 10, Intent(this, AdhanService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE)
        val b = Notification.Builder(this, if (wake) Notifier.CH_FAJR else Notifier.CH_ADHAN)
            .setSmallIcon(R.drawable.ic_stat_waqt)
            .setColor(0xFFF3C66B.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setContentIntent(Notifier.openApp(this, if (wake) "wake" else "today"))
        if (wake) {
            b.addAction(Notification.Action.Builder(null, getString(R.string.im_up), Notifier.openApp(this, "wake")).build())
        } else {
            b.addAction(Notification.Action.Builder(null, getString(R.string.stop_adhan), stop).build())
            b.setDeleteIntent(stop)
        }
        return b.build()
    }

    private fun play(soundId: String, wake: Boolean) {
        release()
        val cfg = Repo.cfg
        val (src, gain) = Sounds.resolve(this, soundId) ?: Sounds.resolve(this, Sounds.fallback(label))!!
        val inSilent = cfg.phone.optBoolean("adhan_in_silent", true) || wake
        val target = ((cfg.adhan.optInt("volume", 80) / 100.0).pow(1.6) * gain).toFloat().coerceIn(0.02f, 1f)
        val mp = MediaPlayer()
        try {
            mp.setAudioAttributes(AudioAttributes.Builder()
                .setUsage(if (inSilent) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build())
            when (src) {
                is Sounds.Src.Asset -> assets.openFd(src.path).use { mp.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
                is Sounds.Src.FileSrc -> mp.setDataSource(src.file.path)
            }
            mp.isLooping = wake
            mp.prepare()
            mp.setVolume(0f, 0f)
            mp.setOnCompletionListener { stopAdhan(fade = false) }
            mp.start()
        } catch (e: Exception) {
            mp.release()
            Repo.store.logDelivery("$label|error", dueAt, System.currentTimeMillis(), "error: ${e.message}")
            Repo.store.save()
            stopAdhan(fade = false)
            return
        }
        player = mp
        Repo.playing = JSONObject().put("label", label).put("sound", soundId).put("started", System.currentTimeMillis())
        if (dueAt > 0 && label != "sehri") {
            Repo.store.logDelivery(if (label == "test") "test" else label, dueAt, System.currentTimeMillis(), "adhan")
            Repo.store.save()
        }
        // Fade in over four seconds (or start at full volume).
        val steps = if (cfg.adhan.optBoolean("fade_in", true) && !wake) 20 else 1
        for (i in 1..steps) handler.postDelayed({ player?.setVolume(target * i / steps, target * i / steps) }, i * 200L)
        // A Fajr wake-up alarm gives up after 15 minutes.
        if (wake) handler.postDelayed({ stopAdhan(fade = true) }, 15 * 60_000L)
        Widget.updateAll(this)
    }

    private fun stopAdhan(fade: Boolean) {
        handler.removeCallbacksAndMessages(null)
        val mp = player
        if (fade && mp != null) {
            for (i in 9 downTo 0) handler.postDelayed({ runCatching { mp.setVolume(i / 10f * 0.6f, i / 10f * 0.6f) } }, (10 - i) * 50L)
            handler.postDelayed({ finish() }, 550)
        } else finish()
    }

    private fun finish() {
        release()
        Repo.playing = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun release() {
        player?.runCatching { stop(); release() }
        player = null
    }

    override fun onDestroy() {
        release()
        Repo.playing = null
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "stop"

        fun start(ctx: Context, label: String, sound: String, wake: Boolean, due: Long) {
            // A Quran recitation playing pauses for the adhan.
            if (label != "preview") QuranPlayer.pauseForAdhan()
            val i = Intent(ctx, AdhanService::class.java).putExtra("label", label).putExtra("sound", sound).putExtra("wake", wake).putExtra("due", due)
            ctx.startForegroundService(i)
        }

        fun stop(ctx: Context) {
            ctx.startService(Intent(ctx, AdhanService::class.java).setAction(ACTION_STOP))
        }
    }
}
