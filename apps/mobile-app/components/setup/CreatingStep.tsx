import { Buffer } from 'buffer';
import srp from 'secure-remote-password/client';

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView
} from 'react-native';

import { useApiUrl } from '@/utils/ApiUrlUtility';
import ConversionUtility from '@/utils/ConversionUtility';
import type { EncryptionKeyDerivationParams } from '@/utils/dist/shared/models/metadata';
import type { VaultResponse } from '@/utils/dist/shared/models/webapi';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ApiAuthError } from '@/utils/types/errors/ApiAuthError';

import { useColors } from '@/hooks/useColorScheme';

import LoadingIndicator from '@/components/LoadingIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';

type SetupData = {
  agreedToTerms: boolean;
  username: string;
  password: string;
  confirmPassword: string;
}

type CreatingStepProps = {
  setupData: SetupData;
  onComplete: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

type RegisterRequest = {
  username: string;
  salt: string;
  verifier: string;
  encryptionType: string;
  encryptionSettings: string;
}

type TokenResponse = {
  token: string;
  refreshToken: string;
}

/**
 * Fourth step of setup: Account creation process
 */
export default function CreatingStep({
  setupData,
  onComplete,
  error,
  setError
}: CreatingStepProps): React.ReactNode {
  const colors = useColors();
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const { loadApiUrl } = useApiUrl();
  const [status, setStatus] = useState<string>('Preparing account creation...');
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Create user account using SRP protocol and AliasVault registration API
   */
  const createAccount = async (): Promise<void> => {
    if (isCreating) {
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      await loadApiUrl();
      
      setStatus('Generating encryption parameters...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 1: Generate SRP salt
      const srpSalt = srp.generateSalt();
      
      // Step 2: Set up encryption parameters (matching server defaults)
      const encryptionType = 'Argon2Id';
      const encryptionSettings = JSON.stringify({
        DegreeOfParallelism: 1,
        MemorySize: 19456,
        Iterations: 2
      });

      setStatus('Deriving encryption key...');
      
      // Step 3: Derive password hash using the same parameters the server would use
      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        setupData.password,
        srpSalt,
        encryptionType,
        encryptionSettings
      );

      const passwordHashString = Buffer.from(passwordHash).toString('hex').toUpperCase();
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      setStatus('Generating secure credentials...');
      
      // Step 4: Generate SRP verifier
      const normalizedUsername = ConversionUtility.normalizeUsername(setupData.username);
      const privateKey = srp.derivePrivateKey(srpSalt, normalizedUsername, passwordHashString);
      const verifier = srp.deriveVerifier(privateKey);

      setStatus('Creating account...');
      
      // Step 5: Register user with server
      const registrationRequest: RegisterRequest = {
        username: normalizedUsername,
        salt: srpSalt,
        verifier: verifier,
        encryptionType: encryptionType,
        encryptionSettings: encryptionSettings,
      };

      const response = await webApi.rawFetch('Auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationRequest),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new ApiAuthError(errorData.title || 'Registration failed');
        }
        throw new ApiAuthError('Registration failed. Please try again.');
      }

      const tokenResponse = await response.json() as TokenResponse;

      if (tokenResponse.token == null || tokenResponse.refreshToken == null) {
        throw new Error('Registration succeeded but no tokens returned');
      }

      setStatus('Setting up your vault...');
      
      // Step 6: Set up authentication and encryption
      const encryptionKeyDerivationParams: EncryptionKeyDerivationParams = {
        encryptionType: encryptionType,
        encryptionSettings: encryptionSettings,
        salt: srpSalt,
      };

      // Store authentication tokens and encryption key
      await authContext.setAuthTokens(
        normalizedUsername, 
        tokenResponse.token, 
        tokenResponse.refreshToken
      );
      await dbContext.storeEncryptionKey(passwordHashBase64);
      await dbContext.storeEncryptionKeyDerivationParams(encryptionKeyDerivationParams);

      setStatus('Initializing vault...');
      
      // Step 7: Get vault from server and initialize local database
      const vaultResponse = await webApi.authFetch<VaultResponse>('Vault', { 
        method: 'GET', 
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`
        } 
      });

      const vaultError = webApi.validateVaultResponse(vaultResponse);
      if (vaultError) {
        throw new Error(vaultError);
      }

      await dbContext.initializeDatabase(vaultResponse);

      setStatus('Finalizing setup...');
      
      // Step 8: Complete authentication setup
      await authContext.login();
      authContext.setOfflineMode(false);
      
      setStatus('Account created successfully!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();

    } catch (err) {
      console.error('Account creation error:', err);
      if (err instanceof ApiAuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during account creation. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Start account creation when component mounts
  useEffect((): void => {
    createAccount();
  }, [createAccount]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorContainer: {
      backgroundColor: colors.errorBackground,
      borderColor: colors.errorBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 20,
      marginTop: 20,
      padding: 16,
      width: '100%',
    },
    errorText: {
      color: colors.errorText,
      fontSize: 14,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 32,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Creating Your Account</Text>
        <Text style={styles.subtitle}>
          Please wait while we set up your secure AliasVault account. This may take a few moments.
        </Text>

        <LoadingIndicator status={status} />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}