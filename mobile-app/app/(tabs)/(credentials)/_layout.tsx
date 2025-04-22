import { useColors } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';

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