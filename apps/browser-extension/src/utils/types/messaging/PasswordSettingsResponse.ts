import type { PasswordSettings } from "@/utils/shared/models/vault";

export type PasswordSettingsResponse = {
    success: boolean,
    error?: string,
    settings?: PasswordSettings
};
