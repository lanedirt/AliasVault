import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

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
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={[
        styles.inputContainer,
        {
          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
          borderColor: isDarkMode ? '#374151' : '#d1d5db',
        },
      ]}
    >
      <View style={styles.inputContent}>
        <View>
          <Text style={[styles.label, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
            {label}
          </Text>
          <Text style={[styles.value, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
            {displayValue}
          </Text>
        </View>
        <View style={styles.actions}>
          {type === 'password' && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>
                {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  inputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
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

export default FormInputCopyToClipboard;