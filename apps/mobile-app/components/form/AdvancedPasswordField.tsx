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
    /*
     * Don't auto-generate preview to avoid modal flickering.
     * User can use the refresh button to see changes.
     */
  }, [currentSettings]);

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
    previewInput: {
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
      padding: 12,
      textAlign: 'center',
    },
    refreshButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 6,
      marginTop: 8,
      padding: 10,
    },
    refreshButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 14,
      fontWeight: '600',
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
      backgroundColor: colors.primary,
      borderRadius: 6,
      padding: 12,
    },
    useButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  /**
   * Settings modal component for advanced password configuration.
   */
  const SettingsModal = ({ onChange }: { onChange: (value: string) => void }): React.ReactElement => (
    <Modal
      visible={showSettingsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Password Settings</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.previewContainer}>
              <TextInput
                style={styles.previewInput}
                value={previewPassword}
                editable={false}
              />
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshPreview}
              >
                <ThemedText style={styles.refreshButtonText}>Generate New</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>Lowercase (a-z)</ThemedText>
                <Switch
                  value={currentSettings.UseLowercase}
                  onValueChange={(value) => handleSettingChange('UseLowercase', value)}
                  trackColor={{ false: colors.accentBorder, true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                />
              </View>

              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>Uppercase (A-Z)</ThemedText>
                <Switch
                  value={currentSettings.UseUppercase}
                  onValueChange={(value) => handleSettingChange('UseUppercase', value)}
                  trackColor={{ false: colors.accentBorder, true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                />
              </View>

              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>Numbers (0-9)</ThemedText>
                <Switch
                  value={currentSettings.UseNumbers}
                  onValueChange={(value) => handleSettingChange('UseNumbers', value)}
                  trackColor={{ false: colors.accentBorder, true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                />
              </View>

              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>Special Characters (!@#)</ThemedText>
                <Switch
                  value={currentSettings.UseSpecialChars}
                  onValueChange={(value) => handleSettingChange('UseSpecialChars', value)}
                  trackColor={{ false: colors.accentBorder, true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? colors.background : undefined}
                />
              </View>

              <View style={styles.settingItem}>
                <ThemedText style={styles.settingLabel}>Avoid Ambiguous Characters</ThemedText>
                <Switch
                  value={currentSettings.UseNonAmbiguousChars}
                  onValueChange={(value) => handleSettingChange('UseNonAmbiguousChars', value)}
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
            
            <SettingsModal onChange={onChange} />
          </View>
        );
      }}
    />
  );
});

AdvancedPasswordFieldComponent.displayName = 'AdvancedPasswordField';

export const AdvancedPasswordField = AdvancedPasswordFieldComponent as <T extends FieldValues>(props: AdvancedPasswordFieldProps<T> & { ref?: React.Ref<AdvancedPasswordFieldRef> }) => JSX.Element;