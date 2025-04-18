import { View, Text, useColorScheme, StyleSheet, Linking, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';

interface NotesSectionProps {
  credential: Credential;
}

/**
 * Split text into parts, separating URLs from regular text to make them clickable.
 */
const splitTextAndUrls = (text: string): Array<{ type: 'text' | 'url', content: string, url?: string }> => {
  const urlPattern = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;

  const parts: Array<{ type: 'text' | 'url', content: string, url?: string }> = [];
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

export const NotesSection: React.FC<NotesSectionProps> = ({ credential }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  if (!credential.Notes) {
    return null;
  }

  const parts = splitTextAndUrls(credential.Notes);

  const handleLinkPress = (url: string) => {
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
  section: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notes: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});