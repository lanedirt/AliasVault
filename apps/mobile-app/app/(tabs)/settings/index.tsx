import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useWebApi } from '@/context/WebApiContext';
import { AppInfo } from '@/utils/AppInfo';
import { useColors } from '@/hooks/useColorScheme';
import { TitleContainer } from '@/components/TitleContainer';
import { useAuth } from '@/context/AuthContext';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import avatarImage from '@/assets/images/avatar.webp';

/**
 * Settings screen.
 */
export default function SettingsScreen() : React.ReactNode {
  const webApi = useWebApi();
  const colors = useColors();
  const { username, getAuthMethodDisplay, shouldShowIosAutofillReminder, getBiometricDisplayName } = useAuth();
  const { getAutoLockTimeout } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoLockDisplay, setAutoLockDisplay] = useState<string>('');
  const [authMethodDisplay, setAuthMethodDisplay] = useState<string>('');

  useEffect(() => {
    /**
     * Load the auto-lock display.
     */
    const loadAutoLockDisplay = async () : Promise<void> => {
      const autoLockTimeout = await getAutoLockTimeout();
      let display = 'Never';

      if (autoLockTimeout === 5) {
        display = '5 seconds';
      } else if (autoLockTimeout === 30) {
        display = '30 seconds';
      } else if (autoLockTimeout === 60) {
        display = '1 minute';
      } else if (autoLockTimeout === 900) {
        display = '15 minutes';
      } else if (autoLockTimeout === 1800) {
        display = '30 minutes';
      } else if (autoLockTimeout === 3600) {
        display = '1 hour';
      } else if (autoLockTimeout === 14400) {
        display = '4 hours';
      } else if (autoLockTimeout === 28800) {
        display = '8 hours';
      }

      setAutoLockDisplay(display);
    };

    /**
     * Load the auth method display.
     */
    const loadAuthMethodDisplay = async () : Promise<void> => {
      const authMethod = await getAuthMethodDisplay();
      setAuthMethodDisplay(authMethod);
    };

    loadAutoLockDisplay();
    loadAuthMethodDisplay();
  }, [getAutoLockTimeout, getAuthMethodDisplay, getBiometricDisplayName]);

  /**
   * Handle the logout.
   */
  const handleLogout = async () : Promise<void> => {
    await webApi.logout();
    router.replace('/login');
  };

  /**
   * Handle the vault unlock press.
   */
  const handleVaultUnlockPress = () : void => {
    router.push('/(tabs)/settings/vault-unlock');
  };

  /**
   * Handle the auto-lock press.
   */
  const handleAutoLockPress = () : void => {
    router.push('/(tabs)/settings/auto-lock');
  };

  /**
   * Handle the iOS autofill press.
   */
  const handleIosAutofillPress = () : void => {
    router.push('/(tabs)/settings/ios-autofill');
  };

  const styles = StyleSheet.create({
    avatar: {
      borderRadius: 20,
      height: 40,
      marginRight: 12,
      width: 40,
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      marginTop: 22,
      padding: 16,
    },
    scrollContent: {
      paddingBottom: 40,
      paddingTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      overflow: 'hidden',
    },
    separator: {
      backgroundColor: colors.accentBorder,
      height: StyleSheet.hairlineWidth,
      marginLeft: 52,
    },
    settingItem: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    settingItemBadge: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 16,
      justifyContent: 'center',
      marginRight: 8,
      width: 16,
    },
    settingItemBadgeText: {
      color: colors.primarySurfaceText,
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 16,
      textAlign: 'center',
    },
    settingItemContent: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 12,
    },
    settingItemIcon: {
      alignItems: 'center',
      height: 24,
      justifyContent: 'center',
      marginRight: 12,
      width: 24,
    },
    settingItemText: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
    },
    settingItemValue: {
      color: colors.textMuted,
      fontSize: 16,
      marginRight: 8,
    },
    userInfoContainer: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      flexDirection: 'row',
      marginBottom: 20,
    },
    usernameText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    versionContainer: {
      alignItems: 'center',
      marginTop: 20,
      paddingBottom: 16,
    },
    versionText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <ThemedSafeAreaView style={styles.container}>
      <CollapsibleHeader
        title="Settings"
        scrollY={scrollY}
        showNavigationHeader={true}
      />
      <ThemedView style={styles.content}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          scrollIndicatorInsets={{ bottom: 40 }}
          style={styles.scrollView}
        >
          <TitleContainer title="Settings" />
          <View style={styles.userInfoContainer}>
            <Image
              source={avatarImage}
              style={styles.avatar}
            />
            <ThemedText style={styles.usernameText}>Logged in as: {username}</ThemedText>
          </View>

          <View style={styles.section}>
            {Platform.OS === 'ios' && (
              <>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={handleIosAutofillPress}
                >
                  <View style={styles.settingItemIcon}>
                    <Ionicons name="key-outline" size={20} color={colors.text} />
                  </View>
                  <View style={styles.settingItemContent}>
                    <ThemedText style={styles.settingItemText}>iOS Autofill</ThemedText>
                    {shouldShowIosAutofillReminder && (
                      <View style={styles.settingItemBadge}>
                        <ThemedText style={styles.settingItemBadgeText}>1</ThemedText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.separator} />
              </>
            )}
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleVaultUnlockPress}
            >
              <View style={styles.settingItemIcon}>
                <Ionicons name="lock-closed" size={20} color={colors.text} />
              </View>
              <View style={styles.settingItemContent}>
                <ThemedText style={styles.settingItemText}>Vault Unlock Method</ThemedText>
                <ThemedText style={styles.settingItemValue}>{authMethodDisplay}</ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleAutoLockPress}
            >
              <View style={styles.settingItemIcon}>
                <Ionicons name="timer-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.settingItemContent}>
                <ThemedText style={styles.settingItemText}>Auto-lock Timeout</ThemedText>
                <ThemedText style={styles.settingItemValue}>{autoLockDisplay}</ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <View style={styles.settingItemIcon}>
                <Ionicons name="log-out" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingItemContent}>
                <ThemedText style={[styles.settingItemText, { color: colors.primary }]}>Logout</ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.versionContainer}>
            <ThemedText style={styles.versionText}>App version {AppInfo.VERSION}</ThemedText>
          </View>
        </Animated.ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}