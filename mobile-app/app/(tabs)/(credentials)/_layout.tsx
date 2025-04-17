import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function CredentialsLayout() {
  const colorScheme = useColorScheme();

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
            backgroundColor: Colors[colorScheme ?? 'light'].headerBackground,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}
      />
    </Stack>
  );
}