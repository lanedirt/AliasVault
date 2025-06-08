import type { Credential } from "@/utils/shared/models/vault";

export type CredentialsResponse = {
    success: boolean,
    error?: string,
    credentials?: Credential[]
};
