import { StyleSheet, View, Text, SafeAreaView, FlatList, ActivityIndicator, useColorScheme, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { router, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';

export default function CredentialsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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

  useEffect(() => {
    if (!isAuthenticated || !isDatabaseAvailable) {
      return;
    }

    const loadCredentials = async () => {
      setIsLoadingCredentials(true);
      try {
        const credentialsList = await dbContext.sqliteClient!.getAllCredentials();
        setCredentialsList(credentialsList);
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
      setIsLoadingCredentials(false);
    };

    loadCredentials();
  }, [isAuthenticated, isDatabaseAvailable]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Credentials" }} />
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Credentials</ThemedText>
      </ThemedView>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.stepContainer}>
          {isLoadingCredentials ? (
            <ActivityIndicator size="large" color="#f97316" />
          ) : (
            <FlatList
              data={credentialsList}
              keyExtractor={(item) => item.Id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigateToCredential(item.Id)}
                  style={[styles.credentialItem, dynamicStyles.credentialItem]}
                >
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
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
                  No credentials found
                </Text>
              }
            />
          )}
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
  credentialItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
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
}); 