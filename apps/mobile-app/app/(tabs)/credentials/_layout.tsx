import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';

/**
 * Credentials layout.
 * @returns {React.ReactNode} The credentials layout component
 */
export default function CredentialsLayout(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t('credentials.title'),
          headerShown: Platform.OS === 'android',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="add-edit"
        options={{
          title: t('credentials.addCredential'),
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="add-edit-page"
        options={{
          title: t('credentials.addCredential'),
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="autofill-credential-created"
        options={{
          title: t('credentials.credentialCreated'),
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: t('credentials.credentialDetails'),
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="email/[id]"
        options={{
          title: t('credentials.emailPreview'),
        }}
      />
    </Stack>
  );
}