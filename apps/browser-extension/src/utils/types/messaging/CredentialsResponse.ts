import type { Credential } from "@/utils/dist/shared/models/vault";

export type CredentialsResponse = {
    success: boolean,
    error?: string,
    credentials?: Credential[]
};
