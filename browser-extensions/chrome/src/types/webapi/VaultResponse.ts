export type Vault = {
    blob: string;
    createdAt: string;
    credentialsCount: number;
    currentRevisionNumber: number;
    emailAddressList: string[];
    encryptionPublicKey: string;
    updatedAt: string;
    username: string;
    version: string;
  }

export type VaultResponse = {
    status: number;
    vault: Vault;
  }