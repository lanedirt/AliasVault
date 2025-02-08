import React, { useEffect, useState, useCallback } from 'react';
import { DISABLED_SITES_KEY } from '../../contentScript/Popup';

/**
 * Popup settings type.
 */
type PopupSettings = {
  disabledUrls: string[];
  currentUrl: string;
  isEnabled: boolean;
}

/**
 * Settings page component.
 */
const Settings: React.FC = () => {
  const [settings, setSettings] = useState<PopupSettings>({
    disabledUrls: [],
    currentUrl: '',
    isEnabled: true
  });

  /**
   * Get current tab in browser.
   */
  const getCurrentTab = async () : Promise<chrome.tabs.Tab> => {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  };

  /**
   * Load settings.
   */
  const loadSettings = useCallback(async () : Promise<void> => {
    const tab = await getCurrentTab();
    const currentUrl = new URL(tab.url || '').hostname;

    // Load disabled URLs from chrome.storage.local
    chrome.storage.local.get([DISABLED_SITES_KEY], (result) => {
      const disabledUrls = result[DISABLED_SITES_KEY] || [];
      setSettings({
        disabledUrls,
        currentUrl,
        isEnabled: !disabledUrls.includes(currentUrl)
      });
    });
  }, []); // No dependencies needed since it only uses external APIs

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Toggle current site.
   */
  const toggleCurrentSite = async () : Promise<void> => {
    const { currentUrl, disabledUrls, isEnabled } = settings;
    let newDisabledUrls = [...disabledUrls];

    if (isEnabled) {
      newDisabledUrls.push(currentUrl);
    } else {
      newDisabledUrls = newDisabledUrls.filter(url => url !== currentUrl);
    }

    const storageData = { [DISABLED_SITES_KEY]: newDisabledUrls };
    await chrome.storage.local.set(storageData);

    setSettings(prev => ({
      ...prev,
      disabledUrls: newDisabledUrls,
      isEnabled: !isEnabled
    }));
  };

  /**
   * Reset settings.
   */
  const resetSettings = async () : Promise<void> => {
    const storageData = { [DISABLED_SITES_KEY]: [] };
    await chrome.storage.local.set(storageData);

    setSettings(prev => ({
      ...prev,
      disabledUrls: [],
      isEnabled: true
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 dark:text-white text-xl mb-4">Popup Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-gray-500 dark:text-gray-400 space-y-2 mb-4">
            <p className="text-sm">
            You can disable the autofill popup by either dismissing the popup or enabling/disabling via the button below.
            </p>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{settings.currentUrl}</p>
              <p className={`text-sm ${settings.isEnabled ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                Popup is {settings.isEnabled ? 'enabled' : 'disabled'} for this site
              </p>
            </div>
            <button
              onClick={toggleCurrentSite}
              className={`px-4 py-2 rounded-md ${
                settings.isEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {settings.isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
        <button
          onClick={resetSettings}
          className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-900 dark:text-white"
        >
          (Re)enable popup for all sites
        </button>
      </div>
    </div>
  );
};

export default Settings;