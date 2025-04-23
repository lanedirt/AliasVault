import { StyleSheet, View, ScrollView, Alert, Platform, Linking, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function VaultUnlockSettingsScreen() {
  const colors = useColors();
  const { setAuthMethods, enabledAuthMethods } = useAuth();
  const [hasFaceID, setHasFaceID] = useState(false);
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(false);

  useEffect(() => {
    const checkFaceIDAvailability = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasFaceID(compatible && enrolled);
    };
    checkFaceIDAvailability();

    if (enabledAuthMethods.includes('faceid')) {
      setIsFaceIDEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (isFaceIDEnabled) {
      setAuthMethods(['faceid', 'password']);
    } else {
      setAuthMethods(['password']);
    }
  }, [isFaceIDEnabled, setAuthMethods]);

  const handleFaceIDToggle = useCallback(async (value: boolean) => {
    if (value && !hasFaceID) {
      Alert.alert(
        'Face ID Not Available',
        'Face ID is not set up on this device. Please set up Face ID in your device settings to use this feature.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    setIsFaceIDEnabled(value);
    setAuthMethods(value ? ['faceid', 'password'] : ['password']);
  }, [hasFaceID]);

  const styles = useMemo(() => StyleSheet.create({
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.accentBorder,
    },
    headerText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    optionContainer: {
      backgroundColor: colors.background,
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.accentBorder,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
    },
    helpText: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    disabledText: {
      color: colors.textMuted,
      opacity: 0.5,
    },
  }), [colors]);

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            Choose how you want to unlock your vault
          </ThemedText>
        </View>

        <View style={styles.optionContainer}>
          <View style={styles.option}>
            <View style={styles.optionHeader}>
              <ThemedText style={[styles.optionText, !hasFaceID && styles.disabledText]}>
                Face ID / Touch ID
              </ThemedText>
              <Switch
                value={isFaceIDEnabled}
                onValueChange={handleFaceIDToggle}
                disabled={!hasFaceID}
              />
            </View>
            <ThemedText style={styles.helpText}>
              Your vault decryption key will be securely stored on your local device in the iOS Keychain and can only be accessed with your face or fingerprint.
            </ThemedText>
          </View>

          <View style={styles.option}>
            <View style={styles.optionHeader}>
              <ThemedText style={styles.optionText}>Password</ThemedText>
              <Switch
                value={true}
                disabled={true}
              />
            </View>
            <ThemedText style={styles.helpText}>
              Re-enter your full master password to unlock your vault. This is always enabled as fallback option.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}