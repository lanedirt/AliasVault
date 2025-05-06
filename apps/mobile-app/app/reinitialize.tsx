import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import NativeVaultManager from '@/specs/NativeVaultManager';
import { useAuth } from '@/context/AuthContext';
import { useVaultSync } from '@/hooks/useVaultSync';
import { ThemedView } from '@/components/themed/ThemedView';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDb } from '@/context/DbContext';
import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';

/**
 * Reinitialize screen which is triggered when the app was still open but the database in memory
 * was cleared because of a time-out. When this happens, we need to re-initialize and unlock the vault.
 */
export default function ReinitializeScreen() : React.ReactNode {
  const authContext = useAuth();
  const dbContext = useDb();
  const { syncVault } = useVaultSync();
  const [status, setStatus] = useState('');
  const hasInitialized = useRef(false);
  const colors = useColors();

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    /**
     * Initialize the app.
     */
    const initialize = async () : Promise<void> => {
      const { isLoggedIn, enabledAuthMethods } = await authContext.initializeAuth();

      // If user is not logged in, navigate to login immediately
      if (!isLoggedIn) {
        router.replace('/login');
        return;
      }

      // Perform initial vault sync
      await syncVault({
        initialSync: true,
        /**
         * Handle the status update.
         */
        onStatus: (message) => {
          setStatus(message);
        }
      });

      // Try to unlock with FaceID
      try {
        const hasEncryptedDatabase = await NativeVaultManager.hasEncryptedDatabase();
        if (hasEncryptedDatabase) {
          const isFaceIDEnabled = enabledAuthMethods.includes('faceid');
          if (!isFaceIDEnabled) {
            router.replace('/unlock');
            return;
          }

          // Attempt to unlock the vault with FaceID.
          setStatus('Unlocking vault');
          const isUnlocked = await dbContext.unlockVault();
          if (isUnlocked) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStatus('Decrypting vault');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate to credentials
            router.replace('/(tabs)/credentials');

            return;
          } else {
            router.replace('/unlock');
          }
        } else {
          /*
           * Vault is not initialized which means the database does not exist or decryption key is missing
           * from device's keychain. Navigate to the unlock screen.
           */
          router.replace('/unlock');
          return;
        }
      } catch {
        /*
         * If FaceID fails (too many attempts, manual cancel, etc.)
         * navigate to unlock screen
         */
        router.replace('/unlock');
        return;
      }

      /*
       * If we get here, something went wrong with the FaceID unlock
       * Navigate to unlock screen as a fallback
       */
      router.replace('/unlock');
    }

    initialize();
  }, [syncVault, authContext, dbContext]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    message: {
      textAlign: 'center',
    },
    messageContainer: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      padding: 20,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.messageContainer}>
        <ThemedText style={styles.message}>Vault locked due to time-out, unlocking vault again...</ThemedText>
        {status ? <LoadingIndicator status={status} /> : null}
      </View>
    </ThemedView>
  );
}
