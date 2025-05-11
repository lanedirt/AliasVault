import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';

type SettingsHeaderProps = {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Settings header component.
 * @param title - The title of the header.
 * @param description - The description of the header.
 * @param icon - The icon of the header.
 * @returns The settings header component.
 */
export function SettingsHeader({ title, description, icon }: SettingsHeaderProps): React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 20,
      textAlign: 'center',
    },
    description: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 20,
      textAlign: 'center',
    },
    gradient: {
      alignItems: 'center',
      borderRadius: 10,
      justifyContent: 'center',
      padding: 16,
    },
    iconContainer: {
      alignItems: 'center',
      borderRadius: 10,
      shadowColor: colors.black,
      shadowOffset: { width: 1, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 2.84,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 24,
      marginBottom: 6,
      marginTop:  20,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[colors.loginHeader, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name={icon} size={48} color={colors.text} />
        </LinearGradient>
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {description ? (
        <ThemedText style={styles.description}>{description}</ThemedText>
      ) : null}
    </View>
  );
}
