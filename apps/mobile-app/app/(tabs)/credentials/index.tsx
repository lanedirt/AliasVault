import { StyleSheet, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform, Animated, View } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedSafeAreaView } from '@/components/themed/ThemedSafeAreaView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';
import { useVaultSync } from '@/hooks/useVaultSync';
import { useColors } from '@/hooks/useColorScheme';
import { CredentialCard } from '@/components/credentials/CredentialCard';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import emitter from '@/utils/EventEmitter';
import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';

/**
 * Credentials screen.
 */
export default function CredentialsScreen() : React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { syncVault } = useVaultSync();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isTabFocused, setIsTabFocused] = useState(false);
  const router = useRouter();
  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useMinDurationLoading(false, 300);

  const authContext = useAuth();
  const dbContext = useDb();

  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;

  /**
   * Load credentials.
   */
  const loadCredentials = useCallback(async () : Promise<void> => {
    try {
      const credentials = await dbContext.sqliteClient!.getAllCredentials();
      setCredentialsList(credentials);
      setIsLoadingCredentials(false);
    } catch (err) {
      // Error loading credentials, show error toast
      Toast.show({
        type: 'error',
        text1: 'Error loading credentials',
        text2: err instanceof Error ? err.message : 'Unknown error',
      });
      setIsLoadingCredentials(false);
    }
  }, [dbContext.sqliteClient, setIsLoadingCredentials]);

  const headerButtons = [{
    icon: 'add' as const,
    position: 'right' as const,
    /**
     * Add credential.
     */
    onPress: () : void => router.push('/(tabs)/credentials/add-edit')
  }];

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsTabFocused(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsTabFocused(false);
    });

    const tabPressSub = emitter.addListener('tabPress', (routeName: string) => {
      if (routeName === 'credentials' && isTabFocused) {
        setSearchQuery(''); // Reset search
        setRefreshing(false); // Reset refreshing
        // Scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    // Add listener for credential changes
    const credentialChangedSub = emitter.addListener('credentialChanged', async () => {
      await loadCredentials();
    });

    return () : void => {
      tabPressSub.remove();
      credentialChangedSub.remove();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [isTabFocused, loadCredentials, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Sync vault and load credentials
      await syncVault({
        /**
         * On success.
         */
        onSuccess: async (hasNewVault) => {
          // Calculate remaining time needed to reach minimum duration
          setIsLoadingCredentials(true);
          await loadCredentials();
          setIsLoadingCredentials(false);
          setRefreshing(false);
          Toast.show({
            type: 'success',
            text1: hasNewVault ? 'Vault synced successfully' : 'Vault is up-to-date',
            position: 'top',
            visibilityTime: 1200,
          });
        },
        /**
         * On error.
         */
        onError: (error) => {
          console.error('Error syncing vault:', error);
          setRefreshing(false);
          Toast.show({
            type: 'error',
            text1: 'Vault sync failed',
            text2: error,
          });
        },
      });
    } catch (err) {
      console.error('Error refreshing credentials:', err);
      setRefreshing(false);
      Toast.show({
        type: 'error',
        text1: 'Vault sync failed',
        text2: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [syncVault, loadCredentials, setIsLoadingCredentials]);

  useEffect(() => {
    if (!isAuthenticated || !isDatabaseAvailable) {
      return;
    }

    setIsLoadingCredentials(true);
    loadCredentials();
  }, [isAuthenticated, isDatabaseAvailable, loadCredentials, setIsLoadingCredentials]);

  const filteredCredentials = credentialsList.filter(credential => {
    const searchLower = searchQuery.toLowerCase();

    return (
      credential.ServiceName?.toLowerCase().includes(searchLower) ??
      credential.Username?.toLowerCase().includes(searchLower) ??
      credential.Alias?.Email?.toLowerCase().includes(searchLower) ??
      credential.ServiceUrl?.toLowerCase().includes(searchLower)
    );
  });

  const styles = StyleSheet.create({
    clearButton: {
      padding: 4,
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: [{ translateY: -12 }],
    },
    clearButtonText: {
      color: colors.textMuted,
      fontSize: 20,
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingTop: 0,
    },
    contentContainer: {
      paddingBottom: 40,
      paddingTop: 42,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 24,
      textAlign: 'center',
    },
    searchContainer: {
      position: 'relative',
    },
    searchIcon: {
      left: 12,
      position: 'absolute',
      top: 11,
      zIndex: 1,
    },
    searchInput: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      color: colors.text,
      fontSize: 16,
      height: 40,
      marginBottom: 16,
      padding: 12,
      paddingLeft: 40,
      paddingRight: Platform.OS === 'android' ? 40 : 12,
    },
    stepContainer: {
      flex: 1,
      gap: 8,
    },
  });

  return (
    <ThemedSafeAreaView style={styles.container}>
      <CollapsibleHeader
        title="Credentials"
        scrollY={scrollY}
        showNavigationHeader={true}
        alwaysVisible={true}
        headerButtons={headerButtons}
      />

      <ThemedView style={styles.content}>
        <ThemedView style={styles.stepContainer}>
          {isLoadingCredentials ? (
            <View style={styles.contentContainer}>
              <TitleContainer title="Credentials" />
              <SkeletonLoader count={4} height={60} parts={2} />
            </View>
          ) : (
            <Animated.FlatList
              ref={flatListRef}
              data={filteredCredentials}
              keyExtractor={(item) => item.Id}
              keyboardShouldPersistTaps='handled'
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              contentContainerStyle={styles.contentContainer}
              scrollIndicatorInsets={{ bottom: 40 }}
              ListHeaderComponent={
                <ThemedView>
                  <TitleContainer title="Credentials" />
                  <ThemedView style={styles.searchContainer}>
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={colors.textMuted}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search credentials..."
                      placeholderTextColor={colors.textMuted}
                      value={searchQuery}
                      autoCorrect={false}
                      autoCapitalize="none"
                      onChangeText={setSearchQuery}
                      clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
                    />
                    {Platform.OS === 'android' && searchQuery.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                      >
                        <ThemedText style={styles.clearButtonText}>×</ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>
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
              renderItem={({ item }) => <CredentialCard credential={item} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
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