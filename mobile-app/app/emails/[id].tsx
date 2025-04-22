import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Email } from '@/utils/types/webapi/Email';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import EncryptionUtility from '@/utils/EncryptionUtility';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { EncryptionKey } from '@/utils/types/EncryptionKey';

export default function EmailDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmail();
  }, [id]);

  const loadEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!dbContext?.sqliteClient || !id) {
        return;
      }

      const response = await webApi.get<Email>(`Email/${id}`);

      // Decrypt email locally using public/private key pairs
      const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();
      const decryptedEmail = await EncryptionUtility.decryptEmail(response, encryptionKeys);
      setEmail(decryptedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await webApi.delete(`Email/${id}`);
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete email');
            }
          },
        },
      ]
    );
  };

  const handleDownloadAttachment = async (attachment: Email['attachments'][0]) => {
    try {
      // Get the encrypted attachment bytes from the API
      const base64EncryptedAttachment = await webApi.downloadBlobAndConvertToBase64(
        `Email/${id}/attachments/${attachment.id}`
      );

      if (!dbContext?.sqliteClient || !email) {
        setError('Database context or email not available');
        return;
      }

      // Get encryption keys for decryption
      const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();

      // Decrypt the attachment
      const decryptedBytes = await EncryptionUtility.decryptAttachment(
        base64EncryptedAttachment,
        email,
        encryptionKeys
      );

      if (!decryptedBytes) {
        setError('Failed to decrypt attachment');
        return;
      }

      // Save to temporary file
      const tempFile = `${FileSystem.cacheDirectory}${attachment.filename}`;
      await FileSystem.writeAsStringAsync(tempFile, decryptedBytes, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file using the native share API
      await Share.share({
        url: tempFile,
        title: attachment.filename,
      });

      // Clean up temp file
      await FileSystem.deleteAsync(tempFile);
    } catch (err) {
      console.error('handleDownloadAttachment error', err);
      setError(err instanceof Error ? err.message : 'Failed to download attachment');
    }
  };

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

  if (!email) {
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>Email not found</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.subject}>{email.subject}</ThemedText>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <IconSymbol name="trash" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.metadata}>
          <ThemedText style={styles.metadataText}>
            From: {email.fromDisplay} ({email.fromLocal}@{email.fromDomain})
          </ThemedText>
          <ThemedText style={styles.metadataText}>
            To: {email.toLocal}@{email.toDomain}
          </ThemedText>
          <ThemedText style={styles.metadataText}>
            Date: {new Date(email.dateSystem).toLocaleString()}
          </ThemedText>
        </View>
      </View>

      {/* Email Body */}
      <View style={styles.body}>
        {email.messageHtml ? (
          <WebView
            style={styles.webView}
            source={{ html: email.messageHtml }}
            scrollEnabled={false}
            onNavigationStateChange={(event) => {
              if (event.url !== 'about:blank') {
                Share.share({
                  url: event.url,
                });
              }
            }}
          />
        ) : (
          <ThemedText style={styles.plainText}>{email.messagePlain}</ThemedText>
        )}
      </View>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <View style={styles.attachments}>
          <ThemedText style={styles.attachmentsTitle}>Attachments</ThemedText>
          {email.attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachment}
              onPress={() => handleDownloadAttachment(attachment)}
            >
              <IconSymbol name="paperclip" size={20} color="#666" />
              <ThemedText style={styles.attachmentName}>
                {attachment.filename} ({Math.ceil(attachment.filesize / 1024)} KB)
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  deleteButton: {
    padding: 8,
  },
  metadata: {
    marginTop: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  body: {
    padding: 16,
  },
  webView: {
    minHeight: 200,
  },
  plainText: {
    fontSize: 16,
    lineHeight: 24,
  },
  attachments: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  attachmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});