import { StyleSheet, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Platform, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';
import { useVaultSync } from '@/hooks/useVaultSync';
import { useColors } from '@/hooks/useColorScheme';
import { CredentialCard } from '@/components/CredentialCard';
import { TitleContainer } from '@/components/TitleContainer';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import emitter from '@/utils/EventEmitter';
import Toast from 'react-native-toast-message';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CredentialsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { syncVault } = useVaultSync();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isTabFocused, setIsTabFocused] = useState(false);
  const router = useRouter();

  const headerButtons = [{
    icon: 'add' as const,
    position: 'right' as const,
    onPress: () => router.push('/(tabs)/credentials/add-edit')
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
        console.log('Credentials tab re-pressed while focused: reset screen');
        setSearchQuery(''); // Reset search
        setRefreshing(false); // Reset refreshing
        // Scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    // Add listener for credential changes
    const credentialChangedSub = emitter.addListener('credentialChanged', async () => {
      console.log('Credential changed, refreshing list');
      await loadCredentials();
    });

    return () => {
      tabPressSub.remove();
      credentialChangedSub.remove();
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
        onSuccess: async (hasNewVault) => {
          // Calculate remaining time needed to reach minimum duration
          const elapsedTime = Date.now() - startTime;
          const remainingDelay = Math.max(0, 350 - elapsedTime);

          // Only delay if needed to reach minimum duration
          if (remainingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
          }

          await loadCredentials();
          setRefreshing(false);
          Toast.show({
            type: 'success',
            text1: hasNewVault ? 'Vault synced successfully' : 'Vault is up-to-date',
            position: 'top',
            visibilityTime: 1200,
          });
        },
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingTop: 0,
      marginTop: 36,
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
      paddingRight: Platform.OS === 'android' ? 40 : 12,
      paddingLeft: 40,
    },
    clearButton: {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: [{ translateY: -12 }],
      padding: 4,
    },
    searchIcon: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: [{ translateY: -17 }],
      zIndex: 1,
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
            <ActivityIndicator size="large" color={colors.primary} />
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
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
              scrollIndicatorInsets={{ bottom: 40 }}
              ListHeaderComponent={
                <ThemedView>
                  <TitleContainer title="Credentials" />
                  <ThemedView style={{ position: 'relative' }}>
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={colors.textMuted}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={[styles.searchInput]}
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
                        <ThemedText style={{ fontSize: 20, color: colors.textMuted }}>×</ThemedText>
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
              renderItem={({ item }) => (
                <CredentialCard credential={item} />
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