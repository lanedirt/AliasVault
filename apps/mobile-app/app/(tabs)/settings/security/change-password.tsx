import { StyleSheet, View, TouchableOpacity, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { ThemedTextInput } from '@/components/themed/ThemedTextInput';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { useWebApi } from '@/context/WebApiContext';

/**
 * Change password screen.
 */
export default function ChangePasswordScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const webApi = useWebApi();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    button: {
      marginTop: 8,
    },
    container: {
      flex: 1,
      paddingBottom: insets.bottom,
      paddingHorizontal: 14,
      paddingTop: insets.top,
    },
    form: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      padding: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 8,
    },
    scrollContent: {
      paddingBottom: 40,
      paddingTop: 42,
    },
    scrollView: {
      flex: 1,
    },
  });

  /**
   *
   */
  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);

      // Verify current password
      /*
       * const isValid = await verifyPassword(currentPassword);
       *if (!isValid) {
       *Alert.alert('Error', 'Current password is incorrect');
       *return;
       *}
       *
       * // Create new vault version with new password
       *await createNewVersion(newPassword);
       *
       * // Submit to server
       *await webApi.submitVaultVersion(vault.getCurrentVersion());
       *
       *Alert.alert('Success', 'Password changed successfully', [
       *{ text: 'OK', onPress: () => router.back() }
       *]);
       */
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.scrollContent}>
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
      </View>
    </ThemedView>
  );
}