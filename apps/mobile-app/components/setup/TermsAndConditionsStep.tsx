import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import { InAppBrowserView } from '@/components/ui/InAppBrowserView';

type TermsAndConditionsStepProps = {
  agreedToTerms: boolean;
  onAgreementChange: (agreed: boolean) => void;
  onNext: () => void;
  error: string | null;
}

/**
 * First step of setup: Terms and Conditions agreement
 */
export default function TermsAndConditionsStep({
  agreedToTerms,
  onAgreementChange,
  onNext,
  error
}: TermsAndConditionsStepProps): React.ReactNode {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle continue button press
   */
  const handleContinue = async (): Promise<void> => {
    if (!agreedToTerms) {
      return;
    }

    setIsLoading(true);
    // Add small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    onNext();
  };

  const styles = StyleSheet.create({
    agreementContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    agreementText: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
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
    checkbox: {
      alignItems: 'center',
      borderColor: colors.accentBorder,
      borderRadius: 4,
      borderWidth: 2,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
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
    termsContainer: {
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      height: 200,
      marginBottom: 20,
      padding: 16,
    },
    termsContent: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to AliasVault</Text>
          <Text style={styles.subtitle}>
            Please review and accept our Terms and Conditions to continue
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.termsContainer}>
            <ScrollView showsVerticalScrollIndicator>
              <Text style={styles.termsContent}>
                {`By creating an AliasVault account, you agree to our Terms of Service and Privacy Policy.

AliasVault is a privacy-first password and email alias manager with full end-to-end encryption. Your data is encrypted on your device before being sent to our servers, ensuring that we never have access to your unencrypted information.

Key points:
• Your master password is never transmitted to our servers
• All sensitive data is encrypted client-side using zero-knowledge encryption
• We cannot recover your data if you forget your master password
• You are responsible for keeping your master password secure
• Our service is provided "as-is" without warranties
• You must not use the service for illegal activities
• We reserve the right to terminate accounts that violate our terms

For the complete Terms of Service and Privacy Policy, please visit our website.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these terms.`}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.agreementContainer}>
            <TouchableOpacity
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
              onPress={() => onAgreementChange(!agreedToTerms)}
            >
              {agreedToTerms && (
                <MaterialIcons 
                  name="check" 
                  size={16} 
                  color={colors.primarySurfaceText} 
                />
              )}
            </TouchableOpacity>
            <Text style={styles.agreementText}>
              I agree to the{' '}
              <InAppBrowserView
                url="https://aliasvault.net/terms"
                title="Terms of Service"
                textStyle={styles.link}
              />
              {' '}and{' '}
              <InAppBrowserView
                url="https://aliasvault.net/privacy"
                title="Privacy Policy"
                textStyle={styles.link}
              />
            </Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          agreedToTerms ? styles.buttonEnabled : styles.buttonDisabled
        ]}
        onPress={handleContinue}
        disabled={!agreedToTerms || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primarySurfaceText} />
        ) : (
          <Text 
            style={[
              styles.buttonText,
              agreedToTerms ? styles.buttonTextEnabled : styles.buttonTextDisabled
            ]}
          >
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}