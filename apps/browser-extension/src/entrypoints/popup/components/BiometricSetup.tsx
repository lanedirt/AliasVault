import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/entrypoints/popup/components/Button';
import { BiometricIcon } from '@/entrypoints/popup/components/Icons/BiometricIcons';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';

import BiometricErrorHandler from '@/utils/BiometricErrorHandler';
import PlatformUtility from '@/utils/PlatformUtility';
import SecureKeyStorage from '@/utils/SecureKeyStorage';
import WebAuthnUtility from '@/utils/WebAuthnUtility';

/**
 * Component for setting up biometric authentication.
 */
const BiometricSetup: React.FC<{
  onSetupComplete: () => void;
  onCancel: () => void;
}> = ({ onSetupComplete, onCancel }) => {
  const { t } = useTranslation();
  const { username } = useAuth();
  const dbContext = useDb();
  const { showLoading, hideLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const biometricName = PlatformUtility.getBiometricDisplayName();

  /**
   * Handle the setup process.
   */
  const handleSetup = async (): Promise<void> => {
    setError(null);
    showLoading();

    try {
      // Check if WebAuthn is supported
      if (!WebAuthnUtility.isWebAuthnSupported()) {
        throw new Error(t('auth.errors.webauthnNotSupported'));
      }

      // Check if Touch ID is available
      const isTouchIDAvailable = await WebAuthnUtility.isTouchIDAvailable();
      if (!isTouchIDAvailable) {
        throw new Error(t('auth.errors.touchIdNotAvailable', { biometric: biometricName }));
      }

      // Register a new WebAuthn credential
      if (!username) {
        throw new Error(t('auth.errors.usernameRequired'));
      }

      const credentialId = await WebAuthnUtility.registerCredential(username);
      if (!credentialId) {
        throw new Error(t('auth.errors.credentialRegistrationFailed'));
      }

      // Get the encryption key from the auth context
      const encryptionKey = await SecureKeyStorage.retrieveMasterKey();
      if (!encryptionKey) {
        // This is the first time setting up, so we need to store the encryption key
        if (!dbContext) {
          throw new Error(t('auth.errors.databaseNotInitialized'));
        }

        const storedKey = await dbContext.getEncryptionKey();
        if (!storedKey) {
          throw new Error(t('auth.errors.encryptionKeyNotFound'));
        }

        // Store the encryption key securely
        const success = await SecureKeyStorage.storeMasterKey(storedKey);
        if (!success) {
          throw new Error(t('auth.errors.failedToStoreKey'));
        }
      }

      // Setup complete
      hideLoading();
      onSetupComplete();
    } catch (err) {
      hideLoading();
      setError(BiometricErrorHandler.getErrorMessage(err));
      
      // If the error is a user cancellation, don't show an error
      if (BiometricErrorHandler.isUserCancellation(err)) {
        setError(null);
      }
      
      // If the error indicates that biometric authentication is not available, show a specific error
      if (BiometricErrorHandler.isBiometricUnavailable(err)) {
        setError(t('auth.errors.biometricUnavailable', { biometric: biometricName }));
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
        {t('auth.setupBiometric', { biometric: biometricName })}
      </h2>
      
      {error && (
        <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center mb-6">
        <BiometricIcon size={64} className="text-orange-500 dark:text-orange-400 mb-4" />
        <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
          {t('auth.biometricSetupDescription', { biometric: biometricName })}
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
          {t('auth.biometricSetupSecurity', { biometric: biometricName })}
        </p>
      </div>
      
      <div className="flex flex-col w-full space-y-2">
        <Button onClick={handleSetup}>
          {t('auth.setupBiometricButton', { biometric: biometricName })}
        </Button>
        <Button onClick={onCancel} variant="secondary">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
};

export default BiometricSetup;
