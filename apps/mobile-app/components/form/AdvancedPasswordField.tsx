import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { View, TextInput, TextInputProps, StyleSheet, TouchableHighlight, Platform, Modal, ScrollView, Switch, TouchableOpacity } from 'react-native';

import type { PasswordSettings } from '@/utils/dist/shared/models/vault';
import { CreatePasswordGenerator } from '@/utils/dist/shared/password-generator';

import { useColors } from '@/hooks/useColorScheme';

import { ThemedText } from '@/components/themed/ThemedText';

export type AdvancedPasswordFieldRef = {
  focus: () => void;
  selectAll: () => void;
};

type AdvancedPasswordFieldProps<T extends FieldValues> = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  initialSettings: PasswordSettings;
  showPassword?: boolean;
  onShowPasswordChange?: (show: boolean) => void;
}

/**
 * Advanced password field component with inline length slider and settings modal.
 */
const AdvancedPasswordFieldComponent = forwardRef<AdvancedPasswordFieldRef, AdvancedPasswordFieldProps<FieldValues>>(({
  label,
  name,
  control,
  required,
  initialSettings,
  showPassword: controlledShowPassword,
  onShowPasswordChange,
  ...props
}, ref) => {
  const colors = useColors();
  const inputRef = React.useRef<TextInput>(null);
  const currentValue = useRef<string>('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<PasswordSettings>(initialSettings);
  const [previewPassword, setPreviewPassword] = useState<string>('');

  // Use controlled or uncontrolled showPassword state
  const showPassword = controlledShowPassword ?? internalShowPassword;

  /**
   * Set the showPassword state.
   */
  const setShowPasswordState = useCallback((show: boolean): void => {
    if (controlledShowPassword !== undefined) {
      onShowPasswordChange?.(show);
    } else {
      setInternalShowPassword(show);
    }
  }, [controlledShowPassword, onShowPasswordChange]);

  /**
   * Expose focus and selectAll methods through ref.
   */
  useImperativeHandle(ref, () => ({
    /**
     * Focus the input field.
     */
    focus: (): void => {
      inputRef.current?.focus();
    },
    /**
     * Select all text in the input field.
     */
    selectAll: (): void => {
      inputRef.current?.setSelection(0, currentValue.current.length);
    }
  }));

  /**
   * Initialize settings when initialSettings change.
   */
  useEffect(() => {
    setCurrentSettings({ ...initialSettings });
  }, [initialSettings]);

  /**
   * Generate a password with the given settings.
   */
  const generatePassword = useCallback((settings: PasswordSettings, onChange: (value: string) => void) => {
    try {
      const passwordGenerator = CreatePasswordGenerator(settings);
      const password = passwordGenerator.generateRandomPassword();
      onChange(password);
      setShowPasswordState(true);
      return password;
    } catch (error) {
      console.error('Error generating password:', error);
      return '';
    }
  }, [setShowPasswordState]);

  /**
   * Generate a preview password for the settings modal.
   */
  const generatePreview = useCallback((settings: PasswordSettings) => {
    try {
      const passwordGenerator = CreatePasswordGenerator(settings);
      const password = passwordGenerator.generateRandomPassword();
      setPreviewPassword(password);
    } catch (error) {
      console.error('Error generating preview password:', error);
      setPreviewPassword('');
    }
  }, []);

  /**
   * Handle password length change via slider.
   */
  const handleLengthChange = useCallback((newLength: number, onChange: (value: string) => void) => {
    const roundedLength = Math.round(newLength);
    const newSettings = { ...currentSettings, Length: roundedLength };
    setCurrentSettings(newSettings);
    generatePassword(newSettings, onChange);
  }, [currentSettings, generatePassword]);

  /**
   * Handle password setting toggle changes.
   */
  const handleSettingChange = useCallback((key: keyof PasswordSettings, value: boolean | number) => {
    const newSettings = { ...currentSettings, [key]: value };
    setCurrentSettings(newSettings);
    // Auto-regenerate preview when settings change
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  /**
   * Individual handlers for each switch to prevent re-renders.
   */
  const handleLowercaseChange = useCallback((value: boolean) => {
    const newSettings = { ...currentSettings, UseLowercase: value };
    setCurrentSettings(newSettings);
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  const handleUppercaseChange = useCallback((value: boolean) => {
    const newSettings = { ...currentSettings, UseUppercase: value };
    setCurrentSettings(newSettings);
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  const handleNumbersChange = useCallback((value: boolean) => {
    const newSettings = { ...currentSettings, UseNumbers: value };
    setCurrentSettings(newSettings);
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  const handleSpecialCharsChange = useCallback((value: boolean) => {
    const newSettings = { ...currentSettings, UseSpecialChars: value };
    setCurrentSettings(newSettings);
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  const handleNonAmbiguousChange = useCallback((value: boolean) => {
    const newSettings = { ...currentSettings, UseNonAmbiguousChars: value };
    setCurrentSettings(newSettings);
    generatePreview(newSettings);
  }, [currentSettings, generatePreview]);

  /**
   * Handle opening the settings modal.
   */
  const handleOpenSettings = useCallback(() => {
    // Generate initial preview when modal opens
    generatePreview(currentSettings);
    setShowSettingsModal(true);
  }, [currentSettings, generatePreview]);

  /**
   * Handle refreshing the preview password in the modal.
   */
  const handleRefreshPreview = useCallback(() => {
    generatePreview(currentSettings);
  }, [currentSettings, generatePreview]);

  /**
   * Handle using the generated password from the modal.
   */
  const handleUsePassword = useCallback((onChange: (value: string) => void) => {
    onChange(previewPassword);
    setShowPasswordState(true);
    setShowSettingsModal(false);
  }, [previewPassword, setShowPasswordState]);

  const colorRed = 'red';
  const modalBackgroundColor = 'rgba(0, 0, 0, 0.5)';

  const styles = StyleSheet.create({
    button: {
      borderLeftColor: colors.accentBorder,
      borderLeftWidth: 1,
      padding: 10,
    },
    clearButton: {
      borderRadius: 6,
      marginRight: 4,
      padding: 6,
    },
    closeButton: {
      padding: 4,
    },
    errorText: {
      color: colorRed,
      fontSize: 12,
      marginTop: 4,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      marginRight: 5,
      padding: 10,
    },
    inputContainer: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: 'row',
    },
    inputError: {
      borderColor: colorRed,
    },
    inputGroup: {
      marginBottom: 6,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      maxHeight: '80%',
      maxWidth: 400,
      padding: 20,
      width: '90%',
    },
    modalHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalOverlay: {
      alignItems: 'center',
      backgroundColor: modalBackgroundColor,
      flex: 1,
      justifyContent: 'center',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
    },
    previewContainer: {
      marginBottom: 20,
    },
    previewInputContainer: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: 'row',
    },
    previewInput: {
      color: colors.text,
      flex: 1,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      padding: 12,
      textAlign: 'center',
    },
    refreshButton: {
      borderLeftColor: colors.accentBorder,
      borderLeftWidth: 1,
      padding: 10,
    },
    requiredIndicator: {
      color: colorRed,
      marginLeft: 4,
    },
    settingItem: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    settingLabel: {
      color: colors.text,
      fontSize: 14,
    },
    settingsButton: {
      marginLeft: 8,
      padding: 4,
    },
    settingsSection: {
      marginBottom: 20,
    },
    slider: {
      height: 40,
      width: '100%',
    },
    sliderContainer: {
      marginTop: 8,
      paddingHorizontal: 4,
    },
    sliderHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sliderLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    sliderValue: {
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 12,
      fontWeight: '600',
    },
    sliderValueContainer: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    useButton: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 12,
    },
    useButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  /**
   * Handle closing the settings modal.
   */
  const handleCloseModal = useCallback(() => {
    setShowSettingsModal(false);
  }, []);

  /**
   * Render the settings modal.
   */
  const renderSettingsModal = useCallback((onChange: (value: string) => void) => {
    if (!showSettingsModal) {
      return null;
    }

    return (
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('credentials.changePasswordComplexity')}</ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.previewContainer}>
                <View style={styles.previewInputContainer}>
                  <TextInput
                    style={styles.previewInput}
                    value={previewPassword}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshPreview}
                  >
                    <MaterialIcons name="refresh" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingsSection}>
                <View style={styles.settingItem}>
                  <ThemedText style={styles.settingLabel}>Lowercase (a-z)</ThemedText>
                  <Switch
                    value={currentSettings.UseLowercase}
                    onValueChange={handleLowercaseChange}
                    trackColor={{ false: colors.accentBorder, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                  />
                </View>

                <View style={styles.settingItem}>
                  <ThemedText style={styles.settingLabel}>Uppercase (A-Z)</ThemedText>
                  <Switch
                    value={currentSettings.UseUppercase}
                    onValueChange={handleUppercaseChange}
                    trackColor={{ false: colors.accentBorder, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                  />
                </View>

                <View style={styles.settingItem}>
                  <ThemedText style={styles.settingLabel}>Numbers (0-9)</ThemedText>
                  <Switch
                    value={currentSettings.UseNumbers}
                    onValueChange={handleNumbersChange}
                    trackColor={{ false: colors.accentBorder, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                  />
                </View>

                <View style={styles.settingItem}>
                  <ThemedText style={styles.settingLabel}>Special Characters (!@#)</ThemedText>
                  <Switch
                    value={currentSettings.UseSpecialChars}
                    onValueChange={handleSpecialCharsChange}
                    trackColor={{ false: colors.accentBorder, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                  />
                </View>

                <View style={styles.settingItem}>
                  <ThemedText style={styles.settingLabel}>Avoid Ambiguous Characters</ThemedText>
                  <Switch
                    value={currentSettings.UseNonAmbiguousChars}
                    onValueChange={handleNonAmbiguousChange}
                    trackColor={{ false: colors.accentBorder, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.useButton}
                onPress={() => handleUsePassword(onChange)}
              >
                <ThemedText style={styles.useButtonText}>Use This Password</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }, [
    showSettingsModal,
    styles,
    previewPassword,
    handleRefreshPreview,
    currentSettings,
    handleLowercaseChange,
    handleUppercaseChange,
    handleNumbersChange,
    handleSpecialCharsChange,
    handleNonAmbiguousChange,
    colors,
    handleUsePassword,
    handleCloseModal
  ]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        currentValue.current = value as string;
        const showClearButton = Platform.OS === 'android' && value && value.length > 0 && isFocused;

        return (
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>
              {label} {required && <ThemedText style={styles.requiredIndicator}>*</ThemedText>}
            </ThemedText>
            
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={value as string}
                placeholderTextColor={colors.textMuted}
                onChangeText={onChange}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                clearButtonMode={Platform.OS === 'ios' ? "while-editing" : "never"}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                secureTextEntry={!showPassword}
                {...props}
              />
              
              {showClearButton && (
                <TouchableHighlight
                  style={styles.clearButton}
                  onPress={() => onChange('')}
                  underlayColor={colors.accentBackground}
                >
                  <MaterialIcons name="close" size={16} color={colors.textMuted} />
                </TouchableHighlight>
              )}
              
              <TouchableHighlight
                style={styles.button}
                onPress={() => setShowPasswordState(!showPassword)}
                underlayColor={colors.accentBackground}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableHighlight>
              
              <TouchableHighlight
                style={styles.button}
                onPress={() => generatePassword(currentSettings, onChange)}
                underlayColor={colors.accentBackground}
              >
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
              </TouchableHighlight>
            </View>
            
            {/* Inline Password Length Slider */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <ThemedText style={styles.sliderLabel}>Password Length</ThemedText>
                <View style={styles.sliderValueContainer}>
                  <ThemedText style={styles.sliderValue}>{currentSettings.Length}</ThemedText>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={handleOpenSettings}
                  >
                    <MaterialIcons name="settings" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Slider
                style={styles.slider}
                minimumValue={8}
                maximumValue={64}
                value={currentSettings.Length}
                onValueChange={(value) => handleLengthChange(value, onChange)}
                step={1}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.accentBorder}
                thumbTintColor={colors.primary}
              />
            </View>
            
            {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            
            {renderSettingsModal(onChange)}
          </View>
        );
      }}
    />
  );
});

AdvancedPasswordFieldComponent.displayName = 'AdvancedPasswordField';

export const AdvancedPasswordField = AdvancedPasswordFieldComponent as <T extends FieldValues>(props: AdvancedPasswordFieldProps<T> & { ref?: React.Ref<AdvancedPasswordFieldRef> }) => JSX.Element;