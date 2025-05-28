import { StyleSheet, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform, Animated, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { Credential } from '@/utils/types/Credential';
import { useVaultSync } from '@/hooks/useVaultSync';
import { useColors } from '@/hooks/useColorScheme';
import { CredentialCard } from '@/components/credentials/CredentialCard';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AndroidHeader } from '@/components/ui/AndroidHeader';
import emitter from '@/utils/EventEmitter';
import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ServiceUrlNotice } from '@/components/credentials/ServiceUrlNotice';

/**
 * Credentials screen.
 */
export default function CredentialsScreen() : React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const { syncVault } = useVaultSync();
  const webApi = useWebApi();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isTabFocused, setIsTabFocused] = useState(false);
  const router = useRouter();
  const { serviceUrl: serviceUrlParam } = useLocalSearchParams<{ serviceUrl?: string }>();
  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useMinDurationLoading(false, 200);
  const [refreshing, setRefreshing] = useMinDurationLoading(false, 200);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);

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

  const headerButtons = useMemo(() => [{
    icon: 'add' as const,
    position: 'right' as const,
    /**
     * Add credential.
     */
    onPress: () : void => router.push('/(tabs)/credentials/add-edit')
  }], [router]);

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
  }, [isTabFocused, loadCredentials, navigation, setRefreshing]);

  const onRefresh = useCallback(async () => {
    // Trigger haptic feedback when pull-to-refresh is activated
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setRefreshing(true);
    setIsLoadingCredentials(true);

    // Check if we are in offline mode, if so, we don't need to refresh the credentials
    const isOffline = authContext.isOffline;
    if (isOffline) {
      setRefreshing(false);
      setIsLoadingCredentials(false);
      return;
    }

    try {
      // Sync vault and load credentials
      await syncVault({
        /**
         * On success.
         */
        onSuccess: async (hasNewVault) => {
          // Calculate remaining time needed to reach minimum duration
          await loadCredentials();
          setIsLoadingCredentials(false);
          setRefreshing(false);
          setTimeout(() => {
            Toast.show({
              type: 'success',
              text1: hasNewVault ? 'Vault synced successfully' : 'Vault is up-to-date',
              position: 'top',
              visibilityTime: 1200,
            });
          }, 200);
        },
        /**
         * On offline.
         */
        onOffline: () => {
          setRefreshing(false);
          setIsLoadingCredentials(false);
          authContext.setOfflineMode(true);
          setTimeout(() => {
            Toast.show({
              type: 'error',
              text1: 'You are offline. Please connect to the internet to sync your vault.',
              position: 'bottom',
            });
          }, 200);
        },
        /**
         * On error.
         */
        onError: async (error) => {
          console.error('Error syncing vault:', error);
          setRefreshing(false);
          setIsLoadingCredentials(false);

          // Show modal with error message
          Alert.alert('Error', error);

          // Logout user
          await webApi.logout(error);
        },
      });
    } catch (err) {
      console.error('Error refreshing credentials:', err);
      setRefreshing(false);
      setIsLoadingCredentials(false);
      Toast.show({
        type: 'error',
        text1: 'Vault sync failed',
        text2: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [syncVault, loadCredentials, setIsLoadingCredentials, setRefreshing, webApi, authContext]);

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
      top: 4,
    },
    clearButtonText: {
      color: colors.textMuted,
      fontSize: 20,
    },
    contentContainer: {
      paddingBottom: 40,
      paddingTop: Platform.OS === 'ios' ? 42 : 0,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 24,
      opacity: 0.7,
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
      lineHeight: 20,
      marginBottom: 16,
      paddingLeft: 40,
      paddingRight: Platform.OS === 'android' ? 40 : 12,
    },
    stepContainer: {
      flex: 1,
      gap: 8,
    },
  });

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      /**
       * Define custom header which is shown on Android. iOS displays the custom CollapsibleHeader component instead.
       * @returns
       */
      headerTitle: (): React.ReactNode => Platform.OS === 'android' ? <AndroidHeader title="Credentials" headerButtons={headerButtons} /> : <Text>Credentials</Text>,
    });
  }, [navigation, headerButtons]);

  // Handle deep link parameters
  useFocusEffect(
    useCallback(() => {
      // Always check the current serviceUrlParam when screen comes into focus
      const currentServiceUrl = serviceUrlParam ? decodeURIComponent(serviceUrlParam) : null;
      setServiceUrl(currentServiceUrl);
    }, [serviceUrlParam])
  );

  return (
    <ThemedContainer>
      <CollapsibleHeader
        title="Credentials"
        scrollY={scrollY}
        showNavigationHeader={true}
        alwaysVisible={true}
        headerButtons={headerButtons}
      />
      <ThemedView style={styles.stepContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={isLoadingCredentials ? Array(4).fill(null) : filteredCredentials}
          keyExtractor={(item, index) => item?.Id ?? `skeleton-${index}`}
          keyboardShouldPersistTaps='handled'
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainer}
          scrollIndicatorInsets={{ bottom: 40 }}
          initialNumToRender={14}
          maxToRenderPerBatch={14}
          windowSize={7}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <ThemedView>
              <TitleContainer title="Credentials" />
              {serviceUrl && (
                <ServiceUrlNotice
                  serviceUrl={serviceUrl}
                  onDismiss={() => setServiceUrl(null)}
                />
              )}
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
          renderItem={({ item }) =>
            isLoadingCredentials ? (
              <SkeletonLoader count={1} height={60} parts={2} />
            ) : (
              <CredentialCard credential={item} />
            )
          }
          ListEmptyComponent={
            !isLoadingCredentials ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching credentials found' : 'No credentials found. Create one to get started. Tip: you can also login to the AliasVault web app to import credentials from other password managers.'}
              </Text>
            ) : null
          }
        />
      </ThemedView>
    </ThemedContainer>
  );
}