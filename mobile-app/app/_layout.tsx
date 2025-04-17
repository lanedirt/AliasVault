import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus, View, ActivityIndicator, Text } from 'react-native';
import 'react-native-reanimated';
// Required for certain modules such as secure-remote-password which relies on crypto.getRandomValues
// and this is not available in react-native without this polyfill
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LoadingProvider } from '@/context/LoadingContext';
import { DbProvider } from '@/context/DbContext';
import { AuthProvider } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useVaultSync } from '@/hooks/useVaultSync';

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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
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
