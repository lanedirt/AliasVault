import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

/**
 * Auto-lock screen.
 */
export default function AutoLockScreen() : React.ReactNode {
  const colors = useColors();
  const { getAutoLockTimeout, setAutoLockTimeout } = useAuth();
  const [autoLockTimeout, setAutoLockTimeoutState] = useState<number>(0);

  useEffect(() => {
    /**
     * Load the auto-lock timeout.
     */
    const loadAutoLockTimeout = async () : Promise<void> => {
      const timeout = await getAutoLockTimeout();
      setAutoLockTimeoutState(timeout);
    };
    loadAutoLockTimeout();
  }, [getAutoLockTimeout]);

  const timeoutOptions = [
    { label: 'Never', value: 0 },
    { label: '5 seconds', value: 5 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '15 minutes', value: 900 },
    { label: '30 minutes', value: 1800 },
    { label: '1 hour', value: 3600 },
    { label: '4 hours', value: 14400 },
    { label: '8 hours', value: 28800 },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      borderBottomColor: colors.accentBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      padding: 16,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    option: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderBottomColor: colors.accentBorder,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    optionText: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    scrollView: {
      flex: 1,
    },
    selectedIcon: {
      color: colors.primary,
      marginLeft: 8,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            Choose how long the app can stay in the background before requiring re-authentication. You&apos;ll need to use Face ID or enter your password to unlock the vault again.
          </ThemedText>
        </View>
        {timeoutOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.option}
            onPress={() => {
              setAutoLockTimeout(option.value);
              setAutoLockTimeoutState(option.value);
            }}
          >
            <ThemedText style={styles.optionText}>{option.label}</ThemedText>
            {autoLockTimeout === option.value && (
              <Ionicons name="checkmark" size={24} style={styles.selectedIcon} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}