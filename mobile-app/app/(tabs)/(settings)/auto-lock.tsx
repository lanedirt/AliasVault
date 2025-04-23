import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function AutoLockScreen() {
  const colors = useColors();
  const { getAutoLockTimeout, setAutoLockTimeout } = useAuth();
  const [autoLockTimeout, setAutoLockTimeoutState] = useState<number>(0);

  useEffect(() => {
    const loadAutoLockTimeout = async () => {
      const timeout = await getAutoLockTimeout();
      setAutoLockTimeoutState(timeout);
    };
    loadAutoLockTimeout();
  }, []);

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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.accentBorder,
    },
    headerText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.accentBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.accentBorder,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    selectedIcon: {
      marginLeft: 8,
      color: colors.primary,
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
            Choose how long the app can stay in the background before requiring re-authentication. You'll need to use Face ID or enter your password to unlock the vault again.
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