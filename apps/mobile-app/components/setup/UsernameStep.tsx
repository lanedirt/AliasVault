import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
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

import { useWebApi } from '@/context/WebApiContext';

type ValidationState = 'idle' | 'validating' | 'valid' | 'error';

type UsernameStepProps = {
  username: string;
  onUsernameChange: (username: string) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Second step of setup: Username selection and validation
 */
export default function UsernameStep({
  username,
  onUsernameChange,
  onNext,
  error,
  setError
}: UsernameStepProps): React.ReactNode {
  const colors = useColors();
  const webApi = useWebApi();
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate username with server
   */
  const validateUsername = useCallback(async (usernameToValidate: string): Promise<void> => {
    if (!usernameToValidate.trim()) {
      setValidationState('idle');
      setValidationError(null);
      return;
    }

    setValidationState('validating');
    setValidationError(null);

    try {
      const response = await webApi.rawFetch('Auth/validate-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToValidate.toLowerCase().trim() }),
      });

      if (response.ok) {
        setValidationState('valid');
      } else {
        const errorData = await response.json();
        setValidationState('error');
        setValidationError(errorData.title ?? 'Username is not available');
      }
    } catch (_err) {
      setValidationState('error');
      setValidationError('Could not validate username. Please try again.');
    }
  }, [webApi]);

  /**
   * Debounced username validation
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length > 0) {
        validateUsername(username);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, validateUsername]);

  /**
   * Handle continue button press
   */
  const handleContinue = async (): Promise<void> => {
    if (validationState !== 'valid') {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Re-validate username before continuing
    try {
      await validateUsername(username);
      if (validationState === 'valid') {
        onNext();
      }
    } catch (_err) {
      setError('Failed to validate username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle username input change
   */
  const handleUsernameChange = (text: string): void => {
    // Clear any previous errors
    setError(null);
    setValidationError(null);
    
    // Update username
    onUsernameChange(text);
    
    // Reset validation state
    if (text.trim() === '') {
      setValidationState('idle');
    }
  };

  const isValidUsername = validationState === 'valid';
  const showValidationIcon = username.length > 0 && validationState !== 'idle';

  const styles = StyleSheet.create({
    assistantContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    assistantText: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 22,
      textAlign: 'center',
    },
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
    scrollContainer: {
      flex: 1,
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
      marginBottom: 20,
    },
    validationMessage: {
      fontSize: 14,
      marginTop: 4,
    },
    validationMessageError: {
      color: colors.errorText,
    },
    validationMessageValid: {
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose a Username</Text>
          <Text style={styles.subtitle}>
            This will be your unique identifier for logging in
          </Text>

          <View style={styles.assistantContainer}>
            <Text style={styles.assistantText}>
              Your username can be an email address or a custom name. It will be used to log into your vault.
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.validationContainer}>
            <Text style={styles.label}>Username</Text>
            <View 
              style={[
                styles.inputContainer,
                validationState === 'error' && styles.inputContainerError,
                validationState === 'valid' && styles.inputContainerValid
              ]}
            >
              <MaterialIcons
                name="person"
                size={24}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="username or email@company.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              {showValidationIcon && (
                <View style={styles.inputIcon}>
                  {validationState === 'validating' && (
                    <ActivityIndicator size="small" color={colors.textMuted} />
                  )}
                  {validationState === 'valid' && (
                    <MaterialIcons 
                      name="check-circle" 
                      size={24} 
                      color={colors.primary} 
                    />
                  )}
                  {validationState === 'error' && (
                    <MaterialIcons 
                      name="error" 
                      size={24} 
                      color={colors.errorText} 
                    />
                  )}
                </View>
              )}
            </View>
            
            {validationError && (
              <Text style={[styles.validationMessage, styles.validationMessageError]}>
                {validationError}
              </Text>
            )}
            
            {validationState === 'valid' && (
              <Text style={[styles.validationMessage, styles.validationMessageValid]}>
                ✓ Username is available
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          isValidUsername ? styles.buttonEnabled : styles.buttonDisabled
        ]}
        onPress={handleContinue}
        disabled={!isValidUsername || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primarySurfaceText} />
        ) : (
          <Text 
            style={[
              styles.buttonText,
              isValidUsername ? styles.buttonTextEnabled : styles.buttonTextDisabled
            ]}
          >
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}