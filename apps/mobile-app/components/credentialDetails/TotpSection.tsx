import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import * as OTPAuth from 'otpauth';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';
import { TotpCode } from '@/utils/types/TotpCode';
import { useDb } from '@/context/DbContext';

type TotpSectionProps = {
  credential: Credential;
};

/**
 * Totp section component.
 */
export const TotpSection: React.FC<TotpSectionProps> = ({ credential }) : React.ReactNode => {
  const [totpCodes, setTotpCodes] = useState<TotpCode[]>([]);
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const dbContext = useDb();

  /**
   * Get the remaining seconds.
   */
  const getRemainingSeconds = (step = 30): number => {
    const totp = new OTPAuth.TOTP({
      secret: 'dummy',
      algorithm: 'SHA1',
      digits: 6,
      period: step
    });
    return totp.period - (Math.floor(Date.now() / 1000) % totp.period);
  };

  /**
   * Get the remaining percentage.
   */
  const getRemainingPercentage = (): number => {
    const remaining = getRemainingSeconds();
    return Math.floor(((30.0 - remaining) / 30.0) * 100);
  };

  /**
   * Generate the totp code.
   */
  const generateTotpCode = (secretKey: string): string => {
    try {
      const totp = new OTPAuth.TOTP({
        secret: secretKey,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      });
      return totp.generate();
    } catch (error) {
      console.error('Error generating TOTP code:', error);
      return 'Error';
    }
  };

  /**
   * Copy the totp code to the clipboard.
   */
  const copyToClipboard = async (code: string): Promise<void> => {
    try {
      await Clipboard.setStringAsync(code);
      Toast.show({
        type: 'success',
        text1: 'Copied to clipboard',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  useEffect(() => {
    /**
     * Load the totp codes.
     */
    const loadTotpCodes = async () : Promise<void> => {
      if (!dbContext?.sqliteClient) {
        return;
      }

      try {
        const codes = await dbContext.sqliteClient.getTotpCodesForCredential(credential.Id);
        setTotpCodes(codes);
      } catch (error) {
        console.error('Error loading TOTP codes:', error);
      }
    };

    loadTotpCodes();
  }, [credential.Id, dbContext?.sqliteClient]);

  useEffect(() => {
    /**
     * Update the totp codes.
     */
    const updateTotpCodes = (prevCodes: Record<string, string>): Record<string, string> => {
      const newCodes: Record<string, string> = {};
      totpCodes.forEach(code => {
        const generatedCode = generateTotpCode(code.SecretKey);
        if (generatedCode !== 'Error') {
          newCodes[code.Id] = generatedCode;
        } else {
          newCodes[code.Id] = prevCodes[code.Id] ?? 'Error';
        }
      });
      return newCodes;
    };

    const initialCodes: Record<string, string> = {};
    totpCodes.forEach(code => {
      initialCodes[code.Id] = generateTotpCode(code.SecretKey);
    });
    setCurrentCodes(initialCodes);

    const intervalId = setInterval(() => {
      setCurrentCodes(updateTotpCodes);
    }, 1000);

    return () : void => clearInterval(intervalId);
  }, [totpCodes]);

  if (totpCodes.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">
        Two-factor authentication
      </ThemedText>
      {totpCodes.map(totpCode => (
        <TouchableOpacity
          key={totpCode.Id}
          style={[
            styles.content,
            {
              backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
              borderColor: isDarkMode ? '#374151' : '#d1d5db',
            }
          ]}
          onPress={() => copyToClipboard(currentCodes[totpCode.Id])}
        >
          <View style={styles.codeContainer}>
            <View>
              <ThemedText style={[styles.label, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                TOTP Code
              </ThemedText>
              <ThemedText style={[styles.code, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
                {currentCodes[totpCode.Id]}
              </ThemedText>
            </View>
            <View style={styles.timerContainer}>
              <ThemedText style={[styles.timer, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                {getRemainingSeconds()}s
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getRemainingPercentage()}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  codeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    marginTop: 16,
    padding: 16,
  },
  content: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    width: 40,
  },
  progressFill: {
    backgroundColor: '#007AFF',
    height: '100%',
  },
  timer: {
    fontSize: 12,
    marginBottom: 4,
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
});