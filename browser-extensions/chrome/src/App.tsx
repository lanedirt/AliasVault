import React, { useState, useEffect, useRef } from 'react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    /**
     * Handle click outside of the user menu to close it.
     * @param event MouseEvent
     */
    const handleClickOutside = (event: MouseEvent) : void => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () : void => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle logout.
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authContext.logout();
    } finally {
      setIsLoading(false);
      setIsUserMenuOpen(false);
    }
  };

  /**
   * Toggle settings.
   */
  const toggleSettings = () : void => {
    setShowSettings(!showSettings);
  };

  /**
   * Toggle user menu.
   */
  const toggleUserMenu = () : void => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  /**
   * User menu.
   */
  const userMenu = authContext.isLoggedIn ? (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleUserMenu}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <span className="sr-only">Open menu</span>
        <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
      </button>

      {isUserMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-50 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
              {authContext.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  ) : null;

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
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Settings</span>
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            userMenu
          )}
        </div>
      </div>

      <div className="p-4 dark:bg-gray-900">
        {authContext.isLoggedIn ? (
          <div className="mt-4">
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
