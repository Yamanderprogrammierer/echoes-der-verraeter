# QR Audio

An Expo app for iPhone and iPad that scans QR codes linking to MP3 files and plays them.

## Features
The UI is in German, with a dark style and glowing controls, built with Expo Router (screens in `src/app/`).

- **Header** (on every screen): the glowing **Echoes** title. Below it, a play/pause button, the `Lauschen | Lösen` switch, and a keyboard button for typing in an MP3 link.
- **Lauschen** (listen): a big echo button in the middle. Tapping it opens the camera scanner (`src/app/scan.tsx`). The camera only runs while the scanner is open. A QR code that holds an MP3 link (`https://…/file.mp3`) starts playing and closes the scanner. The echo button pulses while audio is playing. After a scan, a player panel appears under the echo button. It has play/pause and a slider you can tap or drag to jump anywhere in the MP3.
- **Lösen** (solve): asks "Willst du das Rätsel lösen?". *Ja* shows "Bald verfügbar." and *Nein* goes back to Lauschen.
- Plays when the silent switch is on, keeps playing in the background, and shows lock-screen / Control Center controls.
- iPad: works in every orientation and in Split View, with layouts that stay centred on wide screens.

## Run it
```bash
npm install
npx expo start
```
Scan the terminal QR code with the iPhone Camera app to open it in **Expo Go**.
In Expo Go, background playback and lock-screen controls may be limited; use a development or production build to get everything.

## Build for a real iPhone / iPad
```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview   # installable test build (ad-hoc)
eas build --platform ios --profile production && eas submit -p ios   # TestFlight / App Store
```
Before building, change `ios.bundleIdentifier` in `app.json` (currently `com.example.qraudio`) to your own.

## Making QR codes
Upload your MP3 somewhere it can be downloaded directly (your own web server, S3, Dropbox with `?dl=1`, and so on), then make a QR code from that URL with any QR generator.
The link must point at the audio file itself, not at a web page that contains a player.
