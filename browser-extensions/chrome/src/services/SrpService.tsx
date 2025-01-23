import srp from 'secure-remote-password/client'
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';
import { Buffer } from 'buffer';
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
    encryptionSettings: string = '{"Iterations":1,"MemorySize":1024,"DegreeOfParallelism":4}'
  ): Promise<Uint8Array> {
    const settings = JSON.parse(encryptionSettings);

    try {
        if (encryptionType !== 'Argon2Id') {
            throw new Error('Unsupported encryption type');
        }

        console.log('settings');
        console.log('--------------------------------');
        console.log(password);
        console.log(salt);
        console.log(settings.Iterations);
        console.log(settings.MemorySize);
        console.log(settings.DegreeOfParallelism);

      const hash = await argon2.hash({
        pass: password,
        salt: salt,
        time: settings.Iterations,
        mem: settings.MemorySize,
        parallelism: settings.DegreeOfParallelism,
        hashLen: 32, // 32 bytes = 256 bits
        type: argon2.ArgonType.Argon2id,
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

  private static derivePrivateKey(salt: string, username: string, passwordHash: string): string {
    // SRP private key derivation
    const hash = srp.derivePrivateKey(salt, username, passwordHash);
    return hash;
  }

  public async initiateLogin(username: string): Promise<LoginInitiateResponse> {
    const response = await fetch('https://localhost:7223/v1/Auth/login', {
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

    console.log('loginResponse');
    console.log('--------------------------------');
    console.log(loginResponse);
  // Promise<ValidateLoginResponse> {
    // 1. Derive key from password
    const passwordHash = await SrpService.deriveKeyFromPassword(
      password,
      loginResponse.salt,
      loginResponse.encryptionType,
      loginResponse.encryptionSettings
    );
    const passwordHashString = Array.from(passwordHash)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('').toUpperCase();

    console.log('step 1');
    console.log('--------------------------------');
    console.log(passwordHash);
    console.log(passwordHashString);

    // 2. Generate client ephemeral
    const clientEphemeral = SrpService.generateEphemeral();
    console.log('step 2');
    console.log('--------------------------------');
    console.log(clientEphemeral);

    // 3. Derive private key
    const privateKey = SrpService.derivePrivateKey(
        loginResponse.salt,
        username,
        passwordHashString
    );

    console.log('step 3');
    console.log('--------------------------------');
    console.log(passwordHashString);
    console.log(privateKey);

    // 4. Derive session (simplified for example)
    const sessionProof = srp.deriveSession(clientEphemeral.secret, loginResponse.serverEphemeral, loginResponse.salt, username, privateKey);

    console.log('step 4');
    console.log('--------------------------------');
    console.log(sessionProof);

    // 5. Send validation request
    const response = await fetch('https://localhost:7223/v1/Auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          rememberMe,
          clientPublicEphemeral: clientEphemeral.public,
          clientSessionProof: sessionProof.proof,
        })
      });

    console.log(response);

    return true;

    /*
    const passwordHashString = Buffer.from(passwordHash).toString('hex');
    const clientEphemeral = SrpService.generateEphemeral();

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