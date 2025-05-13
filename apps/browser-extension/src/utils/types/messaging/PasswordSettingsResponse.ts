import { PasswordSettings } from "@/utils/types/PasswordSettings";

export type PasswordSettingsResponse = {
    success: boolean,
    error?: string,
    settings?: PasswordSettings
};
