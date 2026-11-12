# Echoes

An Expo app for iPhone and iPad that scans QR codes linking to MP3 files ("echoes") and plays them.

## Features
The UI is in German, with a dark style and glowing controls, built with Expo Router (screens in `src/app/`).

- **Header** (on Lauschen and Lösen): the glowing **Echoes** title. Below it, a play/pause button, the `Lauschen | Lösen` switch, and a keyboard button for typing in an MP3 link.
- **Lauschen** (listen, `src/app/index.tsx`): a big echo button in the middle. Tapping it opens the camera scanner (`src/app/scan.tsx`). The camera only runs while the scanner is open. A QR code that holds an MP3 link (`https://…/file.mp3`) vibrates briefly, starts playing and closes the scanner. While audio plays, the echo's waveform moves and the hint changes to "Neuen QR Code scannen". After a scan, a player panel shows a slider to jump anywhere in the MP3, play/pause, buttons to skip 5 seconds back or forward (also on the lock screen), and a speed button (1× → 0,75× → 0,5×). Under the scan frame are a flashlight button for dark rooms and a **Fotos** button to read a QR code from a picture.
- **Echo names**: add `?titel=…` to an MP3 link to give it a name, e.g. `https://example.com/echo3.mp3?titel=Die%20Stimme%20im%20Keller`. Without it, the file name is used.
- **Neues Spiel**: at the bottom of "Gefundene Echos". After a confirmation, it deletes all found echoes on the device, so the next group starts fresh.
- **Picks up where you left off**: after closing the app or restarting the iPhone, the last echo reopens (paused) at the same spot and speed. If an MP3 can't be loaded, the panel shows an error with **Erneut versuchen**.
- **Gefundene Echos** (`src/app/echos.tsx`): opened from the button under the echo. It lists every echo found so far. Tap one to hear it again, or use the bin icon (or long-press) to delete it.
- **Offline**: every scanned MP3 is saved on the device in the background, so it also plays later without internet.
- **Lösen** (solve, `src/app/loesen.tsx`): still in progress. It asks "Willst du das Rätsel lösen?". *Ja* shows "Bald verfügbar." and *Nein* goes back to Lauschen.
- Plays when the silent switch is on, keeps playing in the background, and shows lock-screen / Control Center controls.
- iPad: works in every orientation and in Split View.

## Only allow your own QR codes
By default, any `http(s)` MP3 link plays. Once your MP3s are online, add your website to `ALLOWED_HOSTS` in [`src/config.ts`](src/config.ts), for example `['meine-seite.de']`. QR codes that point anywhere else are then rejected with "Dieser Link gehört nicht zu Echoes."

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
The app ID (`ios.bundleIdentifier` in `app.json`) is `de.echoes.app`. It must be unique on the App Store, so change it to something that is yours (e.g. `de.<deinname>.echoes`) before the first build. It can't be changed after the app is published.

## App Store checklist
- **Privacy policy**: [`docs/datenschutz.md`](docs/datenschutz.md) is a German draft. Fill in the `[…]` placeholders, put it online (e.g. on your website or GitHub Pages), and enter the link in App Store Connect. It isn't legal advice, so have it checked if you're unsure.
- **App Privacy ("Datenschutz-Etiketten")** in App Store Connect: the app collects no data, so "Keine Daten erfasst" applies, as long as you don't add analytics later.
- **Screenshots**: at least one set for the 6.9" iPhone (1320 × 2868 or 1290 × 2796) and, because the app supports iPad, one for the 13" iPad (2064 × 2752 or 2048 × 2732). Screenshots from the iOS Simulator for those devices have the right size.
- **App ID**: see "Build" above. It must be your own before the first upload.

## App icon and splash screen
`assets/icon.png` (app icon), `assets/splash-icon.png` (splash screen) and `assets/android-icon-foreground.png` show the glowing echo button on black. Replace them with your own 1024×1024 PNGs any time.

## Making QR codes
Upload your MP3 somewhere it can be downloaded directly (your own web server, S3, Dropbox with `?dl=1`, and so on), then make a QR code from that URL with any QR generator.
The link must point at the audio file itself, not at a web page that contains a player.
