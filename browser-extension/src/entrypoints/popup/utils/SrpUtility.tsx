import srp from 'secure-remote-password/client'
import { WebApiService } from '../../../utils/WebApiService';
import { LoginRequest, LoginResponse } from '../../../utils/types/webapi/Login';
import { ValidateLoginRequest, ValidateLoginRequest2Fa, ValidateLoginResponse } from '../../../utils/types/webapi/ValidateLogin';

/**
 * Utility class for SRP authentication operations.
 */
class SrpUtility {
  private readonly webApiService: WebApiService;

  /**
   * Constructor for the SrpUtility class.
   *
   * @param {WebApiService} webApiService - The WebApiService instance.
   */
  public constructor(webApiService: WebApiService) {
    this.webApiService = webApiService;
  }

  /**
   * Initiate login with server.
   */
  public async initiateLogin(username: string): Promise<LoginResponse> {
    return this.webApiService.post<LoginRequest, LoginResponse>('Auth/login', {
      username: username.toLowerCase().trim()
    });
  }

  /**
   * Validate login with server using locally generated ephemeral and session proof.
   */
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

  /**
   * Validate login with 2FA with server using locally generated ephemeral and session proof.
   */
  public async validateLogin2Fa(
    username: string,
    passwordHashString: string,
    rememberMe: boolean,
    loginResponse: LoginResponse,
    code2Fa: number
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

    return this.webApiService.post<ValidateLoginRequest2Fa, ValidateLoginResponse>('Auth/validate-2fa', {
      username: username.toLowerCase().trim(),
      rememberMe: rememberMe,
      clientPublicEphemeral: clientEphemeral.public,
      clientSessionProof: sessionProof.proof,
      code2Fa: code2Fa,
    });
  }
}

export default SrpUtility;
