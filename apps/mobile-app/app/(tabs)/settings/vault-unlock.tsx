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
  const [hasFaceID, setHasFaceID] = useState(false);
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(false);
  const [biometricDisplayName, setBiometricDisplayName] = useState('Face ID / Touch ID');
  const [_, setEnabledAuthMethods] = useState<AuthMethod[]>([]);

  useEffect(() => {
    /**
     * Initialize the auth methods.
     */
    const initializeAuth = async () : Promise<void> => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasFaceID(compatible && enrolled);

      const displayName = await getBiometricDisplayName();
      setBiometricDisplayName(displayName);

      const methods = await getEnabledAuthMethods();
      setEnabledAuthMethods(methods);

      if (methods.includes('faceid') && enrolled) {
        setIsFaceIDEnabled(true);
      }

      setInitialized(true);
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
      const newAuthMethods = isFaceIDEnabled ? ['faceid', 'password'] : ['password'];

      if (currentAuthMethods.length === newAuthMethods.length &&
          currentAuthMethods.every(method => newAuthMethods.includes(method))) {
        return;
      }

      setAuthMethods(newAuthMethods as AuthMethod[]);
    };

    updateAuthMethods();
  }, [isFaceIDEnabled, setAuthMethods, getEnabledAuthMethods, initialized]);

  const handleFaceIDToggle = useCallback(async (value: boolean) : Promise<void> => {
    if (value && !hasFaceID) {
      Alert.alert(
        'Face ID Not Available',
        'Face ID is disabled for AliasVault. In order to use it, please enable it in the iOS app settings first.',
        [
          {
            text: 'Open Settings',
            /**
             * Handle the open settings press.
             */
            onPress: () : void => {
              setIsFaceIDEnabled(true);
              setAuthMethods(['faceid', 'password']);
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
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
              setIsFaceIDEnabled(false);
              setAuthMethods(['password']);
            },
          },
        ]
      );
      return;
    }

    setIsFaceIDEnabled(value);
    setAuthMethods(value ? ['faceid', 'password'] : ['password']);

    // Show toast notification only on Face ID enabled
    if (value) {
      Toast.show({
        type: 'success',
        text1: 'Face ID is now successfully enabled',
        position: 'bottom',
        visibilityTime: 1200,
      });
    }
  }, [hasFaceID, setAuthMethods]);

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
            onPress={() => handleFaceIDToggle(!isFaceIDEnabled)}
          >
            <View style={styles.optionHeader}>
              <ThemedText style={[styles.optionText, !hasFaceID && styles.disabledText]}>
                {biometricDisplayName}
              </ThemedText>
              <View pointerEvents="none">
                <Switch
                  value={isFaceIDEnabled}
                  disabled={!hasFaceID}
                />
              </View>
            </View>
            <ThemedText style={styles.helpText}>
              Your vault decryption key will be securely stored on your local device in the iOS Keychain and can be accessed securely with {biometricDisplayName}.
            </ThemedText>
            {!hasFaceID && (
              <ThemedText style={[styles.helpText, { color: colors.errorBorder }]}>
                {biometricDisplayName} is blocked in iOS settings. Tap to open settings and enable it.
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