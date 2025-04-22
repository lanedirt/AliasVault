import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useVaultSync } from '@/hooks/useVaultSync';
import { ThemedView } from '@/components/ThemedView';
import LoadingIndicator from '@/components/LoadingIndicator';
import { install } from 'react-native-quick-crypto';

export default function InitialLoadingScreen() {
  const { isInitialized: isAuthInitialized, isLoggedIn } = useAuth();
  const { dbInitialized, dbAvailable } = useDb();
  const { syncVault } = useVaultSync();
  const hasInitialized = useRef(false);
  const [status, setStatus] = useState('');

  const isFullyInitialized = isAuthInitialized && dbInitialized;
  const requireLoginOrUnlock = isFullyInitialized && (!isLoggedIn || !dbAvailable);

  // Install the react-native-quick-crypto library which is used by the EncryptionUtility
  // which acts as a drop-in replacement for the subtle crypto API.
  install();

  useEffect(() => {
    async function initialize() {
      if (hasInitialized.current) {
        return;
      }

      hasInitialized.current = true;

      // Perform initial vault sync
      console.log('Initial vault sync');
      await syncVault({
        initialSync: true,
        onStatus: (message) => {
          setStatus(message);
        }
      });

      // Navigate to appropriate screen
      if (requireLoginOrUnlock) {
        console.log('Navigating to login');
        router.replace('/login');
      } else {
        console.log('Navigating to credentials');
        router.replace('/(tabs)/(credentials)');
      }
    }

    initialize();
  }, [isFullyInitialized, requireLoginOrUnlock, syncVault]); // Keep all dependencies to satisfy ESLint

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoggedIn && status ? <LoadingIndicator status={status} /> : null}
    </ThemedView>
  );
}