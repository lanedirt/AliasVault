import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import Toast from 'react-native-toast-message';

import { useColors } from '@/hooks/useColorScheme';

import NativeVaultManager from '@/specs/NativeVaultManager';

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
  const { t } = useTranslation();
  
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    return () => {
      animatedWidth.stopAnimation();
    };
  }, [animatedWidth]);

  /**
   * Copy the value to the clipboard.
   */
  const copyToClipboard = async () : Promise<void> => {
    if (value) {
      try {
        // Copy to clipboard using expo-clipboard
        await Clipboard.setStringAsync(value);

        // Get clipboard clear timeout from settings
        const timeoutStr = await AsyncStorage.getItem('clipboard_clear_timeout');
        const timeoutSeconds = timeoutStr ? parseInt(timeoutStr, 10) : 10;

        // Schedule clipboard clear if timeout is set
        if (timeoutSeconds > 0) {
          await NativeVaultManager.clearClipboardAfterDelay(timeoutSeconds);
          
          // Start countdown animation
          setIsCountingDown(true);
          animatedWidth.setValue(100);
          
          Animated.timing(animatedWidth, {
            toValue: 0,
            duration: timeoutSeconds * 1000,
            useNativeDriver: false,
            easing: Easing.linear,
          }).start(() => {
            setIsCountingDown(false);
          });
        }

        if (Platform.OS !== 'android') {
          // Only show toast on iOS, Android already shows a native toast on clipboard interactions.
          Toast.show({
            type: 'success',
            text1: t('common.copied'),
            position: 'bottom',
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          position: 'bottom',
          visibilityTime: 2000,
        });
      }
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
      marginBottom: 8,
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
    animatedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      backgroundColor: `${colors.primary}50`,
      borderRadius: 8,
    },
  });

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={styles.inputContainer}
    >
      {isCountingDown && (
        <Animated.View
          style={[
            styles.animatedOverlay,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}
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