import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { sendMessage } from 'webext-bridge/popup';

import { useDb } from '@/entrypoints/popup/context/DbContext';

import { BIOMETRIC_ENABLED_KEY, VAULT_LOCKED_DISMISS_UNTIL_KEY } from '@/utils/Constants';
import EncryptionUtility from '@/utils/EncryptionUtility';
import PlatformUtility from '@/utils/PlatformUtility';
import SecureKeyStorage from '@/utils/SecureKeyStorage';
import WebAuthnUtility from '@/utils/WebAuthnUtility';

import { storage } from '#imports';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  initializeAuth: () => Promise<{ isLoggedIn: boolean }>;
  setAuthTokens: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  login: () => Promise<void>;
  logout: (errorMessage?: string) => Promise<void>;
  globalMessage: string | null;
  clearGlobalMessage: () => void;
  // Biometric authentication methods
  isBiometricsAvailable: () => Promise<boolean>;
  isBiometricsEnabled: () => Promise<boolean>;
  enableBiometrics: (password: string) => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<string | null>;
  getBiometricDisplayName: () => string;
  verifyPassword: (password: string) => Promise<boolean>;
}

/**
 * Auth context.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider to provide the authentication state to the app that components can use.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const dbContext = useDb();

  /**
   * Initialize the authentication state.
   *
   * @returns object containing whether the user is logged in.
   */
  const initializeAuth = useCallback(async () : Promise<{ isLoggedIn: boolean }> => {
    let isLoggedIn = false;

    const accessToken = await storage.getItem('local:accessToken') as string;
    const refreshToken = await storage.getItem('local:refreshToken') as string;
    const username = await storage.getItem('local:username') as string;
    if (accessToken && refreshToken && username) {
      setUsername(username);
      setIsLoggedIn(true);
      isLoggedIn = true;
    }
    setIsInitialized(true);

    return { isLoggedIn };
  }, [setUsername, setIsLoggedIn]);

  /**
   * Check for tokens in browser local storage on initial load when this context is mounted.
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Set auth tokens in browser local storage as part of the login process. After db is initialized, the login method should be called as well.
   */
  const setAuthTokens = useCallback(async (username: string, accessToken: string, refreshToken: string) : Promise<void> => {
    await storage.setItem('local:username', username);
    await storage.setItem('local:accessToken', accessToken);
    await storage.setItem('local:refreshToken', refreshToken);

    setUsername(username);
  }, []);

  /**
   * Set logged in status to true which refreshes the app.
   */
  const login = useCallback(async () : Promise<void> => {
    setIsLoggedIn(true);

    // Clear dismiss until (which can be enabled after user has dimissed vault is locked popup) to ensure popup is shown.
    await storage.setItem(VAULT_LOCKED_DISMISS_UNTIL_KEY, 0);
  }, []);

  /**
   * Logout the user and clear the auth tokens from chrome storage.
   */
  const logout = useCallback(async (errorMessage?: string) : Promise<void> => {
    await sendMessage('CLEAR_VAULT', {}, 'background');
    await storage.removeItems(['local:username', 'local:accessToken', 'local:refreshToken']);
    dbContext?.clearDatabase();

    // Set local storage global message that will be shown on the login page.
    if (errorMessage) {
      setGlobalMessage(errorMessage);
    }

    setUsername(null);
    setIsLoggedIn(false);
  }, [dbContext]);

  /**
   * Clear global message (called after displaying the message).
   */
  const clearGlobalMessage = useCallback(() : void => {
    setGlobalMessage(null);
  }, []);

  /**
   * Check if biometric authentication is available on the current device.
   */
  const isBiometricsAvailable = useCallback(async () : Promise<boolean> => {
    return await PlatformUtility.isBiometricAuthSupported();
  }, []);

  /**
   * Check if biometric authentication is enabled and properly configured.
   */
  const isBiometricsEnabled = useCallback(async () : Promise<boolean> => {
    const enabled = await storage.getItem(BIOMETRIC_ENABLED_KEY) as string;
    if (enabled !== 'true') {
      return false;
    }

    // Check if all required data exists for biometric authentication
    const username = await storage.getItem('local:username') as string;
    const accessToken = await storage.getItem('local:accessToken') as string;
    const refreshToken = await storage.getItem('local:refreshToken') as string;
    const credentialRegistered = await WebAuthnUtility.isCredentialRegistered();
    const masterKeyStored = await SecureKeyStorage.isMasterKeyStored();

    return !!(username && accessToken && refreshToken && credentialRegistered && masterKeyStored);
  }, []);

  /**
   * Enable biometric authentication.
   * This will register a WebAuthn credential and store the encryption key securely.
   * 
   * @param password The user's password for verification
   */
  const enableBiometrics = useCallback(async (password: string) : Promise<boolean> => {
    try {
      // Check if biometric authentication is available
      const available = await isBiometricsAvailable();
      if (!available) {
        return false;
      }

      // Check if the user is logged in
      if (!isLoggedIn || !username) {
        return false;
      }
      
      // Verify the password
      const isValid = await verifyPassword(password);
      if (!isValid) {
        return false;
      }

      // Get the encryption key from the database context
      const encryptionKey = await dbContext?.getEncryptionKey();
      if (!encryptionKey) {
        return false;
      }

      // Store the encryption key securely
      const success = await SecureKeyStorage.storeMasterKey(encryptionKey);
      if (!success) {
        return false;
      }

      // Set biometric authentication as enabled
      await storage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      return false;
    }
  }, [isLoggedIn, username, dbContext, isBiometricsAvailable]);

  /**
   * Disable biometric authentication.
   * This will remove the WebAuthn credential and the stored encryption key.
   */
  const disableBiometrics = useCallback(async () : Promise<boolean> => {
    try {
      // Remove the WebAuthn credential
      await WebAuthnUtility.removeCredential();

      // Remove the stored encryption key
      await SecureKeyStorage.removeMasterKey();

      // Set biometric authentication as disabled
      await storage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      return true;
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      return false;
    }
  }, []);

  /**
   * Authenticate with biometric authentication.
   * This will use the WebAuthn credential to authenticate and retrieve the encryption key.
   * 
   * @returns The encryption key if authentication was successful, null otherwise
   */
  const authenticateWithBiometrics = useCallback(async () : Promise<string | null> => {
    try {
      // Check if biometric authentication is enabled
      const enabled = await isBiometricsEnabled();
      if (!enabled) {
        return null;
      }

      // Check if a WebAuthn credential is registered
      const credentialRegistered = await WebAuthnUtility.isCredentialRegistered();
      if (!credentialRegistered) {
        return null;
      }

      // Authenticate with WebAuthn
      const authenticated = await WebAuthnUtility.authenticate();
      if (!authenticated) {
        return null;
      }

      // Retrieve the encryption key
      const encryptionKey = await SecureKeyStorage.retrieveMasterKey();
      return encryptionKey;
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return null;
    }
  }, [isBiometricsEnabled]);

  /**
   * Get the biometric display name.
   */
  const getBiometricDisplayName = useCallback(() : string => {
    return PlatformUtility.getBiometricDisplayName();
  }, []);
  
  /**
   * Verify the user's password.
   * 
   * @param password The password to verify
   * @returns True if the password is valid, false otherwise
   */
  const verifyPassword = useCallback(async (password: string) : Promise<boolean> => {
    try {
      // Check if the user is logged in
      if (!isLoggedIn || !username) {
        return false;
      }
      
      // Get the encryption key derivation parameters
      const params = await dbContext?.getEncryptionKeyDerivationParams();
      if (!params) {
        return false;
      }
      
      // Derive the key from the password
      const derivedKey = await EncryptionUtility.deriveKeyFromPassword(
        password,
        params.salt,
        params.encryptionType,
        params.encryptionSettings
      );
      
      // Convert to base64 for comparison
      const derivedKeyBase64 = Buffer.from(derivedKey).toString('base64');
      
      // Get the stored encryption key
      const storedKey = await dbContext?.getEncryptionKey();
      
      // Compare the keys
      return derivedKeyBase64 === storedKey;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }, [isLoggedIn, username, dbContext]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    isInitialized,
    username,
    initializeAuth,
    setAuthTokens,
    login,
    logout,
    globalMessage,
    clearGlobalMessage,
    isBiometricsAvailable,
    isBiometricsEnabled,
    enableBiometrics,
    disableBiometrics,
    authenticateWithBiometrics,
    getBiometricDisplayName,
    verifyPassword,
  }), [
    isLoggedIn, 
    isInitialized, 
    username, 
    initializeAuth, 
    globalMessage, 
    setAuthTokens, 
    login, 
    logout, 
    clearGlobalMessage,
    isBiometricsAvailable,
    isBiometricsEnabled,
    enableBiometrics,
    disableBiometrics,
    authenticateWithBiometrics,
    getBiometricDisplayName,
    verifyPassword
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the AuthContext
 */
export const useAuth = () : AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
