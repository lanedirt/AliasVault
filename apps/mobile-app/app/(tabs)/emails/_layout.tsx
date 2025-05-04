import { Stack } from 'expo-router';

import { useColors } from '@/hooks/useColorScheme';

/**
 * Emails layout.
 */
export default function EmailsLayout() : React.ReactNode {
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
          title: 'Email',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
        }}
      />
    </Stack>
  );
}