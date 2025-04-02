import srp from 'secure-remote-password/client'
import { WebApiService } from '../../../utils/WebApiService';
import { LoginRequest, LoginResponse } from '../../../utils/types/webapi/Login';
import { ValidateLoginRequest, ValidateLoginRequest2Fa, ValidateLoginResponse } from '../../../utils/types/webapi/ValidateLogin';
import BadRequestResponse from '@/utils/types/webapi/BadRequestResponse';
import { ApiAuthError } from '../../../utils/types/errors/ApiAuthError';

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
    const model: LoginRequest = {
      username: username.toLowerCase().trim(),
    };

    const response = await this.webApiService.rawFetch('Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });

    // Check if response is a bad request (400)
    if (response.status === 400) {
      const badRequestResponse = await response.json() as BadRequestResponse;
      throw new ApiAuthError(badRequestResponse.title);
    }

    // For other responses, try to parse as LoginResponse
    const loginResponse = await response.json() as LoginResponse;
    return loginResponse;
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

    const model: ValidateLoginRequest = {
      username: username.toLowerCase().trim(),
      rememberMe: rememberMe,
      clientPublicEphemeral: clientEphemeral.public,
      clientSessionProof: sessionProof.proof,
    };

    const response = await this.webApiService.rawFetch('Auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });

    // Check if response is a bad request (400)
    if (response.status === 400) {
      const badRequestResponse = await response.json() as BadRequestResponse;
      throw new ApiAuthError(badRequestResponse.title);
    }

    // For other responses, try to parse as ValidateLoginResponse
    const validateLoginResponse = await response.json() as ValidateLoginResponse;
    return validateLoginResponse;
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
    const model: ValidateLoginRequest2Fa = {
      username: username.toLowerCase().trim(),
      rememberMe,
      clientPublicEphemeral: clientEphemeral.public,
      clientSessionProof: sessionProof.proof,
      code2Fa,
    };

    const response = await this.webApiService.rawFetch('Auth/validate-2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });

    // Check if response is a bad request (400)
    if (response.status === 400) {
      const badRequestResponse = await response.json() as BadRequestResponse;
      throw new ApiAuthError(badRequestResponse.title);
    }

    // For other responses, try to parse as ValidateLoginResponse
    const validateLoginResponse = await response.json() as ValidateLoginResponse;
    return validateLoginResponse;
  }
}

export default SrpUtility;
