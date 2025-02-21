import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component for displaying the login server information.
 */
const LoginServerInfo: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * Loads the base URL for the login server.
     */
    const loadApiUrl = async () : Promise<void> => {
      // TODO: store base webapi configurable in one place.
      const result = await chrome.storage.local.get(['apiUrl']);
      setBaseUrl(result.apiUrl || 'https://api.aliasvault.net/');
    };
    loadApiUrl();
  }, []);

  const isDefaultServer = !baseUrl || baseUrl === 'https://api.aliasvault.net/';
  const displayUrl = isDefaultServer ? 'aliasvault.net' : new URL(baseUrl).hostname;

  /**
   * Handles the click event for the login server information.
   */
  const handleClick = () : void => {
    navigate('/auth-settings');
  };

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 mb-4">
      (Logging into{' '}
      <button
        onClick={handleClick}
        type="button"
        className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500 underline"
      >
        {displayUrl}
      </button>
      )
    </div>
  );
};

export default LoginServerInfo;