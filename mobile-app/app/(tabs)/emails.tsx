import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedText } from '@/components/ThemedText';
import { TitleContainer } from '@/components/TitleContainer';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MailboxBulkRequest, MailboxBulkResponse } from '@/utils/types/webapi/MailboxBulk';
import EncryptionUtility from '@/utils/EncryptionUtility';

// Simple hook for minimum duration loading state
const useMinDurationLoading = (initialState: boolean, minDuration: number): [boolean, (newState: boolean) => void] => {
  const [state, setState] = useState(initialState);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const setStateWithMinDuration = useCallback((newState: boolean) => {
    if (newState) {
      setState(true);
    } else {
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => setState(false), minDuration);
      setTimer(newTimer);
    }
  }, [minDuration, timer]);

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  return [state, setStateWithMinDuration];
};

export default function EmailsScreen() {
  const router = useRouter();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 100);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      } catch (error) {
        console.error(error);
        throw new Error('Failed to load emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [dbContext?.sqliteClient, webApi]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEmails();
    setIsRefreshing(false);
  }, [loadEmails]);

  const formatEmailDate = (dateSystem: string): string => {
    const now = new Date();
    const emailDate = new Date(dateSystem);
    const secondsAgo = Math.floor((now.getTime() - emailDate.getTime()) / 1000);

    if (secondsAgo < 60) {
      return 'just now';
    } else if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (secondsAgo < 172800) {
      return 'yesterday';
    } else {
      return emailDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const renderContent = () => {
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
      <TouchableOpacity
        key={email.id}
        style={styles.emailCard}
        onPress={() => router.push(`/emails/${email.id}`)}
      >
        <View style={styles.emailHeader}>
          <ThemedText style={styles.emailSubject} numberOfLines={1}>
            {email.subject}
          </ThemedText>
          <ThemedText style={styles.emailDate}>
            {formatEmailDate(email.dateSystem)}
          </ThemedText>
        </View>
        <ThemedText style={styles.emailPreview} numberOfLines={2}>
          {email.messagePreview}
        </ThemedText>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="envelope.fill"
            style={styles.headerImage}
          />
        }
      >
        <TitleContainer title="Emails" />
        {renderContent()}
      </ParallaxScrollView>
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  emailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  emailSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emailDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  emailPreview: {
    fontSize: 14,
    opacity: 0.8,
  },
  refreshIndicator: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
  },
});
