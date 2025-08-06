import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Alert, Platform, Linking, Switch, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedText } from '@/components/themed/ThemedText';
import { AuthMethod, useAuth } from '@/context/AuthContext';

/**
 * Vault unlock settings screen.
 */
export default function VaultUnlockSettingsScreen() : React.ReactNode {
  const colors = useColors();
  const { t } = useTranslation();
  const [initialized, setInitialized] = useState(false);
  const { setAuthMethods, getEnabledAuthMethods, getBiometricDisplayNameKey } = useAuth();
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [biometricDisplayName, setBiometricDisplayName] = useState('');
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

        // Set biometric availability based on all checks
        const isBiometricAvailable = compatible && enrolled;
        setHasBiometrics(isBiometricAvailable);

        // Get appropriate display name key from auth context
        const displayNameKey = await getBiometricDisplayNameKey();
        // Translate the key
        const displayName = t(displayNameKey);
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
  }, [getEnabledAuthMethods, getBiometricDisplayNameKey, t]);

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
        t('settings.vaultUnlockSettings.biometricNotAvailable', { biometric: biometricDisplayName }),
        t('settings.vaultUnlockSettings.biometricDisabledMessage', { biometric: biometricDisplayName }),
        [
          {
            text: t('settings.openSettings'),
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
            text: t('common.cancel'),
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
        text1: t('settings.vaultUnlockSettings.biometricEnabled', { biometric: biometricDisplayName }),
        position: 'bottom',
        visibilityTime: 1200,
      });
    }
  }, [hasBiometrics, setAuthMethods, biometricDisplayName, t]);

  const styles = StyleSheet.create({
    disabledText: {
      color: colors.textMuted,
      opacity: 0.5,
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
      marginTop: 16,
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
    <ThemedContainer>
      <ThemedScrollView>
        <ThemedText style={styles.headerText}>
          {t('settings.vaultUnlockSettings.description')}
        </ThemedText>

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
              {t('settings.vaultUnlockSettings.biometricHelp', {
                keystore: Platform.OS === 'ios' ? t('settings.vaultUnlockSettings.keystoreIOS') : t('settings.vaultUnlockSettings.keystoreAndroid'),
                biometric: biometricDisplayName
              })}
            </ThemedText>
            {!hasBiometrics && (
              <ThemedText style={[styles.helpText, { color: colors.errorBorder }]}>
                {t('settings.vaultUnlockSettings.biometricUnavailableHelp', { biometric: biometricDisplayName })}
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={[styles.option, styles.optionLast]}>
            <View style={styles.optionHeader}>
              <ThemedText style={styles.optionText}>{t('credentials.password')}</ThemedText>
              <Switch
                value={true}
                disabled={true}
              />
            </View>
            <ThemedText style={styles.helpText}>
              {t('settings.vaultUnlockSettings.passwordHelp')}
            </ThemedText>
          </View>
        </View>
      </ThemedScrollView>
    </ThemedContainer>
  );
}