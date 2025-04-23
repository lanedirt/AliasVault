import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { TitleContainer } from '@/components/TitleContainer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function AutoLockScreen() {
  const colors = useColors();
  const { autoLockTimeout, setAutoLockTimeout } = useAuth();

  const timeoutOptions = [
    { label: 'Never', value: 0 },
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
    { label: '15 minutes', value: 900 },
    { label: '30 minutes', value: 1800 },
    { label: '1 hour', value: 3600 },
    { label: '2 hours', value: 7200 },
    { label: '4 hours', value: 14400 },
    { label: '8 hours', value: 28800 },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
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
      <View style={styles.content}>
        {timeoutOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.option}
            onPress={() => setAutoLockTimeout(option.value)}
          >
            <ThemedText style={styles.optionText}>{option.label}</ThemedText>
            {autoLockTimeout === option.value && (
              <Ionicons name="checkmark" size={24} style={styles.selectedIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}