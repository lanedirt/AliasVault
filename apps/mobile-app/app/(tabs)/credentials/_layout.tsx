import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';

/**
 * Credentials layout.
 */
export default function CredentialsLayout(): React.ReactNode {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-edit"
        options={{
          title: 'Add Credential',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          headerShown: true,
          gestureEnabled: true,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="autofill-credential-created"
        options={{
          title: 'Credential Created',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          headerShown: true,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Credential Details',
          headerShown: true,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="email/[id]"
        options={{
          title: 'Email Preview',
          headerShown: true,
        }}
      />
    </Stack>
  );
}