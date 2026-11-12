/**
 * Websites whose MP3 links the app is allowed to play.
 *
 * Leave the list empty to accept every http(s) link. Once your MP3s are online,
 * add your host name(s) here so random QR codes can't start anything, e.g.
 *   export const ALLOWED_HOSTS = ['meine-seite.de'];
 * Sub-domains are included automatically (cdn.meine-seite.de matches meine-seite.de).
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
