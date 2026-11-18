# Echoes

An Expo app for iPhone and iPad that scans QR codes linking to MP3 files ("echoes") and plays them.

## Features
The UI is in German, with a dark style and glowing controls, built with Expo Router (screens in `src/app/`).

- **Header** (on Lauschen and Lösen): the glowing **Echoes** title. Below it, a play/pause button, the `Lauschen | Lösen` switch, and a keyboard button for typing in an MP3 link.
- **Lauschen** (listen, `src/app/index.tsx`): a big echo button in the middle. Tapping it opens the camera scanner (`src/app/scan.tsx`). The camera only runs while the scanner is open. A QR code that holds an MP3 link (`https://…/file.mp3`) vibrates briefly, starts playing and closes the scanner. While audio plays, the echo's waveform moves and the hint changes to "Neuen QR Code scannen". After a scan, a player panel shows a slider to jump anywhere in the MP3, play/pause, buttons to skip 5 seconds back or forward (also on the lock screen), and a speed button (1× → 0,75× → 0,5×). Under the scan frame are a flashlight button for dark rooms and a **Fotos** button to read a QR code from a picture.
- **Echo names**: you enter the name in the QR generator (see below). Without a name, the file name is used.
- **Neues Spiel**: at the bottom of "Gefundene Echos". After a confirmation, it deletes all found echoes on the device, so the next group starts fresh.
- **Picks up where you left off**: after closing the app or restarting the iPhone, the last echo reopens (paused) at the same spot and speed. If an MP3 can't be loaded, the panel shows an error with **Erneut versuchen**.
- **Gefundene Echos** (`src/app/echos.tsx`): opened from the button under the echo. It lists every echo found so far. Tap one to hear it again, or use the bin icon (or long-press) to delete it.
- **Offline**: every scanned MP3 is saved on the device in the background, so it also plays later without internet.
- **Lösen** (solve, `src/app/loesen.tsx`): still in progress. It asks "Willst du das Rätsel lösen?". *Ja* shows "Bald verfügbar." and *Nein* goes back to Lauschen.
- Plays when the silent switch is on, keeps playing in the background, and shows lock-screen / Control Center controls.
- iPad: works in every orientation and in Split View.

## MP3s from your PC (built into the app)
You don't need a website or Dropbox for this:
1. Put your MP3 files into the folder `assets/echoes/`. The file name becomes the echo's name, e.g. `Die Stimme im Keller.mp3`.
2. Double-click **`Echoes erstellen.bat`** in the project folder (or run `npm run echoes`).
3. The print page `qr-codes/drucken.html` opens by itself. Print it with Ctrl+P. Each code is also in `qr-codes/` as a PNG.

The MP3s are built into the app, so they play straight away and without internet. The QR codes are signed, just like the online ones.

Things to know:
- **New or changed MP3s reach players through an update** (see "Sending new echoes to players" below). In Expo Go, pressing `r` in the terminal is enough.
- **Don't rename a file after printing its code.** The code refers to the file name.
- **App size:** every MP3 makes the app bigger. A few dozen short clips are fine.
- `npm run echoes` rewrites `src/bundledEchoes.ts` and the `qr-codes/` folder each time. Don't edit them by hand.

## Using the app without the laptop (Expo Go, e.g. at school)
The app can be opened in Expo Go straight from Expo's servers, without `npx expo start`:

1. Double-click **`Echoes hochladen (Schule).bat`**, or run `npm run schule`. It builds in new MP3s from `assets/echoes`, uploads the app on the channel `schule`, and opens `Echoes-App-QR.png`.
2. Scan that QR code once with the iPhone camera. The app opens in Expo Go and stays under "Recently opened".
3. After changes, upload again the same way. Expo Go loads the new version next time the app is opened.

Notes:
- The link is `exp://u.expo.dev/0423b2e2-1e7a-410d-af81-103334e63acc?runtime-version=exposdk%3A58.0.0&channel-name=schule`. Anyone with it can open the app, but only your signed QR codes play.
- `app.config.js` labels this upload with the Expo SDK version (`exposdk:58.0.0`), which Expo Go requires. Normal builds keep `runtimeVersion` from `app.json`.
- When Expo Go itself moves to a newer SDK, the project has to be upgraded before the link works again.

## Sending new echoes to players (over-the-air updates)
The app is linked to the Expo project `@pascalll69/qr-audio-player`, and EAS Update is set up. New MP3s and code changes reach installed apps **without a new App Store version**:

