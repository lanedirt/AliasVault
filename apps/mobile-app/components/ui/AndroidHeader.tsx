import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import Logo from '@/assets/images/logo.svg';

type HeaderButton = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  position: 'left' | 'right';
}

interface IAndroidHeaderProps {
  title: string;
  headerButtons?: HeaderButton[];
}

/**
 * Custom header component for Android that includes the AliasVault logo.
 * @param {IAndroidHeaderProps} props - The component props
 * @returns {React.ReactNode} The Android header component
 */
export function AndroidHeader({ title, headerButtons = [] }: IAndroidHeaderProps): React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
    headerButton: {
      padding: 4,
    },
    headerContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      verticalAlign: 'middle',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    leftButton: {
      marginRight: 'auto',
    },
    logo: {
      marginBottom: 0,
    },
    rightButton: {
      marginLeft: 'auto',
    },
  });

  return (
    <View style={styles.headerContainer}>
      {headerButtons.find(b => b.position === 'left') && (
        <TouchableOpacity
          style={[styles.headerButton, styles.leftButton]}
          onPress={headerButtons.find(b => b.position === 'left')?.onPress}
        >
          <MaterialIcons
            name={headerButtons.find(b => b.position === 'left')?.icon ?? 'add'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
      <Logo width={40} height={40} style={styles.logo} />
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      {headerButtons.find(b => b.position === 'right') && (
        <TouchableOpacity
          style={[styles.headerButton, styles.rightButton]}
          onPress={headerButtons.find(b => b.position === 'right')?.onPress}
        >
          <MaterialIcons
            name={headerButtons.find(b => b.position === 'right')?.icon ?? 'add'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}