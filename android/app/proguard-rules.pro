# The page calls these through the JavaScript bridge.
-keepclassmembers class com.coderashraf.waqt.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
