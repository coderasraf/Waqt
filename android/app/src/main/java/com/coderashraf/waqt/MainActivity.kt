package com.coderashraf.waqt

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.view.HapticFeedbackConstants
import android.view.KeyEvent
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.util.concurrent.Executors

/**
 * The window: Waqt's shared interface (the same HTML/CSS/JS as the desktop
 * app) in a WebView served from the APK's assets. The page's `/api/...`
 * calls arrive through a JavaScript bridge and are answered by [Api].
 */
class MainActivity : ComponentActivity(), Api.Host, SensorEventListener {
    private lateinit var web: WebView
    private lateinit var api: Api
    private val main = Handler(Looper.getMainLooper())
    private val pool = Executors.newFixedThreadPool(3)

    private var permissionDone: ((Boolean) -> Unit)? = null
    private var audioDone: ((Uri?) -> Unit)? = null
    private var docDone: ((Uri?) -> Unit)? = null
    private var volumeTasbih = false
    private var compassOn = false
    private var lastHeading = 0L

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        permissionDone?.invoke(ok); permissionDone = null
    }
    private val audioLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        audioDone?.invoke(uri); audioDone = null
    }
    private val docLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri ->
        docDone?.invoke(uri); docDone = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Repo.init(this)
        // The bars follow the page's theme (saved from the last run, so the
        // first frame already matches).
        val saved = getSharedPreferences("ui", MODE_PRIVATE).getString("theme", "dark,#060c1b")!!
        val lightTheme = saved.startsWith("light")
        val clear = android.graphics.Color.TRANSPARENT
        val bars = if (lightTheme) SystemBarStyle.light(clear, clear) else SystemBarStyle.dark(clear)
        enableEdgeToEdge(bars, bars)
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)
        api = Api(this, this)
        web = WebView(this)
        web.setBackgroundColor(themeBg(saved))
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }
        val loader = WebViewAssetLoader.Builder()
            // The bundled Quran and its fonts.
            .addPathHandler("/quran/", WebViewAssetLoader.AssetsPathHandler(this).let { h -> WebViewAssetLoader.PathHandler { h.handle("quran/$it") } })
            .addPathHandler("/hadith/", WebViewAssetLoader.AssetsPathHandler(this).let { h -> WebViewAssetLoader.PathHandler { h.handle("hadith/$it") } })
            // Hadith chapters saved on the phone.
            .addPathHandler("/hcache/", WebViewAssetLoader.InternalStoragePathHandler(this, HadithFiles.root(this)))
            .addPathHandler("/qfonts/", WebViewAssetLoader.AssetsPathHandler(this).let { h -> WebViewAssetLoader.PathHandler { h.handle("qfonts/$it") } })
            .addPathHandler("/", WebViewAssetLoader.PathHandler { path ->
                WebViewAssetLoader.AssetsPathHandler(this).handle("web/" + path.ifEmpty { "index.html" })
            })
            .build()
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == ORIGIN_HOST) return false
                // Links leave the app for the browser.
                runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                return true
            }

            override fun onPageFinished(view: WebView, url: String) = pushInsets()
        }
        web.addJavascriptInterface(Bridge(), "WaqtNative")
        ViewCompat.setOnApplyWindowInsetsListener(web) { _, insets -> lastInsets = insets; pushInsets(); insets }
        setContentView(web)

        val route = intent.getStringExtra("route") ?: "today"
        web.loadUrl("https://$ORIGIN_HOST/index.html#/$route")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })
    }

    private var lastInsets: WindowInsetsCompat? = null

    /** Tells the page how much room the status and navigation bars take. */
    private fun pushInsets() {
        val ins = lastInsets?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()) ?: return
        val d = resources.displayMetrics.density
        js("(function(e){if(!e)return;e.style.setProperty('--sat','${ins.top / d}px');e.style.setProperty('--sab','${ins.bottom / d}px');})(document.documentElement)")
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.getStringExtra("route")?.let { js("location.hash='#/$it'") }
    }

    override fun onResume() {
        super.onResume()
        // Permissions may have changed in Settings.
        Scheduler.reschedule(this)
        js("window.onNativeResume && onNativeResume()")
        if (compassOn) startCompass()
        main.post(quranTick)
    }

    override fun onPause() {
        super.onPause()
        stopCompass()
        main.removeCallbacks(quranTick)
    }

    /** The Quran player's position, a few times a second, for the live highlight. */
    private var quranWasActive = false
    private val quranTick = object : Runnable {
        override fun run() {
            val on = QuranPlayer.active
            if (on || quranWasActive) js("window.onQuranTick && onQuranTick(${QuranPlayer.state()})")
            quranWasActive = on
            main.postDelayed(this, if (on) 120L else 700L)
        }
    }

    override fun js(code: String) { main.post { if (::web.isInitialized) web.evaluateJavascript(code, null) } }

    inner class Bridge {
        /** An `/api` call from the page; answered via window.__nativeReply. */
        @JavascriptInterface
        fun request(id: String, method: String, path: String, body: String) {
            pool.execute {
                api.handle(method, path, body) { status, json ->
                    js("window.__nativeReply(${JSONObject.quote(id)},$status,${JSONObject.quote(json.toString())})")
                }
            }
        }

        /** Small window commands: compass on/off, volume-key tasbih, haptics. */
        @JavascriptInterface
        fun ui(cmd: String, arg: String) {
            main.post {
                when (cmd) {
                    "compass" -> { compassOn = arg == "1"; if (compassOn) startCompass() else stopCompass() }
                    "volumeTasbih" -> volumeTasbih = arg == "1"
                    "haptic" -> web.performHapticFeedback(if (arg == "long") HapticFeedbackConstants.LONG_PRESS else HapticFeedbackConstants.KEYBOARD_TAP)
                    "keepScreenOn" -> web.keepScreenOn = arg == "1"
                    "theme" -> applyTheme(arg)
                    // Debug builds: render the home-screen widget through the
                    // real RemoteViews inflater, to check it without a launcher.
                    "widgetPreview" -> if (BuildConfig.DEBUG) {
                        val box = android.widget.FrameLayout(this@MainActivity)
                        val v = Widget.build(this@MainActivity).apply(this@MainActivity, box)
                        box.addView(v, android.widget.FrameLayout.LayoutParams((340 * resources.displayMetrics.density).toInt(), (150 * resources.displayMetrics.density).toInt()))
                        android.app.AlertDialog.Builder(this@MainActivity).setView(box).show()
                    }
                }
            }
        }

        @JavascriptInterface
        fun platform(): String = "android"
    }

    /** "light,#f6f2ea": dark or light status-bar icons, and the colour behind the page. */
    private fun applyTheme(spec: String) {
        val light = spec.startsWith("light")
        androidx.core.view.WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
        web.setBackgroundColor(themeBg(spec))
        getSharedPreferences("ui", MODE_PRIVATE).edit().putString("theme", spec).apply()
    }

    private fun themeBg(spec: String) = runCatching { android.graphics.Color.parseColor(spec.substringAfter(',')) }.getOrDefault(0xFF060C1B.toInt())

    // ----- Volume keys count tasbih while the tasbih page asks for it -----
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (volumeTasbih && Repo.cfg.phone.optBoolean("volume_tasbih", true) &&
            (event.keyCode == KeyEvent.KEYCODE_VOLUME_UP || event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                js("window.onVolumeKey && onVolumeKey(${if (event.keyCode == KeyEvent.KEYCODE_VOLUME_UP) 1 else -1})")
            }
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    // ----- Compass: true-north heading for the Qibla page -----
    private fun startCompass() {
        val sm = getSystemService(SensorManager::class.java)
        val s = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) ?: run { js("window.onHeading && onHeading(null)"); return }
        sm.registerListener(this, s, SensorManager.SENSOR_DELAY_UI)
    }

    private fun stopCompass() = getSystemService(SensorManager::class.java).unregisterListener(this)

    private val rot = FloatArray(9)
    private val orient = FloatArray(3)

    override fun onSensorChanged(e: SensorEvent) {
        val now = System.currentTimeMillis()
        if (now - lastHeading < 60) return
        lastHeading = now
        SensorManager.getRotationMatrixFromVector(rot, e.values)
        SensorManager.getOrientation(rot, orient)
        val magnetic = Math.toDegrees(orient[0].toDouble())
        val cfg = Repo.cfg
        val decl = GeomagneticField(cfg.lat.toFloat(), cfg.lng.toFloat(), 0f, now).declination
        val trueHeading = ((magnetic + decl) % 360 + 360) % 360
        js("window.onHeading && onHeading(${"%.1f".format(java.util.Locale.US, trueHeading)},${e.accuracy})")
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    // ----- Api.Host -----
    override fun startActivity(intents: List<Intent>): Boolean {
        for (i in intents) {
            if (runCatching { startActivity(i) }.isSuccess) return true
        }
        return false
    }

    override fun requestPermission(permission: String, done: (Boolean) -> Unit) {
        if (checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) return done(true)
        main.post { permissionDone = done; permissionLauncher.launch(permission) }
    }

    override fun pickAudio(done: (Uri?) -> Unit) = main.post { audioDone = done; audioLauncher.launch(arrayOf("audio/*")) }.let {}

    override fun createDocument(name: String, mime: String, done: (Uri?) -> Unit) = main.post { docDone = done; docLauncher.launch(name) }.let {}

    @SuppressLint("MissingPermission")
    override fun currentLocation(done: (Location?) -> Unit) {
        if (checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return done(null)
        val lm = getSystemService(LocationManager::class.java)
        val provider = listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER, LocationManager.PASSIVE_PROVIDER)
            .firstOrNull { runCatching { lm.isProviderEnabled(it) }.getOrDefault(false) }
        val last = listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER, LocationManager.PASSIVE_PROVIDER)
            .mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }.maxByOrNull { it.time }
        if (provider == null) return done(last)
        var answered = false
        val finish = { l: Location? -> if (!answered) { answered = true; done(l ?: last) } }
        main.postDelayed({ finish(null) }, 15_000)
        if (Build.VERSION.SDK_INT >= 30) {
            lm.getCurrentLocation(provider, CancellationSignal(), mainExecutor) { finish(it) }
        } else {
            @Suppress("DEPRECATION")
            lm.requestSingleUpdate(provider, { finish(it) }, Looper.getMainLooper())
        }
    }

    companion object {
        const val ORIGIN_HOST = "appassets.androidplatform.net"
    }
}
