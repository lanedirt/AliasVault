import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

/**
 * Utility class for encryption operations including:
 * - Argon2id key derivation
 * - AES-GCM symmetric encryption/decryption
 * - RSA-OAEP asymmetric encryption/decryption
 */
class EncryptionUtility {
  /**
   * Derives a key from a password using Argon2id
   */
  public static async deriveKeyFromPassword(
    password: string,
    salt: string,
    encryptionType: string = 'Argon2id',
    encryptionSettings: string = '{"Iterations":1,"MemorySize":1024,"DegreeOfParallelism":4}'
  ): Promise<string> {
    const settings = JSON.parse(encryptionSettings);

    try {
      if (encryptionType !== 'Argon2Id') {
        throw new Error('Unsupported encryption type');
      }

      const hash = await argon2.hash({
        pass: password,
        salt: salt,
        time: settings.Iterations,
        mem: settings.MemorySize,
        parallelism: settings.DegreeOfParallelism,
        hashLen: 32,
        type: 2, // 0 = Argon2d, 1 = Argon2i, 2 = Argon2id
      });

      // Return bytes
      return hash.hash;
    } catch (error) {
      console.error('Argon2 hashing failed:', error);
      throw error;
    }
  }

  /**
   * Encrypts data using AES-GCM symmetric encryption
   */
  public static async symmetricEncrypt(plaintext: string, base64Key: string): Promise<string> {
    if (!plaintext) return plaintext;

    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(
      Array.from(combined)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
  }

  /**
   * Decrypts data using AES-GCM symmetric encryption
   */
  public static async symmetricDecrypt(base64Ciphertext: string, base64Key: string): Promise<string> {
    if (!base64Ciphertext) return base64Ciphertext;

    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(base64Key), c => c.charCodeAt(0)),
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );

    const ivAndCiphertext = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
    const iv = ivAndCiphertext.slice(0, 12);
    const ciphertext = ivAndCiphertext.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Generates a new RSA key pair for asymmetric encryption
   */
  public static async generateRsaKeyPair(): Promise<{ publicKey: string, privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    return {
      publicKey: JSON.stringify(publicKey),
      privateKey: JSON.stringify(privateKey)
    };
  }

  /**
   * Encrypts data using RSA-OAEP asymmetric encryption with a public key
   */
  public static async encryptWithPublicKey(plaintext: string, publicKey: string): Promise<string> {
    const publicKeyObj = await crypto.subtle.importKey(
      "jwk",
      JSON.parse(publicKey),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    const encodedPlaintext = new TextEncoder().encode(plaintext);
    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKeyObj,
      encodedPlaintext
    );

    return btoa(String.fromCharCode.apply(null, new Uint8Array(cipherBuffer)));
  }

  /**
   * Decrypts data using RSA-OAEP asymmetric encryption with a private key
   */
  public static async decryptWithPrivateKey(ciphertext: string, privateKey: string): Promise<Uint8Array> {
    try {
      const privateKeyObj = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(privateKey),
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      );

      const cipherBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const plaintextBuffer = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        privateKeyObj,
        cipherBuffer
      );

      return new Uint8Array(plaintextBuffer);
    } catch (error) {
      console.error('RSA decryption failed:', error);
      throw new Error(`Failed to decrypt: ${error.message}`);
    }
  }
}

export default EncryptionUtility;
