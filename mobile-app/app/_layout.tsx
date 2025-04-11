import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
// Required for certain modules such as secure-remote-password which relies on crypto.getRandomValues
// and this is not available in react-native without this polyfill
import 'react-native-get-random-values';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LoadingProvider } from '@/context/LoadingContext';
import { DbProvider } from '@/context/DbContext';
import { AuthProvider } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { View, ActivityIndicator } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const authContext = useAuth();
  const dbContext = useDb();

  // Check if user is authenticated and database is available
  const isFullyInitialized = authContext.isInitialized && dbContext.dbInitialized;
  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;
  const requireLoginOrUnlock = isFullyInitialized && (!isAuthenticated || !isDatabaseAvailable);

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
