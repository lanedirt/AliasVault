import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

import NativeVaultManager from '@/specs/NativeVaultManager';

/**
 * Copy text to clipboard with automatic expiration based on platform capabilities.
 * On iOS, uses native clipboard expiration. On Android, schedules manual clear.
 * 
 * @param text - The text to copy to clipboard
 * @param expirationSeconds - Number of seconds after which clipboard should be cleared (0 = no expiration)
 */
export async function copyToClipboardWithExpiration(
  text: string,
  expirationSeconds: number
): Promise<void> {
  if (Platform.OS === 'ios') {
    // Use native iOS method with built-in expiration
    await NativeVaultManager.copyToClipboardWithExpiration(text, expirationSeconds);
  } else {
    // For Android, use expo-clipboard and schedule manual clear
    await Clipboard.setStringAsync(text);
    
    // Schedule clipboard clear if timeout is set
    if (expirationSeconds > 0) {
      await NativeVaultManager.clearClipboardAfterDelay(expirationSeconds);
    }
  }
}

/**
 * Copy text to clipboard without expiration.
 * 
 * @param text - The text to copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await copyToClipboardWithExpiration(text, 0);
}