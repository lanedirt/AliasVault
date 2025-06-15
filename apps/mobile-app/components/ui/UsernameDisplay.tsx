import { StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedText } from '@/components/themed/ThemedText';
import { useAuth } from '@/context/AuthContext';

import { Avatar } from './Avatar';

/**
 * Username display component that shows the avatar and "Logged in as" text.
 */
export function UsernameDisplay(): React.ReactNode {
  const colors = useColors();
  const { username } = useAuth();

  const styles = StyleSheet.create({
    userInfoContainer: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      flexDirection: 'row',
    },
    usernameText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.userInfoContainer}>
      <Avatar />
      <ThemedText style={styles.usernameText}>Logged in as: {username}</ThemedText>
    </View>
  );
}
