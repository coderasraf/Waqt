package com.coderashraf.waqt

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** The single alarm in the chain fired. */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        Repo.init(ctx)
        val result = goAsync()
        Thread {
            try { Scheduler.process(ctx) } finally { result.finish() }
        }.start()
    }
}

/**
 * Restarts the alarm chain after a reboot, an app update, a clock or
 * time-zone change, or when the user grants exact alarms. Alerts already
 * past stay silent.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        Repo.init(ctx)
        Repo.store.lastFired = maxOf(Repo.store.lastFired, System.currentTimeMillis())
        Repo.store.save()
        Scheduler.reschedule(ctx)
        Widget.updateAll(ctx)
    }
}
