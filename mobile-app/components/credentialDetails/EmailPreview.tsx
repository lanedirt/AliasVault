import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useWebApi } from '@/context/WebApiContext';
import { useDb } from '@/context/DbContext';
import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';
import { MailboxBulkRequest, MailboxBulkResponse } from '@/utils/types/webapi/MailboxBulk';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ThemedText } from '../ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { ThemedView } from '../ThemedView';
type EmailPreviewProps = {
  email: string | undefined;
};

export const EmailPreview: React.FC<EmailPreviewProps> = ({ email }) => {
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastEmailId, setLastEmailId] = useState<number>(0);
  const webApi = useWebApi();
  const dbContext = useDb();
  const colors = useColors();

  // Sanity check: if no email is provided, don't render anything.
  if (!email) {
    return null;
  }

  useEffect(() => {
    const loadEmails = async () => {
      try {
        if (!dbContext?.sqliteClient) return;

        // Get unique email addresses from all credentials
        const emailAddresses = await dbContext.sqliteClient.getAllEmailAddresses();

        // For now we only show the latest 2 emails
        const data = await webApi.post<MailboxBulkRequest, MailboxBulkResponse>('EmailBox/bulk', {
          addresses: emailAddresses,
          page: 1,
          pageSize: 2,
        });

        // Decrypt emails locally using private key associated with the email address
        const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();
        const decryptedEmails = await EncryptionUtility.decryptEmailList(data.mails, encryptionKeys);

        if (loading && decryptedEmails.length > 0) {
          setLastEmailId(decryptedEmails[0].id);
        }

        setEmails(decryptedEmails);
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
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
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
        <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
        <ThemedText>Loading emails...</ThemedText>
      </ThemedView>
    );
  }

  if (emails.length === 0) {
    return (
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
        <ThemedText>No emails received yet.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="title" style={styles.title}>Recent emails</ThemedText>
      {emails.map((mail) => (
        <TouchableOpacity
          key={mail.id}
          style={[
            styles.emailItem,
            mail.id > lastEmailId && { backgroundColor: colors.accentBackground }
          ]}
          onPress={() => router.push(`/(tabs)/(credentials)/email/${mail.id}`)}
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