import { Buffer } from 'buffer';

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';

import type { Credential, Attachment } from '@/utils/dist/shared/models/vault';
import emitter from '@/utils/EventEmitter';

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
      const tempFile = `${FileSystem.cacheDirectory}${attachment.Filename}`;

      // Step 1: Create a Blob
      if (typeof attachment.Blob === 'string') {
        // If attachment.Blob is already a base64 string
        const base64Data = attachment.Blob;

        await FileSystem.writeAsStringAsync(tempFile, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      else {
        // Convert attachment.Blob to base64
        const base64Data = Buffer.from(attachment.Blob as unknown as string, 'base64');
        await FileSystem.writeAsStringAsync(tempFile, base64Data.toString(), {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Step 2: Share using Sharing API (better handles mime types)
      await Share.share({
        url: tempFile,
        title: attachment.Filename,
      });

      // Optional cleanup
      await FileSystem.deleteAsync(tempFile);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      Alert.alert('Error', 'Failed to download attachment');
    }
  };
  /**
   * Load the attachments.
   */
  const loadAttachments = useCallback(async (): Promise<void> => {
    if (!dbContext?.sqliteClient) {
      return;
    }

    try {
      const attachmentList = await dbContext.sqliteClient.getAttachmentsForCredential(credential.Id);
      setAttachments(attachmentList);
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  }, [credential.Id, dbContext?.sqliteClient]);

  useEffect((): (() => void) => {
    loadAttachments();

    const credentialChangedSub = emitter.addListener('credentialChanged', async (changedId: string) => {
      if (changedId === credential.Id) {
        await loadAttachments();
      }
    });

    return () => {
      credentialChangedSub.remove();
    };
  }, [credential.Id, dbContext?.sqliteClient, loadAttachments]);

  if (attachments.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    attachmentDate: {
      fontSize: 12,
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentItem: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    attachmentName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    container: {
      paddingTop: 16,
    },
    content: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginTop: 8,
      padding: 12,
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
              <Ionicons name="download-outline" size={24} color={colors.text} />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};
