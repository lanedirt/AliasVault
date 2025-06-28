export type IdentitySettingsResponse = {
    success: boolean,
    error?: string,
    settings?: {
        language: string,
        gender: string
    }
};
