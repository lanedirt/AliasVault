/**
 * Vault state.
 */
type VaultState = {
    derivedKey: string | null;
}

/**
 * Initial vault state.
 */
export const initialVaultState: VaultState = {
  derivedKey: null,
};

export type { VaultState };