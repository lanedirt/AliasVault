import React, { useState, useEffect, useCallback } from 'react';
import { useDb } from '../context/DbContext';
import { Credential } from '../../../utils/types/Credential';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { useWebApi } from '../context/WebApiContext';
import { VaultResponse } from '../../../utils/types/webapi/VaultResponse';
import ReloadButton from '../components/ReloadButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMinDurationLoading } from '../../../hooks/useMinDurationLoading';
import { sendMessage } from 'webext-bridge/popup';
import SqliteClient  from '../../../utils/SqliteClient';
/**
 * Credentials list page.
 */
const CredentialsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { showLoading, hideLoading, setIsInitialLoading } = useLoading();

  /**
   * Loading state with minimum duration for more fluid UX.
   */
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 100);

  /**
   * Retrieve latest vault and refresh the credentials list.
   */
  const onRefresh = useCallback(async () : Promise<void> => {
    if (!dbContext?.sqliteClient) {
      return;
    }

    // Do status check first to ensure the extension is (still) supported.
    const statusResponse = await webApi.getStatus();
    const statusError = webApi.validateStatusResponse(statusResponse);
    if (statusError !== null) {
      await webApi.logout(statusError);
      return;
    }

    try {
      // If the vault revision is the same or lower, (re)load existing credentials.
      if (statusResponse.vaultRevision <= dbContext.vaultRevision) {
        const results = dbContext.sqliteClient.getAllCredentials();
        setCredentials(results);
        return;
      }

      /**
       * If the vault revision is higher, fetch the latest vault and initialize the SQLite context again.
       * This will trigger a new credentials list refresh.
       */
      const vaultResponseJson = await webApi.get<VaultResponse>('Vault');

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        await webApi.logout(vaultError);
        hideLoading();
        return;
      }

      // Get derived key from background worker
      const passwordHashBase64 = await sendMessage('GET_DERIVED_KEY', {}, 'background') as string;

      // Initialize the SQLite context again with the newly retrieved decrypted blob
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [dbContext, webApi, hideLoading]);

  /**
   * Manually refresh the credentials list.
   */
  const onManualRefresh = async (): Promise<void> => {
    showLoading();
    await onRefresh();
    hideLoading();
  };

  /**
   * Load credentials list on mount and on sqlite client change.
   */
  useEffect(() => {
    /**
     * Refresh credentials list when sqlite client is available.
     */
    const refreshCredentials = async () : Promise<void> => {
      if (dbContext?.sqliteClient) {
        setIsLoading(true);
        await onRefresh();
        setIsLoading(false);

        // Hide the global app initial loading state after the credentials list is loaded.
        setIsInitialLoading(false);
      }
    };

    refreshCredentials();
  }, [dbContext?.sqliteClient, onRefresh, setIsLoading, setIsInitialLoading]);

  // Add this function to filter credentials
  const filteredCredentials = credentials.filter(cred => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cred.ServiceName.toLowerCase().includes(searchLower) ||
      cred.Username.toLowerCase().includes(searchLower) ||
      (cred.Email?.toLowerCase().includes(searchLower))
    );
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
        <ReloadButton onClick={onManualRefresh} />
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
            <li key={cred.Id}>
              <button
                onClick={() => navigate(`/credentials/${cred.Id}`)}
                className="w-full p-2 border dark:border-gray-600 rounded flex items-center bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={SqliteClient.imgSrcFromBytes(cred.Logo)}
                  alt={cred.ServiceName}
                  className="w-8 h-8 mr-2 flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/images/service-placeholder.webp';
                  }}
                />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{cred.ServiceName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cred.Username}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CredentialsList;