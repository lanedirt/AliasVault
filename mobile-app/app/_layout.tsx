import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';
// Required for certain modules such as secure-remote-password which relies on crypto.getRandomValues
// and this is not available in react-native without this polyfill
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LoadingProvider } from '@/context/LoadingContext';
import { DbProvider } from '@/context/DbContext';
import { AuthProvider } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';
import { View, ActivityIndicator, Text } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure toast styling
const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        backgroundColor: '#f97316', // AliasVault orange
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
        {props.text1}
      </Text>
    </View>
  ),
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const isFirstMount = useRef(true);

  // Check if user is authenticated and database is available
  const isFullyInitialized = authContext.isInitialized && dbContext.dbInitialized;
  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;
  const requireLoginOrUnlock = isFullyInitialized && (!isAuthenticated || !isDatabaseAvailable);

  /**
   * Check for vault updates and fetch if necessary
   */
  const checkVaultUpdates = useCallback(async (isStartup: boolean = false) => {
    const isLoggedIn = await authContext.initializeAuth();

    if (!isLoggedIn) {
      console.log('Start check vault update: Not authenticated');
      return;
    }

    // TODO: add check to know if the encryption key is available in the keychain
    // If not, we should redirect to the unlock screen.
    // Or do this check in the "isLoggedIn" check above?
    const passwordHashBase64 = await AsyncStorage.getItem('passwordHash');
    if (!passwordHashBase64) {
      //console.log('Vault check error: Password hash not found');
      //await webApi.logout('Password hash not found');
      //rreturn;
    }

    console.log('Start check vault updates');

    try {
      // On startup, always check. Otherwise, check the time elapsed
      if (!isStartup) {
        const lastCheckStr = await AsyncStorage.getItem('lastVaultCheck');
        const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;
        const now = Date.now();

        // Only check if more than 1 hour has passed since last check
        if (now - lastCheck < 3600000) {
          console.log('Vault check skipped: Not enough time has passed since last check');
          return;
        }
      }

      console.log('Checking vault updates');

      // Update last check time
      await AsyncStorage.setItem('lastVaultCheck', Date.now().toString());

      // Do status check to ensure this mobile app is supported and check vault revision
      const statusResponse = await webApi.getStatus();
      const statusError = webApi.validateStatusResponse(statusResponse);
      if (statusError !== null) {
        console.log('Vault check error:', statusError);
        await webApi.logout(statusError);
        return;
      }
r
      // If the vault revision is higher, fetch the latest vault
      if (statusResponse.vaultRevision > dbContext.vaultRevision) {
        const vaultResponseJson = await webApi.get<VaultResponse>('Vault');

        const vaultError = webApi.validateVaultResponse(vaultResponseJson);
        if (vaultError) {
          console.log('Vault check error:', vaultError);
          console.log('Vault response:', vaultResponseJson);
          await webApi.logout(vaultError);
          return;
        }
        // Initialize the SQLite context again with the newly retrieved decrypted blob
        await dbContext.initializeDatabase(vaultResponseJson);
      }
      else {
        console.log('Vault check finished: Vault revision is the same, no action requiredr');
      }
    } catch (err) {
      console.error('Vault check error:', err);
    }
  }, [isAuthenticated, dbContext, webApi]);

  // Handle app state changes and initial mount
  useEffect(() => {
    // On first mount (cold boot), always check
    if (isFirstMount.current) {
      isFirstMount.current = false;
      checkVaultUpdates(true);
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkVaultUpdates(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkVaultUpdates]);

  // Show loading screen while initializing
  if (!isFullyInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {requireLoginOrUnlock ? (
          <Stack.Screen name="login" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
          <LoadingProvider>
            <RootLayoutNav />
          </LoadingProvider>
        </WebApiProvider>
      </AuthProvider>
    </DbProvider>
  );
}
