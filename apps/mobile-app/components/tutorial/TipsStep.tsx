import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Linking
} from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type TipsStepProps = {
  onNext: () => void;
  onSkip: () => void;
}

/**
 * Third step of tutorial: Security tips and app downloads
 */
export default function TipsStep({
  onNext,
  onSkip
}: TipsStepProps): React.ReactNode {
  const colors = useColors();

  /**
   * Open app store for browser extension download
   */
  const openBrowserExtension = (): void => {
    if (Platform.OS === 'ios') {
      // iOS Safari Extensions
      Linking.openURL('https://apps.apple.com/app/aliasvault/id1234567890');
    } else {
      // Android Chrome Web Store
      Linking.openURL('https://chrome.google.com/webstore/detail/aliasvault/abcdefghijklmnop');
    }
  };

  const tips = [
    {
      icon: 'security',
      title: 'Keep Your Master Password Safe',
      description: 'Your master password cannot be recovered. Write it down and store it securely.',
      color: colors.errorText
    },
    {
      icon: 'verified-user',
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account in Settings > Security.',
      color: colors.primary
    },
    {
      icon: 'extension',
      title: 'Install Browser Extension',
      description: 'Get the AliasVault browser extension for seamless auto-fill on websites.',
      color: colors.primary,
      action: openBrowserExtension,
      actionText: 'Download'
    }
  ];

  const styles = StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.primary,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: 'center',
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionButtonText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
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
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginBottom: 32,
      textAlign: 'center',
    },
    tipContainer: {
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    tipContent: {
      flex: 1,
      marginLeft: 16,
    },
    tipDescription: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    tipHeader: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    tipIcon: {
      marginRight: 4,
    },
    tipTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    tipsContainer: {
      marginBottom: 32,
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
          <Text style={styles.title}>Tips & Recommendations</Text>
          <Text style={styles.subtitle}>
            Follow these tips to get the most out of AliasVault
          </Text>

          <View style={styles.tipsContainer}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipContainer}>
                <View style={styles.tipHeader}>
                  <MaterialIcons 
                    name={tip.icon as any} 
                    size={24} 
                    color={tip.color} 
                    style={styles.tipIcon}
                  />
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                  </View>
                </View>
                <Text style={styles.tipDescription}>{tip.description}</Text>
                {tip.action && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={tip.action}
                  >
                    <Text style={styles.actionButtonText}>{tip.actionText}</Text>
                  </TouchableOpacity>
                )}
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