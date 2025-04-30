import { useColors } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function CredentialsLayout() {
  const colors = useColors();

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
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="autofill-credential-created"
        options={{
          title: 'Credential Created',
          presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Credential Details',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
      <Stack.Screen
        name="email/[id]"
        options={{
          title: 'Email Preview',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
    </Stack>
  );
}