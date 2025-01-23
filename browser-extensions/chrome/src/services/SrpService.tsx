import srp from 'secure-remote-password/client'
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

interface LoginInitiateResponse {
  salt: string;
  serverEphemeral: string;
  encryptionType: string;
  encryptionSettings: string;
}

interface ValidateLoginResponse {
  requiresTwoFactor: boolean;
  token?: {
    token: string;
    refreshToken: string;
  };
  serverSessionProof: string;
}

class SrpService {
  private static async deriveKeyFromPassword(
    password: string,
    salt: string,
    encryptionType: string = 'Argon2id',
    encryptionSettings: string = '{"iterations":2,"memory":67108864,"parallelism":4}'
  ): Promise<Uint8Array> {
    const settings = JSON.parse(encryptionSettings);

    try {
        if (encryptionType !== 'Argon2Id') {
            throw new Error('Unsupported encryption type');
        }

      const hash = await argon2.hash({
        pass: password,
        salt: salt,
        time: settings.iterations,
        mem: settings.memory / 1024, // Convert bytes to KiB
        parallelism: settings.parallelism,
        hashLen: 32 // 32 bytes = 256 bits
      });

      console.log(hash);
      return hash.hash;
    } catch (error) {
      console.error('Argon2 hashing failed:', error);
      throw error;
    }
  }

  /**
   * Generates a client ephemeral
   *
   * @returns
   */
  private static generateEphemeral(): srp.Ephemeral {
    return srp.generateEphemeral()
  }

  /*private static derivePrivateKey(salt: string, username: string, passwordHash: string): string {
    const hash = createHash('sha256')
      .update(salt)
      .update(username.toLowerCase())
      .update(passwordHash)
      .digest('hex');
    return hash;
  }*/

  public async initiateLogin(username: string): Promise<LoginInitiateResponse> {
    const response = await fetch('http://localhost:5092/v1/Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username.toLowerCase().trim() })
    });

    if (!response.ok) {
      throw new Error('Login initiation failed');
    }

    return await response.json();
  }

  public async validateLogin(
    username: string,
    password: string,
    rememberMe: boolean,
    loginResponse: LoginInitiateResponse
  ): Promise<boolean> {
  // Promise<ValidateLoginResponse> {
    // 1. Derive key from password
    const passwordHash = await SrpService.deriveKeyFromPassword(
      password,
      loginResponse.salt,
      loginResponse.encryptionType,
      loginResponse.encryptionSettings
    );

    return true;

    /*
    const passwordHashString = Buffer.from(passwordHash).toString('hex');

    // 2. Generate client ephemeral


    const clientEphemeral = SrpService.generateEphemeral();

    // 3. Derive private key
    const privateKey = SrpService.derivePrivateKey(
      loginResponse.salt,
      username,
      passwordHashString
    );

    // 4. Derive session (simplified for example)
    const sessionProof = createHash('sha256')
      .update(privateKey)
      .update(clientEphemeral.secret)
      .update(loginResponse.serverEphemeral)
      .digest('hex');

    // 5. Send validation request
    const response = await fetch('http://localhost:5092/v1/Auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.toLowerCase().trim(),
        rememberMe,
        clientPublicEphemeral: clientEphemeral.public,
        clientSessionProof: sessionProof
      })
    });

    if (!response.ok) {
      throw new Error('Login validation failed');
    }

    return await response.json();*/
  }
}

export const srpService = new SrpService();