import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import Logo from '@/assets/images/logo.svg';

interface IAndroidHeaderProps {
  title: string;
}

/**
 * Custom header component for Android that includes the AliasVault logo.
 * @param {IAndroidHeaderProps} props - The component props
 * @returns {React.ReactNode} The Android header component
 */
export function AndroidHeader({ title }: IAndroidHeaderProps): React.ReactNode {
  return (
    <View style={styles.headerContainer}>
      <Logo width={40} height={40} style={styles.logo} />
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
  logo: {
    marginBottom: 0,
  },
});