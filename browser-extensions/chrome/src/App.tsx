import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useDb } from './context/DbContext';
import Unlock from './pages/Unlock';
import Login from './pages/Login';
import Settings from './pages/Settings';
import CredentialsList from './pages/CredentialsList';
import './styles/app.css';

/**
 * Base64 encode
 * TODO: check other usages and make it generic.
 */
function base64Encode(buffer: Uint8Array): string | null {
  if (!buffer || typeof buffer !== 'object') {
    console.error('Empty or invalid buffer received');
    return null;
  }

  try {
    // Convert object to array of numbers
    const byteArray = Object.values(buffer);

    // Convert to binary string
    const binary = String.fromCharCode.apply(null, byteArray as number[]);

    // Use btoa to encode binary string to base64
    return btoa(binary);
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return null;
  }
}

/**
 * Main application component
 */
const App: React.FC = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const dbContext = useDb();
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * Check if the user needs to unlock the vault
   */
  useEffect(() => {
    if (isLoggedIn) {
      if (!dbContext.isInitialized) {
        setNeedsUnlock(true);
      } else {
        setNeedsUnlock(false);
      }
    }
  }, [isLoggedIn, dbContext.isInitialized]);

  /**
   * Handle logout
   */
  const handleLogout = () : void => {
    logout();
  };

  /**
   * Toggle settings
   */
  const toggleSettings = () : void => {
    setShowSettings(!showSettings);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-4 py-3">
            <button
              id="back"
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <h1 className="text-gray-900 dark:text-white text-xl">Settings</h1>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
        </div>
        <Settings />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <img src="/assets/images/logo.svg" alt="AliasVault" className="h-8 w-8 mr-2" />
            <h1 className="text-gray-900 dark:text-white text-xl font-bold">AliasVault</h1>
          </div>
          {!isLoggedIn ? (
            <button
              id="settings"
              onClick={toggleSettings}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Settings
            </button>
          ) : (
            <span
              id="logout"
              onClick={handleLogout}
              className="cursor-pointer text-gray-500 dark:text-gray-400"
            >
              Logout
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {isLoggedIn ? (
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-4">Logged in as {username}</p>
            {needsUnlock ? (
              <Unlock />
            ) : (
              <div>
                <CredentialsList base64Encode={base64Encode} />
              </div>
            )}
          </div>
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
};

export default App;
