package com.coderashraf.waqt

import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject

/**
 * "Will my adhan ring?" — checks everything Android and phone makers use
 * to stop an alarm app, and opens the exact settings screen to fix each.
 * This is the top complaint about prayer apps, so Waqt checks it in-app
 * instead of pointing to a help page.
 */
object Health {
    /** Phone families with their own app killers, matched by manufacturer. */
    fun family(): String {
        val m = (Build.MANUFACTURER + " " + Build.BRAND).lowercase()
        return when {
            listOf("xiaomi", "redmi", "poco").any { it in m } -> "xiaomi"
            listOf("oppo", "realme", "oneplus").any { it in m } -> if ("oneplus" in m) "oneplus" else "oppo"
            listOf("vivo", "iqoo").any { it in m } -> "vivo"
            listOf("huawei", "honor").any { it in m } -> "huawei"
            "samsung" in m -> "samsung"
            listOf("tecno", "infinix", "itel", "transsion").any { it in m } -> "transsion"
            "asus" in m -> "asus"
            else -> "other"
        }
    }

    private val AUTOSTART = mapOf(
        "xiaomi" to listOf(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")),
        "oppo" to listOf(
            ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
            ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"),
            ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"),
        ),
        "oneplus" to listOf(ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity")),
        "vivo" to listOf(
            ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
            ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"),
        ),
        "huawei" to listOf(
            ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
            ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"),
        ),
        "transsion" to listOf(ComponentName("com.transsion.phonemaster", "com.cyin.himgr.autostart.AutoStartActivity")),
        "asus" to listOf(ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity")),
    )

    fun status(ctx: Context): JSONObject {
        val cfg = Repo.cfg
        val nm = ctx.getSystemService(NotificationManager::class.java)
        val pm = ctx.getSystemService(PowerManager::class.java)
        val am = ctx.getSystemService(AudioManager::class.java)
        val items = JSONArray()
        fun item(id: String, ok: Boolean?, required: Boolean, extra: JSONObject = JSONObject()) =
            items.put(extra.put("id", id).put("ok", ok ?: JSONObject.NULL).put("required", required))

        val adhanChannel = nm.getNotificationChannel(Notifier.CH_ADHAN)
        item("notifications", nm.areNotificationsEnabled() && (adhanChannel == null || adhanChannel.importance != NotificationManager.IMPORTANCE_NONE), true)
        item("exact_alarm", Scheduler.canExact(ctx), true)
        item("battery", pm.isIgnoringBatteryOptimizations(ctx.packageName), true)
        val fam = family()
        val confirmed = Repo.store.json.optBoolean("oem_confirmed")
        if (fam != "other") item("oem", if (confirmed) true else null, true, JSONObject().put("family", fam).put("can_open", AUTOSTART[fam] != null))
        val alarmVol = am.getStreamVolume(AudioManager.STREAM_ALARM)
        item("alarm_volume", alarmVol > 0, true, JSONObject().put("value", alarmVol).put("max", am.getStreamMaxVolume(AudioManager.STREAM_ALARM)))
        if (cfg.phone.optBoolean("auto_silent")) item("dnd", nm.isNotificationPolicyAccessGranted, true)

        val deliveries = Repo.store.json.optJSONArray("deliveries") ?: JSONArray()
        val recent = JSONArray()
        for (i in deliveries.length() - 1 downTo maxOf(0, deliveries.length() - 8)) recent.put(deliveries.getJSONObject(i))
        val failing = (0 until items.length()).count { items.getJSONObject(it).let { o -> o.optBoolean("required") && o.opt("ok") != true } }
        return JSONObject()
            .put("items", items)
            .put("failing", failing)
            .put("deliveries", recent)
            .put("next_alarm", Repo.store.json.optJSONObject("next_alarm") ?: JSONObject.NULL)
            .put("test_at", Repo.store.json.optLong("test_at"))
            .put("device", JSONObject().put("brand", Build.MANUFACTURER).put("model", Build.MODEL).put("android", Build.VERSION.RELEASE).put("sdk", Build.VERSION.SDK_INT).put("family", fam))
    }

    /** The settings screen that fixes a check. */
    fun fixIntents(ctx: Context, id: String): List<Intent> {
        val pkg = Uri.parse("package:${ctx.packageName}")
        val details = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg)
        return when (id) {
            "notifications" -> listOf(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName), details)
            "exact_alarm" -> if (Build.VERSION.SDK_INT >= 31) listOf(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg), details) else listOf(details)
            "battery" -> listOf(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS), details)
            "oem" -> AUTOSTART[family()].orEmpty().map { Intent().setComponent(it) } + details
            "dnd" -> listOf(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
            "alarm_volume" -> listOf(Intent(Settings.ACTION_SOUND_SETTINGS))
            else -> listOf(details)
        }.map { it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
    }
}
