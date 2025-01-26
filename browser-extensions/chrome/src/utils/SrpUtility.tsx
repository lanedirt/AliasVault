import srp from 'secure-remote-password/client'
import { WebApiService } from './WebApiService';
import { LoginRequest, LoginResponse } from '../types/webapi/Login';
import { ValidateLoginRequest } from '../types/webapi/ValidateLogin';

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

  public async initiateLogin(username: string): Promise<LoginResponse> {
    return this.webApiService.post<LoginRequest, LoginResponse>('Auth/login', {
      username: username.toLowerCase().trim()
    });
  }

  public async validateLogin(
    username: string,
    passwordHashString: string,
    rememberMe: boolean,
    loginResponse: LoginResponse
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

    return this.webApiService.post<ValidateLoginRequest, ValidateLoginResponse>('Auth/validate', {
      username: username.toLowerCase().trim(),
      rememberMe: rememberMe,
      clientPublicEphemeral: clientEphemeral.public,
      clientSessionProof: sessionProof.proof,
    });
  }
}

export default SrpUtility;
