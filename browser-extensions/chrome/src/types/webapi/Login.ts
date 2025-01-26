export type LoginRequest = {
    username: string;
}

export type LoginResponse = {
    salt: string;
    serverEphemeral: string;
    encryptionType: string;
    encryptionSettings: string;
}
