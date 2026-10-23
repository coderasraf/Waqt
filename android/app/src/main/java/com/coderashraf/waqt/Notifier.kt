package com.coderashraf.waqt

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager

object Notifier {
    const val CH_ADHAN = "adhan"
    const val CH_REMINDERS = "reminders"
    const val CH_QUIET = "quiet"
    const val CH_FAJR = "fajr_wake"

    const val ID_ADHAN = 1
    const val ID_PRAYER = 2
    const val ID_REMINDER = 3
    const val ID_SILENT = 4

    fun channels(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        // The adhan channel is silent: the adhan itself is the sound.
        nm.createNotificationChannel(NotificationChannel(CH_ADHAN, ctx.getString(R.string.ch_adhan), NotificationManager.IMPORTANCE_HIGH).apply {
            description = ctx.getString(R.string.ch_adhan_desc)
            setSound(null, null)
            enableVibration(false)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        })
        nm.createNotificationChannel(NotificationChannel(CH_REMINDERS, ctx.getString(R.string.ch_reminders), NotificationManager.IMPORTANCE_HIGH).apply {
            description = ctx.getString(R.string.ch_reminders_desc)
        })
        nm.createNotificationChannel(NotificationChannel(CH_QUIET, ctx.getString(R.string.ch_quiet), NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = ctx.getString(R.string.ch_quiet_desc)
            setSound(null, null)
        })
        nm.createNotificationChannel(NotificationChannel(CH_FAJR, ctx.getString(R.string.ch_fajr), NotificationManager.IMPORTANCE_HIGH).apply {
            description = ctx.getString(R.string.ch_fajr_desc)
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build())
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        })
    }

    fun openApp(ctx: Context, route: String = "today"): PendingIntent =
        PendingIntent.getActivity(ctx, route.hashCode(), Intent(ctx, MainActivity::class.java).putExtra("route", route).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

    fun post(ctx: Context, id: Int, channel: String, title: String, body: String) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        if (!nm.areNotificationsEnabled()) return
        val n = Notification.Builder(ctx, channel)
            .setSmallIcon(R.drawable.ic_stat_waqt)
            .setColor(0xFFF3C66B.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setContentIntent(openApp(ctx))
            .setAutoCancel(true)
            .build()
        nm.notify(id, n)
    }
}
