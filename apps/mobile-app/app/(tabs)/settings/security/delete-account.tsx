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
import { useAuth } from '@/context/AuthContext';

/**
 * Delete account screen.
 */
export default function DeleteAccountScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const webApi = useWebApi();
  const { username } = useAuth();

  const [confirmUsername, setConfirmUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'username' | 'password'>('username');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: insets.bottom,
      paddingHorizontal: 14,
      paddingTop: insets.top,
    },
    scrollContent: {
      paddingBottom: 40,
      paddingTop: 42,
    },
    scrollView: {
      flex: 1,
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
    warningText: {
      color: colors.error,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    button: {
      marginTop: 8,
    },
    buttonDanger: {
      backgroundColor: colors.error,
    },
  });

  const handleUsernameSubmit = () => {
    if (confirmUsername !== username) {
      Alert.alert('Error', 'Username does not match');
      return;
    }
    setStep('password');
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              // Verify password
              /*const isValid = await vault.verifyPassword(password);
              if (!isValid) {
                Alert.alert('Error', 'Password is incorrect');
                return;
              }

              // Delete account
              await webApi.deleteAccount();*/

              // Log out and return to login
              await webApi.logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.scrollContent}>
        <View style={styles.form}>
          {step === 'username' ? (
            <>
              <ThemedText style={styles.warningText}>
                Warning: This action cannot be undone. All your data will be permanently deleted.
              </ThemedText>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Enter your username to confirm</ThemedText>
                <ThemedTextInput
                  value={confirmUsername}
                  onChangeText={setConfirmUsername}
                  placeholder="Enter username"
                  autoCapitalize="none"
                />
              </View>
              <ThemedButton
                title="Continue"
                onPress={handleUsernameSubmit}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <ThemedText style={styles.warningText}>
                Please enter your password to confirm account deletion
              </ThemedText>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <ThemedTextInput
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                />
              </View>
              <ThemedButton
                title="Delete Account"
                onPress={handleDeleteAccount}
                loading={isLoading}
                style={[styles.button, styles.buttonDanger]}
              />
            </>
          )}
        </View>
      </View>
    </ThemedView>
  );
}