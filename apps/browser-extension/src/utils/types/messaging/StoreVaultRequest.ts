export type StoreVaultRequest = {
  vaultBlob: string;
  derivedKey?: string;
  publicEmailDomainList?: string[];
  privateEmailDomainList?: string[];
  vaultRevisionNumber?: number;
}
