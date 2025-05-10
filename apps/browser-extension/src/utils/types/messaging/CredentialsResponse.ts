import { Credential } from "../Credential";

export type CredentialsResponse = {
    success: boolean,
    error?: string,
    credentials?: Credential[]
};
