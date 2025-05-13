import { Stack } from 'expo-router';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';

/**
 * Settings layout.
 */
export default function SettingsLayout(): React.ReactNode {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
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