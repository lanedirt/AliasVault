import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import CredentialCard from '@/entrypoints/popup/components/CredentialCard';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/Icons/HeaderIcons';
import LoadingSpinner from '@/entrypoints/popup/components/LoadingSpinner';
import ReloadButton from '@/entrypoints/popup/components/ReloadButton';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';
import { useVaultSync } from '@/entrypoints/popup/hooks/useVaultSync';
import { PopoutUtility } from '@/entrypoints/popup/utils/PopoutUtility';

import type { Credential } from '@/utils/dist/shared/models/vault';

import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';

/**
 * Credentials list page.
 */
const CredentialsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const navigate = useNavigate();
  const { syncVault } = useVaultSync();
  const { setHeaderButtons } = useHeaderButtons();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { setIsInitialLoading } = useLoading();

  /**
   * Loading state with minimum duration for more fluid UX.
   */
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 100);

  /**
   * Handle add new credential.
   */
  const handleAddCredential = useCallback(() : void => {
    navigate('/credentials/add');
  }, [navigate]);

  /**
   * Retrieve latest vault and refresh the credentials list.
   */
  const onRefresh = useCallback(async () : Promise<void> => {
    if (!dbContext?.sqliteClient) {
      return;
    }

    try {
      // Sync vault and load credentials
      await syncVault({
        /**
         * On success.
         */
        onSuccess: async (_hasNewVault) => {
          // Credentials list is refreshed automatically when the (new) sqlite client is available via useEffect hook below.
        },
        /**
         * On offline.
         */
        _onOffline: () => {
          // Not implemented for browser extension yet.
        },
        /**
         * On error.
         */
        onError: async (error) => {
          console.error('Error syncing vault:', error);
          await webApi.logout('Error while syncing vault, please re-authenticate.');
        },
      });
    } catch (err) {
      console.error('Error refreshing credentials:', err);
      await webApi.logout('Error while syncing vault, please re-authenticate.');
    }
  }, [dbContext, webApi, syncVault]);

  /**
   * Get latest vault from server and refresh the credentials list.
   */
  const syncVaultAndRefresh = useCallback(async () : Promise<void> => {
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
    setIsInitialLoading(false);
  }, [onRefresh, setIsLoading, setIsInitialLoading]);

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    const headerButtonsJSX = (
      <div className="flex items-center gap-2">
        {!PopoutUtility.isPopup() && (
          <HeaderButton
            onClick={() => PopoutUtility.openInNewPopup()}
            title="Open in new window"
            iconType={HeaderIconType.EXPAND}
          />
        )}
        <HeaderButton
          onClick={handleAddCredential}
          title="Add new credential"
          iconType={HeaderIconType.PLUS}
        />
      </div>
    );

    setHeaderButtons(headerButtonsJSX);
    return () => setHeaderButtons(null);
  }, [setHeaderButtons, handleAddCredential]);

  /**
   * Load credentials list on mount and on sqlite client change.
   */
  useEffect(() => {
    /**
     * Refresh credentials list when a (new) sqlite client is available.
     */
    const refreshCredentials = async () : Promise<void> => {
      if (dbContext?.sqliteClient) {
        setIsLoading(true);
        const results = dbContext.sqliteClient?.getAllCredentials() ?? [];
        setCredentials(results);
        setIsLoading(false);
      }
    };

    refreshCredentials();
  }, [dbContext?.sqliteClient, setIsLoading]);

  // Call syncVaultAndRefresh when the page first mounts
  useEffect(() => {
    syncVaultAndRefresh();
  }, [syncVaultAndRefresh]);

  // Add this function to filter credentials
  const filteredCredentials = credentials.filter(cred => {
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      cred.ServiceName?.toLowerCase(),
      cred.Username?.toLowerCase(),
      cred.Alias?.Email?.toLowerCase(),
      cred.ServiceUrl?.toLowerCase()
    ];
    return searchableFields.some(field => field?.includes(searchLower));
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-900 dark:text-white text-xl">Credentials</h2>
        <ReloadButton onClick={syncVaultAndRefresh} />
      </div>

      {credentials.length > 0 ? (
        <input
          type="text"
          placeholder="Search credentials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
          className="w-full p-2 mb-4 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <></>
      )}

      {credentials.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 space-y-2 mb-10">
          <p className="text-sm">
            Welcome to AliasVault!
          </p>
          <p className="text-sm">
            To use the AliasVault browser extension: navigate to a website and use the AliasVault autofill popup to create a new credential.
          </p>
          <p className="text-sm">
            If you want to create manual identities, open the full AliasVault app via the popout icon in the top right corner.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredCredentials.map(cred => (
            <CredentialCard key={cred.Id} credential={cred} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default CredentialsList;