import { StyleSheet, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router, Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';
import { useVaultSync } from '@/hooks/useVaultSync';
import { useColors } from '@/hooks/useColorScheme';
import { CredentialCard } from '@/components/CredentialCard';
import emitter from '@/utils/EventEmitter';

export default function CredentialsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { syncVault } = useVaultSync();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const [isTabFocused, setIsTabFocused] = useState(false);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsTabFocused(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsTabFocused(false);
    });

    const sub = emitter.addListener('tabPress', (routeName: string) => {
      console.log('Tab press received:', routeName);
      if (routeName === '(credentials)' && isTabFocused) {
        console.log('Tab re-pressed while focused: reset screen');
        setSearchQuery(''); // Reset search
        setRefreshing(false); // Reset refreshing
        // Scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    return () => {
      sub.remove();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [isTabFocused]);

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
    try {
      const credentials = await dbContext.sqliteClient!.getAllCredentials();
      setCredentialsList(credentials);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
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
          // Calculate remaining time needed to reach minimum duration
          const elapsedTime = Date.now() - startTime;
          const remainingDelay = Math.max(0, 350 - elapsedTime);

          // Only delay if needed to reach minimum duration
          if (remainingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
          }

          await loadCredentials();
          setRefreshing(false);
        },
        onError: (error) => {
          console.error('Error syncing vault:', error);
        }
      });
    } catch (err) {
      console.error('Error refreshing credentials:', err);
      setRefreshing(false);
    }
  }, [syncVault, loadCredentials]);

  useEffect(() => {
    if (!isAuthenticated || !isDatabaseAvailable) {
      return;
    }

    setIsLoadingCredentials(true);
    loadCredentials();
    setIsLoadingCredentials(false);
  }, [isAuthenticated, isDatabaseAvailable]);

  const filteredCredentials = credentialsList.filter(credential => {
    const searchLower = searchQuery.toLowerCase();
    return (
      credential.ServiceName?.toLowerCase().includes(searchLower) ||
      credential.Username?.toLowerCase().includes(searchLower) ||
      credential.Alias?.Email?.toLowerCase().includes(searchLower) ||
      credential.ServiceUrl?.toLowerCase().includes(searchLower)
    );
  });

  const handleCredentialPress = (credentialId: string) => {
    Keyboard.dismiss();
    navigateToCredential(credentialId);
  };

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

  return (
    <ThemedSafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Credentials" }} />
      <ThemedView style={styles.content}>
        <ThemedView style={styles.stepContainer}>
          {isLoadingCredentials ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              ref={flatListRef}
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
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCredentialPress(item.Id)}
                  style={[styles.credentialItem]}
                  activeOpacity={0.7}
                >
                  <CredentialCard credential={item} />
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