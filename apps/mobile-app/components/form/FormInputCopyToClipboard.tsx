import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColorScheme';

type FormInputCopyToClipboardProps = {
  label: string;
  value: string | undefined;
  type?: 'text' | 'password';
}

/**
 * Form input copy to clipboard component.
 */
const FormInputCopyToClipboard: React.FC<FormInputCopyToClipboardProps> = ({
  label,
  value,
  type = 'text',
}) : React.ReactNode => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colors = useColors();

  /**
   * Copy the value to the clipboard.
   */
  const copyToClipboard = async () : Promise<void> => {
    if (value) {
      await Clipboard.setStringAsync(value);
      Toast.show({
        type: 'success',
        text1: 'Copied to clipboard',
        position: 'bottom',
        visibilityTime: 2000,
      });
    }
  };

  const displayValue = type === 'password' && !isPasswordVisible
    ? '••••••••'
    : value;

  const styles = StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    iconButton: {
      padding: 8,
    },
    inputContainer: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginBottom: 12,
      padding: 12,
    },
    inputContent: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={styles.inputContainer}
    >
      <View style={styles.inputContent}>
        <View>
          <Text style={styles.label}>
            {label}
          </Text>
          <Text style={styles.value}>
            {displayValue}
          </Text>
        </View>
        <View style={styles.actions}>
          {type === 'password' && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.iconButton}
            >
              <MaterialIcons
                name={isPasswordVisible ? "visibility-off" : "visibility"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FormInputCopyToClipboard;