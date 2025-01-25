import React, { useState, useEffect } from 'react';

type ApiOption = {
  label: string;
  value: string;
};

const DEFAULT_OPTIONS: ApiOption[] = [
  { label: 'Aliasvault.net', value: 'https://app.aliasvault.net/api' },
  { label: 'Development', value: 'https://localhost:7223' },
  { label: 'Self-hosted', value: 'custom' }
];

const Settings: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

  useEffect(() => {
    // Load saved API URL from storage
    chrome.storage.local.get(['apiUrl'], (result) => {
      const savedUrl = result.apiUrl;
      const matchingOption = DEFAULT_OPTIONS.find(opt => opt.value === savedUrl);
      if (matchingOption) {
        setSelectedOption(matchingOption.value);
      } else if (savedUrl) {
        setSelectedOption('custom');
        setCustomUrl(savedUrl);
      } else {
        setSelectedOption(DEFAULT_OPTIONS[0].value);
      }
    });
  }, []);

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedOption(value);
    if (value !== 'custom') {
      chrome.storage.local.set({ apiUrl: value });
    }
  };

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomUrl(value);
    if (selectedOption === 'custom') {
      chrome.storage.local.set({ apiUrl: value });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Custom API URL
          </label>
          <input
            type="text"
            value={customUrl}
            onChange={handleCustomUrlChange}
            placeholder="https://my-aliasvault-instance.com/api"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

export default Settings;