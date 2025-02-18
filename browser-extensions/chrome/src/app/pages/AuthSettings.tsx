import React, { useState, useEffect } from 'react';

type ApiOption = {
  label: string;
  value: string;
};

const DEFAULT_OPTIONS: ApiOption[] = [
  { label: 'Aliasvault.net', value: 'https://app.aliasvault.net/api' },
  { label: 'Self-hosted', value: 'custom' }
];

/**
 * Auth settings page only shown when user is not logged in.
 */
const AuthSettings: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customClientUrl, setCustomClientUrl] = useState<string>('');

  useEffect(() => {
    // Load saved URLs from storage
    chrome.storage.local.get(['apiUrl', 'clientUrl'], (result) => {
      const savedUrl = result.apiUrl;
      const savedClientUrl = result.clientUrl;
      const matchingOption = DEFAULT_OPTIONS.find(opt => opt.value === savedUrl);
      if (matchingOption) {
        setSelectedOption(matchingOption.value);
      } else if (savedUrl) {
        setSelectedOption('custom');
        setCustomUrl(savedUrl);
        setCustomClientUrl(savedClientUrl ?? '');
      } else {
        setSelectedOption(DEFAULT_OPTIONS[0].value);
      }
    });
  }, []);

  /**
   * Handle option change
   */
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) : void => {
    const value = e.target.value;
    setSelectedOption(value);
    if (value !== 'custom') {
      chrome.storage.local.set({
        apiUrl: '',
        clientUrl: '',
      });
    }
  };

  /**
   * Handle custom API URL change
   */
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) : void => {
    const value = e.target.value;
    setCustomUrl(value);
    chrome.storage.local.set({ apiUrl: value });
  };

  /**
   * Handle custom client URL change
   * @param e
   */
  const handleCustomClientUrlChange = (e: React.ChangeEvent<HTMLInputElement>) : void => {
    const value = e.target.value;
    setCustomClientUrl(value);
    chrome.storage.local.set({ clientUrl: value });
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
    </div>
  );
};

export default AuthSettings;
