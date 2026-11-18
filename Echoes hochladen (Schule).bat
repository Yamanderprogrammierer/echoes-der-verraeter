@echo off
rem Doppelklick: laedt die App auf die Expo-Server hoch, damit sie ohne Laptop in Expo Go laeuft.
chcp 65001 >nul
cd /d "%~dp0"
title Echoes - Hochladen fuer die Schule
echo.
echo   ECHOES - App hochladen (Expo Go, ohne Laptop)
echo   ---------------------------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js ist nicht installiert. Bitte von https://nodejs.org installieren.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   Einmalige Einrichtung: Pakete werden installiert ...
  call npm install --legacy-peer-deps
)

echo   Schritt 1: neue MP3s aus assets\echoes einbauen ...
call npm run --silent echoes
if errorlevel 1 (
  echo   Es ist ein Fehler aufgetreten. Lies die Meldung oben.
  echo.
  pause
  exit /b 1
)

echo   Schritt 2: hochladen ...
call npm run --silent schule
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

rem Opens the print page with the echo QR codes and the QR code that opens the app.
if exist "qr-codes\drucken.html" start "" "qr-codes\drucken.html"
if exist "Echoes-App-QR.png" start "" "Echoes-App-QR.png"
pause
