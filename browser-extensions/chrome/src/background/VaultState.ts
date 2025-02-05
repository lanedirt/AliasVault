/**
 * Vault state.
 */
type VaultState = {
    derivedKey: string | null;
    publicEmailDomains: string[];
    privateEmailDomains: string[];
    vaultRevisionNumber: number;
}

/**
 * Initial vault state.
 */
export const initialVaultState: VaultState = {
  derivedKey: null,
  publicEmailDomains: [],
  privateEmailDomains: [],
  vaultRevisionNumber: 0,
};

export type { VaultState };