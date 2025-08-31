import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type ThemedTextInputProps = TextInputProps & {
  error?: string;
};

/**
 * Themed text input component that matches the app's design system.
 */
export const ThemedTextInput: React.FC<ThemedTextInputProps> = ({ error, style, ...props }) => {
  const colors = useColors();

  const styles = StyleSheet.create({
    errorText: {
      color: colors.red,
      fontSize: 12,
      marginTop: 4,
    },
    input: {
      color: colors.text,
      fontSize: 16,
      padding: 10,
    },
    inputContainer: {
      backgroundColor: colors.background,
      borderColor: error ? colors.red : colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
    },
  });

  return (
    <View>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          multiline={false}
          numberOfLines={1}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};