import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppInfo } from '@/utils/AppInfo';

type ApiOption = {
  label: string;
  value: string;
};

const DEFAULT_OPTIONS: ApiOption[] = [
  { label: 'Aliasvault.net', value: AppInfo.DEFAULT_API_URL },
  { label: 'Self-hosted', value: 'custom' }
];

export default function SettingsScreen() {
  const colors = useColors();
  const [selectedOption, setSelectedOption] = useState<string>(DEFAULT_OPTIONS[0].value);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSettings();
  }, []);

  const loadStoredSettings = async () => {
    try {
      const apiUrl = await AsyncStorage.getItem('apiUrl');
      const matchingOption = DEFAULT_OPTIONS.find(opt => opt.value === apiUrl);

      if (matchingOption) {
        setSelectedOption(matchingOption.value);
      } else if (apiUrl) {
        setSelectedOption('custom');
        setCustomUrl(apiUrl);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = async (value: string) => {
    setSelectedOption(value);
    if (value !== 'custom') {
      await AsyncStorage.setItem('apiUrl', value);
      setCustomUrl('');
    }
  };

  const handleCustomUrlChange = async (value: string) => {
    setCustomUrl(value);
    await AsyncStorage.setItem('apiUrl', value);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    formContainer: {
      gap: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      borderColor: colors.accentBorder,
      color: colors.text,
      backgroundColor: colors.accentBackground,
    },
    optionButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      marginBottom: 8,
    },
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionButtonText: {
      color: colors.text,
      fontSize: 16,
    },
    optionButtonTextSelected: {
      color: colors.text,
    },
    versionText: {
      textAlign: 'center',
      color: colors.textMuted,
      marginTop: 24,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>API Connection</Text>

          {DEFAULT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                selectedOption === option.value && styles.optionButtonSelected
              ]}
              onPress={() => handleOptionChange(option.value)}
            >
              <Text style={[
                styles.optionButtonText,
                selectedOption === option.value && styles.optionButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedOption === 'custom' && (
            <View>
              <Text style={styles.label}>Custom API URL</Text>
              <TextInput
                style={styles.input}
                value={customUrl}
                onChangeText={handleCustomUrlChange}
                placeholder="https://my-aliasvault-instance.com/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        </View>

        <Text style={styles.versionText}>Version: {AppInfo.VERSION}</Text>
      </ThemedView>
    </SafeAreaView>
  );
}