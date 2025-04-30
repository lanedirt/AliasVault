import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColorScheme';

export default function SettingsLayout() {
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
        name="ios-autofill"
        options={{
          title: 'iOS Autofill',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
      <Stack.Screen
        name="vault-unlock"
        options={{
          title: 'Vault Unlock Method',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
      <Stack.Screen
        name="auto-lock"
        options={{
          title: 'Auto-lock Settings',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
    </Stack>
  );
}