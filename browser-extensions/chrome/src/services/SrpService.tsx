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
    // 1. Derive key from password
    const passwordHashString = await SrpService.deriveKeyFromPassword(
      password,
      loginResponse.salt,
      loginResponse.encryptionType,
      loginResponse.encryptionSettings
    );

    console.log('step 1');
    console.log('--------------------------------');
    console.log(passwordHashString);

    // 2. Generate client ephemeral
    const clientEphemeral = srp.generateEphemeral()
    console.log('step 2');
    console.log('--------------------------------');
    console.log(clientEphemeral);

    // 3. Derive private key
    console.log(loginResponse);
    const privateKey = srp.derivePrivateKey(loginResponse.salt, username, passwordHashString);

    console.log('step 3');
    console.log('--------------------------------');
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
          rememberMe: rememberMe,
          clientPublicEphemeral: clientEphemeral.public,
          clientSessionProof: sessionProof.proof,
        })
      });

    const responseJson = await response.json();

    console.log('Auth response:')
    console.log('--------------------------------');
    console.log(responseJson);

    // Store access and refresh token
    localStorage.setItem('accessToken', responseJson.token.token);
    localStorage.setItem('refreshToken', responseJson.token.refreshToken);

    // Make another API call trying to get latest vault
    const vaultResponse = await fetch('https://localhost:7223/v1/Vault', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
    });

    const vaultResponseJson = await vaultResponse.json();

    console.log('Vault response:')
    console.log('--------------------------------');
    console.log(vaultResponseJson);


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