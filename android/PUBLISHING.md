# Publishing Waqt on Google Play

Everything Play asks for is ready in this folder. The steps below are the ones only you can do, because they need your Google account.

## What's ready

| Item | Where |
|---|---|
| App bundle to upload | `release/Waqt-1.2.0.aab` (signed with your upload key; older versions are kept too) |
| APK for direct install and testing | `release/Waqt-1.2.0.apk` |
| Store text in English and Bangla, plus every Play Console form answer | `store/listing.md` |
| Icon 512, feature graphic 1024×500, 8 + 8 screenshots | `store/` |
| Foreground-service demo video | `store/fgs-demo.mp4` |
| Website and privacy policy | `../docs/` (GitHub Pages) |
| Bangladesh Hijri announcements file | `../docs/hijri.json` |

## 1. Back up the upload key (do this first)

`D:\Android\keys\waqt-upload.jks` plus its passwords in `D:\Android\keys\keystore.properties.backup`.

Copy both to a safe place, such as an encrypted USB drive or a password manager. Every future update must be signed with this key. If it's lost, Google can reset it, but that takes days.

## 2. Put the website online (privacy policy URL)

1. Push the repository, including `docs/`, to `github.com/coderasraf/Waqt`.
2. On GitHub, go to **Settings → Pages → Build and deployment**, set Source to **Deploy from a branch**, and choose Branch **main** and folder **/docs**.
3. After a minute, check that https://coderasraf.github.io/Waqt/privacy.html opens.

GitHub Pages on a private repository needs a paid GitHub plan. If the repository is private, either make it public or host `docs/` elsewhere and update the URLs in `docs/*.html`, `store/listing.md` and `Repo.HIJRI_URL`.

## 3. Create the developer account

1. Go to https://play.google.com/console and sign up as **Personal**.
2. Pay the **$25** one-time fee. Use a debit or credit card that is not prepaid; dual-currency cards work from Bangladesh.
3. Verify your identity with a government ID and confirm your phone number.

## 4. Create the app

1. In Play Console, choose **Create app** and enter:
   - name **Waqt: Prayer Times & Azan**
   - default language **English (United States)**
   - type **App**, **Free**
2. Fill **Policy → App content** with the answers in `store/listing.md`:
   - privacy policy
   - ads (none)
   - app access
   - content rating
   - target audience (13+)
   - data safety
   - foreground service declaration (needs the video link)
3. Fill **Store presence → Main store listing** with the English text and graphics. Then use **Manage translations → Add bn-BD** and paste the Bangla text and Bangla screenshots.

## 5. Closed test: required before going public

New personal accounts must have **at least 12 testers opted in for 14 days in a row** before they can apply for production.

1. Go to **Testing → Closed testing → Create track**, then upload `release/Waqt-1.2.0.aab`.
2. Under **Testers**, add a Google Group or a list of at least 15 Gmail addresses. Allow a few extra in case someone opts out.
3. Send testers the opt-in link. They must stay opted in for all 14 days.
4. Ask testers to run **Adhan check → Test in 1 minute** on their own phones, especially Xiaomi, Vivo, Oppo, Realme, Samsung and Tecno. That's the best real-world check of the adhan.
5. After 14 days, go to **Publishing overview → Apply for production**.

**Timing for Ramadan 1448 (about 9 February 2027):** start the closed test by mid-December 2026, so the 14 days plus Google's review fit before Ramadan.

## Quran (added in 1.1.0)

The Quran audiobook adds a second foreground service, `QuranService`, of type **mediaPlayback**.
- In **App content → Foreground service permissions**, tick **Media playback** as well as the existing adhan answer.
- Explain it as: "Plays Quran recitation the user starts, with the screen off and with lock-screen controls."
- No new runtime permission is needed.

Content sources (credited in the app under Quran settings → Sources):
- **Text, translations and word-by-word meanings:** Quran.com (Quran Foundation). Rebuild them with `node tools/build_quran.mjs`.
- **Uthmani font:** King Fahd Glorious Quran Printing Complex.
- **Recitations and word timings:** streamed from Quran.com's audio servers.
- **English audio translation:** EveryAyah.com.
- **Tafsir:** fetched from Quran.com when first opened.

The translations are free for non-commercial use with credit. Waqt is free with no ads, which fits. Before going public, check that the IndoPak font's licence allows redistribution. If in doubt, drop it and keep Uthmani only.

## Hadith (added in 1.2.0)

What's in the app:
- **The seven big books:** Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah and Malik.
  - Only their catalogue is bundled: chapters, Bengali chapter names and hadith ranges, in `assets/hadith/meta.json`.
  - The text downloads on the phone chapter by chapter from the open hadith-api dataset (`fawazahmed0/hadith-api`), from jsDelivr with raw GitHub as a fallback.
- **Built in:** the three Forty Hadith books (Nawawi, Qudsi, Dehlawi).

Rebuilding the catalogue:
- Run `node tools/build_hadith.mjs`.
- The Bengali chapter names come from `tools/hadith/sections_bn.json`.

Licensing:
- The dataset is released into the public domain (Unlicense).
- The English and Bengali translations belong to their publishers. Like the Quran translations, they are fine for a free, ad-free app with credit, which the app shows under Hadith settings → Sources.

## 6. Keep Bangladesh's Hijri dates in sync

After each Islamic Foundation moon-sighting announcement, add the month's first day to `docs/hijri.json` and push it, for example:

```json
"1448-06": "2026-11-11"
```

Every installed app picks it up within six hours. Without an entry, the app keeps using its moon-sighting prediction.

## 7. Building a new version

1. Raise `versionCode` (for example to 2) and `versionName` in `app/build.gradle.kts`.
2. Build with:
   ```
   cd android
   set JAVA_HOME=D:\Android\jdk-21.0.12.1+1
   gradlew bundleRelease
   ```
3. Upload `app/build/outputs/bundle/release/app-release.aab` to a new release.

Unit tests: `gradlew testDebugUnitTest`. The interface (`../src/ui`) is shared with the desktop app, so test both after UI changes.
