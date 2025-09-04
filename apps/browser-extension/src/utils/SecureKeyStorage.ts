import { Buffer } from 'buffer';

import { ENCRYPTED_MASTER_KEY_KEY, WEBAUTHN_CREDENTIAL_ID_KEY } from '@/utils/Constants';
import EncryptionUtility from '@/utils/EncryptionUtility';
import WebAuthnUtility from '@/utils/WebAuthnUtility';

import { storage } from '#imports';

/**
 * Utility for securely storing and retrieving encryption keys for use with biometric authentication.
 */
export default class SecureKeyStorage {
  /**
   * Store the master encryption key securely for use with biometric authentication.
   * The key is encrypted with a key derived from the WebAuthn credential and stored in browser storage.
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

      // Derive a consistent encryption key from the WebAuthn credential
      const encryptionKey = await this.deriveEncryptionKeyFromWebAuthn();
      if (!encryptionKey) {
        return false;
      }

      // Encrypt the master key with the derived key
      const masterKeyBytes = Buffer.from(masterKey, 'base64');
      const encryptedMasterKey = await EncryptionUtility.encryptData(masterKeyBytes, encryptionKey);
      
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

      // Derive the encryption key from the WebAuthn credential
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
   * This uses the credential ID as a seed to derive a consistent encryption key.
   * 
   * @returns The derived encryption key (base64 encoded)
   */
  private static async deriveEncryptionKeyFromWebAuthn(): Promise<string | null> {
    try {
      // Get the stored credential ID
      const credentialId = await storage.getItem(WEBAUTHN_CREDENTIAL_ID_KEY) as string;
      if (!credentialId) {
        throw new Error('No WebAuthn credential found');
      }

      /**
       * Use the credential ID as a seed for key derivation
       * Convert the credential ID to bytes
       */
      const credentialIdBytes = new TextEncoder().encode(credentialId);
      
      // Create a consistent salt by hashing the credential ID
      const saltBuffer = await crypto.subtle.digest('SHA-256', credentialIdBytes);
      const salt = new Uint8Array(saltBuffer);
      
      // Derive a key using PBKDF2 with the credential ID as password and the salt
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        credentialIdBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      // Derive the encryption key
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000, // 100k iterations for security
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      // Export the key as raw bytes
      const keyBytes = await crypto.subtle.exportKey('raw', derivedKey);
      
      // Convert to base64 for storage
      return Buffer.from(keyBytes).toString('base64');
    } catch (error) {
      console.error('Error deriving encryption key from WebAuthn:', error);
      return null;
    }
  }
}
