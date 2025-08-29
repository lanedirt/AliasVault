import NativeVaultManager from '@/specs/NativeVaultManager';

/**
 * Copy text to clipboard with automatic expiration based on platform capabilities.
 *
 * On iOS: Uses native clipboard expiration via UIPasteboard.setItems with expirationDate.
 * On Android: Uses native method that combines clipboard copy with automatic clearing:
 *   - Uses AlarmManager (works even when app is backgrounded)
 *   - Android 13+: Also marks clipboard content as sensitive
 *
 * @param text - The text to copy to clipboard
 * @param expirationSeconds - Number of seconds after which clipboard should be cleared (0 = no expiration)
 */
export async function copyToClipboardWithExpiration(
  text: string,
  expirationSeconds: number
): Promise<void> {
  // Both platforms now use native methods for reliable clipboard management
  await NativeVaultManager.copyToClipboardWithExpiration(text, expirationSeconds);
}

/**
 * Copy text to clipboard without expiration.
 *
 * @param text - The text to copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await copyToClipboardWithExpiration(text, 0);
}
