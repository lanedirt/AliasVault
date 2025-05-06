import { StyleSheet, View, TouchableOpacity, AppState } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect } from 'react';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedSafeAreaView } from '@/components/themed/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';

/**
 * Autofill credential created screen.
 */
export default function AutofillCredentialCreatedScreen() : React.ReactNode {
  const router = useRouter();
  const colors = useColors();
  const navigation = useNavigation();

  /**
   * Handle the stay in app button press.
   */
  const handleStayInApp = useCallback(() => {
    router.back();
  }, [router]);

  // Handle app state changes to auto-dismiss when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        router.back();
      }
    });

    return (): void => {
      subscription.remove();
    };
  }, [router]);

  const styles = StyleSheet.create({
    boldMessage: {
      fontWeight: 'bold',
      marginTop: 20,
    },
    container: {
      flex: 1,
    },
    content: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    headerRightButton: {
      padding: 10,
      paddingRight: 0,
    },
    iconContainer: {
      marginBottom: 30,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 30,
      textAlign: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
  });

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      /**
       * Header right button.
       */
      headerRight: () => (
        <TouchableOpacity
          onPress={handleStayInApp}
          style={styles.headerRightButton}
        >
          <ThemedText style={{ color: colors.primary }}>Dismiss</ThemedText>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.primary, styles.headerRightButton, handleStayInApp]);

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="task-alt"
            size={80}
            color={colors.primary}
          />
        </View>

        <ThemedText style={styles.title}>Credential Created!</ThemedText>

        <ThemedText style={styles.message}>
          Your new credential has been added to your vault and is now available for password autofill.
        </ThemedText>
        <ThemedText style={[styles.message, styles.boldMessage]}>
            Switch back to your browser to continue.
        </ThemedText>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}