import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';
import { useVaultMutate } from '@/hooks/useVaultMutate';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';
import { ThemedText } from '@/components/themed/ThemedText';
import { useDb } from '@/context/DbContext';

// Language and gender options will be defined inside the component to use translations

/**
 * Identity Generator Settings screen.
 */
export default function IdentityGeneratorSettingsScreen(): React.ReactNode {
  const colors = useColors();
  const { t } = useTranslation();
  const dbContext = useDb();
  const { executeVaultMutation } = useVaultMutate();

  const [language, setLanguage] = useState<string>('en');
  const [gender, setGender] = useState<string>('random');

  const LANGUAGE_OPTIONS = [
    { label: t('settings.identityGeneratorSettings.languageOptions.english'), value: 'en' },
    { label: t('settings.identityGeneratorSettings.languageOptions.dutch'), value: 'nl' }
  ];

  const GENDER_OPTIONS = [
    { label: t('settings.identityGeneratorSettings.genderOptions.random'), value: 'random' },
    { label: t('settings.identityGeneratorSettings.genderOptions.male'), value: 'male' },
    { label: t('settings.identityGeneratorSettings.genderOptions.female'), value: 'female' }
  ];

  useFocusEffect(
    useCallback(() => {
      /**
       * Load the identity generator settings.
       */
      const loadSettings = async (): Promise<void> => {
        try {
          const [currentLanguage, currentGender] = await Promise.all([
            dbContext.sqliteClient!.getDefaultIdentityLanguage(),
            dbContext.sqliteClient!.getDefaultIdentityGender()
          ]);

          setLanguage(currentLanguage);
          setGender(currentGender);
        } catch (error) {
          console.error('Error loading identity generator settings:', error);
          Alert.alert(t('common.error'), t('settings.identityGeneratorSettings.errors.loadFailed'));
        }
      };

      loadSettings();
    }, [dbContext.sqliteClient, t])
  );

  /**
   * Handle language change.
   */
  const handleLanguageChange = useCallback(async (newLanguage: string): Promise<void> => {
    try {
      executeVaultMutation(async () => {
        // Update the default language setting
        await dbContext.sqliteClient!.updateSetting('DefaultIdentityLanguage', newLanguage);
      });
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language setting:', error);
      Alert.alert(t('common.error'), t('settings.identityGeneratorSettings.errors.languageUpdateFailed'));
    }
  }, [executeVaultMutation, dbContext.sqliteClient, t]);

  /**
   * Handle gender change.
   */
  const handleGenderChange = useCallback(async (newGender: string): Promise<void> => {
    try {
      executeVaultMutation(async () => {
        await dbContext.sqliteClient!.updateSetting('DefaultIdentityGender', newGender);
      });
      setGender(newGender);
    } catch (error) {
      console.error('Error updating gender setting:', error);
      Alert.alert(t('common.error'), t('settings.identityGeneratorSettings.errors.genderUpdateFailed'));
    }
  }, [executeVaultMutation, dbContext.sqliteClient, t]);

  const styles = StyleSheet.create({
    descriptionText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
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
      marginTop: 8,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionText: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 16,
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
          {t('settings.identityGeneratorSettings.description')}
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>{t('settings.identityGeneratorSettings.languageSection')}</ThemedText>
        <ThemedText style={styles.descriptionText}>
          {t('settings.identityGeneratorSettings.languageDescription')}
        </ThemedText>
        <View style={styles.optionContainer}>
          {LANGUAGE_OPTIONS.map((option, index) => {
            const isLast = index === LANGUAGE_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isLast && styles.optionLast]}
                onPress={() => handleLanguageChange(option.value)}
              >
                <ThemedText style={styles.optionText}>{option.label}</ThemedText>
                {language === option.value && (
                  <Ionicons name="checkmark" size={20} style={styles.selectedIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <ThemedText style={styles.sectionTitle}>{t('settings.identityGeneratorSettings.genderSection')}</ThemedText>
        <ThemedText style={styles.descriptionText}>
          {t('settings.identityGeneratorSettings.genderDescription')}
        </ThemedText>
        <View style={styles.optionContainer}>
          {GENDER_OPTIONS.map((option, index) => {
            const isLast = index === GENDER_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, isLast && styles.optionLast]}
                onPress={() => handleGenderChange(option.value)}
              >
                <ThemedText style={styles.optionText}>{option.label}</ThemedText>
                {gender === option.value && (
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