export interface ValidateLoginRequest {
    username: string;
    rememberMe: boolean;
    clientPublicEphemeral: string;
    clientSessionProof: string;
}

export interface ValidateLoginResponse {
    requiresTwoFactor: boolean;
    token?: {
      token: string;
      refreshToken: string;
    };
    serverSessionProof: string;
  }