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
          headerShown: true,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="vault-unlock"
        options={{
          title: 'Vault Unlock Method',
          headerBackTitle: 'Settings',
          headerShown: true,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="auto-lock"
        options={{
          title: 'Auto-lock Settings',
          headerBackTitle: 'Settings',
          headerShown: true,
          ...defaultHeaderOptions,
        }}
      />
    </Stack>
  );
}