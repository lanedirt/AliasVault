import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedText } from '@/components/themed/ThemedText';
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
          Choose how long the app can stay in the background before requiring re-authentication. You&apos;ll need to use Face ID or enter your password to unlock the vault again.
        </ThemedText>
        <View style={styles.optionContainer}>
          {timeoutOptions.map((option, index) => {
            const isLast = index === timeoutOptions.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isLast && styles.optionLast]}
                onPress={() => {
                  setAutoLockTimeout(option.value);
                  setAutoLockTimeoutState(option.value);
                }}
              >
                <ThemedText style={styles.optionText}>{option.label}</ThemedText>
                {autoLockTimeout === option.value && (
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