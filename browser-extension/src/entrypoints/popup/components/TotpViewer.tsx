import React, { useState, useEffect, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { TotpCode } from '../../../utils/types/TotpCode';
import  * as OTPAuth from 'otpauth';

type TotpViewerProps = {
  credentialId: string;
}

/**
 * This component shows TOTP codes for a credential.
 */
export const TotpViewer: React.FC<TotpViewerProps> = ({ credentialId }) => {
  const [totpCodes, setTotpCodes] = useState<TotpCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dbContext = useDb();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Gets the remaining seconds for the TOTP code.
   */
  const getRemainingSeconds = (step = 30): number => {
    const totp = new OTPAuth.TOTP({
      secret: 'dummy', // We only need this for timing calculations
      algorithm: 'SHA1',
      digits: 6,
      period: step
    });
    return totp.period - (Math.floor(Date.now() / 1000) % totp.period);
  };

  /**
   * Gets the remaining percentage for the TOTP code.
   */
  const getRemainingPercentage = (): number => {
    const remaining = getRemainingSeconds();
    // Invert the percentage so it counts down instead of up
    return Math.floor(((30.0 - remaining) / 30.0) * 100);
  };

  /**
   * Generates a TOTP code for a given secret key.
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
   * Refreshes the TOTP codes.
   */
  const refreshCodes = (): void => {
    const newCodes: Record<string, string> = {};

    totpCodes.forEach(code => {
      const generatedCode = generateTotpCode(code.SecretKey);
      // Only update if we have a valid code
      if (generatedCode !== 'Error') {
        newCodes[code.Id] = generatedCode;
      } else {
        // Keep the previous code if there's an error
        newCodes[code.Id] = currentCodes[code.Id] || 'Error';
      }
    });

    setCurrentCodes(newCodes);
  };

  /**
   * Copies a TOTP code to the clipboard.
   */
  const copyToClipboard = async (code: string, id: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  useEffect(() => {
    const loadTotpCodes = async (): Promise<void> => {
      if (!dbContext?.sqliteClient) {
        return;
      }

      try {
        const codes = dbContext.sqliteClient.getTotpCodesForCredential(credentialId);
        setTotpCodes(codes);
      } catch (error) {
        console.error('Error loading TOTP codes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTotpCodes();
  }, [credentialId, dbContext?.sqliteClient]);

  useEffect(() => {
    // Generate initial codes
    const initialCodes: Record<string, string> = {};
    totpCodes.forEach(code => {
      initialCodes[code.Id] = generateTotpCode(code.SecretKey);
    });
    setCurrentCodes(initialCodes);

    // Set up interval to refresh codes
    const interval = setInterval(refreshCodes, 1000);
    intervalRef.current = interval;

    // Clean up interval on unmount or when totpCodes change
    return () => {
      clearInterval(interval);
      intervalRef.current = null;
    };
  }, [totpCodes]);

  if (loading) {
    return (
      <div className="text-gray-500 dark:text-gray-400 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Two-factor authentication</h2>
        Loading TOTP codes...
      </div>
    );
  }

  if (totpCodes.length === 0) {
    return null; // Don't show anything if there are no TOTP codes
  }

  return (
    <div className="mb-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Two-factor authentication</h2>
        <div className="grid grid-cols-1 gap-2">
          {totpCodes.map(totpCode => (
            <div key={totpCode.Id} className="p-2 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center flex-1">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white">{totpCode.Name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <div
                      className="text-xl font-bold cursor-pointer text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      onClick={() => copyToClipboard(currentCodes[totpCode.Id], totpCode.Id)}
                    >
                      {currentCodes[totpCode.Id]}
                    </div>
                    <div className="text-xs">
                      {copiedId === totpCode.Id ? (
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{getRemainingSeconds()}s</span>
                      )}
                    </div>
                  </div>
                  <div className="w-1 h-6 bg-gray-200 rounded-full dark:bg-gray-600">
                    <div
                      className="bg-blue-600 rounded-full transition-all"
                      style={{ height: `${getRemainingPercentage()}%`, width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};