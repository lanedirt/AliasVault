import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TouchableWithoutFeedback, Keyboard, Text } from 'react-native';

import type { VaultVersion } from '@/utils/dist/shared/vault-sql';
import { VaultSqlGenerator } from '@/utils/dist/shared/vault-sql';

import { useColors } from '@/hooks/useColorScheme';
import { useVaultMutate } from '@/hooks/useVaultMutate';
import { useVaultSync } from '@/hooks/useVaultSync';

import Logo from '@/assets/images/logo.svg';
import LoadingIndicator from '@/components/LoadingIndicator';
import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import NativeVaultManager from '@/specs/NativeVaultManager';

/**
 * Upgrade screen.
 */
export default function UpgradeScreen() : React.ReactNode {
  const { username } = useAuth();
  const { sqliteClient } = useDb();
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<VaultVersion | null>(null);
  const [latestVersion, setLatestVersion] = useState<VaultVersion | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState('Preparing upgrade...');
  const colors = useColors();
  const webApi = useWebApi();
  const { executeVaultMutation, isLoading: isVaultMutationLoading, syncStatus } = useVaultMutate();
  const { syncVault } = useVaultSync();

  /**
   * Load version information from the database.
   */
  const loadVersionInfo = useCallback(async () => {
    try {
      if (sqliteClient) {
        const current = await sqliteClient.getDatabaseVersion();
        const latest = await sqliteClient.getLatestDatabaseVersion();
        setCurrentVersion(current);
        setLatestVersion(latest);
      }
    } catch (error) {
      console.error('Failed to load version information:', error);
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
      Alert.alert('Error', 'Unable to get version information. Please try again.');
      return;
    }

    // Check if this is a self-hosted instance and show warning if needed
    if (await webApi.isSelfHosted()) {
      Alert.alert(
        'Self-Hosted Server',
        "If you're using a self-hosted server, make sure to also update your self-hosted instance as otherwise logging in to the web client will stop working.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Upgrade',
            style: 'default',
            /**
             * Continue upgrade.
             */
            onPress: async () : Promise<void> => {
              await performUpgrade();
            }
          }
        ]
      );
    } else {
      await performUpgrade();
    }
  };

  /**
   * Perform the actual vault upgrade.
   */
  const performUpgrade = async (): Promise<void> => {
    if (!sqliteClient || !currentVersion || !latestVersion) {
      Alert.alert('Error', 'Unable to get version information. Please try again.');
      return;
    }

    setIsLoading(true);
    setUpgradeStatus('Preparing upgrade...');

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

      // Use the useVaultMutate hook to handle the upgrade and vault upload
      await executeVaultMutation(async () => {
        // Begin transaction
        setUpgradeStatus('Starting database transaction...');
        await NativeVaultManager.beginTransaction();

        // Execute each SQL command
        setUpgradeStatus('Applying database migrations...');
        for (let i = 0; i < upgradeResult.sqlCommands.length; i++) {
          const sqlCommand = upgradeResult.sqlCommands[i];
          setUpgradeStatus(`Applying migration ${i + 1} of ${upgradeResult.sqlCommands.length}...`);

          try {
            await NativeVaultManager.executeRaw(sqlCommand);
          } catch (error) {
            console.error(`Error executing SQL command ${i + 1}:`, sqlCommand, error);
            await NativeVaultManager.rollbackTransaction();
            throw new Error(`Failed to apply migration ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Commit transaction
        setUpgradeStatus('Committing changes...');
        await NativeVaultManager.commitTransaction();
      }, {
        skipSyncCheck: true, // Skip sync check during upgrade to prevent loop
        /**
         * Handle successful upgrade completion.
         */
        onSuccess: () => {
          void handleUpgradeSuccess();
        },
        /**
         * Handle upgrade error.
         */
        onError: (error: Error) => {
          console.error('Upgrade failed:', error);
          Alert.alert('Upgrade Failed', error.message);
        }
      });

    } catch (error) {
      console.error('Upgrade failed:', error);
      Alert.alert('Upgrade Failed', error instanceof Error ? error.message : 'An unknown error occurred during the upgrade. Please try again.');
    } finally {
      setIsLoading(false);
      setUpgradeStatus('Preparing upgrade...');
    }
  };

  /**
   * Handle successful upgrade completion.
   */
  const handleUpgradeSuccess = async () : Promise<void> => {
    try {
      // Sync vault to ensure we have the latest data
      await syncVault({
        /**
         * Handle the status update.
         */
        onStatus: (message) => setUpgradeStatus(message),
        /**
         * Handle successful vault sync and navigate to credentials.
         */
        onSuccess: () => {
          // Navigate to credentials index
          router.replace('/(tabs)/credentials');
        },
        /**
         * Handle sync error and still navigate to credentials.
         */
        onError: (error) => {
          console.error('Sync error after upgrade:', error);
          // Still navigate to credentials even if sync fails
          router.replace('/(tabs)/credentials');
        }
      });
    } catch (error) {
      console.error('Error during post-upgrade sync:', error);
      // Navigate to credentials even if sync fails
      router.replace('/(tabs)/credentials');
    }
  };

  /**
   * Handle the logout.
   */
  const handleLogout = async () : Promise<void> => {
    /*
     * Clear any stored tokens or session data
     * This will be handled by the auth context
     */
    await webApi.logout();
    router.replace('/login');
  };

  /**
   * Show native dialog with version description.
   */
  const showVersionDialog = (): void => {
    Alert.alert(
      "What's New",
      `An upgrade is required to support the following changes:\n\n${latestVersion?.description ?? 'No description available for this version.'}`,
      [
        { text: 'Okay', style: 'default' }
      ]
    );
  };

  const styles = StyleSheet.create({
    appName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    avatarContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    button: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 50,
      justifyContent: 'center',
      marginBottom: 16,
      width: '100%',
    },
    buttonText: {
      color: colors.primarySurfaceText,
      fontSize: 16,
      fontWeight: '600',
    },
    container: {
      flex: 1,
    },
    content: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      padding: 20,
      width: '100%',
    },
    currentVersionValue: {
      color: colors.primary,
    },
    gradientContainer: {
      height: Dimensions.get('window').height * 0.4,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    headerSection: {
      paddingBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    helpButton: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderRadius: 20,
      height: 24,
      justifyContent: 'center',
      marginLeft: 8,
      width: 24,
    },
    helpButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    latestVersionValue: {
      color: colors.greenBackground,
    },
    loadingContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    logoutButton: {
      alignSelf: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    logoutButtonText: {
      color: colors.red,
      fontSize: 16,
    },
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 40,
      paddingHorizontal: 20,
    },
    scrollContent: {
      flexGrow: 1,
    },
    subtitle: {
      color: colors.text,
      fontSize: 14,
      marginBottom: 24,
      opacity: 0.7,
      textAlign: 'center',
    },
    username: {
      color: colors.text,
      fontSize: 18,
      opacity: 0.8,
      textAlign: 'center',
    },
    versionContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 16,
      padding: 16,
    },
    versionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    versionLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      opacity: 0.7,
    },
    versionRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    versionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    versionValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <ThemedView style={styles.container}>
      {(isLoading || isVaultMutationLoading) ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator status={syncStatus || upgradeStatus} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <LinearGradient
                colors={[colors.loginHeader, colors.background]}
                style={styles.gradientContainer}
              />
              <View style={styles.mainContent}>
                <View style={styles.headerSection}>
                  <View style={styles.logoContainer}>
                    <Logo width={80} height={80} />
                    <Text style={styles.appName}>Upgrade Vault</Text>
                  </View>
                </View>
                <View style={styles.content}>
                  <View style={styles.avatarContainer}>
                    <Avatar />
                    <ThemedText style={styles.username}>{username}</ThemedText>
                  </View>
                  <ThemedText style={styles.subtitle}>AliasVault has updated and your vault needs to be upgraded. Normally this only takes a few seconds.</ThemedText>

                  <View style={styles.versionContainer}>
                    <View style={styles.versionHeader}>
                      <ThemedText style={styles.versionTitle}>Version Information</ThemedText>
                      <TouchableOpacity
                        style={styles.helpButton}
                        onPress={showVersionDialog}
                      >
                        <ThemedText style={styles.helpButtonText}>?</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.versionRow}>
                      <ThemedText style={styles.versionLabel}>Your vault:</ThemedText>
                      <ThemedText style={[styles.versionValue, styles.currentVersionValue]}>
                        {currentVersion?.releaseVersion ?? '...'}
                      </ThemedText>
                    </View>
                    <View style={styles.versionRow}>
                      <ThemedText style={styles.versionLabel}>New version:</ThemedText>
                      <ThemedText style={[styles.versionValue, styles.latestVersionValue]}>
                        {latestVersion?.releaseVersion ?? '...'}
                      </ThemedText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleUpgrade}
                    disabled={isLoading || isVaultMutationLoading}
                  >
                    <ThemedText style={styles.buttonText}>
                      {isLoading || isVaultMutationLoading ? (syncStatus || 'Upgrading...') : 'Upgrade'}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}