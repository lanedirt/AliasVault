import { Stack } from 'expo-router';
import { Platform, Text } from 'react-native';

import { defaultHeaderOptions } from '@/components/themed/ThemedHeader';
import { AndroidHeader } from '@/components/ui/AndroidHeader';

/**
 * Emails layout.
 */
export default function EmailsLayout(): React.ReactNode {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Emails',
          headerShown: Platform.OS === 'android',
          /**
           * On Android, we use a custom header component that includes the AliasVault logo.
           * On iOS, we don't show the header as a custom collapsible header is used.
           * @returns {React.ReactNode} The header component
           */
          headerTitle: (): React.ReactNode => Platform.OS === 'android' ? <AndroidHeader title="Emails" /> : <Text>Emails</Text>,
          ...defaultHeaderOptions,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Email',
        }}
      />
    </Stack>
  );
}