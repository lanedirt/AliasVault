import { StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';

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
  const { markAndroidAutofillConfigured, shouldShowAndroidAutofillReminder } = useAuth();

  /**
   * Handle the configure press.
   */
  const handleConfigurePress = async () : Promise<void> => {
    await markAndroidAutofillConfigured();
    try {
      await Linking.sendIntent('android.settings.SETTINGS');
      router.back();
    } catch (err) {
      console.warn('Failed to open settings:', err);
    }
  };

  /**
   * Handle the already configured press.
   */
  const handleAlreadyConfigured = async () : Promise<void> => {
    await markAndroidAutofillConfigured();
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
    header: {
      paddingTop: 12,
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
    warningText: {
      color: colors.textMuted,
      fontSize: 15,
      fontStyle: 'italic',
      marginTop: 8,
    },
  });

  return (
    <ThemedContainer>
      <ThemedScrollView>
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            You can configure AliasVault to provide native password autofill functionality in Android. Follow the instructions below to enable it.
          </ThemedText>
        </View>

        <View style={styles.instructionContainer}>
          <ThemedText style={styles.instructionTitle}>How to enable:</ThemedText>
          <ThemedText style={styles.instructionStep}>
            1. Open Android Settings via the button below
          </ThemedText>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.configureButton}
              onPress={handleConfigurePress}
            >
              <ThemedText style={styles.configureButtonText}>
                Open Android Settings
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.instructionStep}>
            2. Navigate to &quot;Passwords, passkeys & accounts&quot; in the settings menu
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            3. Change the &quot;prefered service&quot; to &quot;AliasVault&quot;
          </ThemedText>
          <ThemedText style={styles.warningText}>
            Note: You&apos;ll need to authenticate with your device security method when using autofill.
          </ThemedText>
          <View style={styles.buttonContainer}>
            {shouldShowAndroidAutofillReminder && (
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