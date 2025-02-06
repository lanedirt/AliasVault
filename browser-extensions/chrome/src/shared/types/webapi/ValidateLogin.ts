export type ValidateLoginRequest = {
    username: string;
    rememberMe: boolean;
    clientPublicEphemeral: string;
    clientSessionProof: string;
}

export type ValidateLoginResponse = {
    requiresTwoFactor: boolean;
    token?: {
      token: string;
      refreshToken: string;
    };
    serverSessionProof: string;
  }