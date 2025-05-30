import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { SettingsHeader } from '@/components/ui/SettingsHeader';
import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';

/**
 * Security settings screen.
 */
export default function SecuritySettingsScreen() : React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
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
    settingItemContent: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
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
  });

  return (
    <ThemedContainer>
      <ThemedScrollView>
        <SettingsHeader title="Security" description="Manage your account and vault security settings." icon="shield-checkmark" />
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/security/change-password')}
          >
            <View style={styles.settingItemIcon}>
              <Ionicons name="key" size={20} color={colors.text} />
            </View>
            <View style={styles.settingItemContent}>
              <ThemedText style={styles.settingItemText}>Change Master Password</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/security/active-sessions')}
          >
            <View style={styles.settingItemIcon}>
              <Ionicons name="desktop" size={20} color={colors.text} />
            </View>
            <View style={styles.settingItemContent}>
              <ThemedText style={styles.settingItemText}>Active Sessions</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/security/auth-logs')}
          >
            <View style={styles.settingItemIcon}>
              <Ionicons name="list" size={20} color={colors.text} />
            </View>
            <View style={styles.settingItemContent}>
              <ThemedText style={styles.settingItemText}>Recent Auth Logs</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/security/delete-account')}
          >
            <View style={styles.settingItemIcon}>
              <Ionicons name="trash" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingItemContent}>
              <ThemedText style={[styles.settingItemText, { color: colors.primary }]}>Delete Account</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </ThemedScrollView>
    </ThemedContainer>
  );
}