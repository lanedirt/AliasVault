import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useDb } from './context/DbContext';
import Unlock from './pages/Unlock';
import Login from './pages/Login';
import Settings from './pages/Settings';
import CredentialsList from './pages/CredentialsList';
import { useMinDurationLoading } from './hooks/useMinDurationLoading';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/app.css';

/**
 * Main application component
 */
const App: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * Loading state with minimum duration, shown when opening the extension popup.
   */
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 200);

  /**
   * Check if the user needs to unlock the vault.
   */
  useEffect(() => {
    if (authContext.isLoggedIn && authContext.isInitialized && dbContext.dbAvailable && dbContext.dbInitialized) {
      setNeedsUnlock(false);
    } else {
      setNeedsUnlock(true);
    }
  }, [authContext.isLoggedIn, dbContext.dbInitialized, dbContext.dbAvailable, authContext.isInitialized]);

  /**
   * Set loading state to false when auth and db are initialized.
   */
  useEffect(() => {
    if (authContext.isInitialized && dbContext.dbInitialized) {
      setIsLoading(false);
    }
  }, [authContext.isInitialized, dbContext.dbInitialized, setIsLoading]);

  /**
   * Handle logout
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authContext.logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle settings
   */
  const toggleSettings = () : void => {
    setShowSettings(!showSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <img src="/assets/images/logo.svg" alt="AliasVault" className="h-8 w-8 mr-2" />
              <h1 className="text-gray-900 dark:text-white text-xl font-bold">AliasVault</h1>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <img src="/assets/images/logo.svg" alt="AliasVault" className="h-8 w-8 mr-2" />
            <h1 className="text-gray-900 dark:text-white text-xl font-bold">AliasVault</h1>
          </div>
          {!authContext.isLoggedIn ? (
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

      <div className="p-4 dark:bg-gray-900">
        {authContext.isLoggedIn ? (
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-4">Logged in as {authContext.username}</p>
            {needsUnlock ? (
              <Unlock />
            ) : (
              <div>
                <CredentialsList />
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
