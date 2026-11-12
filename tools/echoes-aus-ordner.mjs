// MP3s vom PC in die App einbauen und QR-Codes dafür erstellen: `npm run echoes`
//
// 1. Lege deine MP3-Dateien in den Ordner assets/echoes/ (der Dateiname wird der Name des Echos).
// 2. Führe `npm run echoes` aus.
//    -> src/bundledEchoes.ts wird neu geschrieben (damit die App die Dateien kennt)
//    -> qr-codes/ enthält für jede Datei ein PNG und qr-codes/drucken.html zum Ausdrucken
//
// Wichtig: Den Dateinamen später nicht mehr ändern - sonst passt der gedruckte QR-Code nicht mehr.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import nacl from 'tweetnacl';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = join(root, 'assets', 'echoes');
const outDir = join(root, 'qr-codes');
const keyFile = join(root, 'tools', 'echoes-schluessel.json');
const AUDIO = new Set(['.mp3', '.m4a', '.aac', '.wav']);

function fail(message) {
  console.error('\n✖ ' + message + '\n');
  process.exit(1);
}

// --- Schlüssel laden und prüfen, ob er zur App passt ---
if (!existsSync(keyFile)) fail('Schlüssel fehlt: tools/echoes-schluessel.json (zuerst `npm run qr:schluessel`).');
const secretKey = Uint8Array.from(Buffer.from(JSON.parse(readFileSync(keyFile, 'utf8')).secretKey, 'base64'));
const publicKey = Buffer.from(nacl.sign.keyPair.fromSecretKey(secretKey).publicKey).toString('base64');
const config = readFileSync(join(root, 'src', 'config.ts'), 'utf8');
const appKey = config.match(/ECHOES_PUBLIC_KEY\s*=\s*'([^']*)'/)?.[1];
if (appKey !== publicKey) fail('Der Schlüssel passt nicht zu ECHOES_PUBLIC_KEY in src/config.ts.');

// --- MP3s einsammeln ---
mkdirSync(audioDir, { recursive: true });
const files = readdirSync(audioDir)
  .filter((f) => AUDIO.has(extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, 'de'));

function slug(name) {
  return (
    name
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'echo'
  );
}

const used = new Set();
const echoes = files.map((file) => {
  const base = file.slice(0, -extname(file).length);
  let id = slug(base);
  for (let n = 2; used.has(id); n++) id = `${slug(base)}-${n}`;
  used.add(id);
  const title = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { file, id, title };
});

// --- src/bundledEchoes.ts schreiben ---
const lines = echoes.map((e) => `  ${JSON.stringify(e.id)}: require(${JSON.stringify(`../assets/echoes/${e.file}`)}),`);
writeFileSync(
  join(root, 'src', 'bundledEchoes.ts'),
  [
    '// AUTOMATISCH ERSTELLT von `npm run echoes` – nicht von Hand ändern.',
    '// MP3s aus assets/echoes/, die in die App eingebaut sind (Name im QR-Code -> Datei).',
    '',
    echoes.length
      ? `export const BUNDLED_ECHOES: Record<string, number> = {\n${lines.join('\n')}\n};`
      : 'export const BUNDLED_ECHOES: Record<string, number> = {};',
    '',
  ].join('\n'),
);

// --- signierte QR-Codes erstellen (gleiches Format wie tools/qr-generator.html) ---
const b64url = (bytes) => Buffer.from(bytes).toString('base64url');
function makeCode(id, title) {
  const payload = b64url(Buffer.from(JSON.stringify({ f: id, t: title }), 'utf8'));
  const sig = b64url(nacl.sign.detached(Buffer.from(payload, 'ascii'), secretKey));
  return `ECHOES1.${payload}.${sig}`;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const cards = [];
for (const e of echoes) {
  const code = makeCode(e.id, e.title);
  const options = { errorCorrectionLevel: 'M', margin: 4, width: 900 };
  await QRCode.toFile(join(outDir, `${e.id}.png`), code, options);
  const dataUrl = await QRCode.toDataURL(code, options);
  cards.push({ ...e, dataUrl });
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
writeFileSync(
  join(outDir, 'drucken.html'),
  `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Echoes QR-Codes</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; color: #000; background: #fff; }
  h1 { margin: 0 0 4px; } p { color: #555; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
  .card { border: 1px dashed #bbb; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
  .card img { width: 100%; max-width: 320px; height: auto; }
  .title { font-weight: 700; font-size: 20px; margin-top: 8px; }
  .brand { color: #777; font-size: 14px; }
  @media print { p { display: none; } .grid { grid-template-columns: repeat(2, 1fr); } }
</style></head><body>
<h1>Echoes – QR-Codes</h1>
<p>${cards.length} Codes · Zum Drucken Strg+P drücken · Entlang der gestrichelten Linie ausschneiden.</p>
<div class="grid">
${cards
  .map((c) => `  <div class="card"><img src="${c.dataUrl}" alt="QR-Code ${esc(c.title)}"><div class="title">${esc(c.title)}</div><div class="brand">Echoes</div></div>`)
  .join('\n')}
</div>
</body></html>
`,
);

// --- Zusammenfassung ---
if (!echoes.length) {
  console.log('\nKeine MP3s gefunden. Lege Dateien in den Ordner assets/echoes/ und starte `npm run echoes` erneut.\n');
} else {
  console.log(`\n✔ ${echoes.length} Echo(s) in die App eingebaut und QR-Codes erstellt:\n`);
  for (const e of echoes) console.log(`   ${e.title}  →  qr-codes/${e.id}.png`);
  console.log('\n   Alle Codes zum Ausdrucken: qr-codes/drucken.html');
  console.log('   Die App lädt die neuen Dateien beim nächsten Neuladen (in Expo Go: Taste r im Terminal).\n');
}
