import nacl from 'tweetnacl';

import { ECHOES_PUBLIC_KEY, isAllowedUrl } from './config';
import { titleFromUrl } from './library';
import { extractUrl } from './theme';

/**
 * Signed Echoes code, as made by tools/qr-generator.html:
 *   ECHOES1.<payload>.<signature>
 * payload   = base64url(UTF-8 JSON { "u": mp3 link, "t": title })
 * signature = base64url(Ed25519 signature of the payload text)
 */
export const CODE_PREFIX = 'ECHOES1.';

// Declared before `publicKey` below, which decodes the key as soon as this file loads.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export type CodeResult =
  | { ok: true; url: string; title: string }
  | { ok: false; reason: 'not-ours' | 'no-link' };

const publicKey = ECHOES_PUBLIC_KEY ? decodeBase64(ECHOES_PUBLIC_KEY.replace(/\+/g, '-').replace(/\//g, '_')) : null;

/** Whether the app only accepts signed codes. */
export const signedCodesOnly = !!publicKey;

/** Turns scanned or typed text into something to play, or says why it was rejected. */
export function readCode(text: string): CodeResult {
  const trimmed = text.trim();

  if (trimmed.startsWith(CODE_PREFIX)) {
    const signed = verifySigned(trimmed);
    return signed ?? { ok: false, reason: 'not-ours' };
  }

  const url = extractUrl(trimmed);
  if (!url) return { ok: false, reason: 'no-link' };
  if (signedCodesOnly || !isAllowedUrl(url)) return { ok: false, reason: 'not-ours' };
  return { ok: true, url, title: titleFromUrl(url) };
}

function verifySigned(code: string): CodeResult | null {
  if (!publicKey || publicKey.length !== nacl.sign.publicKeyLength) return null;
  const parts = code.slice(CODE_PREFIX.length).split('.');
  if (parts.length !== 2) return null;
  const [payloadText, sigText] = parts;
  const signature = decodeBase64(sigText);
  if (!signature || signature.length !== nacl.sign.signatureLength) return null;
  if (!nacl.sign.detached.verify(asciiBytes(payloadText), signature, publicKey)) return null;

  try {
    const bytes = decodeBase64(payloadText);
    if (!bytes) return null;
    const data = JSON.parse(utf8Decode(bytes)) as { u?: unknown; t?: unknown };
    if (typeof data.u !== 'string' || !/^https?:\/\//i.test(data.u)) return null;
    const title = typeof data.t === 'string' && data.t.trim() ? data.t.trim() : titleFromUrl(data.u);
    return { ok: true, url: data.u, title };
  } catch {
    return null;
  }
}

/** Decodes base64url (padding optional). Returns null for invalid input. */
function decodeBase64(text: string): Uint8Array | null {
  const clean = text.replace(/=+$/, '');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const value = ALPHABET.indexOf(ch);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

function asciiBytes(text: string): Uint8Array {
  return Uint8Array.from(text, (ch) => ch.charCodeAt(0) & 0xff);
}

function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    let cp: number;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else
      cp =
        ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    out += String.fromCodePoint(cp);
  }
  return out;
}
