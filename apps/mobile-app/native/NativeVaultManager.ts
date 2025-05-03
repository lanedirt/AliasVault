import { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Basic credential operations
  getCredentials(): Promise<{ credentials: Array<{ username: string; password: string; service: string }> }>;
  clearVault(): Promise<void>;

  // Vault state management
  hasStoredVault(): Promise<boolean>;
  isVaultUnlocked(): Promise<boolean>;
  getVaultMetadata(): Promise<any>;
  unlockVault(): Promise<boolean>;

  // Database operations
  storeDatabase(base64EncryptedDb: string, metadata: string): Promise<void>;
  setAuthMethods(authMethods: string[]): Promise<void>;
  storeEncryptionKey(base64EncryptionKey: string): Promise<void>;
  getEncryptedDatabase(): Promise<string | null>;
  getCurrentVaultRevisionNumber(): Promise<number>;
  setCurrentVaultRevisionNumber(revisionNumber: number): Promise<void>;

  // SQL operations
  executeQuery(query: string, params: any[]): Promise<any[]>;
  executeUpdate(query: string, params: any[]): Promise<number>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;

  // Auto-lock settings
  setAutoLockTimeout(timeout: number): Promise<void>;
  getAutoLockTimeout(): Promise<number>;
  getAuthMethods(): Promise<string[]>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeVaultManager');