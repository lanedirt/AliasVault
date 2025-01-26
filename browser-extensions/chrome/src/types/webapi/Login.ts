export interface LoginRequest {
    username: string;
}

export interface LoginResponse {
    salt: string;
    serverEphemeral: string;
    encryptionType: string;
    encryptionSettings: string;
}
