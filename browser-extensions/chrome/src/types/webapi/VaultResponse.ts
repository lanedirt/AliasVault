export interface Vault {
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

  export interface VaultResponse {
    status: number;
    vault: Vault;
  }