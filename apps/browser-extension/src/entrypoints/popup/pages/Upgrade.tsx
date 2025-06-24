import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@/entrypoints/popup/components/Button';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/Icons/HeaderIcons';
import LoadingSpinnerFullScreen from '@/entrypoints/popup/components/LoadingSpinnerFullScreen';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';
import { useVaultSync } from '@/entrypoints/popup/hooks/useVaultSync';
import { PopoutUtility } from '@/entrypoints/popup/utils/PopoutUtility';

import type { VaultVersion } from '@/utils/dist/shared/vault-sql';
import { VaultSqlGenerator } from '@/utils/dist/shared/vault-sql';

/**
 * Upgrade page for handling vault version upgrades.
 */
const Upgrade: React.FC = () => {
  const { username } = useAuth();
  const dbContext = useDb();
  const { sqliteClient } = dbContext;
  const { setHeaderButtons } = useHeaderButtons();
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<VaultVersion | null>(null);
  const [latestVersion, setLatestVersion] = useState<VaultVersion | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState('Preparing upgrade...');
  const [error, setError] = useState<string | null>(null);
  const { setIsInitialLoading } = useLoading();
  const webApi = useWebApi();
  const { syncVault } = useVaultSync();
  const navigate = useNavigate();

  console.log('upgrade page mounted');

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    const headerButtonsJSX = !PopoutUtility.isPopup() ? (
      <>
        <HeaderButton
          onClick={() => PopoutUtility.openInNewPopup()}
          title="Open in new window"
          iconType={HeaderIconType.EXPAND}
        />
      </>
    ) : null;

    setHeaderButtons(headerButtonsJSX);

    return () => {
      setHeaderButtons(null);
    };
  }, [setHeaderButtons]);

  /**
   * Load version information from the database.
   */
  const loadVersionInfo = useCallback(async () => {
    try {
      if (sqliteClient) {
        const current = sqliteClient.getDatabaseVersion();
        const latest = await sqliteClient.getLatestDatabaseVersion();
        setCurrentVersion(current);
        setLatestVersion(latest);
      }
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Failed to load version information:', error);
      setError('Failed to load version information. Please try again.');
    }
  }, [sqliteClient]);

  useEffect(() => {
    loadVersionInfo();
  }, [loadVersionInfo]);

  /**
   * Handle the vault upgrade.
   */
  const handleUpgrade = async (): Promise<void> => {
    if (!sqliteClient || !currentVersion || !latestVersion) {
      setError('Unable to get version information. Please try again.');
      return;
    }

    // Check if this is a self-hosted instance and show warning if needed
    if (await webApi.isSelfHosted()) {
      const confirmed = window.confirm(
        'Self-Hosted Server\n\n' +
        "If you're using a self-hosted server, make sure to also update your self-hosted instance as otherwise logging in to the web client will stop working.\n\n" +
        'Do you want to continue with the upgrade?'
      );
      if (!confirmed) {
        return;
      }
    }

    await performUpgrade();
  };

  /**
   * Perform the actual vault upgrade.
   */
  const performUpgrade = async (): Promise<void> => {
    if (!sqliteClient || !currentVersion || !latestVersion) {
      setError('Unable to get version information. Please try again.');
      return;
    }

    setIsLoading(true);
    setUpgradeStatus('Preparing upgrade...');
    setError(null);

    try {
      // Get upgrade SQL commands from vault-sql shared library
      setUpgradeStatus('Generating upgrade SQL...');
      const vaultSqlGenerator = new VaultSqlGenerator();
      const upgradeResult = vaultSqlGenerator.getUpgradeVaultSql(currentVersion.revision, latestVersion.revision);

      if (!upgradeResult.success) {
        throw new Error(upgradeResult.error ?? 'Failed to generate upgrade SQL');
      }

      if (upgradeResult.sqlCommands.length === 0) {
        // No upgrade needed, vault is already up to date
        setUpgradeStatus('Vault is already up to date');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handleUpgradeSuccess();
        return;
      }

      // Begin transaction
      setUpgradeStatus('Starting database transaction...');
      sqliteClient.beginTransaction();

      // Execute each SQL command
      setUpgradeStatus('Applying database migrations...');
      for (let i = 0; i < upgradeResult.sqlCommands.length; i++) {
        const sqlCommand = upgradeResult.sqlCommands[i];
        setUpgradeStatus(`Applying migration ${i + 1} of ${upgradeResult.sqlCommands.length}...`);

        try {
          sqliteClient.executeRaw(sqlCommand);
        } catch (error) {
          console.error(`Error executing SQL command ${i + 1}:`, sqlCommand, error);
          sqliteClient.rollbackTransaction();
          throw new Error(`Failed to apply migration ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Commit transaction
      setUpgradeStatus('Committing changes...');
      sqliteClient.commitTransaction();

      // Upload to server
      setUpgradeStatus('Uploading vault to server...');
      await uploadVaultToServer();

      // Sync and navigate to credentials
      setUpgradeStatus('Finalizing upgrade...');
      await handleUpgradeSuccess();

    } catch (error) {
      console.error('Upgrade failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred during the upgrade. Please try again.');
    } finally {
      setIsLoading(false);
      setUpgradeStatus('Preparing upgrade...');
    }
  };

  /**
   * Upload the upgraded vault to the server.
   */
  const uploadVaultToServer = async (): Promise<void> => {
    try {
      if (!sqliteClient || !username) {
        throw new Error('Required data not available');
      }

      // Get the current vault revision number
      const currentRevision = sqliteClient.getCurrentVaultRevisionNumber();

      // Get the encrypted database
      const encryptedDb = sqliteClient.getEncryptedDatabase();
      if (!encryptedDb) {
        throw new Error('Failed to get encrypted database');
      }

      // TODO: this needs to use the useVaultSync hook instead..
      const newVault = {
        blob: encryptedDb,
        createdAt: new Date().toISOString(),
        credentialsCount: 0,
        currentRevisionNumber: currentRevision,
        emailAddressList: [],
        privateEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
        publicEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
        encryptionPublicKey: '', // Empty on purpose, only required if new public/private key pair is generated
        client: '', // Empty on purpose, API will not use this for vault updates
        updatedAt: new Date().toISOString(),
        username: username,
        version: sqliteClient.getDatabaseVersion().version
      };

      // Upload to server
      const response = await webApi.post<typeof newVault, { status: number; newRevisionNumber: number }>('Vault', newVault);

      if (response.status === 0) {
        dbContext.setCurrentVaultRevisionNumber(response.newRevisionNumber);
      } else if (response.status === 1) {
        throw new Error('Vault merge required. Please login via the web app to merge the multiple pending updates to your vault.');
      } else {
        throw new Error('Failed to upload vault to server');
      }
    } catch (error) {
      console.error('Error uploading vault:', error);
      throw error;
    }
  };

  /**
   * Handle successful upgrade completion.
   */
  const handleUpgradeSuccess = async (): Promise<void> => {
    try {
      /*
       * After successful upgrade, we need to reload the vault to clear the upgrade state.
       * This will trigger a re-check of pending migrations.
       */
      dbContext.clearDatabase();

      // Sync vault to ensure we have the latest data
      await syncVault({
        /**
         * Update status message during sync.
         * @param message Status message
         */
        onStatus: (message: string) => setUpgradeStatus(message),
        /**
         * Handle successful sync completion.
         */
        onSuccess: () => {
          // Navigate to credentials page
          navigate('/credentials');
        },
        /**
         * Handle sync error.
         * @param error Error message
         */
        onError: (error: string) => {
          console.error('Sync error after upgrade:', error);
          // Still navigate to credentials even if sync fails
          navigate('/credentials');
        }
      });
    } catch (error) {
      console.error('Error during post-upgrade sync:', error);
      // Navigate to credentials even if sync fails
      navigate('/credentials');
    }
  };

  /**
   * Handle the logout.
   */
  const handleLogout = async (): Promise<void> => {
    navigate('/logout');
  };

  /**
   * Show version description dialog.
   */
  const showVersionDialog = (): void => {
    alert(
      "What's New\n\n" +
      `An upgrade is required to support the following changes:\n\n${latestVersion?.description ?? 'No description available for this version.'}`
    );
  };

  if (isLoading) {
    return <LoadingSpinnerFullScreen status={upgradeStatus} />;
  }

  return (
    <div>
      <form className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && (
          <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <h2 className="text-xl font-bold dark:text-gray-200 mb-4">Upgrade Required</h2>

        {/* User display section like settings page */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-lg font-medium">
                  {username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Logged in
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">
            AliasVault has updated and your vault needs to be upgraded. Normally this only takes a few seconds.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Version Information</span>
              <button
                type="button"
                onClick={showVersionDialog}
                className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
                title="Show version details"
              >
                ?
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your vault:</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {currentVersion?.releaseVersion ?? '...'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">New version:</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {latestVersion?.releaseVersion ?? '...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full space-y-2">
          <Button
            type="button"
            onClick={handleUpgrade}
            disabled={isLoading || !currentVersion || !latestVersion}
          >
            {isLoading ? 'Upgrading...' : 'Upgrade Vault'}
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            variant="secondary"
          >
            Logout
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Upgrade;
