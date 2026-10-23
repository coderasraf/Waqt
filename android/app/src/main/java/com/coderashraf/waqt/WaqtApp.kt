package com.coderashraf.waqt

import android.app.Application

class WaqtApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Repo.init(this)
        Notifier.channels(this)
        Scheduler.reschedule(this)
    }
}
