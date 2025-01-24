import srp from 'secure-remote-password/client'

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

/**
 * Utility class for SRP authentication operations.
 */
class SrpUtility {
  public async initiateLogin(username: string): Promise<LoginInitiateResponse> {
    // TODO: make base API URL configurable. The extension will have to support both official
    // and self-hosted instances.
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
    passwordHashString: string,
    rememberMe: boolean,
    loginResponse: LoginInitiateResponse
  ): Promise<ValidateLoginResponse> {
    // 2. Generate client ephemeral
    const clientEphemeral = srp.generateEphemeral()

    // 3. Derive private key
    const privateKey = srp.derivePrivateKey(loginResponse.salt, username, passwordHashString);

    // 4. Derive session (simplified for example)
    const sessionProof = srp.deriveSession(clientEphemeral.secret, loginResponse.serverEphemeral, loginResponse.salt, username, privateKey);

    // 5. Send validation request
    // TODO: make base API URL configurable. The extension will have to support both official
    // and self-hosted instances.
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

    return await response.json();
  }
}

export const srpUtility = new SrpUtility();
