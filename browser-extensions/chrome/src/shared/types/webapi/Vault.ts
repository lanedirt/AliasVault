/**
 * Vault type.
 */
export type Vault = {
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
}