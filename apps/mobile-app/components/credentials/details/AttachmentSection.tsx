import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

import type { Credential, Attachment } from '@/utils/dist/shared/models/vault';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useDb } from '@/context/DbContext';

type AttachmentSectionProps = {
  credential: Credential;
};

/**
 * Attachment section component.
 */
export const AttachmentSection: React.FC<AttachmentSectionProps> = ({ credential }): React.ReactNode => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const colors = useColors();
  const dbContext = useDb();
  const { t } = useTranslation();

  /**
   * Download and share an attachment.
   */
  const downloadAttachment = async (attachment: Attachment): Promise<void> => {
    try {
      // Convert Uint8Array or number[] to Uint8Array
      const byteArray = attachment.Blob instanceof Uint8Array
        ? attachment.Blob
        : new Uint8Array(attachment.Blob);

      const fileUri = `${FileSystem.documentDirectory}${attachment.Filename}`;

      // Convert byte array to base64
      let binary = '';
      const bytes = new Uint8Array(byteArray);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Write file to local storage
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: attachment.Filename,
        });
      } else {
        Alert.alert('Download Complete', `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error downloading attachment:', error);
      Alert.alert('Error', 'Failed to download attachment');
    }
  };

  useEffect(() => {
    /**
     * Load the attachments.
     */
    const loadAttachments = async (): Promise<void> => {
      if (!dbContext?.sqliteClient) {
        return;
      }

      try {
        const attachmentList = await dbContext.sqliteClient.getAttachmentsForCredential(credential.Id);
        setAttachments(attachmentList);
      } catch (error) {
        console.error('Error loading attachments:', error);
      }
    };

    loadAttachments();
  }, [credential.Id, dbContext?.sqliteClient]);

  if (attachments.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingTop: 16,
    },
    content: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginTop: 8,
      padding: 12,
    },
    attachmentItem: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    attachmentDate: {
      fontSize: 12,
    },
    downloadIcon: {
      marginLeft: 12,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">
        {t('credentials.attachments')}
      </ThemedText>
      {attachments.map(attachment => (
        <TouchableOpacity
          key={attachment.Id}
          style={styles.content}
          onPress={() => downloadAttachment(attachment)}
        >
          <View style={styles.attachmentItem}>
            <View style={styles.attachmentInfo}>
              <ThemedText style={styles.attachmentName}>
                {attachment.Filename}
              </ThemedText>
              <ThemedText style={styles.attachmentDate} type="subtitle">
                {new Date(attachment.CreatedAt).toLocaleDateString()}
              </ThemedText>
            </View>
            <View style={styles.downloadIcon}>
              <ThemedText type="subtitle">📎</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};