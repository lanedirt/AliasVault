import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import Logo from '@/assets/images/logo.svg';

interface TitleContainerProps {
  title: string;
  showLogo?: boolean;
}

export function TitleContainer({ title, showLogo = true }: TitleContainerProps) {
  return (
    <View style={styles.titleContainer}>
      {showLogo && <Logo width={40} height={40} />}
      <ThemedText type="title">{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
});
