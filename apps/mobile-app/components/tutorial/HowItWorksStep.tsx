import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type HowItWorksStepProps = {
  onNext: () => void;
  onSkip: () => void;
}

/**
 * Second step of tutorial: How AliasVault Works
 */
export default function HowItWorksStep({
  onNext,
  onSkip
}: HowItWorksStepProps): React.ReactNode {
  const colors = useColors();

  const steps = [
    {
      icon: 'person-add',
      title: 'Create an Identity',
      description: 'Generate a new identity with a unique email alias for each service you sign up for.'
    },
    {
      icon: 'email',
      title: 'Use the Alias',
      description: 'Sign up for services using your alias email instead of your real email address.'
    },
    {
      icon: 'security',
      title: 'Stay Protected',
      description: 'Your real email stays private, and you can disable aliases if they get compromised.'
    },
    {
      icon: 'password',
      title: 'Manage Passwords',
      description: 'Store unique, secure passwords for each account with our built-in password manager.'
    }
  ];

  const styles = StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 8,
      padding: 16,
    },
    buttonContainer: {
      gap: 12,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
    secondaryButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    stepContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    stepContent: {
      flex: 1,
      marginLeft: 16,
    },
    stepDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    stepIcon: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 30,
      height: 60,
      justifyContent: 'center',
      width: 60,
    },
    stepNumber: {
      backgroundColor: colors.accentBackground,
      borderRadius: 12,
      color: colors.text,
      fontSize: 12,
      fontWeight: 'bold',
      height: 24,
      lineHeight: 24,
      position: 'absolute',
      right: -8,
      textAlign: 'center',
      top: -8,
      width: 24,
    },
    stepTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    stepsContainer: {
      marginBottom: 32,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 32,
      textAlign: 'center',
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
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>How AliasVault Works</Text>
          <Text style={styles.subtitle}>
            Protect your privacy with email aliases and secure password management
          </Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepIcon}>
                  <MaterialIcons 
                    name={step.icon as any} 
                    size={30} 
                    color={colors.primarySurfaceText} 
                  />
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onSkip}
        >
          <Text style={styles.secondaryButtonText}>Skip Tour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}