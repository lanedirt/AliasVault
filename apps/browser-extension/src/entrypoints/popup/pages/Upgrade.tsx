import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@/entrypoints/popup/components/Button';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/Icons/HeaderIcons';
import LoadingSpinner from '@/entrypoints/popup/components/LoadingSpinner';
import Modal from '@/entrypoints/popup/components/Modal';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';
import { useVaultMutate } from '@/entrypoints/popup/hooks/useVaultMutate';
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
  const [error, setError] = useState<string | null>(null);
  const [showSelfHostedWarning, setShowSelfHostedWarning] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const { setIsInitialLoading } = useLoading();
  const webApi = useWebApi();
  const { executeVaultMutation, isLoading: isVaultMutationLoading, syncStatus } = useVaultMutate();
  const { syncVault } = useVaultSync();
  const navigate = useNavigate();

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
  }, [sqliteClient, setIsInitialLoading]);

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
      setShowSelfHostedWarning(true);
      return;
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
    setError(null);

    try {
      // Get upgrade SQL commands from vault-sql shared library
      const vaultSqlGenerator = new VaultSqlGenerator();
      const upgradeResult = vaultSqlGenerator.getUpgradeVaultSql(currentVersion.revision, latestVersion.revision);

      if (!upgradeResult.success) {
        throw new Error(upgradeResult.error ?? 'Failed to generate upgrade SQL');
      }

      if (upgradeResult.sqlCommands.length === 0) {
        // No upgrade needed, vault is already up to date
        await handleUpgradeSuccess();
        return;
      }

      // Use the useVaultMutate hook to handle the upgrade and vault upload
      console.debug('executeVaultMutation');
      await executeVaultMutation(async () => {
        // Begin transaction
        console.debug('beginTransaction');
        sqliteClient.beginTransaction();

        // Execute each SQL command
        console.debug('executeRaw', upgradeResult.sqlCommands.length);
        for (let i = 0; i < upgradeResult.sqlCommands.length; i++) {
          const sqlCommand = upgradeResult.sqlCommands[i];

          try {
            console.debug('executeRaw', sqlCommand);
            sqliteClient.executeRaw(sqlCommand);
          } catch (error) {
            console.debug('error', error);
            console.error(`Error executing SQL command ${i + 1}:`, sqlCommand, error);
            sqliteClient.rollbackTransaction();
            throw new Error(`Failed to apply migration ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Commit transaction
        console.debug('commitTransaction');
        sqliteClient.commitTransaction();
      }, {
        skipSyncCheck: true, // Skip sync check during upgrade to prevent loop
        /**
         * Handle successful upgrade completion.
         */
        onSuccess: () => {
          console.debug('onSuccess');
          void handleUpgradeSuccess();
        },
        /**
         * Handle upgrade error.
         */
        onError: (error: Error) => {
          console.debug('onError');
          console.error('Upgrade failed:', error);
          setError(error.message);
        }
      });
      console.debug('executeVaultMutation done?');
    } catch (error) {
      console.error('Upgrade failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred during the upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle successful upgrade completion.
   */
  const handleUpgradeSuccess = async (): Promise<void> => {
    try {
      // Sync vault to ensure we have the latest data
      await syncVault({
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
    setShowVersionInfo(true);
  };

  return (
    <div>
      {/* Full loading screen overlay */}
      {(isLoading || isVaultMutationLoading) && (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 z-50">
          <LoadingSpinner />
          <div className="text-sm text-gray-500 mt-2">
            {syncStatus || 'Upgrading vault...'}
          </div>
        </div>
      )}

      {/* Self-hosted warning modal */}
      <Modal
        isOpen={showSelfHostedWarning}
        onClose={() => setShowSelfHostedWarning(false)}
        onConfirm={() => {
          setShowSelfHostedWarning(false);
          void performUpgrade();
        }}
        title="Self-Hosted Server"
        message="If you're using a self-hosted server, make sure to also update your self-hosted instance as otherwise logging in to the web client will stop working. Do you want to continue with the upgrade?"
        confirmText="Continue"
        cancelText="Cancel"
      />

      {/* Version info modal */}
      <Modal
        isOpen={showVersionInfo}
        onClose={() => setShowVersionInfo(false)}
        onConfirm={() => setShowVersionInfo(false)}
        title="What's New"
        message={`An upgrade is required to support the following changes:\n\n${latestVersion?.description ?? 'No description available for this version.'}`}
      />

      <form className="w-full px-2 pt-2 pb-2 mb-4">
        {error && (
          <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* User display section like settings page */}
        <div className="flex items-center space-x-3 mb-4">
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
          </div>
        </div>

        <h2 className="text-xl font-bold dark:text-gray-200 mb-4">Upgrade Vault</h2>

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
          >
            {isLoading || isVaultMutationLoading ? (syncStatus || 'Upgrading...') : 'Upgrade Vault'}
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium py-2"
            disabled={isLoading || isVaultMutationLoading}
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
};

export default Upgrade;
