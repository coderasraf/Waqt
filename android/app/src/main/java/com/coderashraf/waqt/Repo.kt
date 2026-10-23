package com.coderashraf.waqt

import android.content.Context
import com.coderashraf.waqt.core.Config
import com.coderashraf.waqt.core.Hijri
import com.coderashraf.waqt.core.Schedule
import com.coderashraf.waqt.core.Store
import org.json.JSONObject
import java.io.File
import java.time.LocalDate

/** The app's state, shared by the window, the alarms and the widget. */
object Repo {
    lateinit var app: Context
        private set

    @Volatile lateinit var cfg: Config
        private set

    lateinit var store: Store
        private set

    /** The latest adhan, for the in-app adhan screen (like the desktop). */
    @Volatile var alert: JSONObject? = null

    /** What AdhanService is playing now, if anything. */
    @Volatile var playing: JSONObject? = null

    private val configFile get() = File(app.filesDir, "config.json")

    @Synchronized
    fun init(ctx: Context) {
        if (::app.isInitialized) return
        app = ctx.applicationContext
        cfg = Config.load(configFile)
        store = Store(File(app.filesDir, "state.json"))
        runCatching { Hijri.bangladesh = Hijri.parseOverrides(JSONObject(hijriFile.readText())) }
    }

    private val hijriFile get() = File(app.filesDir, "hijri.json")
    const val HIJRI_URL = "https://coderasraf.github.io/Waqt/hijri.json"

    /**
     * Refreshes Bangladesh's announced Hijri month starts at most every six
     * hours (a few hundred bytes). Offline, the last copy keeps working.
     */
    fun refreshHijri() {
        val last = store.json.optLong("hijri_checked")
        if (System.currentTimeMillis() - last < 6 * 3_600_000L) return
        store.json.put("hijri_checked", System.currentTimeMillis()); store.save()
        Thread {
            runCatching {
                val j = Net.getJson(HIJRI_URL)
                val map = Hijri.parseOverrides(j)
                if (map.isNotEmpty()) {
                    hijriFile.writeText(j.toString())
                    Hijri.bangladesh = map
                    Widget.updateAll(app)
                }
            }
        }.start()
    }

    @Synchronized
    fun saveConfig(newCfg: Config) {
        Config.save(configFile, newCfg)
        cfg = newCfg
        // Times may have moved: nothing already past should fire now.
        store.lastFired = maxOf(store.lastFired, System.currentTimeMillis())
        store.save()
        Scheduler.reschedule(app)
        Widget.updateAll(app)
    }

    /** After a restore: read the settings and state again, and reschedule. */
    @Synchronized
    fun reload() {
        cfg = Config.load(configFile)
        store = Store(File(app.filesDir, "state.json"))
        Scheduler.reschedule(app)
        Widget.updateAll(app)
    }

    fun today(): LocalDate = Schedule.localDate(cfg, System.currentTimeMillis())

    fun mutedToday(): Boolean = store.muted == today().toString()
}
