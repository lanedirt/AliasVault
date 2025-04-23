import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';
// Required for certain modules such as secure-remote-password which relies on crypto.getRandomValues
// and this is not available in react-native without this polyfill
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';

import { useColors, useColorScheme } from '@/hooks/useColorScheme';
import { LoadingProvider } from '@/context/LoadingContext';
import { DbProvider } from '@/context/DbContext';
import { AuthProvider } from '@/context/AuthContext';
import { WebApiProvider } from '@/context/WebApiContext';

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
        marginTop: 20,
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
  error: (props: any) => (
    <View
      style={{
        backgroundColor: '#dc2626', // Red
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        marginTop: 30,
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
      {props.text2 && (
        <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  info: (props: any) => (
    <View
      style={{
        backgroundColor: '#3b82f6', // Blue
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        marginTop: 30,
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
          backgroundColor: colors.background,
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
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
