import { StyleSheet, View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

/**
 * iOS autofill screen.
 */
export default function IosAutofillScreen() : React.ReactNode {
  const colors = useColors();
  const { markIosAutofillConfigured, shouldShowIosAutofillReminder } = useAuth();

  /**
   * Handle the configure press.
   */
  const handleConfigurePress = async () : Promise<void> => {
    await markIosAutofillConfigured();
    await Linking.openURL('App-Prefs:root');
    router.back();
  };

  /**
   * Handle the already configured press.
   */
  const handleAlreadyConfigured = async () : Promise<void> => {
    await markIosAutofillConfigured();
    router.back();
  };

  const styles = StyleSheet.create({
    buttonContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    configureButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 16,
    },
    configureButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    container: {
      flex: 1,
    },
    header: {
      padding: 16,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    instructionContainer: {
      padding: 16,
    },
    instructionStep: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 8,
    },
    instructionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 8,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    scrollView: {
      flex: 1,
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 12,
      paddingVertical: 16,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    warningText: {
      color: colors.textMuted,
      fontSize: 15,
      fontStyle: 'italic',
      marginTop: 8,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            You can configure AliasVault to provide native password autofill functionality in iOS. Follow the instructions below to enable it.
          </ThemedText>
        </View>

        <View style={styles.instructionContainer}>
          <ThemedText style={styles.instructionTitle}>How to enable:</ThemedText>
          <ThemedText style={styles.instructionStep}>
            1. Open iOS Settings via the button below
          </ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.configureButton}
              onPress={handleConfigurePress}
            >
              <ThemedText style={styles.configureButtonText}>
                Open iOS Settings
              </ThemedText>
            </TouchableOpacity>
            {shouldShowIosAutofillReminder && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleAlreadyConfigured}
              >
                <ThemedText style={styles.secondaryButtonText}>
                I already configured it
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <ThemedText style={styles.instructionStep}>
            2. Go to &quot;General&quot;
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            3. Tap &quot;AutoFill & Passwords&quot;
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            4. Enable &quot;AliasVault&quot;
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            5. Disable other password providers (e.g. &quot;iCloud Passwords&quot;) to avoid conflicts
          </ThemedText>
          <ThemedText style={styles.warningText}>
            Note: You&apos;ll need to authenticate with Face ID/Touch ID or your device passcode when using autofill.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}