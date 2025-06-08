/**
 * Vault type.
 */
type Vault = {
    blob: string;
    createdAt: string;
    credentialsCount: number;
    currentRevisionNumber: number;
    emailAddressList: string[];
    privateEmailDomainList: string[];
    publicEmailDomainList: string[];
    encryptionPublicKey: string;
    updatedAt: string;
    username: string;
    version: string;
    client: string;
};

/**
 * Vault response type.
 */
type VaultResponse = {
    status: number;
    vault: Vault;
};

export type { VaultResponse };
