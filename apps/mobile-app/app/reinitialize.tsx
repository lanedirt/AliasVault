import { useEffect, useRef, useState } from 'react';
import { Href, router } from 'expo-router';
import { StyleSheet, View, Alert } from 'react-native';

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
     * Redirect to the return URL.
     */
    function redirectToReturnUrl() : void {
      /**
       * Simulate stack navigation.
       */
      function simulateStackNavigation(from: string, to: string) : void {
        router.replace(from as Href);
        setTimeout(() => {
          router.push(to as Href);
        }, 0);
      }

      if (authContext.returnUrl?.path) {
        // Type assertion needed due to router type limitations
        const path = authContext.returnUrl.path as '/';
        const isDetailRoute = path.includes('credentials/');
        if (isDetailRoute) {
          // If there is a "serviceUrl" or "id" param from the return URL, use it.
          const params = authContext.returnUrl.params as Record<string, string>;

          if (params.serviceUrl) {
            simulateStackNavigation('/(tabs)/credentials', path + '?serviceUrl=' + params.serviceUrl);
          } else if (params.id) {
            simulateStackNavigation('/(tabs)/credentials', path + '?id=' + params.id);
          } else {
            simulateStackNavigation('/(tabs)/credentials', path);
          }
        } else {
          router.replace({
            pathname: path,
            params: authContext.returnUrl.params as Record<string, string>
          });
        }
        // Clear the return URL after using it
        authContext.setReturnUrl(null);
      } else {
        // If there is no return URL, navigate to the credentials tab as default entry page.
        router.replace('/(tabs)/credentials');
      }
    }

    /**
     * Handle vault unlocking process.
     */
    async function handleVaultUnlock() : Promise<void> {
      const { enabledAuthMethods } = await authContext.initializeAuth();

      try {
        const hasEncryptedDatabase = await NativeVaultManager.hasEncryptedDatabase();
        if (hasEncryptedDatabase) {
          const isFaceIDEnabled = enabledAuthMethods.includes('faceid');
          if (!isFaceIDEnabled) {
            router.replace('/unlock');
            return;
          }

          setStatus('Unlocking vault');
          const isUnlocked = await dbContext.unlockVault();
          if (isUnlocked) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStatus('Decrypting vault');
            await new Promise(resolve => setTimeout(resolve, 1000));
            redirectToReturnUrl();
            return;
          }
        }

        router.replace('/unlock');
      } catch {
        router.replace('/unlock');
      }
    }

    /**
     * Initialize the app.
     */
    const initialize = async () : Promise<void> => {
      const { isLoggedIn } = await authContext.initializeAuth();

      // If user is not logged in, navigate to login immediately
      if (!isLoggedIn) {
        router.replace('/login');
        return;
      }

      // First perform vault sync
      await syncVault({
        initialSync: true,
        /**
         * Handle the status update.
         */
        onStatus: (message) => {
          setStatus(message);
        },
        /**
         * Handle successful vault sync and continue with vault unlock flow.
         */
        onSuccess: async () => {
          await handleVaultUnlock();
        },
        /**
         * Handle offline state and prompt user for action.
         */
        onOffline: () => {
          Alert.alert(
            'Sync Issue',
            'The AliasVault server could not be reached and the vault could not be synced. Would you like to open your local vault in read-only mode or retry the connection?',
            [
              {
                text: 'Open Local Vault',
                /**
                 * Handle opening vault in read-only mode.
                 */
                onPress: async () : Promise<void> => {
                  setStatus('Opening vault in read-only mode');
                  await handleVaultUnlock();
                }
              },
              {
                text: 'Retry Sync',
                /**
                 * Handle retrying the connection.
                 */
                onPress: () : void => {
                  setStatus('Retrying connection...');
                  initialize();
                }
              }
            ]
          );
        }
      });
    };

    initialize();
  }, [syncVault, authContext, dbContext]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    message: {
      marginTop: 5,
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
        <ThemedText style={styles.message}>Vault auto-locked after timeout. Attempting to unlock...</ThemedText>
        {status ? <LoadingIndicator status={status} /> : null}
      </View>
    </ThemedView>
  );
}
