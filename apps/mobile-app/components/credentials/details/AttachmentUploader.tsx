import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import type { Attachment } from '@/utils/dist/shared/models/vault';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';

type AttachmentUploaderProps = {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

/**
 * This component allows uploading and managing attachments for a credential.
 */
export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onAttachmentsChange,
}) => {
  const { t } = useTranslation();
  const colors = useColors();
  const [statusMessage, setStatusMessage] = useState<string>('');

  /**
   * Handles file selection and upload.
   */
  const handleFileSelection = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return;
      }

      const newAttachments = [...attachments];

      for (const file of result.assets) {
        if (file.uri) {
          // Read file as bytes
          const response = await fetch(file.uri);
          const arrayBuffer = await response.arrayBuffer();
          const byteArray = new Uint8Array(arrayBuffer);

          const attachment: Attachment = {
            Id: crypto.randomUUID(),
            Filename: file.name,
            Blob: byteArray,
            CredentialId: '', // Will be set when saving credential
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            IsDeleted: false,
          };

          newAttachments.push(attachment);
        }
      }

      onAttachmentsChange(newAttachments);
      setStatusMessage('');
    } catch (error) {
      console.error('Error uploading files:', error);
      setStatusMessage('Error uploading files.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  /**
   * Deletes an attachment.
   */
  const deleteAttachment = (attachmentToDelete: Attachment): void => {
    Alert.alert(
      'Delete Attachment',
      `Are you sure you want to delete ${attachmentToDelete.Filename}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          /**
           * Deletes the attachment.
           */
          onPress: (): void => {
            try {
              const updatedAttachments = [...attachments];

              // Remove the attachment from the list
              const index = updatedAttachments.findIndex(a => a.Id === attachmentToDelete.Id);
              if (index !== -1) {
                updatedAttachments.splice(index, 1);
              }

              onAttachmentsChange(updatedAttachments);
              setStatusMessage('');
            } catch (error) {
              console.error('Error deleting attachment:', error);
              setStatusMessage('Error deleting attachment.');
              setTimeout(() => setStatusMessage(''), 3000);
            }
          },
        },
      ]
    );
  };

  const activeAttachments = attachments.filter(a => !a.IsDeleted);

  const styles = StyleSheet.create({
    addButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 35,
      justifyContent: 'center',
      marginTop: 12,
      width: '100%',
    },
    attachmentDate: {
      fontSize: 12,
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentItem: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      padding: 12,
    },
    attachmentName: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 2,
    },
    container: {
      backgroundColor: colors.accentBackground,
    },
    deleteButton: {
      backgroundColor: colors.errorBackground,
      borderRadius: 6,
      marginLeft: 12,
      padding: 8,
    },
    deleteButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    statusMessage: {
      fontSize: 14,
      textAlign: 'center',
    },
  });

  return (
    <ThemedView style={styles.container}>
      {statusMessage && (
        <ThemedText style={styles.statusMessage} type="subtitle">
          {statusMessage}
        </ThemedText>
      )}

      {activeAttachments.length > 0 && (
        <View>
          {activeAttachments.map(attachment => (
            <View key={attachment.Id} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <ThemedText style={styles.attachmentName}>
                  {attachment.Filename}
                </ThemedText>
                <ThemedText style={styles.attachmentDate} type="subtitle">
                  {new Date(attachment.CreatedAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteAttachment(attachment)}
              >
                <ThemedText style={styles.deleteButtonText}>
                  {t('credentials.deleteAttachment')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleFileSelection}
      >
        <Ionicons name="add" size={24} color={colors.background} />
      </TouchableOpacity>
    </ThemedView>
  );
};