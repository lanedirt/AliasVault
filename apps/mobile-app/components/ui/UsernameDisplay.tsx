import { StyleSheet, View, Image } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import avatarImage from '@/assets/images/avatar.webp';
import { ThemedText } from '@/components/themed/ThemedText';
import { useAuth } from '@/context/AuthContext';

/**
 * Username display component.
 */
export function UsernameDisplay(): React.ReactNode {
  const colors = useColors();
  const { username } = useAuth();

  const styles = StyleSheet.create({
    avatar: {
      borderRadius: 20,
      height: 40,
      marginRight: 12,
      width: 40,
    },
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
      <Image
        source={avatarImage}
        style={styles.avatar}
      />
      <ThemedText style={styles.usernameText}>Logged in as: {username}</ThemedText>
    </View>
  );
}
