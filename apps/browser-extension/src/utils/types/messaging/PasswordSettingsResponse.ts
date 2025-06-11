import type { PasswordSettings } from "@/utils/dist/shared/models/vault";

export type PasswordSettingsResponse = {
    success: boolean,
    error?: string,
    settings?: PasswordSettings
};
