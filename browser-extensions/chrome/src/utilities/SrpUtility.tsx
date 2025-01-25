import srp from 'secure-remote-password/client'
import { WebApiService } from '../services/WebApiService';

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
  private webApiService: WebApiService;

  constructor(webApiService: WebApiService) {
    this.webApiService = webApiService;
  }

  public async initiateLogin(username: string): Promise<LoginInitiateResponse> {
    return this.webApiService.post('Auth/login', {
      username: username.toLowerCase().trim()
    });
  }

  public async validateLogin(
    username: string,
    passwordHashString: string,
    rememberMe: boolean,
    loginResponse: LoginInitiateResponse
  ): Promise<ValidateLoginResponse> {
    // Generate client ephemeral
    const clientEphemeral = srp.generateEphemeral()

    // Derive private key
    const privateKey = srp.derivePrivateKey(loginResponse.salt, username, passwordHashString);

    // Derive session
    const sessionProof = srp.deriveSession(
      clientEphemeral.secret,
      loginResponse.serverEphemeral,
      loginResponse.salt,
      username,
      privateKey
    );

    return this.webApiService.post('Auth/validate', {
      username: username.toLowerCase().trim(),
      rememberMe: rememberMe,
      clientPublicEphemeral: clientEphemeral.public,
      clientSessionProof: sessionProof.proof,
    });
  }
}

export default SrpUtility;
