import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { Credential } from '../../shared/types/Credential';
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { useWebApi } from '../context/WebApiContext';
import { VaultResponse } from '../../shared/types/webapi/VaultResponse';
import ReloadButton from '../components/ReloadButton';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMinDurationLoading } from '../hooks/useMinDurationLoading';
import { AppInfo } from '../../shared/AppInfo';

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
  const authContext = useAuth();
  const isMounted = useRef(false);

  /**
   * Loading state with minimum duration for more fluid UX.
   */
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 100);

  /**
   * Retrieve latest vault and refresh the credentials list.
   */
  const onRefresh = useCallback(async () : Promise<void> => {
    if (!dbContext?.sqliteClient) return;

    // Do status check first to ensure the extension is (still) supported.
    const statusResponse = await webApi.getStatus();
    console.log('CredentialsList: statusResponse', statusResponse);
    if (!statusResponse.clientVersionSupported) {
      authContext.logout('This version of the AliasVault browser extension is outdated. Please update your browser extension to the latest version.');
      return;
    }

    // Check if server version is supported by this client.
    if (!AppInfo.isServerVersionSupported(statusResponse.serverVersion)) {
      authContext.logout('The AliasVault server needs to be updated to a newer version in order to use this browser extension. Please contact support if you need help.');
      return;
    }

    // If the vault has not been updated on the server, just load existing credentials
    if (statusResponse.vaultRevision <= dbContext.vaultRevision) {
      try {
        const results = dbContext.sqliteClient.getAllCredentials();
        setCredentials(results);
        return;
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
    }

    try {
      // Make API call to get latest vault
      const vaultResponseJson = await webApi.get<VaultResponse>('Vault');

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        authContext.logout(vaultError);
        hideLoading();
        return;
      }

      // Get derived key from background worker
      const passwordHashBase64 = await chrome.runtime.sendMessage({ type: 'GET_DERIVED_KEY' });

      // Initialize the SQLite context again with the newly retrieved decrypted blob
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      // Load credentials
      try {
        const results = dbContext.sqliteClient.getAllCredentials();
        setCredentials(results);
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [dbContext, webApi, authContext, hideLoading]);

  /**
   * Load the credentials list when the component is mounted (only once).
   */
  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    /**
     * Asynchronously load the credentials list.
     */
    const loadInitialData = async () : Promise<void> => {
      setIsLoading(true);
      await onRefresh();
      setIsLoading(false);

      // Hide the global app initial loading state after the credentials list is loaded.
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, [onRefresh, setIsLoading, setIsInitialLoading]);

  /**
   * Manually refresh the credentials list.
   */
  const onManualRefresh = async (): Promise<void> => {
    showLoading();
    await onRefresh();
    hideLoading();
  };

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
                  src={cred.Logo ? `data:image/x-icon;base64,${Buffer.from(cred.Logo).toString('base64')}` : '/assets/images/service-placeholder.webp'}
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