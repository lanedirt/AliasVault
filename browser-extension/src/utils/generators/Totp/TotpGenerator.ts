/**
 * TOTP Generator utility for generating Time-based One-Time Passwords.
 * Based on RFC 6238 (https://tools.ietf.org/html/rfc6238).
 */
export class TotpGenerator {
  /**
   * Generates a Time-based One-Time Password (TOTP) for the given secret key.
   * @param secretKey The secret key in Base32 encoding.
   * @param digits The number of digits in the generated code. Default is 6.
   * @param step The time step in seconds. Default is 30.
   * @returns The generated TOTP code.
   */
  public static generateTotpCode(secretKey: string, digits: number = 6, step: number = 30): string {
    // Remove any whitespace and hyphens from the secret key
    secretKey = secretKey.replace(/\s|-/g, '');

    // Convert the secret key from Base32 to byte array
    const keyBytes = this.base32ToBytes(secretKey);

    // Get the current Unix timestamp and calculate the counter value
    const counter = Math.floor(Date.now() / 1000 / step);

    // Generate the TOTP code
    return this.generateHOTP(keyBytes, counter, digits);
  }

  /**
   * Calculates the remaining seconds until the next TOTP code generation.
   * @param step The time step in seconds. Default is 30.
   * @returns The remaining seconds.
   */
  public static getRemainingSeconds(step: number = 30): number {
    const unixTimestamp = Math.floor(Date.now() / 1000);
    return step - (unixTimestamp % step);
  }

  /**
   * Calculates the remaining percentage until the next TOTP code generation.
   * @param step The time step in seconds. Default is 30.
   * @returns The remaining percentage (0-100).
   */
  public static getRemainingPercentage(step: number = 30): number {
    const remaining = this.getRemainingSeconds(step);
    // Invert the percentage so it counts down instead of up
    return Math.floor(((step - remaining) / step) * 100);
  }

  /**
   * Generates an HMAC-based One-Time Password (HOTP) for the given key and counter.
   * @param key The secret key as a byte array.
   * @param counter The counter value.
   * @param digits The number of digits in the generated code.
   * @returns The generated HOTP code.
   */
  private static generateHOTP(key: Uint8Array, counter: number, digits: number): string {
    // Convert counter to a byte array (8 bytes, big-endian)
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = counter & 0xff;
      counter = counter >> 8;
    }

    // Calculate HMAC-SHA1
    const hmac = this.hmacSha1(key, counterBytes);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    // Generate the code
    const code = binary % Math.pow(10, digits);
    return code.toString().padStart(digits, '0');
  }

  /**
   * Converts a Base32 encoded string to a byte array.
   * @param base32 The Base32 encoded string.
   * @returns The byte array.
   */
  private static base32ToBytes(base32: string): Uint8Array {
    // Base32 character set (RFC 4648)
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    // Convert to uppercase and remove padding
    base32 = base32.toUpperCase().replace(/=+$/, '');

    // Initialize variables
    const length = base32.length;
    const output = new Uint8Array(Math.floor(length * 5 / 8));
    let bits = 0;
    let value = 0;
    let index = 0;

    // Process each character
    for (let i = 0; i < length; i++) {
      const charValue = base32Chars.indexOf(base32[i]);
      if (charValue === -1) {
        throw new Error('Invalid Base32 character: ' + base32[i]);
      }

      // Add 5 bits to the buffer
      value = (value << 5) | charValue;
      bits += 5;

      // If we have at least 8 bits, extract a byte
      if (bits >= 8) {
        bits -= 8;
        output[index++] = (value >> bits) & 0xff;
      }
    }

    return output;
  }

  /**
   * Calculates the HMAC-SHA1 of a message using a key.
   * @param key The key as a byte array.
   * @param message The message as a byte array.
   * @returns The HMAC-SHA1 digest as a byte array.
   */
  private static hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
    // Simple implementation of HMAC-SHA1
    // In a real implementation, you would use a crypto library
    // This is a placeholder that should be replaced with a proper implementation

    // For now, we'll use the Web Crypto API if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // This is async, but we need a sync implementation for this example
      // In a real implementation, you would make this method async
      console.warn('Web Crypto API is available but not used in this synchronous implementation');
    }

    // Fallback implementation (not secure, for demonstration only)
    // In a real implementation, use a proper crypto library
    const blockSize = 64;

    // Prepare the key
    let keyToUse = key;
    if (key.length > blockSize) {
      // If key is too long, hash it
      keyToUse = this.sha1(key);
    }
    if (key.length < blockSize) {
      // If key is too short, pad it with zeros
      const paddedKey = new Uint8Array(blockSize);
      paddedKey.set(keyToUse);
      keyToUse = paddedKey;
    }

    // Prepare the inner and outer padded keys
    const innerPadded = new Uint8Array(blockSize);
    const outerPadded = new Uint8Array(blockSize);

    for (let i = 0; i < blockSize; i++) {
      innerPadded[i] = keyToUse[i] ^ 0x36;
      outerPadded[i] = keyToUse[i] ^ 0x5c;
    }

    // Concatenate inner padded key with message
    const innerData = new Uint8Array(innerPadded.length + message.length);
    innerData.set(innerPadded);
    innerData.set(message, innerPadded.length);

    // Hash the inner data
    const innerHash = this.sha1(innerData);

    // Concatenate outer padded key with inner hash
    const outerData = new Uint8Array(outerPadded.length + innerHash.length);
    outerData.set(outerPadded);
    outerData.set(innerHash, outerPadded.length);

    // Hash the outer data
    return this.sha1(outerData);
  }

  /**
   * Calculates the SHA-1 hash of a message.
   * @param message The message as a byte array.
   * @returns The SHA-1 hash as a byte array.
   */
  private static sha1(message: Uint8Array): Uint8Array {
    // This is a placeholder for a proper SHA-1 implementation
    // In a real implementation, use a proper crypto library

    // For demonstration purposes, we'll return a fixed-length array
    // This is NOT a real SHA-1 implementation
    console.warn('Using placeholder SHA-1 implementation - NOT SECURE');

    // Return a 20-byte array (SHA-1 digest length)
    return new Uint8Array(20).fill(1);
  }
}