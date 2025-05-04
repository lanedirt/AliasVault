import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import 'react-native-reanimated';
/*
 * Required for certain modules such as secure-remote-password which relies on crypto.getRandomValues
 * and this is not available in react-native without this polyfill
 */
import 'react-native-get-random-values';

import { useColors, useColorScheme } from '@/hooks/useColorScheme';
import { DbProvider } from '@/context/DbContext';
import { AuthProvider } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';
import { AliasVaultToast } from '@/components/Toast';
import SpaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Root layout navigation.
 */
function RootLayoutNav() : React.ReactNode {
  const colorScheme = useColorScheme();
  const colors = useColors();

  // Create custom themes that extend the default ones.
  const customDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
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
      <Stack screenOptions={{
        headerShown: true,
        animation: 'none',
        headerStyle: {
          backgroundColor: colors.accentBackground,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="sync" options={{ headerShown: false }} />
        <Stack.Screen name="unlock" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
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
