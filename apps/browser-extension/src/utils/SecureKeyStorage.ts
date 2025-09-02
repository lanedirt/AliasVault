import { Buffer } from 'buffer';

import { ENCRYPTED_MASTER_KEY_KEY } from '@/utils/Constants';
import EncryptionUtility from '@/utils/EncryptionUtility';
import WebAuthnUtility from '@/utils/WebAuthnUtility';

import { storage } from '#imports';

/**
 * Utility for securely storing and retrieving encryption keys for use with biometric authentication.
 */
export default class SecureKeyStorage {
  /**
   * Store the master encryption key securely for use with biometric authentication.
   * The key is encrypted with a random key and stored in browser storage.
   * 
   * @param masterKey The master encryption key to store (base64 encoded)
   * @returns True if the key was stored successfully, false otherwise
   */
  public static async storeMasterKey(masterKey: string): Promise<boolean> {
    try {
      // Check if WebAuthn is available and a credential is registered
      if (!WebAuthnUtility.isWebAuthnSupported() || !(await WebAuthnUtility.isCredentialRegistered())) {
        return false;
      }

      // Generate a random encryption key
      const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
      const encryptionKeyBase64 = Buffer.from(encryptionKey).toString('base64');

      // Encrypt the master key with the random key
      const masterKeyBytes = Buffer.from(masterKey, 'base64');
      const encryptedMasterKey = await EncryptionUtility.encryptData(masterKeyBytes, encryptionKeyBase64);
      
      // Store the encrypted master key
      await storage.setItem(ENCRYPTED_MASTER_KEY_KEY, encryptedMasterKey);

      return true;
    } catch (error) {
      console.error('Error storing master key:', error);
      return false;
    }
  }

  /**
   * Retrieve the master encryption key using biometric authentication.
   * 
   * @returns The master encryption key if retrieval was successful, null otherwise
   */
  public static async retrieveMasterKey(): Promise<string | null> {
    try {
      // Check if WebAuthn is available and a credential is registered
      if (!WebAuthnUtility.isWebAuthnSupported() || !(await WebAuthnUtility.isCredentialRegistered())) {
        return null;
      }

      // Get the encrypted master key
      const encryptedMasterKey = await storage.getItem(ENCRYPTED_MASTER_KEY_KEY) as string;
      if (!encryptedMasterKey) {
        return null;
      }

      // Authenticate with WebAuthn
      const authenticated = await WebAuthnUtility.authenticate();
      if (!authenticated) {
        return null;
      }

      // TODO: In a real implementation, we would derive the encryption key from the WebAuthn credential
      // For now, we'll use a placeholder implementation that simulates this process
      
      // This is a simplified implementation for demonstration purposes
      // In a real implementation, we would use the WebAuthn credential to derive the encryption key
      const encryptionKey = await this.deriveEncryptionKeyFromWebAuthn();
      if (!encryptionKey) {
        return null;
      }

      // Decrypt the master key
      const decryptedMasterKey = await EncryptionUtility.decryptData(encryptedMasterKey, encryptionKey);
      if (!decryptedMasterKey) {
        return null;
      }

      // Convert the decrypted master key to base64
      return Buffer.from(decryptedMasterKey).toString('base64');
    } catch (error) {
      console.error('Error retrieving master key:', error);
      return null;
    }
  }

  /**
   * Check if a master key is stored for biometric authentication.
   */
  public static async isMasterKeyStored(): Promise<boolean> {
    const encryptedMasterKey = await storage.getItem(ENCRYPTED_MASTER_KEY_KEY) as string;
    return !!encryptedMasterKey;
  }

  /**
   * Remove the stored master key.
   */
  public static async removeMasterKey(): Promise<void> {
    await storage.removeItem(ENCRYPTED_MASTER_KEY_KEY);
  }

  /**
   * Derive an encryption key from the WebAuthn credential.
   * This is a placeholder implementation that simulates the process.
   * In a real implementation, we would use the WebAuthn credential to derive the encryption key.
   * 
   * @returns The derived encryption key (base64 encoded)
   */
  private static async deriveEncryptionKeyFromWebAuthn(): Promise<string | null> {
    try {
      // In a real implementation, we would use the WebAuthn credential to derive the encryption key
      // For now, we'll use a placeholder implementation that simulates this process
      
      // Generate a random key for demonstration purposes
      const key = crypto.getRandomValues(new Uint8Array(32));
      return Buffer.from(key).toString('base64');
    } catch (error) {
      console.error('Error deriving encryption key from WebAuthn:', error);
      return null;
    }
  }
}

