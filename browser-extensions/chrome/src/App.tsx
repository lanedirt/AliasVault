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
import EncryptionUtility from './utils/EncryptionUtility';
import { VaultResponse } from './types/webapi/VaultResponse';
import { useWebApi } from './context/WebApiContext';

/**
 * Main application component
 */
const App: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);
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

  // Add URL parameter detection
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsInlineUnlockMode(queryParams.get('mode') === 'inline_unlock');
  }, []);

  /**
   * Handle logout.
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    setIsUserMenuOpen(false);
    try {
      await webApi.logout();
      await authContext.logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh the vault.
   */
  const handleRefresh = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Make API call to get latest vault
      const vaultResponseJson = await webApi.get('Vault') as VaultResponse;

      // Get derived key from background worker
      const passwordHashBase64 = await chrome.runtime.sendMessage({ type: 'GET_DERIVED_KEY' });

      // Attempt to decrypt the blob
      const decryptedBlob = await EncryptionUtility.symmetricDecrypt(
        vaultResponseJson.vault.blob,
        passwordHashBase64
      );

      // Initialize the SQLite context again with the newly retrieved decrypted blob
      await dbContext.initializeDatabase(passwordHashBase64, decryptedBlob);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsLoading(false);
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

  // Add UnlockSuccess component
  const UnlockSuccess = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 text-green-600 dark:text-green-400">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Your vault is successfully unlocked
      </h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        You can now use autofill in login forms in your browser.
      </p>
      <div className="space-y-3 w-full">
        <button
          onClick={() => window.close()}
          className="w-full px-4 py-2 text-white bg-primary-600 rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Close this popup
        </button>
        <button
          onClick={() => setIsInlineUnlockMode(false)}
          className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Browse vault contents
        </button>
      </div>
    </div>
  );

  /**
   * User menu.
   *
   * Only shown if the user is logged in and the vault is not locked.
   */
  const userMenu = authContext.isLoggedIn && !needsUnlock ? (
    <div className="relative flex items-center">
      <div role="status" className="px-2 flex items-center">
      <div className="relative inline-flex items-center justify-center">
        <button onClick={handleRefresh} className="absolute p-2 hover:bg-gray-200 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path>
          </svg>
        </button>
        <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200  dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"></path>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"></path>
        </svg>
      </div>

      <span className="sr-only">Loading...</span></div>

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
            <>
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
            </>
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
            ) : isInlineUnlockMode ? (
              <UnlockSuccess />
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
