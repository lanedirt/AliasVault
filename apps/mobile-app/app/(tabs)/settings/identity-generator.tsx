import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, Animated, Platform, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';
import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';
import { useVaultMutate } from '@/hooks/useVaultMutate';

import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { useDb } from '@/context/DbContext';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Dutch', value: 'nl' }
];

const GENDER_OPTIONS = [
  { label: 'Random', value: 'random' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' }
];

/**
 * Identity Generator Settings screen.
 */
export default function IdentityGeneratorSettingsScreen(): React.ReactNode {
  const colors = useColors();
  const dbContext = useDb();
  const { executeVaultMutation } = useVaultMutate();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const [language, setLanguage] = useState<string>('en');
  const [gender, setGender] = useState<string>('random');
  const [isFirstLoad, setIsFirstLoad] = useMinDurationLoading(true, 100);

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
          setIsFirstLoad(false);
        } catch (error) {
          console.error('Error loading identity generator settings:', error);
          Alert.alert('Error', 'Failed to load identity generator settings.');
          setIsFirstLoad(false);
        }
      };

      loadSettings();
    }, [dbContext.sqliteClient, setIsFirstLoad])
  );

  /**
   * Handle language change.
   */
  const handleLanguageChange = useCallback(async (newLanguage: string): Promise<void> => {
    try {
      executeVaultMutation(async () => {
        // Update the default language setting
        await dbContext.sqliteClient!.updateSetting('DefaultIdentityLanguage', newLanguage);
        console.log('Updated default language setting to:', newLanguage);
      });
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language setting:', error);
      Alert.alert('Error', 'Failed to update language setting.');
    }
  }, [executeVaultMutation, dbContext.sqliteClient]);

  /**
   * Handle gender change.
   */
  const handleGenderChange = useCallback(async (newGender: string): Promise<void> => {
    try {
      executeVaultMutation(async () => {
        await dbContext.sqliteClient!.updateSetting('DefaultIdentityGender', newGender);
        console.log('Updated default gender setting to:', newGender);
      });
      setGender(newGender);
    } catch (error) {
      console.error('Error updating gender setting:', error);
      Alert.alert('Error', 'Failed to update gender setting.');
    }
  }, [executeVaultMutation, dbContext.sqliteClient]);

  const styles = StyleSheet.create({
    descriptionText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
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
    scrollContent: {
      paddingBottom: 40,
      paddingTop: Platform.OS === 'ios' ? 42 : 16,
    },
    scrollView: {
      flex: 1,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 24,
    },
    selectedIcon: {
      color: colors.primary,
      marginLeft: 8,
    },
  });

  if (isFirstLoad) {
    return (
      <ThemedContainer>
        <CollapsibleHeader
          title="Identity Generator"
          scrollY={scrollY}
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer>
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        scrollIndicatorInsets={{ bottom: 40 }}
        style={styles.scrollView}
      >
        <ThemedText style={styles.headerText}>
          Configure the default language and gender preferences for generating new identities.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Language</ThemedText>
        <ThemedText style={styles.descriptionText}>
          Set the language that will be used when generating new identities.
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

        <ThemedText style={styles.sectionTitle}>Gender</ThemedText>
        <ThemedText style={styles.descriptionText}>
          Set the gender preference for generating new identities.
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
      </Animated.ScrollView>
    </ThemedContainer>
  );
}