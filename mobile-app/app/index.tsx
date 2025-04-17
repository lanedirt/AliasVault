import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useVaultSync } from '@/hooks/useVaultSync';
import { ThemedView } from '@/components/ThemedView';

export default function InitialLoadingScreen() {
  const { isInitialized: isAuthInitialized, isLoggedIn } = useAuth();
  const { dbInitialized, dbAvailable } = useDb();
  const { syncVault } = useVaultSync();
  const hasInitialized = useRef(false);

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
      await syncVault({ forceCheck: true });

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
      <ActivityIndicator size="large" color="#f97316" />
    </ThemedView>
  );
}