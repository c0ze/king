# Google Play release: King (tr.gand.king)

Everything needed to put King on Google Play as a free app: no ads, no in-app
purchases, no price. The Android app is a Trusted Web Activity that opens
https://king.arda.tr in Chrome, so every web deploy updates the app too.
Only Android-side changes (icon, name, package settings) need a new upload.

## Build

```sh
android/build.sh            # build/king-1.0.0.aab (upload this) and build/king-1.0.0.apk (sideload test)
android/build.sh fingerprint
```

- Upload key: `~/android-signing/king-upload.jks`, alias `upload`. The password is in the login
  keychain as `king-android-upload`, the same setup as HELIOBANE.
- Raise `versionCode` (and `versionName`) in `android/app/build.gradle.kts` for every new upload.

## First release, step by step

1. In the Play Console, create the app: **King: Rıfkı Kağıt Oyunu**, default language
   Turkish, **Game**, **Free**.
2. Keep **Play App Signing** on (Google-managed app signing key). Upload `build/king-1.0.0.aab`
   to **Internal testing** first.
3. Under **Protected with Play → App signing** (direct URL: `.../app/<id>/keymanagement`), use
   **Copy all certificate fingerprints → SHA-256** and put every fingerprint in
   `public/.well-known/assetlinks.json` next to the upload key. (Done for 1.0.0: the app is
   created as id 4974614950163010974 and its three signing fingerprints are listed.) Push to `main`, which deploys it to
   https://king.arda.tr/.well-known/assetlinks.json.
   Without that fingerprint, the Play-installed app shows a browser address bar at the top.
4. Install from the internal-testing link and check: no address bar, the splash screen, play
   offline after the first launch, the language switch, the Cetvel mode.
5. Fill in the store listing (below) and the App content forms, then promote to production.
   Gand is an organization account, so Play's 12-tester closed-test rule doesn't apply.

## Store listing

Category **Card**. Tags: Card, Trick-taking, Offline, Single player.
Graphics: `docs/store/icon-512.png`, `docs/store/feature-graphic.png` (1024×500),
phone screenshots in `docs/store/` (1080×1920, Turkish and English sets).

Play doesn't allow "free", "no ads" or similar claims in the app name, so those go in the
descriptions.

### Türkçe (varsayılan)

**Uygulama adı** (30): King: Rıfkı Kağıt Oyunu

**Kısa açıklama** (80): Bilgisayara karşı King oyna ya da gerçek masada puan cetveli tut. Reklam yok.

**Tam açıklama:**

King, kahvehane masalarının klasik kart oyunu. 20 oyun, 6 ceza ve koz; her oyuncu 3 ceza ve 2 koz seçer, her ceza en fazla iki kez oynanır.

Bu King’de reklam yok, satın alma yok, üyelik yok. İnternet olmadan da oynanır.

BİLGİSAYARA KARŞI
• Üç bilgisayar oyuncusuna karşı 20 oyunun tamamı
• Kurallar uygulanır: renge uyma, ceza kartını atma zorunluluğu, kupa ve koz kırılmadan açılmaz, kozda yükseltme, rıfkıda as düşünce papazı atma
• Kupa, erkek, kız ve rıfkı, cezalar bitince erken biter
• Otomatik düğmesi o oyunun kalanını senin yerine oynar

PUAN CETVELİ
Arkadaşlarla gerçek kartlarla mı oynuyorsunuz? Kâğıt kalemi bırakın.
• Dört oyuncuyu yazın, seçim sırası masada kendiliğinden döner
• Seçen oyuncuya yalnızca hâlâ seçebileceği oyunlar gösterilir
• Kim kaç el, kaç kupa, kaç kız aldıysa girin; toplam tutmadan kaydedilmez (13 el, 13 kupa, 8 erkek, 4 kız)
• Yanlış girilen herhangi bir oyunu dokunarak düzeltin
• Sonuçları WhatsApp’a tek dokunuşla paylaşın

CEZALAR
El Almaz (el başı −50), Kupa Almaz (kupa başı −30), Erkek Almaz (papaz ve vale başı −60), Kız Almaz (kız başı −100), Rıfkı (−320), Son İki (son iki el, el başı −180). Koz: el başı +50. Parti sonunda dört oyuncunun toplamı her zaman sıfırdır.

Türkçe, İngilizce ve Japonca. Telefonda da, tablette de rahat oynanır.

King, Gand’ın bir oyunudur.

### English (en-US)

**App name** (30): King: Turkish Card Game

**Short description** (80): Play King against the computer, or keep the score sheet for your real table.

**Full description:**

King is the classic Turkish trick-taking card game. 20 hands of penalties and trumps: every player picks 3 penalty games and 2 trump games, and each penalty can be played at most twice.

This King has no ads, no purchases and no sign-up. It plays offline.

PLAY AGAINST THE COMPUTER
• All 20 hands against three computer players
• The rules are enforced: follow suit, discard penalty cards when void, no leading hearts or trumps before they're broken, overtrump in koz, the K♥ falls when the A♥ is played in Rıfkı
• Kupa, Erkek, Kız and Rıfkı end as soon as their penalty cards are gone
• The Auto button plays the rest of the hand for you

SCORE SHEET FOR REAL GAMES
Playing with real cards? Put the pen and paper away.
• Enter the four players and the pick moves round the table by itself
• The picker only sees the games they can still choose
• Enter who took how many tricks, hearts or queens; a hand only saves when it adds up (13 tricks, 13 hearts, 8 kings and jacks, 4 queens)
• Tap any hand to fix a mistake
• Share the results to WhatsApp in one tap

THE GAMES
El Almaz (−50 per trick), Kupa Almaz (−30 per heart), Erkek Almaz (−60 per king or jack), Kız Almaz (−100 per queen), Rıfkı (−320 for the king of hearts), Son İki (−180 for each of the last two tricks). Koz: +50 per trick. At the end, the four scores always add up to zero.

In English, Turkish and Japanese, on phones and tablets.

King is made by Gand.

## App content answers

| Form | Answer |
|---|---|
| Privacy policy | https://king.arda.tr/privacy.html |
| App access | All functionality is available without special access |
| Ads | No, the app does not contain ads. The "Also from Gand" entry is in the menu only, which Play allows without the ads label. |
| Content rating (IARC) | Card game. No violence, no real or simulated gambling, no user-generated content shared with others, no purchases. Expect PEGI 3 / Everyone. |
| Target audience | 13 and over (keeps the app out of the Families programme; it is not designed for children) |
| Data safety | No data collected, no data shared. The game saves progress and player names on the device only. |
| Government / financial / health / news | No |
| Contact | The developer email already on the Gand account; website https://king.arda.tr |
