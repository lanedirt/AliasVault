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

type CreateFirstIdentityStepProps = {
  onGetStarted: () => void;
}

/**
 * Fourth step of tutorial: Call to action to create first identity
 */
export default function CreateFirstIdentityStep({
  onGetStarted
}: CreateFirstIdentityStepProps): React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 8,
      padding: 16,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
    },
    ctaButton: {
      backgroundColor: colors.primary,
    },
    ctaButtonText: {
      color: colors.primarySurfaceText,
      fontSize: 18,
      fontWeight: '600',
    },
    description: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 32,
      textAlign: 'center',
    },
    featureContainer: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 20,
    },
    featureDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    featureIcon: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 30,
      height: 60,
      justifyContent: 'center',
      marginBottom: 12,
      width: 60,
    },
    featureTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    featuresContainer: {
      marginBottom: 32,
    },
    readyIcon: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 50,
      height: 100,
      justifyContent: 'center',
      marginBottom: 24,
      width: 100,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 32,
      textAlign: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
  });

  const features = [
    {
      icon: 'email',
      title: 'Email Aliases',
      description: 'Create unique email addresses for each service'
    },
    {
      icon: 'password',
      title: 'Secure Passwords',
      description: 'Generate and store strong, unique passwords'
    },
    {
      icon: 'security',
      title: 'Privacy Protection',
      description: 'Keep your real email address private'
    }
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <View style={styles.readyIcon}>
              <MaterialIcons 
                name="rocket-launch" 
                size={50} 
                color={colors.primarySurfaceText} 
              />
            </View>
            <Text style={styles.title}>You're All Set!</Text>
            <Text style={styles.subtitle}>
              Your secure vault is ready to protect your privacy
            </Text>
          </View>

          <Text style={styles.description}>
            You now have access to all of AliasVault's powerful privacy features. 
            Start by creating your first identity to begin protecting your email address online.
          </Text>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureContainer}>
                <View style={styles.featureIcon}>
                  <MaterialIcons 
                    name={feature.icon as any} 
                    size={30} 
                    color={colors.primarySurfaceText} 
                  />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, styles.ctaButton]}
        onPress={onGetStarted}
      >
        <Text style={styles.ctaButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}