@echo off
rem Doppelklick: baut die MP3s aus assets\echoes in die App ein und erstellt die QR-Codes.
chcp 65001 >nul
cd /d "%~dp0"
title Echoes - QR-Codes erstellen
echo.
echo   ECHOES - QR-Codes erstellen
echo   ---------------------------
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

call npm run --silent echoes
if errorlevel 1 (
  echo   Es ist ein Fehler aufgetreten. Lies die Meldung oben.
  echo.
  pause
  exit /b 1
)

if exist "qr-codes\drucken.html" start "" "qr-codes\drucken.html"
pause
