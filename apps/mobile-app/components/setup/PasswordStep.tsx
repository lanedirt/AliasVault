import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type PasswordStepProps = {
  password: string;
  confirmPassword: string;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Third step of setup: Master password creation
 */
export default function PasswordStep({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onNext,
  error,
  setError
}: PasswordStepProps): React.ReactNode {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Check if passwords match
   */
  const passwordsMatch = password === confirmPassword;
  const hasMinLength = password.length >= 10;
  const isValidForm = hasMinLength && passwordsMatch && password.length > 0 && confirmPassword.length > 0;

  /**
   * Handle password input change
   */
  const handlePasswordChange = (text: string): void => {
    onPasswordChange(text);
    setError(null);
  };

  /**
   * Handle confirm password input change
   */
  const handleConfirmPasswordChange = (text: string): void => {
    onConfirmPasswordChange(text);
    setError(null);
  };

  /**
   * Handle continue button press
   */
  const handleContinue = async (): Promise<void> => {
    if (!isValidForm) {
      if (!hasMinLength) {
        setError('Password must be at least 10 characters long');
      } else if (!passwordsMatch) {
        setError('Passwords do not match');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(false);
    onNext();
  };

  const styles = StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 8,
      padding: 16,
    },
    buttonDisabled: {
      backgroundColor: colors.accentBackground,
    },
    buttonEnabled: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: colors.textMuted,
    },
    buttonTextEnabled: {
      color: colors.primarySurfaceText,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
    },
    errorContainer: {
      backgroundColor: colors.errorBackground,
      borderColor: colors.errorBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 16,
      padding: 12,
    },
    errorText: {
      color: colors.errorText,
      fontSize: 14,
    },
    eyeButton: {
      padding: 12,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      height: 50,
      paddingHorizontal: 4,
    },
    inputContainer: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 8,
      width: '100%',
    },
    inputContainerError: {
      borderColor: colors.errorBorder,
    },
    inputContainerValid: {
      borderColor: colors.primary,
    },
    inputIcon: {
      padding: 12,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    passwordField: {
      marginBottom: 16,
    },
    scrollContainer: {
      flex: 1,
    },
    securityNote: {
      backgroundColor: colors.warningBackground,
      borderColor: colors.warningBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 20,
      padding: 12,
    },
    securityNoteText: {
      color: colors.warningText,
      fontSize: 14,
      lineHeight: 20,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 24,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    validationContainer: {
      marginBottom: 4,
    },
    validationItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },
    validationText: {
      fontSize: 14,
    },
    validationTextError: {
      color: colors.errorText,
    },
    validationTextValid: {
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Master Password</Text>
          <Text style={styles.subtitle}>
            Your master password protects all your data
          </Text>

          <View style={styles.securityNote}>
            <Text style={styles.securityNoteText}>
              ⚠️ Important: Your master password cannot be recovered if forgotten. 
              AliasVault uses zero-knowledge encryption, which means we never have access to your password or data.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.passwordField}>
            <Text style={styles.label}>Master Password</Text>
            <View 
              style={[
                styles.inputContainer,
                password.length > 0 && !hasMinLength && styles.inputContainerError,
                hasMinLength && password.length > 0 && styles.inputContainerValid
              ]}
            >
              <MaterialIcons
                name="lock"
                size={24}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your master password"
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.validationContainer}>
              <View style={styles.validationItem}>
                <MaterialIcons
                  name={hasMinLength ? "check-circle" : "cancel"}
                  size={16}
                  color={hasMinLength ? colors.primary : colors.errorText}
                />
                <Text 
                  style={[
                    styles.validationText,
                    hasMinLength ? styles.validationTextValid : styles.validationTextError
                  ]}
                >
                  At least 10 characters
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.passwordField}>
            <Text style={styles.label}>Confirm Master Password</Text>
            <View 
              style={[
                styles.inputContainer,
                confirmPassword.length > 0 && !passwordsMatch && styles.inputContainerError,
                confirmPassword.length > 0 && passwordsMatch && styles.inputContainerValid
              ]}
            >
              <MaterialIcons
                name="lock"
                size={24}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm your master password"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            
            {confirmPassword.length > 0 && (
              <View style={styles.validationContainer}>
                <View style={styles.validationItem}>
                  <MaterialIcons
                    name={passwordsMatch ? "check-circle" : "cancel"}
                    size={16}
                    color={passwordsMatch ? colors.primary : colors.errorText}
                  />
                  <Text 
                    style={[
                      styles.validationText,
                      passwordsMatch ? styles.validationTextValid : styles.validationTextError
                    ]}
                  >
                    Passwords match
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          isValidForm ? styles.buttonEnabled : styles.buttonDisabled
        ]}
        onPress={handleContinue}
        disabled={!isValidForm || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primarySurfaceText} />
        ) : (
          <Text 
            style={[
              styles.buttonText,
              isValidForm ? styles.buttonTextEnabled : styles.buttonTextDisabled
            ]}
          >
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}