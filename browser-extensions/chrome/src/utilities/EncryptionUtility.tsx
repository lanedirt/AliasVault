import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

/**
 * Utility class for encryption operations which includes Argon2id hashing.
 */
class EncryptionUtility {
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

          return hash.hashHex.toUpperCase();
        } catch (error) {
          console.error('Argon2 hashing failed:', error);
          throw error;
        }
      }
}

export default EncryptionUtility;
