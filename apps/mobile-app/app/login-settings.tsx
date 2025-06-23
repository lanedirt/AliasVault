import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

import { AppInfo } from '@/utils/AppInfo';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedView } from '@/components/themed/ThemedView';

type ApiOption = {
  label: string;
  value: string;
};

const DEFAULT_OPTIONS: ApiOption[] = [
  { label: 'Aliasvault.net', value: AppInfo.DEFAULT_API_URL },
  { label: 'Self-hosted', value: 'custom' }
];

/**
 * Settings screen (for logged out users).
 */
export default function SettingsScreen() : React.ReactNode {
  const colors = useColors();
  const [selectedOption, setSelectedOption] = useState<string>(DEFAULT_OPTIONS[0].value);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSettings();
  }, []);

  /**
   * Load the stored settings.
   */
  const loadStoredSettings = async () : Promise<void> => {
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

  /**
   * Handle the option change.
   */
  const handleOptionChange = async (value: string) : Promise<void> => {
    setSelectedOption(value);
    if (value !== 'custom') {
      await AsyncStorage.setItem('apiUrl', value);
      setCustomUrl('');
    }
  };

  /**
   * Handle the custom URL change.
   */
  const handleCustomUrlChange = async (value: string) : Promise<void> => {
    setCustomUrl(value);
    await AsyncStorage.setItem('apiUrl', value);
  };

  const styles = StyleSheet.create({
    content: {
      flex: 1,
    },
    formContainer: {
      gap: 16,
    },
    input: {
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      padding: 12,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    optionButton: {
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      padding: 12,
    },
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionButtonText: {
      color: colors.text,
      fontSize: 14,
    },
    optionButtonTextSelected: {
      color: colors.primarySurfaceText,
      fontWeight: 'bold',
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
    },
    titleContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    versionText: {
      color: colors.textMuted,
      marginTop: 24,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <ThemedContainer>
        <ThemedScrollView>
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </ThemedScrollView>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer>
      <ThemedScrollView>
        <ThemedView style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>API Connection</Text>
          </View>

          <View style={styles.formContainer}>
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
      </ThemedScrollView>
    </ThemedContainer>
  );
}