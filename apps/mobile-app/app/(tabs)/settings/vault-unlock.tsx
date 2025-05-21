import { StyleSheet, View, Alert, Platform, Linking, Switch, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { AuthMethod, useAuth } from '@/context/AuthContext';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedView } from '@/components/themed/ThemedView';

/**
 * Vault unlock settings screen.
 */
export default function VaultUnlockSettingsScreen() : React.ReactNode {
  const colors = useColors();
  const [initialized, setInitialized] = useState(false);
  const { setAuthMethods, getEnabledAuthMethods, getBiometricDisplayName } = useAuth();
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [biometricDisplayName, setBiometricDisplayName] = useState(Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Biometrics');
  const [_, setEnabledAuthMethods] = useState<AuthMethod[]>([]);

  useEffect(() => {
    /**
     * Initialize the auth methods.
     */
    const initializeAuth = async () : Promise<void> => {
      try {
        // Check for hardware support
        const compatible = await LocalAuthentication.hasHardwareAsync();

        // Check if any biometrics are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        // Check for strong authentication support
        const hasStrongAuth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Checking biometric capabilities',
          disableDeviceFallback: true,
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use password',
        }).then(result => result.success);

        // Set biometric availability based on all checks
        const isBiometricAvailable = compatible && enrolled && hasStrongAuth;
        setHasBiometrics(isBiometricAvailable);

        // Get appropriate display name
        const displayName = Platform.OS === 'ios' ? await getBiometricDisplayName() : 'Biometrics';
        setBiometricDisplayName(displayName);

        const methods = await getEnabledAuthMethods();
        setEnabledAuthMethods(methods);

        if (methods.includes('faceid') && enrolled) {
          setIsBiometricsEnabled(true);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setHasBiometrics(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [getEnabledAuthMethods, getBiometricDisplayName]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    /**
     * Update the auth methods.
     */
    const updateAuthMethods = async () : Promise<void> => {
      const currentAuthMethods = await getEnabledAuthMethods();
      const newAuthMethods = isBiometricsEnabled ? ['faceid', 'password'] : ['password'];

      if (currentAuthMethods.length === newAuthMethods.length &&
          currentAuthMethods.every(method => newAuthMethods.includes(method))) {
        return;
      }

      setAuthMethods(newAuthMethods as AuthMethod[]);
    };

    updateAuthMethods();
  }, [isBiometricsEnabled, setAuthMethods, getEnabledAuthMethods, initialized]);

  const handleBiometricsToggle = useCallback(async (value: boolean) : Promise<void> => {
    if (value && !hasBiometrics) {
      Alert.alert(
        `${biometricDisplayName} Not Available`,
        `${biometricDisplayName} is disabled for AliasVault. In order to use it, please enable it in your device settings first.`,
        [
          {
            text: 'Open Settings',
            /**
             * Handle the open settings press.
             */
            onPress: () : void => {
              setIsBiometricsEnabled(true);
              setAuthMethods(['faceid', 'password']);
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            /**
             * Handle the cancel press.
             */
            onPress: () : void => {
              setIsBiometricsEnabled(false);
              setAuthMethods(['password']);
            },
          },
        ]
      );
      return;
    }

    setIsBiometricsEnabled(value);
    setAuthMethods(value ? ['faceid', 'password'] : ['password']);

    // Show toast notification only on biometrics enabled
    if (value) {
      Toast.show({
        type: 'success',
        text1: `${biometricDisplayName} is now successfully enabled`,
        position: 'bottom',
        visibilityTime: 1200,
      });
    }
  }, [hasBiometrics, setAuthMethods, biometricDisplayName]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    disabledText: {
      color: colors.textMuted,
      opacity: 0.5,
    },
    header: {
      padding: 16,
      paddingBottom: 0,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    helpText: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    option: {
      borderBottomColor: colors.accentBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    optionContainer: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      margin: 16,
    },
    optionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionText: {
      color: colors.text,
      fontSize: 16,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView>
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            Choose how you want to unlock your vault.
          </ThemedText>
        </View>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleBiometricsToggle(!isBiometricsEnabled)}
          >
            <View style={styles.optionHeader}>
              <ThemedText style={[styles.optionText, !hasBiometrics && styles.disabledText]}>
                {biometricDisplayName}
              </ThemedText>
              <View pointerEvents="none">
                <Switch
                  value={isBiometricsEnabled}
                  disabled={!hasBiometrics}
                />
              </View>
            </View>
            <ThemedText style={styles.helpText}>
              Your vault decryption key will be securely stored on your local device in the {Platform.OS === 'ios' ? 'iOS Keychain' : 'Android Keystore'} and can be accessed securely with {biometricDisplayName}.
            </ThemedText>
            {!hasBiometrics && (
              <ThemedText style={[styles.helpText, { color: colors.errorBorder }]}>
                {biometricDisplayName} is blocked in device settings. Tap to open settings and enable it.
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={[styles.option, styles.optionLast]}>
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
      </ThemedScrollView>
    </ThemedView>
  );
}