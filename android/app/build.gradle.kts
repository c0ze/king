// Trusted Web Activity for https://king.arda.tr (Google Play, package tr.gand.king).
// Release builds are signed with the upload key: ~/android-signing/king-upload.jks,
// alias "upload", password from KING_UPLOAD_PASSWORD (android/build.sh reads it from the keychain).
plugins {
    id("com.android.application")
}

val uploadKeystore = System.getenv("KING_UPLOAD_KEYSTORE") ?: "${System.getProperty("user.home")}/android-signing/king-upload.jks"
val uploadPassword: String? = System.getenv("KING_UPLOAD_PASSWORD")

android {
    namespace = "tr.gand.king"
    compileSdk = 36

    defaultConfig {
        applicationId = "tr.gand.king"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        create("upload") {
            storeFile = file(uploadKeystore)
            storePassword = uploadPassword
            keyAlias = "upload"
            keyPassword = uploadPassword
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (uploadPassword != null) signingConfig = signingConfigs.getByName("upload")
        }
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}
