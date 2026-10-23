import java.util.Properties
import javax.inject.Inject

plugins {
    id("com.android.application")
}

// Release signing comes from keystore.properties (never committed). Without
// it, release builds are unsigned and can't be uploaded.
val keystore = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

/// Copies the shared Waqt interface (the same files the desktop app embeds)
/// and the adhan recordings into the APK's assets, so desktop and phone
/// never drift apart.
abstract class SyncSharedAssets : DefaultTask() {
    @get:InputDirectory abstract val ui: DirectoryProperty
    @get:InputDirectory abstract val adhan: DirectoryProperty
    @get:InputFile abstract val logo: RegularFileProperty
    @get:OutputDirectory abstract val output: DirectoryProperty
    @get:Inject abstract val fs: FileSystemOperations

    @TaskAction
    fun run() {
        fs.sync {
            from(ui) { into("web") }
            from(logo) { into("web"); rename { "logo.png" } }
            from(adhan) { into("adhan") }
            into(output)
        }
    }
}

val syncShared = tasks.register<SyncSharedAssets>("syncSharedAssets") {
    ui.set(layout.projectDirectory.dir("../../src/ui"))
    adhan.set(layout.projectDirectory.dir("../../assets/adhan"))
    logo.set(layout.projectDirectory.file("../../assets/icon-256.png"))
    output.set(layout.buildDirectory.dir("generated/shared-assets"))
}

android {
    namespace = "com.coderashraf.waqt"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.coderashraf.waqt"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        create("release") {
            if (keystore.isNotEmpty()) {
                storeFile = file(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystore.isNotEmpty()) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // MP3s are already compressed; keeping them uncompressed lets the
    // player open them straight from the APK.
    androidResources {
        noCompress += "mp3"
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(syncShared, SyncSharedAssets::output)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.19.1")
    implementation("androidx.activity:activity-ktx:1.13.0")
    implementation("androidx.webkit:webkit:1.18.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20260814")
}
