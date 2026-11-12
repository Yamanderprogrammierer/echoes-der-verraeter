import * as Updates from 'expo-updates';

/**
 * Looks for a newer app update (e.g. with new built-in echoes) and downloads it.
 * Returns true when an update is ready; call `Updates.reloadAsync()` to start it.
 * Always false in Expo Go and development, where updates are switched off.
 */
export async function downloadNewEchoes(): Promise<boolean> {
  if (!Updates.isEnabled) return false;
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;
    const fetched = await Updates.fetchUpdateAsync();
    return fetched.isNew;
  } catch {
    return false; // offline or server not reachable
  }
}

export function restartWithUpdate(): void {
  Updates.reloadAsync().catch(() => {});
}
