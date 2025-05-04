import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useColors } from '@/hooks/useColorScheme';
import Logo from '@/assets/images/logo.svg';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { SrpUtility } from '@/utils/SrpUtility';
import { useWebApi } from '@/context/WebApiContext';
import avatarImage from '@/assets/images/avatar.webp';

/**
 * Unlock screen.
 */
export default function UnlockScreen() : React.ReactNode {
  const { isLoggedIn, username, isFaceIDEnabled } = useAuth();
  const { testDatabaseConnection } = useDb();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceIDAvailable, setIsFaceIDAvailable] = useState(false);
  const colors = useColors();
  const webApi = useWebApi();
  const srpUtil = new SrpUtility(webApi);

  useEffect(() => {
    /**
     * Check the face ID status.
     */
    const checkFaceIDStatus = async () : Promise<void> => {
      const enabled = await isFaceIDEnabled();
      setIsFaceIDAvailable(enabled);
    };
    checkFaceIDStatus();
  }, [isFaceIDEnabled]);

  /**
   * Handle the unlock.
   */
  const handleUnlock = async () : Promise<void> => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      if (!isLoggedIn || !username) {
        // No username means we're not logged in, redirect to login
        router.replace('/login');
        return;
      }

      // Initialize the database with the provided password
      const loginResponse = await srpUtil.initiateLogin(username);

      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      // Initialize the database with the vault response and password
      if (await testDatabaseConnection(passwordHashBase64)) {
        // Navigate to credentials
        router.replace('/(tabs)/credentials');
      } else {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle the logout.
   */
  const handleLogout = async () : Promise<void> => {
    /*
     * Clear any stored tokens or session data
     * This will be handled by the auth context
     */
    await webApi.logout();
    router.replace('/login');
  };

  /**
   * Handle the face ID retry.
   */
  const handleFaceIDRetry = async () : Promise<void> => {
    router.replace('/');
  };

  const styles = StyleSheet.create({
    avatar: {
      borderRadius: 20,
      height: 40,
      marginRight: 12,
      width: 40,
    },
    avatarContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    button: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 50,
      justifyContent: 'center',
      marginBottom: 16,
      width: '100%',
    },
    buttonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    container: {
      flex: 1,
    },
    content: {
      width: '100%',
    },
    faceIdButton: {
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
      marginBottom: 16,
      width: '100%',
    },
    faceIdButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      height: 50,
      paddingHorizontal: 16,
    },
    inputContainer: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 16,
      width: '100%',
    },
    inputIcon: {
      padding: 12,
    },
    keyboardAvoidingView: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    logo: {
      height: 80,
      width: 200,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logoutButton: {
      alignItems: 'center',
      height: 50,
      justifyContent: 'center',
      width: '100%',
    },
    logoutButtonText: {
      color: colors.primary,
      fontSize: 16,
    },
    subtitle: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 24,
      opacity: 0.7,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 16,
      paddingTop: 4,
      textAlign: 'center',
    },
    username: {
      color: colors.text,
      fontSize: 18,
      opacity: 0.8,
      textAlign: 'center',
    },
  });

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <LoadingIndicator status="Unlocking vault..." />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Logo style={styles.logo} />
            </View>
            <ThemedText style={styles.title}>Unlock Vault</ThemedText>
            <View style={styles.avatarContainer}>
              <Image
                source={avatarImage}
                style={styles.avatar}
              />
              <ThemedText style={styles.username}>{username}</ThemedText>
            </View>
            <ThemedText style={styles.subtitle}>Enter your password to unlock your vault</ThemedText>

            <View style={styles.inputContainer}>
              <MaterialIcons
                name="lock"
                size={24}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleUnlock}
              disabled={isLoading}
            >
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Unlocking...' : 'Unlock'}
              </ThemedText>
            </TouchableOpacity>

            {isFaceIDAvailable && (
              <TouchableOpacity
                style={styles.faceIdButton}
                onPress={handleFaceIDRetry}
              >
                <ThemedText style={styles.faceIdButtonText}>Try Face ID Again</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}