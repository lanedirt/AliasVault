import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColorScheme';

interface FormInputCopyToClipboardProps {
  label: string;
  value: string | undefined;
  type?: 'text' | 'password';
}

const FormInputCopyToClipboard: React.FC<FormInputCopyToClipboardProps> = ({
  label,
  value,
  type = 'text',
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colors = useColors();

  const copyToClipboard = async () => {
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
      inputContainer: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        marginBottom: 12,
        backgroundColor: colors.accentBackground,
        borderColor: colors.accentBorder,
      },
      inputContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      label: {
        fontSize: 12,
        marginBottom: 4,
        color: colors.textMuted,
      },
      value: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
      },
      actions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      iconButton: {
        padding: 8,
      },
      iconText: {
        fontSize: 20,
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