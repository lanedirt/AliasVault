import React, { useState, useEffect } from 'react';
import { AppInfo } from '@/utils/AppInfo';
import { storage } from '#imports';
import { GLOBAL_AUTOFILL_POPUP_ENABLED_KEY, DISABLED_SITES_KEY, VAULT_LOCKED_DISMISS_UNTIL_KEY } from '@/entrypoints/contentScript/Popup';

type ApiOption = {
  label: string;
  value: string;
};

const DEFAULT_OPTIONS: ApiOption[] = [
  { label: 'Aliasvault.net', value: AppInfo.DEFAULT_API_URL },
  { label: 'Self-hosted', value: 'custom' }
];

/**
 * Auth settings page only shown when user is not logged in.
 */
const AuthSettings: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customClientUrl, setCustomClientUrl] = useState<string>('');
  const [isGloballyEnabled, setIsGloballyEnabled] = useState<boolean>(true);

  useEffect(() => {
    /**
     * Load the stored settings from the storage.
     */
    const loadStoredSettings = async () : Promise<void> => {
      const apiUrl = await storage.getItem('local:apiUrl') as string;
      const clientUrl = await storage.getItem('local:clientUrl') as string;
      const globallyEnabled = await storage.getItem(GLOBAL_AUTOFILL_POPUP_ENABLED_KEY) !== false; // Default to true if not set
      const dismissUntil = await storage.getItem(VAULT_LOCKED_DISMISS_UNTIL_KEY) as number;

      if (dismissUntil) {
        setIsGloballyEnabled(false);
      } else {
        setIsGloballyEnabled(globallyEnabled);
      }

      const matchingOption = DEFAULT_OPTIONS.find(opt => opt.value === apiUrl);

      if (matchingOption) {
        setSelectedOption(matchingOption.value);
      } else if (apiUrl) {
        setSelectedOption('custom');
        setCustomUrl(apiUrl);
        setCustomClientUrl(clientUrl ?? '');
      } else {
        setSelectedOption(DEFAULT_OPTIONS[0].value);
      }
    };

    loadStoredSettings();
  }, []);

  /**
   * Handle option change
   */
  const handleOptionChange = async (e: React.ChangeEvent<HTMLSelectElement>) : Promise<void> => {
    const value = e.target.value;
    setSelectedOption(value);
    if (value !== 'custom') {
      await storage.setItem('local:apiUrl', '');
      await storage.setItem('local:clientUrl', '');
    }
  };

  /**
   * Handle custom API URL change
   */
  const handleCustomUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) : Promise<void> => {
    const value = e.target.value;
    setCustomUrl(value);
    await storage.setItem('local:apiUrl', value);
  };

  /**
   * Handle custom client URL change
   * @param e
   */
  const handleCustomClientUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) : Promise<void> => {
    const value = e.target.value;
    setCustomClientUrl(value);
    await storage.setItem('local:clientUrl', value);
  };

  /**
   * Toggle global popup.
   */
  const toggleGlobalPopup = async () : Promise<void> => {
    const newGloballyEnabled = !isGloballyEnabled;

    await storage.setItem(GLOBAL_AUTOFILL_POPUP_ENABLED_KEY, newGloballyEnabled);

    if (newGloballyEnabled) {
      // Reset all disabled sites when enabling globally
      await storage.setItem(DISABLED_SITES_KEY, []);
      await storage.setItem(VAULT_LOCKED_DISMISS_UNTIL_KEY, 0);
    }

    setIsGloballyEnabled(newGloballyEnabled);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <label htmlFor="api-connection" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          API Connection
        </label>
        <select
          value={selectedOption}
          onChange={handleOptionChange}
          className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        >
          {DEFAULT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {selectedOption === 'custom' && (
        <>
          <div className="mb-6">
            <label htmlFor="custom-client-url" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Custom client URL
            </label>
            <input
              id="custom-client-url"
              type="text"
              value={customClientUrl}
              onChange={handleCustomClientUrlChange}
              placeholder="https://my-aliasvault-instance.com"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="custom-api-url" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Custom API URL
            </label>
            <input
              id="custom-api-url"
              type="text"
              value={customUrl}
              onChange={handleCustomUrlChange}
              placeholder="https://my-aliasvault-instance.com/api"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>
        </>
      )}

      {/* Autofill Popup Settings Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Autofill popup</p>
          <button
            onClick={toggleGlobalPopup}
            className={`px-4 py-2 rounded-md transition-colors ${
              isGloballyEnabled
                ? 'bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                : 'bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
            }`}
          >
            {isGloballyEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <div className="text-center text-gray-400 dark:text-gray-600">
        Version: {AppInfo.VERSION}
      </div>
    </div>
  );
};

export default AuthSettings;
