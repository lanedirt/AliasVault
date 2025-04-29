import { StyleSheet, View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function IosAutofillScreen() {
  const colors = useColors();
  const { markIosAutofillConfigured, shouldShowIosAutofillReminder } = useAuth();

  const handleConfigurePress = async () => {
    await markIosAutofillConfigured();
    await Linking.openURL('App-Prefs:root');
    router.back();
  };

  const handleAlreadyConfigured = async () => {
    await markIosAutofillConfigured();
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      padding: 16,
    },
    headerText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    instructionContainer: {
      padding: 16,
    },
    instructionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    instructionStep: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    warningText: {
      fontSize: 15,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: 8,
    },
    buttonContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    configureButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
    },
    configureButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    noticeContainer: {
      backgroundColor: colors.accentBackground,
      padding: 16,
      margin: 16,
      borderRadius: 10,
    },
    noticeText: {
      fontSize: 15,
      color: colors.text,
      textAlign: 'center',
    },
    secondaryButton: {
      backgroundColor: colors.accentBackground,
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
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
          <ThemedText style={styles.instructionStep}>
            2. Go to "General"
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            3. Tap "AutoFill & Passwords"
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            4. Enable "AliasVault"
          </ThemedText>
          <ThemedText style={styles.instructionStep}>
            5. Disable other password providers (e.g. "iCloud Passwords") to avoid conflicts
          </ThemedText>
          <ThemedText style={styles.warningText}>
            Note: You'll need to authenticate with Face ID/Touch ID or your device passcode when using autofill.
          </ThemedText>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.configureButton}
            onPress={handleConfigurePress}
          >
            <ThemedText style={styles.configureButtonText}>
              Open Settings
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
      </ScrollView>
    </ThemedView>
  );
}