```bash
npm run update:test      # to your test builds (made with --profile preview)
npm run update:spieler   # to everyone (App Store / TestFlight builds, --profile production)
```

- The app downloads the update in the background when it starts, and uses it from the next start.
- If a player scans a code for an echo their app doesn't have yet, the app downloads the update right away. It shows "Neue Echos werden geladen …" and restarts, and then they scan again. Without internet, they're asked to connect and try again.
- Updates only reach builds with the same app `version` in `app.json` (currently `1.0.0`). Changing the version or adding new native packages needs a new build.
- Updates don't work in Expo Go. There you just press `r`.

## Only your own QR codes (signed codes)
Echoes only plays QR codes that you made with your own generator. Plain MP3 links, other people's QR codes and copied or changed codes are rejected with "Dieser QR-Code gehört nicht zu Echoes."

**Making a QR code**
1. Upload the MP3 somewhere it can be downloaded directly (your website, Dropbox …).
2. Open [`tools/qr-generator.html`](tools/qr-generator.html) in your browser (double-click it). It works without internet, using its files in `tools/vendor/`, so keep that folder next to it.
3. The first time only: click **Schlüssel-Datei wählen** and pick `tools/echoes-schluessel.json`. The browser remembers it on this PC.
4. Paste the MP3 link, enter a name (e.g. "Die Stimme im Keller"), and click **QR-Code erstellen**.
5. Use the audio player there to check the link works, then click **PNG herunterladen** and print it.

**How it works**: every code is signed with the secret key in `tools/echoes-schluessel.json`. The app contains only the matching public key (`ECHOES_PUBLIC_KEY` in [`src/config.ts`](src/config.ts)), so it can check codes but can't make them. A code looks like `ECHOES1.…` and contains the MP3 link and the name.

**Keep the key safe**:
- `tools/echoes-schluessel.json` is in `.gitignore` and is never committed. **Make a backup** (USB stick, password manager). Without it, you can't make new codes. Codes you've already printed keep working.
- Never share it. Anyone who has it can make codes for your app.
- `npm run qr:schluessel -- --ueberschreiben` creates a new key. This makes **all** printed codes invalid, and you'd have to put the new public key into the app and release an update.

To accept plain MP3 links again (e.g. for testing), set `ECHOES_PUBLIC_KEY` to `''` in `src/config.ts`. Then `ALLOWED_HOSTS` in the same file can limit them to your website.

## Run it
```bash
npm install --legacy-peer-deps
npx expo start
```
Scan the terminal QR code with the iPhone Camera app to open the app in **Expo Go**.
Expo Go shows its own icon and splash screen, and background playback and lock-screen controls are limited there. To see everything as it really is, use a build (below).

## Build for a real iPhone / iPad
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile preview      # installable test build
npx eas-cli@latest build --platform ios --profile production   # for TestFlight / App Store
npx eas-cli@latest submit -p ios
```
The app ID (`ios.bundleIdentifier` in `app.json`) is `de.pascal.echoesderverraeter`. Don't change it after the first App Store upload; it can't be changed once the app is published.

## App Store checklist
- **Privacy policy**: [`docs/datenschutz.md`](docs/datenschutz.md) is a German draft. Fill in the `[…]` placeholders, put it online (e.g. on your website or GitHub Pages), and enter the link in App Store Connect. It isn't legal advice, so have it checked if you're unsure.
- **App Privacy ("Datenschutz-Etiketten")** in App Store Connect: the app collects no data, so "Keine Daten erfasst" applies, as long as you don't add analytics later.
- **Screenshots**: at least one set for the 6.9" iPhone (1320 × 2868 or 1290 × 2796) and, because the app supports iPad, one for the 13" iPad (2064 × 2752 or 2048 × 2732). Screenshots from the iOS Simulator for those devices have the right size.
- **App ID**: `de.pascal.echoesderverraeter` (see "Build" above). It's set and must not change after the first upload.

## App icon and splash screen
`assets/icon.png` (app icon), `assets/splash-icon.png` (splash screen) and `assets/android-icon-foreground.png` show the glowing echo button on black. Replace them with your own 1024×1024 PNGs any time.

## Making QR codes
Upload your MP3 somewhere it can be downloaded directly (your own web server, S3, Dropbox with `?dl=1`, and so on), then make a QR code from that URL with any QR generator.
The link must point at the audio file itself, not at a web page that contains a player.
