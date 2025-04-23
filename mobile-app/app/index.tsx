import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useVaultSync } from '@/hooks/useVaultSync';
import { ThemedView } from '@/components/ThemedView';
import LoadingIndicator from '@/components/LoadingIndicator';
import { install } from 'react-native-quick-crypto';
import { NativeModules } from 'react-native';

export default function InitialLoadingScreen() {
  const { isInitialized: isAuthInitialized, isLoggedIn } = useAuth();
  const { dbInitialized, dbAvailable } = useDb();
  const { syncVault } = useVaultSync();
  const authContext = useAuth();
  const [status, setStatus] = useState('');
  const hasInitialized = useRef(false);

  // TODO: isauthinitialized and dbinitialize do not have to be checekd anymore separately.
  // Refactor this and check usages of isAuthInitialized and dbInitialized in other places.
  // Doing the check in this file once should be enough. Especially after adding the server
  // status check later which should fire periodically..
  const isFullyInitialized = isAuthInitialized && dbInitialized;
  const requireLoginOrUnlock = isFullyInitialized && (!isLoggedIn || !dbAvailable);

  // Install the react-native-quick-crypto library which is used by the EncryptionUtility
  // which acts as a drop-in replacement for the subtle crypto API.
  install();

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    async function initialize() {
      const { isLoggedIn, enabledAuthMethods } = await authContext.initializeAuth();

      // If user is not logged in, navigate to login immediately
      if (!isLoggedIn) {
        console.log('User not logged in, navigating to login');
        router.replace('/login');
        return;
      }

      // Perform initial vault sync
      console.log('Initial vault sync');
      await syncVault({
        initialSync: true,
        onStatus: (message) => {
          setStatus(message);
        }
      });

      // Try to unlock with FaceID
      try {
        // This will check if the encrypted database file exists locally.
        // TODO: this isvaultinitialized should be renamed to "isVaultExists" or something similar
        // as we're just checking if the file exists.
        const isInitialized = await NativeModules.CredentialManager.isVaultInitialized();
        if (isInitialized) {
          const isFaceIDEnabled = enabledAuthMethods.includes('faceid');
          if (!isFaceIDEnabled) {
            console.log('FaceID is not enabled, navigating to unlock screen');
            router.replace('/unlock');
            return;
          }

          // Attempt to unlock the vault with FaceID.
          setStatus('Unlocking vault|');
          const isUnlocked = await NativeModules.CredentialManager.unlockVault();
          if (isUnlocked) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStatus('Decrypting vault');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('FaceID unlock successful, navigating to credentials');
            router.replace('/(tabs)/(credentials)');
            return;
          }
          else {
            console.log('FaceID unlock failed, navigating to unlock screen');
            router.replace('/unlock');
          }
        }
        else {
          // Vault is not initialized which means the database does not exist or decryption key is missing
          // from device's keychain. Navigate to the unlock screen.
          console.log('Vault is not initialized (db file does not exist), navigating to unlock screen');
          router.replace('/unlock');
          return;
        }
      } catch (error) {
        console.log('FaceID unlock failed:', error);
        // If FaceID fails (too many attempts, manual cancel, etc.)
        // navigate to unlock screen
        router.replace('/unlock');
        return;
      }

      // If we get here, something went wrong with the FaceID unlock
      // Navigate to unlock screen as a fallback
      console.log('FaceID unlock failed, navigating to unlock screen');
      router.replace('/unlock');
    }

    initialize();
  }, [isFullyInitialized, requireLoginOrUnlock, syncVault]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {(isLoggedIn && status) ? <LoadingIndicator status={status} /> : null}
    </ThemedView>
  );
}