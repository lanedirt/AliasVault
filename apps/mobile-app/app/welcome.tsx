import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  BackHandler
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import Logo from '@/assets/images/logo.svg';
import { ThemedView } from '@/components/themed/ThemedView';
import WelcomeStep from '@/components/tutorial/WelcomeStep';
import HowItWorksStep from '@/components/tutorial/HowItWorksStep';
import TipsStep from '@/components/tutorial/TipsStep';
import CreateFirstIdentityStep from '@/components/tutorial/CreateFirstIdentityStep';
import { useDb } from '@/context/DbContext';

enum TutorialStep {
  Welcome = 0,
  HowAliasVaultWorks = 1,
  Tips = 2,
  CreateFirstIdentity = 3,
}

/**
 * Welcome/Tutorial screen.
 * Shown after successful account creation to guide new users.
 */
export default function WelcomeScreen(): React.ReactNode {
  const colors = useColors();
  const dbContext = useDb();
  const [currentStep, setCurrentStep] = useState<TutorialStep>(TutorialStep.Welcome);

  const totalSteps = 4;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  /**
   * Handle navigation to next step
   */
  const handleNext = (): void => {
    if (currentStep < TutorialStep.CreateFirstIdentity) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handle navigation to previous step
   */
  const handleBack = (): void => {
    if (currentStep > TutorialStep.Welcome) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Finish the tutorial and mark it as completed
   */
  const finishTutorial = async (): Promise<void> => {
    try {
      // Mark tutorial as done in database
      if (dbContext.sqliteClient) {
        await dbContext.sqliteClient.setSetting('TutorialDone', 'true');
      }
      
      // Navigate to credentials screen
      router.replace('/(tabs)/credentials');
    } catch (error) {
      console.error('Failed to finish tutorial:', error);
      // Navigate anyway
      router.replace('/(tabs)/credentials');
    }
  };

  /**
   * Skip tutorial and go directly to credentials
   */
  const skipTutorial = async (): Promise<void> => {
    await finishTutorial();
  };

  /**
   * Render the current step component
   */
  const renderCurrentStep = (): React.ReactNode => {
    switch (currentStep) {
      case TutorialStep.Welcome:
        return (
          <WelcomeStep
            onNext={handleNext}
            onSkip={skipTutorial}
          />
        );
      case TutorialStep.HowAliasVaultWorks:
        return (
          <HowItWorksStep
            onNext={handleNext}
            onSkip={skipTutorial}
          />
        );
      case TutorialStep.Tips:
        return (
          <TipsStep
            onNext={handleNext}
            onSkip={skipTutorial}
          />
        );
      case TutorialStep.CreateFirstIdentity:
        return (
          <CreateFirstIdentityStep
            onGetStarted={finishTutorial}
          />
        );
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    appName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    backButton: {
      alignItems: 'center',
      backgroundColor: colors.secondary,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 8,
      padding: 12,
    },
    backButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      backgroundColor: colors.background,
      flex: 1,
      padding: 16,
    },
    gradientContainer: {
      height: Dimensions.get('window').height * 0.3,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    headerSection: {
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    navigationContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'space-between',
      marginTop: 16,
    },
    progressBar: {
      backgroundColor: colors.accentBackground,
      borderRadius: 4,
      height: 8,
      width: '100%',
    },
    progressContainer: {
      marginBottom: 24,
    },
    progressFill: {
      backgroundColor: colors.primary,
      borderRadius: 4,
      height: '100%',
    },
    progressText: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'center',
    },
    stepContainer: {
      flex: 1,
    },
  });

  // Disable hardware back button on Android
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[colors.loginHeader, colors.background]}
          style={styles.gradientContainer}
        />
        
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Logo width={60} height={60} />
            <Text style={styles.appName}>AliasVault</Text>
          </View>
        </View>

        <ThemedView style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {totalSteps}
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          <View style={styles.stepContainer}>
            {renderCurrentStep()}
          </View>

          {currentStep > TutorialStep.Welcome && currentStep < TutorialStep.CreateFirstIdentity && (
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.primarySurfaceText} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
            </View>
          )}
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}