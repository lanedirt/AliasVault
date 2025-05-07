import { StyleSheet, View } from 'react-native';

import { OfflineBanner } from '../OfflineBanner';

import { ThemedText } from '@/components/themed/ThemedText';
import Logo from '@/assets/images/logo.svg';

type TitleContainerProps = {
  title: string;
  showLogo?: boolean;
};

/**
 * Title container component.
 */
export function TitleContainer({ title, showLogo = true }: TitleContainerProps): React.ReactNode {
  return (
    <>
      <OfflineBanner />
      <View style={styles.titleContainer}>
        {showLogo && <Logo width={40} height={40} style={styles.logo} />}
        <ThemedText type="title">{title}</ThemedText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logo: {
    marginBottom: 6,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
});
