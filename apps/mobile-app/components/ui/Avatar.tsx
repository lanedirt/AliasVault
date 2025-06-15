import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import { useAuth } from '@/context/AuthContext';

import { ThemedText } from '../themed/ThemedText';

/**
 * Avatar component that displays the first letter of the username.
 */
export function Avatar(): React.ReactNode {
  const colors = useColors();
  const { username } = useAuth();

  const styles = StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: colors.primary + 80,
      borderRadius: 20,
      height: 40,
      justifyContent: 'center',
      marginRight: 12,
      width: 40,
    },
    avatarText: {
      color: colors.primarySurfaceText,
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.avatar}>
      <ThemedText style={styles.avatarText}>
        {username?.[0]?.toUpperCase() ?? '?'}
      </ThemedText>
    </View>
  );
}