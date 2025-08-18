import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';
import { useTranslation } from '@/hooks/useTranslation';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedText } from '@/components/themed/ThemedText';
import { useAuth } from '@/context/AuthContext';

const TIMEOUT_OPTIONS = [
  { value: 0, label: 'settings.clipboardClearOptions.never' },
  { value: 5, label: 'settings.clipboardClearOptions.5seconds' },
  { value: 10, label: 'settings.clipboardClearOptions.10seconds' },
  { value: 15, label: 'settings.clipboardClearOptions.15seconds' },
];

/**
 * Clipboard clear settings screen.
 */
export default function ClipboardClearScreen(): React.ReactNode {
  const colors = useColors();
  const { t } = useTranslation();
  const { getClipboardClearTimeout, setClipboardClearTimeout } = useAuth();
  const [selectedTimeout, setSelectedTimeout] = useState<number>(10);

  useEffect(() => {
    /**
     * Load the current clipboard clear timeout.
     */
    const loadCurrentTimeout = async (): Promise<void> => {
      const timeout = await getClipboardClearTimeout();
      setSelectedTimeout(timeout);
    };

    loadCurrentTimeout();
  }, [getClipboardClearTimeout]);

  /**
   * Handle timeout change.
   */
  const handleTimeoutChange = async (timeout: number): Promise<void> => {
    await setClipboardClearTimeout(timeout);
    setSelectedTimeout(timeout);
  };

  const styles = StyleSheet.create({
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    option: {
      alignItems: 'center',
      borderBottomColor: colors.accentBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    optionContainer: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 16,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionText: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
    },
    selectedIcon: {
      color: colors.primary,
      marginLeft: 8,
    },
  });

  return (
    <ThemedContainer>
      <ThemedScrollView>
        <ThemedText style={styles.headerText}>
          {t('settings.clipboardClearDescription')}
        </ThemedText>
        <View style={styles.optionContainer}>
          {TIMEOUT_OPTIONS.map((option, index) => {
            const isLast = index === TIMEOUT_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isLast && styles.optionLast]}
                onPress={() => handleTimeoutChange(option.value)}
              >
                <ThemedText style={styles.optionText}>{t(option.label)}</ThemedText>
                {selectedTimeout === option.value && (
                  <Ionicons name="checkmark" size={20} style={styles.selectedIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ThemedScrollView>
    </ThemedContainer>
  );
}