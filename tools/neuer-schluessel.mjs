// Creates the signing key for Echoes QR codes (run once: `npm run qr:schluessel`).
//
// - tools/echoes-schluessel.json  -> SECRET. Load it into tools/qr-generator.html to make codes.
//                                    Keep a backup (USB stick, password manager). Never share it.
// - the printed public key        -> goes into ECHOES_PUBLIC_KEY in src/config.ts.
//
// Creating a new key makes all QR codes printed with the old key stop working.
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import nacl from 'tweetnacl';

const file = join(dirname(fileURLToPath(import.meta.url)), 'echoes-schluessel.json');
if (existsSync(file) && !process.argv.includes('--ueberschreiben')) {
  console.error(
    'Es gibt schon einen Schlüssel (tools/echoes-schluessel.json).\n' +
      'Ein neuer Schlüssel macht alle bisherigen QR-Codes ungültig.\n' +
      'Wenn du das wirklich willst: npm run qr:schluessel -- --ueberschreiben',
  );
  process.exit(1);
}

const keys = nacl.sign.keyPair();
const b64 = (bytes) => Buffer.from(bytes).toString('base64');
writeFileSync(
  file,
  JSON.stringify(
    {
      hinweis: 'GEHEIM - nicht weitergeben. Damit erstellst du Echoes-QR-Codes.',
      publicKey: b64(keys.publicKey),
      secretKey: b64(keys.secretKey),
      erstellt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('Schlüssel gespeichert: tools/echoes-schluessel.json (geheim, Backup machen!)');
console.log('Öffentlicher Schlüssel für src/config.ts:');
console.log(b64(keys.publicKey));
