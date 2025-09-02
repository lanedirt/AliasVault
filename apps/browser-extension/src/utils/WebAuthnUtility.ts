import { Buffer } from 'buffer';

import { WEBAUTHN_CHALLENGE_KEY, WEBAUTHN_CREDENTIAL_ID_KEY } from '@/utils/Constants';

import { storage } from '#imports';

/**
 * WebAuthn utility for biometric authentication.
 */
export default class WebAuthnUtility {
  /**
   * Check if WebAuthn is supported in the current browser.
   */
  public static isWebAuthnSupported(): boolean {
    return window.PublicKeyCredential !== undefined;
  }

  /**
   * Check if the current platform is MacOS.
   */
  public static isMacOS(): boolean {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }

  /**
   * Check if Touch ID is available on the current device.
   * This is a best-effort check as browsers don't provide a direct way to check for Touch ID.
   */
  public static async isTouchIDAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported() || !this.isMacOS()) {
      return false;
    }

    try {
      // Check if platform authenticators are available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Error checking for Touch ID availability:', error);
      return false;
    }
  }

  /**
   * Register a new WebAuthn credential for biometric authentication.
   * 
   * @param username The username to associate with the credential
   * @returns The credential ID if registration was successful, null otherwise
   */
  public static async registerCredential(username: string): Promise<string | null> {
    if (!this.isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Generate a random challenge
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = Buffer.from(challenge).toString('base64');
      
      // Store the challenge for later verification
      await storage.setItem(WEBAUTHN_CHALLENGE_KEY, challengeBase64);

      // Create credential creation options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'AliasVault',
          // Use the current origin as the RP ID
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(username),
          name: username,
          displayName: username
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Restrict to platform authenticators (like Touch ID)
          requireResidentKey: false,
          userVerification: 'required' // Require biometric verification
        },
        timeout: 60000, // 1 minute timeout
        attestation: 'none' // Don't request attestation
      };

      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Get the credential ID
      const credentialId = credential.id;
      
      // Store the credential ID for later use
      await storage.setItem(WEBAUTHN_CREDENTIAL_ID_KEY, credentialId);

      return credentialId;
    } catch (error) {
      console.error('Error registering WebAuthn credential:', error);
      return null;
    }
  }

  /**
   * Authenticate with an existing WebAuthn credential.
   * 
   * @returns True if authentication was successful, false otherwise
   */
  public static async authenticate(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Get the stored credential ID
      const credentialId = await storage.getItem(WEBAUTHN_CREDENTIAL_ID_KEY) as string;
      if (!credentialId) {
        throw new Error('No WebAuthn credential found');
      }

      // Generate a random challenge
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      // Create credential request options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(
            atob(credentialId.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
          ),
          type: 'public-key',
          transports: ['internal']
        }],
        timeout: 60000, // 1 minute timeout
        userVerification: 'required' // Require biometric verification
      };

      // Request the credential
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      // Authentication successful
      return true;
    } catch (error) {
      console.error('Error authenticating with WebAuthn:', error);
      return false;
    }
  }

  /**
   * Check if a WebAuthn credential is registered.
   */
  public static async isCredentialRegistered(): Promise<boolean> {
    const credentialId = await storage.getItem(WEBAUTHN_CREDENTIAL_ID_KEY) as string;
    return !!credentialId;
  }

  /**
   * Remove the registered WebAuthn credential.
   */
  public static async removeCredential(): Promise<void> {
    await storage.removeItem(WEBAUTHN_CREDENTIAL_ID_KEY);
    await storage.removeItem(WEBAUTHN_CHALLENGE_KEY);
  }
}

