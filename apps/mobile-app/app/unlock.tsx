import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
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
import { MaterialIcons } from '@expo/vector-icons';

export default function UnlockScreen() {
  const { isLoggedIn, username, isFaceIDEnabled } = useAuth();
  const { testDatabaseConnection } = useDb();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceIDAvailable, setIsFaceIDAvailable] = useState(false);
  const colors = useColors();
  const webApi = useWebApi();
  const srpUtil = new SrpUtility(webApi);

  useEffect(() => {
    const checkFaceIDStatus = async () => {
      const enabled = await isFaceIDEnabled();
      setIsFaceIDAvailable(enabled);
    };
    checkFaceIDStatus();
  }, [isFaceIDEnabled]);

  const handleUnlock = async () => {
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

      console.log('loginResponse', loginResponse);

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
      }
      else {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear any stored tokens or session data
    // This will be handled by the auth context
    await webApi.logout();
    router.replace('/login');
  };

  const handleFaceIDRetry = async () => {
    router.replace('/');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardAvoidingView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    content: {
      width: '100%',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      width: 200,
      height: 80,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
      paddingTop: 4,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    username: {
      fontSize: 18,
      textAlign: 'center',
      opacity: 0.8,
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 24,
      textAlign: 'center',
      opacity: 0.7,
      color: colors.text,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      marginBottom: 16,
      backgroundColor: colors.accentBackground,
    },
    inputIcon: {
      padding: 12,
    },
    input: {
      flex: 1,
      height: 50,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      width: '100%',
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    faceIdButton: {
      width: '100%',
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    faceIdButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    logoutButton: {
      width: '100%',
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButtonText: {
      color: colors.primary,
      fontSize: 16,
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
                source={require('@/assets/images/avatar.webp')}
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