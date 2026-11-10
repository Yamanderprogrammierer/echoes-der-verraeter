# QR Audio

An Expo app for iPhone and iPad that scans QR codes linking to MP3 files and plays them.

## Features
- **Scan**: point the camera at a QR code that holds an MP3 link (`https://…/file.mp3`). It starts playing right away. There's a flashlight toggle for dark rooms.
- **Open from Files**: import one or more MP3s from the iOS Files app (iCloud Drive, On My iPhone, etc.). The files are copied into the app, so they still play later.
- **Enter a link**: paste an MP3 address by hand.
- **Now Playing**: play/pause, skip 15 s back or forward, and a seek bar you can drag.
- **Library**: every track you scan or import is saved. Long-press or tap `…` to rename a track, save a streamed track for offline use, or delete it.
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
