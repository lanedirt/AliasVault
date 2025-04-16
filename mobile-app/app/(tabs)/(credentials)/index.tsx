import { StyleSheet, View, Text, FlatList, ActivityIndicator, useColorScheme, TouchableOpacity, TextInput, Keyboard, Image, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';
import { CredentialIcon } from '@/components/CredentialIcon';

export default function CredentialsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const dynamicStyles = {
    credentialItem: {
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
    },
    serviceName: {
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
    credentialText: {
      color: isDarkMode ? '#d1d5db' : '#4b5563',
    },
    emptyText: {
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
    searchInput: {
      backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
  };

  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  const authContext = useAuth();
  const dbContext = useDb();

  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;

  const navigateToCredential = (credentialId: string) => {
    console.log('Navigating to credential:', credentialId);
    router.push(`/(tabs)/(credentials)/${credentialId}`);
  };

  const loadCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const credentials = await dbContext.sqliteClient!.getAllCredentials();
      setCredentialsList(credentials);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
    setIsLoadingCredentials(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Record start time
      const startTime = Date.now();

      // Load data
      const credentials = await dbContext.sqliteClient!.getAllCredentials();

      // Calculate remaining time needed to reach 350ms minimum
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 350 - elapsedTime);

      // Only delay if needed to reach minimum 350ms
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }

      // Update the data
      setCredentialsList(credentials);
      setRefreshing(false);
    } catch (err) {
      console.error('Error refreshing credentials:', err);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isDatabaseAvailable) {
      return;
    }

    loadCredentials();
  }, [isAuthenticated, isDatabaseAvailable]);

  const filteredCredentials = credentialsList.filter(credential => {
    const searchLower = searchQuery.toLowerCase();
    return (
      credential.ServiceName?.toLowerCase().includes(searchLower) ||
      credential.Username?.toLowerCase().includes(searchLower) ||
      credential.Alias?.Email?.toLowerCase().includes(searchLower)
    );
  });

  const handleCredentialPress = (credentialId: string) => {
    Keyboard.dismiss();
    navigateToCredential(credentialId);
  };

  return (
    <ThemedSafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Credentials" }} />
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Credentials</ThemedText>
        </ThemedView>
        <TextInput
          style={[styles.searchInput, dynamicStyles.searchInput]}
          placeholder="Search credentials..."
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ThemedView style={styles.stepContainer}>
          {isLoadingCredentials ? (
            <ActivityIndicator size="large" color="#f97316" />
          ) : (
            <FlatList
              data={filteredCredentials}
              keyExtractor={(item) => item.Id}
              keyboardShouldPersistTaps='handled'
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#f97316']}
                  tintColor={isDarkMode ? '#f97316' : '#f97316'}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCredentialPress(item.Id)}
                  style={[styles.credentialItem, dynamicStyles.credentialItem]}
                  activeOpacity={0.7}
                >
                  <View style={styles.credentialContent}>
                    <CredentialIcon logo={item.Logo} style={styles.logo} />
                    <View style={styles.credentialInfo}>
                      <Text style={[styles.serviceName, dynamicStyles.serviceName]}>
                        {item.ServiceName ?? 'Unknown Service'}
                      </Text>
                      {item.Username && (
                        <Text style={[styles.credentialText, dynamicStyles.credentialText]}>
                          Username: {item.Username}
                        </Text>
                      )}
                      {item.Alias?.Email && (
                        <Text style={[styles.credentialText, dynamicStyles.credentialText]}>
                          Email: {item.Alias.Email}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
                  {searchQuery ? 'No matching credentials found' : 'No credentials found'}
                </Text>
              }
            />
          )}
        </ThemedView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 80,
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
  credentialItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  credentialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 12,
  },
  credentialInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  credentialText: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 24,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
});