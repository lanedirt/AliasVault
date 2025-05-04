import { View, Text, useColorScheme, StyleSheet, Linking, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';

type NotesSectionProps = {
  credential: Credential;
};

/**
 * Split text into parts, separating URLs from regular text to make them clickable.
 */
const splitTextAndUrls = (text: string): { type: 'text' | 'url', content: string, url?: string }[] => {
  const urlPattern = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;

  const parts: { type: 'text' | 'url', content: string, url?: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    // Add text before the URL if it's not empty
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({
          type: 'text',
          content: textBefore
        });
      }
    }

    // Add the URL
    const url = match[0];
    const href = url.startsWith('http') ? url : `http://${url}`;
    parts.push({
      type: 'url',
      content: url,
      url: href
    });

    lastIndex = match.index + url.length;
  }

  // Add remaining text if it's not empty
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText
      });
    }
  }

  return parts;
};

/**
 * Notes section component.
 */
export const NotesSection: React.FC<NotesSectionProps> = ({ credential }) : React.ReactNode => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  if (!credential.Notes) {
    return null;
  }

  const parts = splitTextAndUrls(credential.Notes);

  /**
   * Handle the link press.
   */
  const handleLinkPress = (url: string) : void => {
    Linking.openURL(url);
  };

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Notes</ThemedText>
      <View style={[styles.notesContainer, {
        backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
        borderColor: isDarkMode ? '#374151' : '#d1d5db',
      }]}>
        <Text style={[styles.notes, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
          {parts.map((part, index) => {
            if (part.type === 'url') {
              return (
                <Pressable
                  key={index}
                  onPress={() => handleLinkPress(part.url!)}
                >
                  <Text style={[styles.link, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>
                    {part.content}
                  </Text>
                </Pressable>
              );
            }
            return (
              <Text key={index} selectable={true}>
                {part.content}
              </Text>
            );
          })}
        </Text>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  link: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  notes: {
    fontSize: 14,
  },
  notesContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  section: {
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
});