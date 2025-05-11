import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedTextInput } from '@/components/themed/ThemedTextInput';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { useAuth } from '@/context/AuthContext';
import { useVaultMutate } from '@/hooks/useVaultMutate';
import LoadingOverlay from '@/components/LoadingOverlay';
import { UsernameDisplay } from '@/components/ui/UsernameDisplay';

/**
 * Change password screen.
 * @returns {React.ReactNode} The rendered component
 */
export default function ChangePasswordScreen(): React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { executeVaultPasswordChange, syncStatus } = useVaultMutate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const styles = StyleSheet.create({
    button: {
      marginTop: 8,
    },
    container: {
      flex: 1,
      marginTop: 42,
      paddingBottom: insets.bottom,
      paddingHorizontal: 14,
      paddingTop: insets.top,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    form: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      padding: 16,
    },
    header: {
      padding: 16,
      paddingBottom: 0,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 8,
    },
  });

  /**
   * Handle the submit button press.
   * @returns {Promise<void>} A promise that resolves when the operation is complete
   */
  const handleSubmit = async (): Promise<void> => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (!authContext.username) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStatus('Initiating password change...');

      const currentPasswordHashBase64 = await authContext.verifyPassword(currentPassword);
      if (!currentPasswordHashBase64) {
        Alert.alert('Error', 'Current password is not correct');
        return;
      }

      await executeVaultPasswordChange(currentPasswordHashBase64, newPassword);

      // Show confirm dialog and go back to the settings screen
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK',
          /**
           * Reset the password change state and go back to the settings screen
           */
          onPress: () : void => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            router.back();
          } }
      ]);
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return (
    <>
      {(isLoading) && (
        <LoadingOverlay status={syncStatus.length > 0 ? syncStatus : loadingStatus ?? ''} />
      )}
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <ThemedText style={styles.headerText}>
            Changing your master password also changes the vault encryption keys. It is advised to periodically change your master password to keep your vaults secure.
            </ThemedText>
          </View>
          <UsernameDisplay />
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Current Password</ThemedText>
              <ThemedTextInput
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>New Password</ThemedText>
              <ThemedTextInput
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm New Password</ThemedText>
              <ThemedTextInput
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
              />
            </View>

            <ThemedButton
              title="Change Password"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}