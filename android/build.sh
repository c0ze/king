#!/usr/bin/env bash
## Builds the Google Play bundle for King (tr.gand.king), a Trusted Web Activity
## that opens https://king.arda.tr in Chrome.
##   android/build.sh          → build/king-<version>.aab (release, upload key; upload to Play)
##                               and build/king-<version>.apk (same signature, for sideload testing)
##   android/build.sh keystore → creates the upload keystore if it doesn't exist yet
##   android/build.sh fingerprint → prints the upload key's SHA-256 (for assetlinks.json)
## Never uploads anything.
##
## The upload keystore is ~/android-signing/king-upload.jks (alias "upload"), its
## password in the login keychain (service king-android-upload, account upload),
## the same arrangement as HELIOBANE. Override with KING_UPLOAD_KEYSTORE /
## KING_UPLOAD_PASSWORD.
set -euo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$0")"

KS=${KING_UPLOAD_KEYSTORE:-$HOME/android-signing/king-upload.jks}
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Library/Android/sdk}
export JAVA_HOME=${JAVA_HOME:-$(/usr/libexec/java_home -v 21 2>/dev/null || true)}

password() {
	if [[ -n "${KING_UPLOAD_PASSWORD:-}" ]]; then printf '%s' "$KING_UPLOAD_PASSWORD"; return; fi
	security find-generic-password -s king-android-upload -a upload -w 2>/dev/null \
		|| { echo "No upload key password in the keychain (service king-android-upload). Run: android/build.sh keystore" >&2; exit 1; }
}

case "${1:-bundle}" in
	keystore)
		if [[ -f "$KS" ]]; then echo "Upload keystore already exists: $KS"; exit 0; fi
		mkdir -p "$(dirname "$KS")" && chmod 700 "$(dirname "$KS")"
		export KING_PW; KING_PW=$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)
		# the password goes to the keychain over stdin and to keytool through the environment,
		# never on a command line where other processes could read it
		printf 'add-generic-password -U -s king-android-upload -a upload -l "king android upload" -w "%s"\n' "$KING_PW" | security -i >/dev/null
		keytool -genkeypair -keystore "$KS" -storetype PKCS12 -alias upload -keyalg RSA -keysize 4096 \
			-validity 12000 -dname "CN=Gand, O=Gand, C=TR" -storepass:env KING_PW -keypass:env KING_PW >/dev/null 2>&1
		chmod 600 "$KS"
		unset KING_PW
		echo "Created $KS (alias upload); password stored in the login keychain (king-android-upload)."
		"$SELF" fingerprint ;;
	fingerprint)
		KING_PW=$(password) keytool -list -v -keystore "$KS" -alias upload -storepass:env KING_PW 2>/dev/null | awk '/SHA256:/{print $2}' ;;
	bundle)
		pw=$(password)
		version=$(sed -n 's/.*versionName = "\(.*\)".*/\1/p' app/build.gradle.kts)
		KING_UPLOAD_KEYSTORE="$KS" KING_UPLOAD_PASSWORD="$pw" \
			heavy-slot ./gradlew --no-daemon --max-workers=4 -q bundleRelease assembleRelease
		mkdir -p ../build
		cp app/build/outputs/bundle/release/app-release.aab "../build/king-$version.aab"
		cp app/build/outputs/apk/release/app-release.apk "../build/king-$version.apk"
		ls -lh "../build/king-$version.aab" "../build/king-$version.apk" ;;
	*)
		sed -n '2,13p' "$SELF"; exit 2 ;;
esac
