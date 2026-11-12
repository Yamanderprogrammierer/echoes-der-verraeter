/**
 * Public key that Echoes QR codes must be signed with (see tools/qr-generator.html).
 *
 * While it is set, the app only plays signed codes made with your generator - plain MP3 links,
 * other people's QR codes and copied links are rejected. Set it to '' to accept plain links again.
 * Created with `npm run qr:schluessel`; the matching secret key is in tools/echoes-schluessel.json.
 */
export const ECHOES_PUBLIC_KEY = '6tvL6mOXbDxf5rEpto3pbCP193TR3hcuimCa5LcMESk=';

/**
 * Only used while ECHOES_PUBLIC_KEY is empty: websites whose plain MP3 links the app may play.
 * Leave empty to accept every http(s) link. Sub-domains are included (cdn.meine-seite.de matches meine-seite.de).
 */
export const ALLOWED_HOSTS: string[] = [];

export function isAllowedUrl(url: string): boolean {
  if (ALLOWED_HOSTS.length === 0) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => {
      const a = allowed.toLowerCase();
      return host === a || host.endsWith(`.${a}`);
    });
  } catch {
    return false;
  }
}
