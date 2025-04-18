import { StyleSheet, Button, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useWebApi } from '@/context/WebApiContext';
import { router } from 'expo-router';
import { AppInfo } from '@/utils/AppInfo';
import { useColors } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const webApi = useWebApi();
  const colors = useColors();

  const handleLogout = async () => {
    await webApi.logout();
    router.replace('/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    settingsContainer: {
      flex: 1,
      gap: 8,
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      padding: 16,
      borderRadius: 8,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    versionContainer: {
      marginTop: 'auto',
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
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>
        <ThemedView style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.versionText}>Version {AppInfo.VERSION}</ThemedText>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}