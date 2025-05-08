import { Linking, StyleSheet, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Href, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import 'react-native-get-random-values';
import { install } from 'react-native-quick-crypto';

import { useColors, useColorScheme } from '@/hooks/useColorScheme';
import { DbProvider, useDb } from '@/context/DbContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';
import { AliasVaultToast } from '@/components/Toast';
import NativeVaultManager from '@/specs/NativeVaultManager';
import { useVaultSync } from '@/hooks/useVaultSync';
import SpaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';
import LoadingIndicator from '@/components/LoadingIndicator';
import { ThemedView } from '@/components/themed/ThemedView';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout navigation.
 */
function RootLayoutNav() : React.ReactNode {
  const colorScheme = useColorScheme();
  const colors = useColors();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const { initializeAuth } = useAuth();
  const { syncVault } = useVaultSync();
  const dbContext = useDb();

  const [bootComplete, setBootComplete] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const hasBooted = useRef(false);

  useEffect(() => {
    if (hasBooted.current) {
      return;
    }

    // Install the react-native-quick-crypto library which is used by the EncryptionUtility
    install();

    hasBooted.current = true;

    /**
     * Handle vault unlocking process.
     */
    async function handleVaultUnlock() : Promise<void> {
      const { enabledAuthMethods } = await initializeAuth();

      try {
        const hasEncryptedDatabase = await NativeVaultManager.hasEncryptedDatabase();
        if (hasEncryptedDatabase) {
          const isFaceIDEnabled = enabledAuthMethods.includes('faceid');
          if (!isFaceIDEnabled) {
            setRedirectTarget('/unlock');
            setBootComplete(true);
            return;
          }

          setStatus('Unlocking vault');
          const isUnlocked = await dbContext.unlockVault();
          if (isUnlocked) {
            await new Promise(resolve => setTimeout(resolve, 750));
            setStatus('Decrypting vault');
            await new Promise(resolve => setTimeout(resolve, 750));
            setBootComplete(true);
            return;
          }

          setRedirectTarget('/unlock');
          setBootComplete(true);
          return;
        } else {
          setRedirectTarget('/unlock');
          setBootComplete(true);
          return;
        }
      } catch {
        setRedirectTarget('/unlock');
        setBootComplete(true);
        return;
      }
    }

    /**
     * Initialize the app.
     */
    const initialize = async () : Promise<void> => {
      const { isLoggedIn } = await initializeAuth();

      if (!isLoggedIn) {
        setRedirectTarget('/login');
        setBootComplete(true);
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
          // Continue with the rest of the flow after successful sync
          handleVaultUnlock();
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
                  handleVaultUnlock();
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
        },
        /**
         * Handle error during vault sync.
         */
        onError: () => {
          // Navigate to the manual unlock screen.
          setRedirectTarget('/unlock');
          setBootComplete(true);
        }
      });
    };

    initialize();
  }, [dbContext, syncVault, initializeAuth]);

  useEffect(() => {
    /**
     * Redirect to a explicit target page if we have one (in case of non-happy path).
     * Otherwise check for a deep link and simulate stack navigation.
     * If neither is present, we let the router redirect us to the default route.
     */
    const redirect = async () : Promise<void> => {
      if (!bootComplete) {
        return;
      }

      if (redirectTarget) {
        // If we have an explicit redirect target, we navigate to it. This overrides potential deep link handling.
        router.replace(redirectTarget as Href);
      } else {
        // Check if we have an initial URL to handle (deep link from most likely the autofill extension).
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          /**
           * Check for certain supported deep link routes, and if found, ensure we simulate the stack navigation
           * as otherwise the "back" button for navigation will not work as expected.
           */
          const path = initialUrl.replace('net.aliasvault.app://', '');
          const isDetailRoute = path.includes('credentials/');
          if (isDetailRoute) {
            // First go to the credentials tab.
            router.replace('/(tabs)/credentials');

            // Then push the target route inside the credentials tab.
            setTimeout(() => {
              router.push(path as Href);
            }, 0);
          }
        }
      }
    };

    redirect();
  }, [bootComplete, redirectTarget, router]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
  });

  if (!bootComplete) {
    return (
      <ThemedView style={styles.container}>
        {status ? <LoadingIndicator status={status} /> : null}
      </ThemedView>
    );
  }

  const customDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customDefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: true,
          animation: 'none',
          headerTransparent: true,
          headerStyle: {
            backgroundColor: colors.accentBackground,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="login-settings" options={{ title: 'Login Settings' }} />
        <Stack.Screen name="reinitialize" options={{ headerShown: false }} />
        <Stack.Screen name="unlock" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
      <AliasVaultToast />
    </ThemeProvider>
  );
}

/**
 * Root layout.
 */
export default function RootLayout() : React.ReactNode {
  const [loaded] = useFonts({
    SpaceMono: SpaceMono,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <DbProvider>
      <AuthProvider>
        <WebApiProvider>
          <RootLayoutNav />
        </WebApiProvider>
      </AuthProvider>
    </DbProvider>
  );
}
