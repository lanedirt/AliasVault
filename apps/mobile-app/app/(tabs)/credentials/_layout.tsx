import { Stack } from 'expo-router';
import { Platform, Text } from 'react-native';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';
import { AndroidHeader } from '@/components/ui/AndroidHeader';

/**
 * Credentials layout.
 * @returns {React.ReactNode} The credentials layout component
 */
export default function CredentialsLayout(): React.ReactNode {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Credentials',
          headerShown: Platform.OS === 'android',
          /**
           * On Android, we use a custom header component that includes the AliasVault logo.
           * On iOS, we don't show the header as a custom collapsible header is used.
           * @returns {React.ReactNode} The header component
           */
          headerTitle: (): React.ReactNode => Platform.OS === 'android' ? <AndroidHeader title="Credentials" /> : <Text>Credentials</Text>,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="add-edit"
        options={{
          title: 'Add Credential',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="add-edit-page"
        options={{
          title: 'Add Credential',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="autofill-credential-created"
        options={{
          title: 'Credential Created',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Credential Details',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="email/[id]"
        options={{
          title: 'Email Preview',
        }}
      />
    </Stack>
  );
}