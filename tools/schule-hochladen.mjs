// Uploads the app to Expo's servers so it opens in Expo Go without the laptop: `npm run schule`
//
// - Uploads the current app (incl. the MP3s in assets/echoes) as an update on the channel "schule".
// - Saves "Echoes-App-QR.png" in the project folder: scan it once with the iPhone camera,
//   then the app opens in Expo Go, straight from the internet.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const projectId = app.extra?.eas?.projectId;
const sdk = JSON.parse(readFileSync(join(root, 'node_modules', 'expo', 'package.json'), 'utf8')).version.split('.')[0];
const runtimeVersion = `exposdk:${sdk}.0.0`;
const channel = 'schule';

if (!projectId) {
  console.error('\n✖ Keine Expo-Projekt-ID in app.json gefunden.\n');
  process.exit(1);
}

const message = process.argv[2] || `Echoes ${new Date().toLocaleString('de-DE')}`;
console.log(`\nEchoes wird hochgeladen (Kanal "${channel}") …\n`);
// Runs through the shell (needed for npx on Windows), so arguments with spaces must be quoted.
const quote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);
const args = ['eas-cli@latest', 'update', '--channel', channel, '--environment', 'preview', '--message', message, '--non-interactive'];
const result = spawnSync('npx', args.map(quote), {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ECHOES_EXPO_GO: '1' },
});
if (result.status !== 0) {
  console.error('\n✖ Hochladen fehlgeschlagen. Lies die Meldung oben (bist du bei Expo angemeldet? `npx eas-cli@latest login`).\n');
  process.exit(1);
}

// Link that opens the latest "schule" update in Expo Go.
const link = `exp://u.expo.dev/${projectId}?runtime-version=${encodeURIComponent(runtimeVersion)}&channel-name=${channel}`;
const png = join(root, 'Echoes-App-QR.png');
await QRCode.toFile(png, link, { errorCorrectionLevel: 'M', margin: 4, width: 700 });

console.log('\n✔ Hochgeladen!');
console.log('   Scanne Echoes-App-QR.png (im Projektordner) mit der iPhone-Kamera → öffnet die App in Expo Go.');
console.log(`   Link: ${link}\n`);
