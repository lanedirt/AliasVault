import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Share, useColorScheme, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { Email } from '@/utils/types/webapi/Email';
import { Credential } from '@/utils/types/Credential';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { ThemedText } from '@/components/themed/ThemedText';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { useColors } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import emitter from '@/utils/EventEmitter';

/**
 * Email details screen.
 */
export default function EmailDetailsScreen() : React.ReactNode {
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

  /**
   * Load the email.
   */
  const loadEmail = useCallback(async () : Promise<void> => {
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
  }, [dbContext.sqliteClient, id, webApi]);

  useEffect(() => {
    loadEmail();
  }, [id, loadEmail]);

  /**
   * Handle the delete button press.
   */
  const handleDelete = useCallback(async () : Promise<void> => {
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
          /**
           * Handle the delete button press.
           */
          onPress: async () : Promise<void> => {
            try {
              // Delete the email from the server.
              await webApi.delete(`Email/${id}`);

              // Refresh the emails list in the index screen.
              emitter.emit('refreshEmails');

              // Go back to the emails list screen.
              router.back();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete email');
            }
          },
        },
      ]
    );
  }, [id, router, webApi]);

  /**
   * Handle the download attachment button press.
   */
  const handleDownloadAttachment = async (attachment: Email['attachments'][0]) : Promise<void> => {
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

  /**
   * Handle the open credential button press.
   */
  const handleOpenCredential = () : void => {
    if (associatedCredential) {
      router.push(`/(tabs)/credentials/${associatedCredential.Id}`);
    }
  };

  const styles = StyleSheet.create({
    attachment: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 8,
      padding: 12,
    },
    attachmentName: {
      color: colors.textMuted,
      fontSize: 14,
      marginLeft: 8,
    },
    attachments: {
      borderTopColor: colors.accentBorder,
      borderTopWidth: 1,
      padding: 16,
    },
    attachmentsTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    centerContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    container: {
      flex: 1,
    },
    divider: {
      backgroundColor: colors.accentBorder,
      height: 1,
      marginVertical: 2,
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
    headerRightButton: {
      padding: 10,
      paddingRight: 0,
    },
    headerRightContainer: {
      flexDirection: 'row',
    },
    metadataContainer: {
      padding: 2,
    },
    metadataCredential: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    metadataCredentialIcon: {
      marginRight: 4,
    },
    metadataHeading: {
      color: colors.text,
      fontSize: 13,
      fontWeight: 'bold',
      marginBottom: 0,
      marginTop: 0,
      paddingBottom: 0,
      paddingTop: 0,
    },
    metadataIcon: {
      paddingTop: 6,
      width: 30,
    },
    metadataLabel: {
      paddingBottom: 4,
      paddingLeft: 5,
      paddingTop: 4,
      width: 60,
    },
    metadataRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      padding: 2,
    },
    metadataText: {
      color: colors.text,
      fontSize: 13,
      marginBottom: 0,
      marginTop: 0,
      paddingBottom: 0,
      paddingTop: 0,
    },
    metadataValue: {
      flex: 1,
      paddingBottom: 4,
      paddingLeft: 5,
      paddingTop: 4,
    },
    plainText: {
      flex: 1,
      fontSize: 15,
      padding: 16,
    },
    subject: {
      color: colors.text,
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    subjectContainer: {
      paddingBottom: 8,
      paddingLeft: 5,
      paddingTop: 8,
      width: '90%',
    },
    textDark: {
      color: colors.text,
    },
    textLight: {
      color: colors.text,
    },
    topBox: {
      alignSelf: 'flex-start',
      backgroundColor: colors.background,
      flexDirection: 'row',
      padding: 2,
    },
    viewDark: {
      backgroundColor: colors.background,
    },
    viewLight: {
      backgroundColor: colors.background,
    },
    webView: {
      flex: 1,
    },
  });

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      /**
       * Header right button.
       */
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            onPress={() => setHtmlView(!isHtmlView)}
            style={styles.headerRightButton}
          >
            <Ionicons
              name={isHtmlView ? 'text-outline' : 'document-outline'}
              size={22}
              color="#FFA500"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerRightButton}
          >
            <Ionicons name="trash-outline" size={22} color="#FF0000" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isHtmlView, navigation, handleDelete, styles.headerRightButton, styles.headerRightContainer]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, isDarkMode ? styles.viewDark : styles.viewLight]}>
        <Stack.Screen options={{ title: 'Email Details' }} />
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
                  <TouchableOpacity onPress={handleOpenCredential} style={styles.metadataCredential}>
                    <IconSymbol size={16} name="key.fill" color={colors.primary} style={styles.metadataCredentialIcon} />
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
      <Stack.Screen options={{ title: 'Email Details' }} />
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