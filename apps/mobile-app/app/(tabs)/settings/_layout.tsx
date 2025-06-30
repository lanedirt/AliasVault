import { Stack } from 'expo-router';
import { Platform, Text } from 'react-native';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';
import { AndroidHeader } from '@/components/ui/AndroidHeader';

/**
 * Settings layout.
 */
export default function SettingsLayout(): React.ReactNode {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerShown: Platform.OS === 'android',
          /**
           * On Android, we use a custom header component that includes the AliasVault logo.
           * On iOS, we don't show the header as a custom collapsible header is used.
           * @returns {React.ReactNode} The header component
           */
          headerTitle: (): React.ReactNode => Platform.OS === 'android' ? <AndroidHeader title="Settings" /> : <Text>Settings</Text>,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="ios-autofill"
        options={{
          title: 'iOS Autofill',
          headerBackTitle: 'Settings',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="android-autofill"
        options={{
          title: 'Android Autofill',
          headerBackTitle: 'Settings',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="vault-unlock"
        options={{
          title: 'Vault Unlock Method',
          headerBackTitle: 'Settings',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="auto-lock"
        options={{
          title: 'Auto-lock Timeout',
          headerBackTitle: 'Settings',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="identity-generator"
        options={{
          title: 'Identity Generator',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="security/index"
        options={{
          title: 'Security Settings',
          headerBackTitle: 'Settings',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="security/change-password"
        options={{
          title: 'Change Password',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="security/active-sessions"
        options={{
          title: 'Active Sessions',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="security/auth-logs"
        options={{
          title: 'Auth Logs',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="security/delete-account"
        options={{
          title: 'Delete Account',
          ...defaultHeaderOptions,
        }}
      />
    </Stack>
  );
}