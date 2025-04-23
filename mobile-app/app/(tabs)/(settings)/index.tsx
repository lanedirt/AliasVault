import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useWebApi } from '@/context/WebApiContext';
import { router } from 'expo-router';
import { AppInfo } from '@/utils/AppInfo';
import { useColors } from '@/hooks/useColorScheme';
import { TitleContainer } from '@/components/TitleContainer';
import { useAuth } from '@/context/AuthContext';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { Ionicons } from '@expo/vector-icons';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useRef, useState, useEffect } from 'react';

export default function SettingsScreen() {
  const webApi = useWebApi();
  const colors = useColors();
  const { username, getAuthMethodDisplay } = useAuth();
  const { getAutoLockTimeout } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoLockDisplay, setAutoLockDisplay] = useState<string>('');

  useEffect(() => {
    const loadAutoLockDisplay = async () => {
      const autoLockTimeout = await getAutoLockTimeout();
      let display = 'Never';

      if (autoLockTimeout === 5) display = '5 seconds';
      else if (autoLockTimeout === 30) display = '30 seconds';
      else if (autoLockTimeout === 60) display = '1 minute';
      else if (autoLockTimeout === 900) display = '15 minutes';
      else if (autoLockTimeout === 1800) display = '30 minutes';
      else if (autoLockTimeout === 3600) display = '1 hour';
      else if (autoLockTimeout === 14400) display = '4 hours';
      else if (autoLockTimeout === 28800) display = '8 hours';

      setAutoLockDisplay(display);
    };

    loadAutoLockDisplay();
  }, [getAutoLockTimeout]);

  const handleLogout = async () => {
    await webApi.logout();
    router.replace('/login');
  };

  const handleVaultUnlockPress = () => {
    router.push('/(tabs)/(settings)/vault-unlock');
  };

  const handleAutoLockPress = () => {
    router.push('/(tabs)/(settings)/auto-lock');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      marginTop: 22,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    section: {
      marginTop: 20,
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.accentBackground,
    },
    settingItemIcon: {
      width: 24,
      height: 24,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingItemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingItemContentWithBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.accentBorder,
    },
    settingItemText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    settingItemValue: {
      fontSize: 16,
      color: colors.textMuted,
      marginRight: 8,
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      marginBottom: 20,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    usernameText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      padding: 16,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 20,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    versionContainer: {
      marginTop: 20,
      alignItems: 'center',
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
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          scrollIndicatorInsets={{ bottom: 40 }}
          style={styles.scrollView}
        >
          <TitleContainer title="Settings" />
          <View style={styles.userInfoContainer}>
            <Image
              source={require('@/assets/images/avatar.webp')}
              style={styles.avatar}
            />
            <ThemedText style={styles.usernameText}>Logged in as: {username}</ThemedText>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleVaultUnlockPress}
            >
              <View style={styles.settingItemIcon}>
                <Ionicons name="lock-closed" size={20} color={colors.text} />
              </View>
              <View style={[styles.settingItemContent]}>
                <ThemedText style={styles.settingItemText}>Vault Unlock Method</ThemedText>
                <ThemedText style={styles.settingItemValue}>{getAuthMethodDisplay()}</ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemContentWithBorder]}
              onPress={handleAutoLockPress}
            >
              <View style={styles.settingItemIcon}>
                <Ionicons name="timer-outline" size={20} color={colors.text} />
              </View>
              <View style={[styles.settingItemContent]}>
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
                <Ionicons name="log-out" size={20} color="#FF3B30" />
              </View>
              <View style={[styles.settingItemContent]}>
                <ThemedText style={[styles.settingItemText, { color: '#FF3B30' }]}>Logout</ThemedText>
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