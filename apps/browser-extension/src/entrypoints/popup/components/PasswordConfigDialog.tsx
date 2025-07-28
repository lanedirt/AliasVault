import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { PasswordSettings } from '@/utils/dist/shared/models/vault';
import { CreatePasswordGenerator } from '@/utils/dist/shared/password-generator';

interface IPasswordConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string) => void;
  onSettingsChange?: (settings: PasswordSettings) => void;
  initialSettings: PasswordSettings;
}

/**
 * Password configuration dialog component.
 */
const PasswordConfigDialog: React.FC<IPasswordConfigDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  onSettingsChange,
  initialSettings
}) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PasswordSettings>(initialSettings);
  const [previewPassword, setPreviewPassword] = useState<string>('');

  const generatePreview = useCallback((currentSettings: PasswordSettings) => {
    try {
      const passwordGenerator = CreatePasswordGenerator(currentSettings);
      const password = passwordGenerator.generateRandomPassword();
      setPreviewPassword(password);
    } catch (error) {
      console.error('Error generating preview password:', error);
      setPreviewPassword('');
    }
  }, []);

  // Initialize settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSettings({ ...initialSettings });
      generatePreview({ ...initialSettings });
    }
  }, [isOpen, initialSettings, generatePreview]);

  const handleSettingChange = useCallback((key: keyof PasswordSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    generatePreview(newSettings);
    onSettingsChange?.(newSettings);
  }, [settings, generatePreview, onSettingsChange]);

  const handleRefreshPreview = useCallback(() => {
    generatePreview(settings);
  }, [settings, generatePreview]);

  const handleSave = useCallback(() => {
    onSave(previewPassword);
    onClose();
  }, [previewPassword, onSave, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={handleCancel} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-lg">
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={handleCancel}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal content */}
          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                {t('credentials.advancedPasswordOptions')}
              </h3>
              
              <div className="space-y-4">
                {/* Character Type Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="use-lowercase"
                      type="checkbox"
                      checked={settings.UseLowercase}
                      onChange={(e) => handleSettingChange('UseLowercase', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="use-lowercase" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('credentials.includeLowercase')} (a-z)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="use-uppercase"
                      type="checkbox"
                      checked={settings.UseUppercase}
                      onChange={(e) => handleSettingChange('UseUppercase', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="use-uppercase" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('credentials.includeUppercase')} (A-Z)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="use-numbers"
                      type="checkbox"
                      checked={settings.UseNumbers}
                      onChange={(e) => handleSettingChange('UseNumbers', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="use-numbers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('credentials.includeNumbers')} (0-9)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="use-special-chars"
                      type="checkbox"
                      checked={settings.UseSpecialChars}
                      onChange={(e) => handleSettingChange('UseSpecialChars', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="use-special-chars" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('credentials.includeSpecialChars')} (!@#$%^&*)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="use-non-ambiguous"
                      type="checkbox"
                      checked={settings.UseNonAmbiguousChars}
                      onChange={(e) => handleSettingChange('UseNonAmbiguousChars', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="use-non-ambiguous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('credentials.avoidAmbiguousChars')} (avoid 0, O, l, I, etc.)
                    </label>
                  </div>
                </div>

                {/* Password Preview */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('credentials.preview')}:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={previewPassword}
                      readOnly
                      className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleRefreshPreview}
                      className="px-3 py-2 text-sm text-gray-500 dark:text-white bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                      title={t('credentials.generateNewPreview')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                  onClick={handleSave}
                >
                  {t('common.use')}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                  onClick={handleCancel}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordConfigDialog;