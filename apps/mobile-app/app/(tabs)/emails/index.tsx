import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, RefreshControl, Animated } from 'react-native';
import { useNavigation } from 'expo-router';

import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedText } from '@/components/themed/ThemedText';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { MailboxBulkRequest, MailboxBulkResponse } from '@/utils/types/webapi/MailboxBulk';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedSafeAreaView } from '@/components/themed/ThemedSafeAreaView';
import { EmailCard } from '@/components/EmailCard';
import emitter from '@/utils/EventEmitter';

/**
 * Hook for minimum duration loading state.
 */
const useMinDurationLoading = (
  initialState: boolean,
  minDuration: number
): [boolean, (newState: boolean) => void] => {
  const [state, setState] = useState(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setStateWithMinDuration = useCallback(
    (newState: boolean) => {
      if (newState) {
        setState(true);
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => setState(false), minDuration);
      }
    },
    [minDuration] // ✅ No dependency on timerRef, it won't change
  );

  useEffect(() => {
    return () : void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [state, setStateWithMinDuration];
};

/**
 * Emails screen.
 */
export default function EmailsScreen() : React.ReactNode {
  const dbContext = useDb();
  const webApi = useWebApi();
  const colors = useColors();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(false);

  /**
   * Load emails.
   */
  const loadEmails = useCallback(async () : Promise<void> => {
    try {
      setError(null);

      if (!dbContext?.sqliteClient) {
        return;
      }

      // Get unique email addresses from all credentials
      const emailAddresses = await dbContext.sqliteClient.getAllEmailAddresses();

      try {
        // For now we only show the latest 50 emails. No pagination.
        const data = await webApi.post<MailboxBulkRequest, MailboxBulkResponse>('EmailBox/bulk', {
          addresses: emailAddresses,
          page: 1,
          pageSize: 50,
        });

        // Decrypt emails locally using private key associated with the email address
        const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();

        // Decrypt emails locally using public/private key pairs
        const decryptedEmails = await EncryptionUtility.decryptEmailList(data.mails, encryptionKeys);

        setEmails(decryptedEmails);
        setIsLoading(false);
      } catch {
        throw new Error('Failed to load emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [dbContext?.sqliteClient, webApi, setIsLoading]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsTabFocused(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsTabFocused(false);
    });

    const sub = emitter.addListener('tabPress', (routeName: string) => {
      if (routeName === 'emails' && isTabFocused) {
        // Scroll to top
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });

    /*
     * Add listener for email refresh which other components can trigger,
     * e.g. the email delete event in email details screen.
     */
    const refreshSub = emitter.addListener('refreshEmails', () => {
      loadEmails();
    });

    return () : void => {
      sub.remove();
      unsubscribeFocus();
      unsubscribeBlur();
      refreshSub.remove();
    };
  }, [isTabFocused, loadEmails, navigation]);

  /**
   * Load emails on mount.
   */
  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  /**
   * Refresh the emails on pull to refresh.
   */
  const onRefresh = useCallback(async () : Promise<void> => {
    setIsRefreshing(true);
    await loadEmails();
    setIsRefreshing(false);
  }, [loadEmails]);

  const styles = StyleSheet.create({
    centerContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    contentContainer: {
      paddingBottom: 40,
      paddingTop: 26,
    },
    emptyText: {
      color: colors.textMuted,
      opacity: 0.7,
      textAlign: 'center',
    },
    errorText: {
      color: colors.errorBackground,
      textAlign: 'center',
    },
  });

  /**
   * Render the content.
   */
  const renderContent = () : React.ReactNode => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        </View>
      );
    }

    if (emails.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>
              You have not received any emails at your private email addresses yet. When you receive a new email, it will appear here.
          </ThemedText>
        </View>
      );
    }

    return emails.map((email) => (
      <EmailCard key={email.id} email={email} />
    ));
  };

  return (
    <ThemedSafeAreaView style={styles.container}>
      <CollapsibleHeader
        title="Emails"
        scrollY={scrollY}
        showNavigationHeader={true}
      />
      <ThemedView style={styles.content}>
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.contentContainer}
          scrollIndicatorInsets={{ bottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <TitleContainer title="Emails" />
          {renderContent()}
        </Animated.ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}
