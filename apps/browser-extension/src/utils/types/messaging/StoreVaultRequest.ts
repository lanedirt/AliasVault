export type StoreVaultRequest = {
  vaultBlob: string;
  publicEmailDomainList?: string[];
  privateEmailDomainList?: string[];
  vaultRevisionNumber?: number;
}
