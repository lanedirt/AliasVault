import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';

/**
 * Not found screen.
 */
export default function NotFoundScreen() : React.ReactNode {
  const { t } = useTranslation();
  
  return (
    <>
      <Stack.Screen options={{ title: t('app.notFound.title') }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('app.notFound.message')}</ThemedText>
        <Link href="/reinitialize" style={styles.link}>
          <ThemedText type="link">{t('app.notFound.goHome')}</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
