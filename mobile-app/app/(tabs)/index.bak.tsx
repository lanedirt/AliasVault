import { Image, StyleSheet, Platform, Button, View, FlatList, Text, SafeAreaView, AppState } from 'react-native';
import { NativeModules } from 'react-native';
import { useState, useEffect, useRef } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Credential {
  username: string;
  password: string;
  service: string;
}

export default function HomeScreen() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const appState = useRef(AppState.currentState);

  const fetchCredentials = async () => {
    console.log('Fetching credentials called');
    try {
      const result = await NativeModules.CredentialManager.getCredentials();
      setCredentials(result);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        fetchCredentials();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    console.log('Fetching credentials in useEffect once on mount');
    fetchCredentials();
  }, []);

  const handleInsertEntry = async () => {
    // Generate a random credential
    const randomUsername = `user${Math.floor(Math.random() * 1000)}`;
    const randomPassword = `pass${Math.floor(Math.random() * 1000)}`;
    const randomService = `service${Math.floor(Math.random() * 1000)}`;
    
    // Call native module to add credential
    await NativeModules.CredentialManager.addCredential(randomUsername, randomPassword, randomService);
    // Add a small delay to ensure the operation is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Fetching credentials after insert');
    fetchCredentials(); // Refresh the list
  };

  const renderCredential = (item: Credential) => (
    <ThemedView style={styles.credentialItem} key={`${item.service}-${item.username}`}>
      <ThemedText type="defaultSemiBold">Service: {item.service}</ThemedText>
      <ThemedText>Username: {item.username}</ThemedText>
      <ThemedText>Password: {item.password}</ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">AliasVault</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Credentials</ThemedText>
          <Button title="Add Random Credential" onPress={handleInsertEntry} />
          <FlatList
            data={credentials}
            renderItem={({ item }) => renderCredential(item)}
            keyExtractor={(item) => `${item.service}-${item.username}`}
          />
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

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
  stepContainer: {
    flex: 1,
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  credentialItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
});
