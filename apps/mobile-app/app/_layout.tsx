import { Linking, StyleSheet } from 'react-native';
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
     * Initialize the app.
     */
    const initialize = async () : Promise<void> => {
      const { isLoggedIn, enabledAuthMethods } = await initializeAuth();

      if (!isLoggedIn) {
        setRedirectTarget('/login');
        setBootComplete(true);
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
          await new Promise(resolve => setTimeout(resolve, 1000));
          setStatus('Decrypting vault');
          await new Promise(resolve => setTimeout(resolve, 1000));
          // The vault is successfully unlocked, so we let the native code handle the default routing.
        } else {
          setRedirectTarget('/unlock');
        }
      } else {
        setRedirectTarget('/unlock');
      }

      setBootComplete(true);
    };

    initialize();
  }, [dbContext, syncVault, initializeAuth]);

  useEffect(() => {
    /**
     * Simulate stack navigation.
     */
    function simulateStackNavigation(from: string, to: string) : void {
      router.replace(from as Href);
      setTimeout(() => {
        router.push(to as Href);
      }, 0);
    }

    /**
     * Redirect to the target if we have one, otherwise check for a deep link and simulate stack navigation.
     */
    const redirect = async () : Promise<void> => {
      if (bootComplete && redirectTarget) {
        // If we have an explicit redirect target, we navigate to it. This overrides potential deep link handling.
        router.replace(redirectTarget as Href);
      } else if (bootComplete) {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          /**
           * Check for certain deep link routes, and if found, ensure we simulate the stack navigation
           * as otherwise the "back" button for navigation will not work as expected.
           */
          const path = initialUrl.replace('net.aliasvault.app://', '');
          const isDetailRoute = path.includes('credentials/');
          if (isDetailRoute) {
            simulateStackNavigation('/(tabs)/credentials', path);
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
