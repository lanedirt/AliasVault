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

type WelcomeStepProps = {
  onNext: () => void;
  onSkip: () => void;
}

/**
 * First step of tutorial: Welcome message
 */
export default function WelcomeStep({
  onNext,
  onSkip
}: WelcomeStepProps): React.ReactNode {
  const colors = useColors();

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
    congratsIcon: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 40,
      height: 80,
      justifyContent: 'center',
      marginBottom: 24,
      width: 80,
    },
    content: {
      paddingBottom: 24,
    },
    description: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 32,
      textAlign: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 32,
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
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 16,
      textAlign: 'center',
    },
    scrollContainer: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.congratsIcon}>
              <MaterialIcons 
                name="check" 
                size={40} 
                color={colors.primarySurfaceText} 
              />
            </View>
            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.subtitle}>
              Your AliasVault has been created successfully
            </Text>
          </View>

          <Text style={styles.description}>
            Welcome to AliasVault, your privacy-first password and email alias manager. 
            Your vault is now secured with end-to-end encryption, ensuring that only you 
            can access your data.
            {'\n\n'}
            Let&apos;s take a quick tour to help you get started with protecting your privacy online.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>Start Tour</Text>
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