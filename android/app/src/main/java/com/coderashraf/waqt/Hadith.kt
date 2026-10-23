package com.coderashraf.waqt

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * The big hadith books, saved on the phone chapter by chapter as they are
 * read or downloaded, in the slim form the page reads (served at /hcache/).
 * The three small Forty Hadith books ship inside the app instead.
 */
object HadithFiles {
    private const val CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"
    /** jsDelivr refuses files it hasn't cached yet from this (large) repository; GitHub serves them. */
    private const val GITHUB = "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions"

    fun root(ctx: Context) = File(ctx.filesDir, "hadith").apply { mkdirs() }
    private fun file(ctx: Context, b: String, s: Int, lang: String) = File(root(ctx), "$b/$s/$lang.json")
    private fun safe(b: String) = b.also { require(Regex("[a-z]+").matches(it)) { "bad book" } }

    @Volatile var cancelled = false

    /** Makes sure these chapters are on the phone in each language; fetches what's missing. */
    fun ensure(ctx: Context, b: String, sections: List<Int>, langs: List<String>, progress: ((Int, Int) -> Unit)? = null) {
        safe(b)
        cancelled = false
        val jobs = sections.flatMap { s -> langs.map { l -> s to l } }
        jobs.forEachIndexed { i, (s, l) ->
            if (cancelled) error("cancelled")
            val f = file(ctx, b, s, l)
            if (!f.exists()) {
                val path = "$l-$b/sections/$s.min.json"
                runCatching { fetch("$CDN/$path", f) }.onFailure { fetch("$GITHUB/$path", f) }
            }
            progress?.invoke(i + 1, jobs.size)
        }
    }

    private fun fetch(link: String, target: File) {
        target.parentFile?.mkdirs()
        val c = URL(link).openConnection() as HttpURLConnection
        c.connectTimeout = 15_000; c.readTimeout = 60_000
        c.setRequestProperty("User-Agent", "Waqt-Android")
        val text = try {
            // A language without this chapter: remember it as empty.
            if (c.responseCode == 404) "{\"hadiths\":[]}"
            else if (c.responseCode !in 200..299) error("the server answered ${c.responseCode}")
            else c.inputStream.bufferedReader().use { it.readText() }
        } finally { c.disconnect() }
        val src = JSONObject(text).optJSONArray("hadiths") ?: JSONArray()
        val out = JSONArray()
        for (i in 0 until src.length()) {
            val h = src.getJSONObject(i)
            val o = JSONObject().put("n", h.get("hadithnumber")).put("t", h.optString("text").trim())
            if (h.opt("arabicnumber") != h.opt("hadithnumber")) o.put("a", h.opt("arabicnumber"))
            val g = h.optJSONArray("grades")
            if (g != null && g.length() > 0) {
                val gs = JSONArray()
                for (k in 0 until g.length()) g.getJSONObject(k).let { gs.put(JSONArray().put(it.optString("name")).put(it.optString("grade"))) }
                o.put("g", gs)
            }
            out.put(o)
        }
        val part = File(target.path + ".part")
        part.writeText(out.toString())
        part.renameTo(target)
    }

    /** Per book: how many chapter files are saved, and their size. */
    fun status(ctx: Context): JSONObject {
        val out = JSONObject()
        root(ctx).listFiles()?.filter { it.isDirectory }?.forEach { book ->
            val files = book.walkTopDown().filter { it.isFile && it.name.endsWith(".json") }.toList()
            out.put(book.name, JSONObject().put("files", files.size).put("bytes", files.sumOf { it.length() })
                .put("sections", JSONArray(book.listFiles()?.filter { it.isDirectory }?.map { it.name.toInt() }?.sorted().orEmpty())))
        }
        return out
    }

    fun delete(ctx: Context, b: String) { File(root(ctx), safe(b)).deleteRecursively() }
}
