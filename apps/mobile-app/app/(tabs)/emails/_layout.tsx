import { Stack } from 'expo-router';

/**
 * Emails layout.
 */
export default function EmailsLayout(): React.ReactNode {
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
          title: 'Email',
          headerShown: true,
        }}
      />
    </Stack>
  );
}