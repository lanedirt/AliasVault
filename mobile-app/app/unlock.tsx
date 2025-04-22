import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { NativeModules } from 'react-native';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';

export default function UnlockScreen() {
  const { isLoggedIn } = useAuth();
  const { initializeDatabase } = useDb();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      // Initialize the database with the provided password
      // We need to get the vault response from the API first
      const response = await fetch('https://api.aliasvault.net/v1/vault', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vault');
      }

      const vaultResponse: VaultResponse = await response.json();

      // Initialize the database with the vault response and password
      await initializeDatabase(vaultResponse, password);

      // If successful, navigate to credentials
      router.replace('/(tabs)/(credentials)');
    } catch (error) {
      Alert.alert('Error', 'Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear any stored tokens or session data
    // This will be handled by the auth context
    router.replace('/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Unlock Vault</ThemedText>
        <ThemedText style={styles.subtitle}>Enter your password to unlock your vault</ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleUnlock}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>

      {isLoading && <LoadingIndicator status="Unlocking vault..." />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
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
  logoutButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});