import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Share, useColorScheme, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Email } from '@/utils/types/webapi/Email';
import { Credential } from '@/utils/types/Credential';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedText } from '@/components/ThemedText';
import EncryptionUtility from '@/utils/EncryptionUtility';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function EmailDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const dbContext = useDb();
  const webApi = useWebApi();
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetadataMaximized, setMetadataMaximized] = useState(false);
  const [isHtmlView, setHtmlView] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';
  const [associatedCredential, setAssociatedCredential] = useState<Credential | null>(null);

  useEffect(() => {
    loadEmail();
  }, [id]);

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setHtmlView(!isHtmlView)}
            style={{ padding: 10, paddingRight: 0 }}
          >
            <Ionicons
              name={isHtmlView ? 'text-outline' : 'document-outline'}
              size={22}
              color="#FFA500"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ padding: 10, paddingRight: 0 }}
          >
            <Ionicons name="trash-outline" size={22} color="#FF0000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isHtmlView, navigation]);

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

      // Look up associated credential
      if (decryptedEmail.toLocal && decryptedEmail.toDomain) {
        const emailAddress = `${decryptedEmail.toLocal}@${decryptedEmail.toDomain}`;
        const credential = await dbContext.sqliteClient.getCredentialByEmail(emailAddress);
        setAssociatedCredential(credential);
      }

      // Set initial view mode based on content
      if (decryptedEmail.messageHtml && decryptedEmail.messageHtml.length > 0) {
        setHtmlView(true);
      } else {
        setHtmlView(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email? This action is permanent and cannot be undone.',
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
      const base64EncryptedAttachment = await webApi.downloadBlobAndConvertToBase64(
        `Email/${id}/attachments/${attachment.id}`
      );

      if (!dbContext?.sqliteClient || !email) {
        setError('Database context or email not available');
        return;
      }

      const encryptionKeys = await dbContext.sqliteClient.getAllEncryptionKeys();
      const decryptedBytes = await EncryptionUtility.decryptAttachment(
        base64EncryptedAttachment,
        email,
        encryptionKeys
      );

      if (!decryptedBytes) {
        setError('Failed to decrypt attachment');
        return;
      }

      const tempFile = `${FileSystem.cacheDirectory}${attachment.filename}`;
      await FileSystem.writeAsStringAsync(tempFile, decryptedBytes, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Share.share({
        url: tempFile,
        title: attachment.filename,
      });

      await FileSystem.deleteAsync(tempFile);
    } catch (err) {
      console.error('handleDownloadAttachment error', err);
      setError(err instanceof Error ? err.message : 'Failed to download attachment');
    }
  };

  const handleOpenCredential = () => {
    if (associatedCredential) {
      router.push(`/(tabs)/(credentials)/${associatedCredential.Id}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    viewLight: {
      backgroundColor: colors.background,
    },
    viewDark: {
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: colors.errorBackground,
      textAlign: 'center',
    },
    emptyText: {
      textAlign: 'center',
      opacity: 0.7,
      color: colors.textMuted,
    },
    topBox: {
      backgroundColor: colors.background,
      flexDirection: 'row',
      alignSelf: 'flex-start',
      padding: 2,
    },
    subjectContainer: {
      paddingBottom: 8,
      paddingTop: 8,
      paddingLeft: 5,
      width: '90%',
    },
    metadataIcon: {
      width: 30,
      paddingTop: 6,
    },
    metadataContainer: {
      padding: 2,
    },
    metadataRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      padding: 2,
    },
    metadataLabel: {
      paddingBottom: 4,
      paddingTop: 4,
      paddingLeft: 5,
      width: 60,
    },
    metadataValue: {
      paddingBottom: 4,
      paddingTop: 4,
      paddingLeft: 5,
      flex: 1,
    },
    metadataHeading: {
      fontWeight: 'bold',
      marginTop: 0,
      paddingTop: 0,
      marginBottom: 0,
      paddingBottom: 0,
      fontSize: 13,
      color: colors.text,
    },
    metadataText: {
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      fontSize: 13,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.accentBorder,
      marginVertical: 2,
    },
    subject: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.text,
    },
    webView: {
      flex: 1,
    },
    plainText: {
      flex: 1,
      padding: 16,
      fontSize: 15,
    },
    textDark: {
      color: colors.text,
    },
    textLight: {
      color: colors.text,
    },
    attachments: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.accentBorder,
    },
    attachmentsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    attachment: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginBottom: 8,
    },
    attachmentName: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textMuted,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, isDarkMode ? styles.viewDark : styles.viewLight]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, isDarkMode ? styles.viewDark : styles.viewLight]}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </View>
    );
  }

  if (!email) {
    return (
      <View style={[styles.centerContainer, isDarkMode ? styles.viewDark : styles.viewLight]}>
        <ThemedText style={styles.emptyText}>Email not found</ThemedText>
      </View>
    );
  }

  let metadataView = null;
  if (!isMetadataMaximized) {
    metadataView = (
      <TouchableOpacity onPress={() => setMetadataMaximized(!isMetadataMaximized)}>
        <View style={styles.topBox}>
          <View style={styles.subjectContainer}>
            <ThemedText style={styles.subject}>{email.subject}</ThemedText>
          </View>
          <View style={styles.metadataIcon}>
            <Ionicons name="reorder-four-outline" size={22} color={isDarkMode ? '#eee' : '#000'} />
          </View>
        </View>
      </TouchableOpacity>
    );
  } else {
    metadataView = (
      <TouchableOpacity onPress={() => setMetadataMaximized(!isMetadataMaximized)}>
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <View style={styles.metadataLabel}>
              <ThemedText style={styles.metadataHeading}>Subject:</ThemedText>
            </View>
            <View style={styles.metadataValue}>
              <ThemedText style={styles.metadataText}>{email.subject}</ThemedText>
              {associatedCredential && (
              <>
                <TouchableOpacity onPress={handleOpenCredential} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol size={16} name="key.fill" color={colors.primary} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.metadataText, { color: colors.primary }]}>
                    {associatedCredential.ServiceName}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            </View>
            <View style={styles.metadataIcon}>
              <Ionicons name="chevron-up-outline" size={22} color={isDarkMode ? '#eee' : '#000'} />
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.metadataRow}>
            <View style={styles.metadataLabel}>
              <ThemedText style={styles.metadataHeading}>Date:</ThemedText>
            </View>
            <View style={styles.metadataValue}>
              <ThemedText style={styles.metadataText}>
                {new Date(email.dateSystem).toLocaleString()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.metadataRow}>
            <View style={styles.metadataLabel}>
              <ThemedText style={styles.metadataHeading}>From:</ThemedText>
            </View>
            <View style={styles.metadataValue}>
              <ThemedText style={styles.metadataText}>
                {email.fromDisplay} ({email.fromLocal}@{email.fromDomain})
              </ThemedText>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.metadataRow}>
            <View style={styles.metadataLabel}>
              <ThemedText style={styles.metadataHeading}>To:</ThemedText>
            </View>
            <View style={styles.metadataValue}>
              <ThemedText style={styles.metadataText}>
                {email.toLocal}@{email.toDomain}
              </ThemedText>
            </View>
          </View>
          <View style={styles.divider} />
        </View>
      </TouchableOpacity>
    );
  }

  let emailView = null;
  if (isHtmlView && email.messageHtml) {
    emailView = (
      <WebView
        style={styles.webView}
        source={{ html: email.messageHtml }}
        scrollEnabled={true}
        onNavigationStateChange={(event) => {
          if (event.url !== 'about:blank') {
            Share.share({
              url: event.url,
            });
          }
        }}
      />
    );
  } else {
    emailView = (
      <TextInput
        style={[styles.plainText, isDarkMode ? styles.textDark : styles.textLight]}
        value={email.messagePlain || 'This email does not contain any plain-text.'}
        editable={false}
        multiline
      />
    );
  }

  return (
    <View style={[styles.container, isDarkMode ? styles.viewDark : styles.viewLight]}>
      {metadataView}
      {emailView}
      {email.attachments && email.attachments.length > 0 && (
        <View style={styles.attachments}>
          <ThemedText style={styles.attachmentsTitle}>Attachments</ThemedText>
          {email.attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachment}
              onPress={() => handleDownloadAttachment(attachment)}
            >
              <Ionicons name="attach" size={20} color="#666" />
              <ThemedText style={styles.attachmentName}>
                {attachment.filename} ({Math.ceil(attachment.filesize / 1024)} KB)
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}