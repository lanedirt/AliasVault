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
  BackHandler,
  Alert
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

import Logo from '@/assets/images/logo.svg';
import CreatingStep from '@/components/setup/CreatingStep';
import PasswordStep from '@/components/setup/PasswordStep';
import TermsAndConditionsStep from '@/components/setup/TermsAndConditionsStep';
import UsernameStep from '@/components/setup/UsernameStep';
import { ThemedView } from '@/components/themed/ThemedView';

enum SetupStep {
  TermsAndConditions = 0,
  Username = 1,
  Password = 2,
  Creating = 3,
}

type SetupData = {
  agreedToTerms: boolean;
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * Account setup/registration screen.
 * Provides a 4-step wizard for creating new AliasVault accounts.
 */
export default function SetupScreen(): React.ReactNode {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.TermsAndConditions);
  const [setupData, setSetupData] = useState<SetupData>({
    agreedToTerms: false,
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  /**
   * Handle back button press
   */
  const handleBackPress = (): boolean => {
    if (currentStep === SetupStep.TermsAndConditions) {
      // On first step, show confirmation to exit
      Alert.alert(
        'Exit Setup',
        'Are you sure you want to exit the account creation process?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit', 
            style: 'destructive',
            onPress: (): void => router.replace('/login')
          }
        ]
      );
      return true;
    } else if (currentStep === SetupStep.Creating) {
      // Don't allow back during account creation
      return true;
    } else {
      // Go back to previous step
      setCurrentStep(currentStep - 1);
      setError(null);
      return true;
    }
  };

  /**
   * Handle navigation to next step
   */
  const handleNext = (): void => {
    setError(null);
    
    if (currentStep < SetupStep.Creating) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Update setup data
   */
  const updateSetupData = (updates: Partial<SetupData>): void => {
    setSetupData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handle setup completion (redirect to tutorial)
   */
  const handleSetupComplete = (): void => {
    // Navigate to credentials screen which will show tutorial if needed
    router.replace('/(tabs)/credentials');
  };

  /**
   * Render the current step component
   */
  const renderCurrentStep = (): React.ReactNode => {
    switch (currentStep) {
      case SetupStep.TermsAndConditions:
        return (
          <TermsAndConditionsStep
            agreedToTerms={setupData.agreedToTerms}
            onAgreementChange={(agreed) => updateSetupData({ agreedToTerms: agreed })}
            onNext={handleNext}
            error={error}
          />
        );
      case SetupStep.Username:
        return (
          <UsernameStep
            username={setupData.username}
            onUsernameChange={(username) => updateSetupData({ username })}
            onNext={handleNext}
            error={error}
            setError={setError}
          />
        );
      case SetupStep.Password:
        return (
          <PasswordStep
            password={setupData.password}
            confirmPassword={setupData.confirmPassword}
            onPasswordChange={(password) => updateSetupData({ password })}
            onConfirmPasswordChange={(confirmPassword) => updateSetupData({ confirmPassword })}
            onNext={handleNext}
            error={error}
            setError={setError}
          />
        );
      case SetupStep.Creating:
        return (
          <CreatingStep
            setupData={setupData}
            onComplete={handleSetupComplete}
            error={error}
            setError={setError}
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
    spacer: {
      flex: 1,
    },
    stepContainer: {
      flex: 1,
    },
  });

  /**
   * Set up hardware back button handler for Android
   */
  React.useEffect((): (() => void) => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [currentStep, handleBackPress]);

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

          {currentStep > SetupStep.TermsAndConditions && currentStep < SetupStep.Creating && (
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.primarySurfaceText} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
            </View>
          )}
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}