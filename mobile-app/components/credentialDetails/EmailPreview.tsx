import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useWebApi } from '@/context/WebApiContext';
import { useDb } from '@/context/DbContext';
import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';
import { MailboxBulkRequest, MailboxBulkResponse } from '@/utils/types/webapi/MailboxBulk';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ThemedText } from '../ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { ThemedView } from '../ThemedView';
import { AppInfo } from '@/utils/AppInfo';
import { PulseDot } from '@/components/PulseDot';

type EmailPreviewProps = {
  email: string | undefined;
};

export const EmailPreview: React.FC<EmailPreviewProps> = ({ email }) => {
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastEmailId, setLastEmailId] = useState<number>(0);
  const [isSpamOk, setIsSpamOk] = useState(false);
  const webApi = useWebApi();
  const dbContext = useDb();
  const colors = useColors();

  // Sanity check: if no email is provided, don't render anything.
  if (!email) {
    return null;
  }

  const isPublicDomain = async (emailAddress: string): Promise<boolean> => {
    // TODO: Implement public domain check similar to browser extension
    // For now, we'll just check if it's a spamok.com domain
    return emailAddress.toLowerCase().endsWith('@spamok.com');
  };

  useEffect(() => {
    const loadEmails = async () => {
      try {
        const isPublic = await isPublicDomain(email);
        setIsSpamOk(isPublic);

        if (isPublic) {
          // For public domains (SpamOK), use the SpamOK API directly
          const emailPrefix = email.split('@')[0];
          const response = await fetch(`https://api.spamok.com/v2/EmailBox/${emailPrefix}`, {
            headers: {
              'X-Asdasd-Platform-Id': 'av-mobile',
              'X-Asdasd-Platform-Version': AppInfo.VERSION,
            }
          });
          const data = await response.json();

          // Only show the latest 2 emails to save space in UI
          const latestMails = data?.mails
            ?.sort((a: MailboxEmail, b: MailboxEmail) =>
              new Date(b.dateSystem).getTime() - new Date(a.dateSystem).getTime())
            ?.slice(0, 2) ?? [];

          if (loading && latestMails.length > 0) {
            setLastEmailId(latestMails[0].id);
          }

          setEmails(latestMails);
        } else {
          // For private domains, use existing encrypted email logic
          if (!dbContext?.sqliteClient) return;

          // Get all encryption keys
          const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();

          // Only fetch emails for the provided email address
          const data = await webApi.post<MailboxBulkRequest, MailboxBulkResponse>('EmailBox/bulk', {
            addresses: [email],
            page: 1,
            pageSize: 2,
          });

          // For each email, find its matching encryption key based on the public key
          const decryptedEmails = await Promise.all(data.mails.map(async (mail) => {
            const matchingKey = encryptionKeys.find(key => key.PublicKey === mail.encryptionKey);
            if (!matchingKey) {
              console.error('No encryption key found for email:', mail.id);
              return null;
            }
            return await EncryptionUtility.decryptEmailList([mail], [matchingKey]);
          }));

          // Filter out any null results and set the emails
          const validEmails = decryptedEmails
            .filter((result): result is MailboxEmail[] => result !== null)
            .flat();

          if (loading && validEmails.length > 0) {
            setLastEmailId(validEmails[0].id);
          }

          setEmails(validEmails);
        }
      } catch (err) {
        console.error('Error loading emails:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
    // Set up auto-refresh interval
    const interval = setInterval(loadEmails, 2000);
    return () => clearInterval(interval);
  }, [email, loading, webApi, dbContext]);

  const styles = StyleSheet.create({
    section: {
      padding: 16,
      paddingBottom: 0,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    emailItem: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentBackground,
    },
    subject: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
    date: {
      fontSize: 12,
      opacity: 0.7,
      color: colors.textMuted,
    },
  });

  if (loading) {
    return (
      <ThemedView style={styles.section}>
        <View style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
          <PulseDot />
        </View>
        <ThemedText>Loading emails...</ThemedText>
      </ThemedView>
    );
  }

  if (emails.length === 0) {
    return (
      <ThemedView style={styles.section}>
        <View style={styles.titleContainer}>
          <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
          <PulseDot />
        </View>
        <ThemedText>No emails received yet.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <View style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
        <PulseDot />
      </View>
      {emails.map((mail) => (
        <TouchableOpacity
          key={mail.id}
          style={[
            styles.emailItem,
            mail.id > lastEmailId && { backgroundColor: colors.accentBackground }
          ]}
          onPress={() => {
            if (isSpamOk) {
              const emailPrefix = email.split('@')[0];
              Linking.openURL(`https://spamok.com/${emailPrefix}/${mail.id}`);
            } else {
              router.push(`/(tabs)/(credentials)/email/${mail.id}`);
            }
          }}
        >
          <ThemedText style={styles.subject} numberOfLines={1}>
            {mail.subject}
          </ThemedText>
          <ThemedText style={styles.date}>
            {new Date(mail.dateSystem).toLocaleDateString()}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};