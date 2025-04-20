import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useVaultSync } from '@/hooks/useVaultSync';
import { ThemedView } from '@/components/ThemedView';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function InitialLoadingScreen() {
  const { isInitialized: isAuthInitialized, isLoggedIn } = useAuth();
  const { dbInitialized, dbAvailable } = useDb();
  const { syncVault } = useVaultSync();
  const hasInitialized = useRef(false);
  const [status, setStatus] = useState('');

  const isFullyInitialized = isAuthInitialized && dbInitialized;
  const requireLoginOrUnlock = isFullyInitialized && (!isLoggedIn || !dbAvailable);

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