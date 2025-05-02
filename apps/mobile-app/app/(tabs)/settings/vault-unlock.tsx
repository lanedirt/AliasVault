import { StyleSheet, View, ScrollView, Alert, Platform, Linking, Switch, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthMethod, useAuth } from '@/context/AuthContext';

export default function VaultUnlockSettingsScreen() {
  const colors = useColors();
  const [initialized, setInitialized] = useState(false);
  const { setAuthMethods, getEnabledAuthMethods, getBiometricDisplayName } = useAuth();
  const [hasFaceID, setHasFaceID] = useState(false);
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(false);
  const [biometricDisplayName, setBiometricDisplayName] = useState('Face ID / Touch ID');
  const [_, setEnabledAuthMethods] = useState<AuthMethod[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasFaceID(compatible && enrolled);

      const methods = await getEnabledAuthMethods();
      setEnabledAuthMethods(methods);

      if (methods.includes('faceid') && enrolled) {
        setIsFaceIDEnabled(true);
      }

      const displayName = await getBiometricDisplayName();
      setBiometricDisplayName(displayName);

      setInitialized(true);
    };

    initializeAuth();
  }, [getEnabledAuthMethods, getBiometricDisplayName]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const updateAuthMethods = async () => {
      const currentAuthMethods = await getEnabledAuthMethods();
      const newAuthMethods = isFaceIDEnabled ? ['faceid', 'password'] : ['password'];

      if (currentAuthMethods.length === newAuthMethods.length &&
          currentAuthMethods.every(method => newAuthMethods.includes(method))) {
        return;
      }

      console.log('Updating auth methods to', newAuthMethods);
      setAuthMethods(newAuthMethods as AuthMethod[]);
    };

    updateAuthMethods();
  }, [isFaceIDEnabled, setAuthMethods, getEnabledAuthMethods, initialized]);

  const handleFaceIDToggle = useCallback(async (value: boolean) => {
    if (value && !hasFaceID) {
      Alert.alert(
        'Face ID Not Available',
        'Face ID is disabled for AliasVault. In order to use it, please enable it in the iOS app settings first.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
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
            onPress: () => {
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