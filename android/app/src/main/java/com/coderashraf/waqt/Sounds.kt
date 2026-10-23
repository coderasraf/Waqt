package com.coderashraf.waqt

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Adhan recordings: five ship inside the app (kept small for data-sensitive
 * users), four more download on demand straight from the Internet Archive,
 * and users can add their own files.
 */
object Sounds {
    class Def(
        val id: String, val name: String, val nameBn: String, val fajr: Boolean,
        /** Loudness match measured by the desktop app (capped at 1 here). */
        val gain: Float,
        /** Public-domain source for the downloadable ones; null when bundled. */
        val url: String? = null, val size: Long = 0,
    )

    private const val WORLD = "https://archive.org/download/azaan-of-world-mosques-english/"
    private const val KOTA = "https://archive.org/download/AdzanKotaKuwaitMisyariRasyid/"

    val ALL = listOf(
        Def("makkah", "Makkah · Masjid al-Haram", "মক্কা · মসজিদুল হারাম", false, 0.89f),
        Def("madinah", "Madinah · Masjid an-Nabawi", "মদিনা · মসজিদে নববী", false, 0.30f),
        Def("mishary", "Mishary Rashid Alafasy", "মিশারি রাশিদ আলাফাসি", false, 0.69f),
        Def("makkah-fajr", "Makkah · Fajr adhan", "মক্কা · ফজরের আজান", true, 0.93f),
        Def("short", "Short · first takbir only", "সংক্ষিপ্ত · শুধু প্রথম তাকবির", false, 0.59f),
        Def("aqsa", "Al-Aqsa · Naji Qazzaz", "আল-আকসা · নাজি কাজ্জাজ", false, 0.80f, WORLD + "Al-Aqsa%20Masjid%20Naaji%20Qazzaaz.mp3", 3_231_893),
        Def("abdulbasit", "Abdul Basit · Cairo", "আব্দুল বাসিত · কায়রো", false, 0.58f, WORLD + "Cairo%20Abdul%20Baset.mp3", 2_878_432),
        Def("istanbul", "Istanbul · Turkey", "ইস্তাম্বুল · তুরস্ক", false, 1.0f, KOTA + "Adzan%20Kota%20Turki%201.mp3", 2_156_821),
        Def("madinah-fajr", "Madinah · Fajr adhan", "মদিনা · ফজরের আজান", true, 0.47f, KOTA + "Adzan%20Subuh%20Madinah%20(Abu%20Hazim).mp3", 3_008_214),
    )

    fun dir(ctx: Context) = File(ctx.filesDir, "sounds").apply { mkdirs() }

    /** Where to play a sound from: an asset path or a file. */
    sealed class Src {
        data class Asset(val path: String) : Src()
        data class FileSrc(val file: File) : Src()
    }

    fun resolve(ctx: Context, id: String): Pair<Src, Float>? {
        if (id.startsWith("custom:")) {
            val name = id.removePrefix("custom:")
            if (name.contains('/') || name.contains("..")) return null
            val f = File(dir(ctx), "custom-$name")
            return if (f.exists()) Src.FileSrc(f) to 1f else null
        }
        val def = ALL.firstOrNull { it.id == id } ?: return null
        return if (def.url == null) Src.Asset("adhan/${def.id}.mp3") to def.gain
        else File(dir(ctx), "${def.id}.mp3").takeIf { it.exists() }?.let { Src.FileSrc(it) to def.gain }
    }

    fun list(ctx: Context): JSONArray {
        val out = JSONArray()
        for (d in ALL) {
            val have = d.url == null || File(dir(ctx), "${d.id}.mp3").exists()
            out.put(JSONObject().put("id", d.id).put("name", d.name).put("name_bn", d.nameBn).put("fajr", d.fajr)
                .put("custom", false).put("available", have).put("size", d.size))
        }
        dir(ctx).listFiles()?.filter { it.name.startsWith("custom-") }?.sortedBy { it.name }?.forEach {
            val name = it.name.removePrefix("custom-")
            val label = name.substringBeforeLast('.')
            out.put(JSONObject().put("id", "custom:$name").put("name", label).put("name_bn", label).put("fajr", false).put("custom", true).put("available", true))
        }
        return out
    }

    /** Downloads one of the optional recordings. */
    fun download(ctx: Context, id: String) {
        val def = ALL.firstOrNull { it.id == id && it.url != null } ?: error("unknown recording")
        val target = File(dir(ctx), "${def.id}.mp3")
        val part = File(dir(ctx), "${def.id}.part")
        val conn = URL(def.url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15_000; conn.readTimeout = 30_000
        conn.instanceFollowRedirects = true
        conn.setRequestProperty("User-Agent", "Waqt-Android")
        conn.inputStream.use { input -> part.outputStream().use { input.copyTo(it) } }
        if (part.length() < 50_000) { part.delete(); error("the download was incomplete") }
        part.renameTo(target)
    }

    /** The fallback when a chosen recording isn't on this phone. */
    fun fallback(prayer: String) = if (prayer == "fajr") "makkah-fajr" else "makkah"
}
