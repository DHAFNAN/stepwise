plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "app.stepwise.habit"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.stepwise.habit"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.1.0"
    }

    val debugKeystore = rootProject.file("debug.keystore")
    signingConfigs {
        getByName("debug") {
            if (debugKeystore.exists()) {
                storeFile = debugKeystore
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.webkit)
}
