import { useColors } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';

export default function EmailsLayout() {
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