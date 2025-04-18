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
import { useVaultSync } from '@/hooks/useVaultSync';
import { useColors } from '@/hooks/useColorScheme';
export default function CredentialsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { syncVault } = useVaultSync();
  const colors = useColors();

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
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
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
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    credentialText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 16,
      marginTop: 24,
    },
    searchInput: {
      backgroundColor: colors.accentBackground,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      fontSize: 16,
    },
  });

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

      // Sync vault and load credentials
      await syncVault({
        forceCheck: true,
        onSuccess: async () => {
          await loadCredentials();
        },
        onError: (error) => {
          console.error('Error syncing vault:', error);
        }
      });

      // Calculate remaining time needed to reach 350ms minimum
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(0, 350 - elapsedTime);

      // Only delay if needed to reach minimum 350ms
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }
    } catch (err) {
      console.error('Error refreshing credentials:', err);
    } finally {
      setRefreshing(false);
    }
  }, [syncVault, loadCredentials]);

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
        <ThemedView style={styles.stepContainer}>
          {isLoadingCredentials ? (
            <ActivityIndicator size="large" color={colors.primaryButton} />
          ) : (
            <FlatList
              data={filteredCredentials}
              keyExtractor={(item) => item.Id}
              keyboardShouldPersistTaps='handled'
              ListHeaderComponent={
                <ThemedView>
                  <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">Credentials</ThemedText>
                  </ThemedView>
                    <TextInput
                    style={[styles.searchInput]}
                    placeholder="Search credentials..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </ThemedView>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primaryButton]}
                  tintColor={isDarkMode ? colors.primaryButton : colors.primaryButton}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCredentialPress(item.Id)}
                  style={[styles.credentialItem]}
                  activeOpacity={0.7}
                >
                  <View style={styles.credentialContent}>
                    <CredentialIcon logo={item.Logo} style={styles.logo} />
                    <View style={styles.credentialInfo}>
                      <Text style={[styles.serviceName]}>
                        {item.ServiceName ?? 'Unknown Service'}
                      </Text>
                      {item.Username && (
                        <Text style={[styles.credentialText]}>
                          Username: {item.Username}
                        </Text>
                      )}
                      {item.Alias?.Email && (
                        <Text style={[styles.credentialText]}>
                          Email: {item.Alias.Email}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText]}>
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