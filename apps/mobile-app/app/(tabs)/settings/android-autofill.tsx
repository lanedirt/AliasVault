import { StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';

import NativeVaultManager from '@/specs/NativeVaultManager';
import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedContainer } from '@/components/themed/ThemedContainer';

/**
 * Android autofill screen.
 */
export default function AndroidAutofillScreen() : React.ReactNode {
  const colors = useColors();
  const { markAutofillConfigured, shouldShowAutofillReminder } = useAuth();

  /**
   * Handle the configure press.
   */
  const handleConfigurePress = async () : Promise<void> => {
    await markAutofillConfigured();
    try {
      await NativeVaultManager.openAutofillSettingsPage();
    } catch (err) {
      console.warn('Failed to open settings:', err);
    }
  };

  /**
   * Handle the already configured press.
   */
  const handleAlreadyConfigured = async () : Promise<void> => {
    await markAutofillConfigured();
    router.back();
  };

  /**
   * Handle opening the documentation link.
   */
  const handleOpenDocs = () : void => {
    Linking.openURL('https://docs.aliasvault.net/mobile-apps/android/autofill.html');
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
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    instructionContainer: {
      paddingTop: 16,
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
    tipStep: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
    warningContainer: {
      backgroundColor: colors.accentBackground,
      marginBottom: 16,
      padding: 16,
    },
    warningDescription: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    warningLink: {
      color: colors.primary,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    warningTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
  });

  return (
    <ThemedContainer>
      <ThemedScrollView>
        <View style={styles.warningContainer}>
          <ThemedText style={styles.warningTitle}>⚠️ Experimental Feature</ThemedText>
          <ThemedText style={styles.warningDescription}>
            Autofill support for Android is currently in an experimental state.{' '}
            <ThemedText style={styles.warningLink} onPress={handleOpenDocs}>
              Read more about it here
            </ThemedText>
          </ThemedText>
        </View>

        <View>
          <ThemedText style={styles.headerText}>
            You can configure AliasVault to provide native password autofill functionality in Android. Follow the instructions below to enable it.
          </ThemedText>
        </View>

        <View style={styles.instructionContainer}>
          <ThemedText style={styles.instructionTitle}>How to enable:</ThemedText>
          <ThemedText style={styles.instructionStep}>
            1. Open Android Settings via the button below, and change the &quot;autofill preferred service&quot; to &quot;AliasVault&quot;
          </ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.configureButton}
              onPress={handleConfigurePress}
            >
              <ThemedText style={styles.configureButtonText}>
                Open Autofill Settings
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.tipStep}>
              If the button above doesn&apos;t work it might be blocked because of security settings. You can manually go to Android Settings → General Management → Passwords and autofill.
            </ThemedText>
          </View>
          <ThemedText style={styles.instructionStep}>
            2. Some apps, e.g. Google Chrome, may require manual configuration in their settings to allow third-party autofill apps. However, most apps should work with autofill by default.
          </ThemedText>
          <View style={styles.buttonContainer}>
            {shouldShowAutofillReminder && (
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
        </View>
      </ThemedScrollView>
    </ThemedContainer>
  );
}