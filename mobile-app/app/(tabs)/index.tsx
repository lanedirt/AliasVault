import { Image, StyleSheet, Platform, Button, View, FlatList, Text } from 'react-native';
import { NativeModules } from 'react-native';
import { useEffect, useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Credential {
  username: string;
  password: string;
  service: string;
}

export default function HomeScreen() {
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const fetchCredentials = async () => {
    try {
      const result = await NativeModules.CredentialManager.getCredentials();
      setCredentials(result);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  useEffect(() => {
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
    fetchCredentials(); // Refresh the list
  };

  const handleClearVault = async () => {
    // Call native module to clear credentials
    await NativeModules.CredentialManager.clearCredentials();
    setCredentials([]); // Clear the list
  };

  const renderCredential = (item: Credential) => (
    <ThemedView style={styles.credentialItem} key={`${item.service}-${item.username}`}>
      <ThemedText type="defaultSemiBold">Service: {item.service}</ThemedText>
      <ThemedText>Username: {item.username}</ThemedText>
      <ThemedText>Password: {item.password}</ThemedText>
    </ThemedView>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">AliasVault</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.buttonContainer}>
        <Button title="Insert Random Entry" onPress={handleInsertEntry} />
        <View style={styles.buttonSpacer} />
        <Button title="Clear Vault" onPress={handleClearVault} color="red" />
      </ThemedView>

      <ThemedView style={styles.credentialsContainer}>
        <ThemedText type="subtitle">Stored Credentials</ThemedText>
        <View style={styles.credentialsList}>
          {credentials.map(renderCredential)}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  buttonSpacer: {
    height: 8,
  },
  credentialsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  credentialsList: {
    marginTop: 8,
  },
  credentialItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
