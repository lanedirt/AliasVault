import { StyleSheet, View, TouchableOpacity, Alert, Keyboard, ScrollView } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { ThemedSafeAreaView } from '@/components/themed/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { Credential } from '@/utils/types/Credential';
import emitter from '@/utils/EventEmitter';
import { FaviconExtractModel } from '@/utils/types/webapi/FaviconExtractModel';
import { AliasVaultToast } from '@/components/Toast';
import { useVaultMutate } from '@/hooks/useVaultMutate';
import { IdentityGeneratorEn, IdentityGeneratorNl, IdentityHelperUtils, BaseIdentityGenerator } from '@/utils/shared/identity-generator';
import { PasswordGenerator } from '@/utils/shared/password-generator';
import { ValidatedFormField, ValidatedFormFieldRef } from '@/components/form/ValidatedFormField';
import { credentialSchema } from '@/utils/validationSchema';
import LoadingOverlay from '@/components/LoadingOverlay';

type CredentialMode = 'random' | 'manual';

/**
 * Add or edit a credential screen.
 */
export default function AddEditCredentialScreen() : React.ReactNode {
  const { id, serviceUrl } = useLocalSearchParams<{ id: string, serviceUrl?: string }>();
  const router = useRouter();
  const colors = useColors();
  const dbContext = useDb();
  const [mode, setMode] = useState<CredentialMode>('random');
  const { executeVaultMutation, syncStatus } = useVaultMutate();
  const navigation = useNavigation();
  const webApi = useWebApi();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const serviceNameRef = useRef<ValidatedFormFieldRef>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<Credential>({
    resolver: yupResolver(credentialSchema) as Resolver<Credential>,
    defaultValues: {
      Id: "",
      Username: "",
      Password: "",
      ServiceName: "",
      ServiceUrl: "",
      Notes: "",
      Alias: {
        FirstName: "",
        LastName: "",
        NickName: "",
        BirthDate: "",
        Gender: undefined,
        Email: ""
      }
    }
  });

  /**
   * If we received an ID, we're in edit mode.
   */
  const isEditMode = id !== undefined && id.length > 0;

  /**
   * Load an existing credential from the database in edit mode.
   */
  const loadExistingCredential = useCallback(async () : Promise<void> => {
    try {
      const existingCredential = await dbContext.sqliteClient!.getCredentialById(id);
      if (existingCredential) {
        existingCredential.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDisplay(existingCredential.Alias.BirthDate);
        Object.entries(existingCredential).forEach(([key, value]) => {
          setValue(key as keyof Credential, value);
        });
        if (existingCredential.Alias?.FirstName || existingCredential.Alias?.LastName) {
          setMode('manual');
        }
      }
    } catch (err) {
      console.error('Error loading credential:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to load credential',
        text2: 'Please try again'
      });
    }
  }, [id, dbContext.sqliteClient, setValue]);

  /**
   * On mount, load an existing credential if we're in edit mode, or extract the service name from the service URL
   * if we're in add mode and the service URL is provided (by native autofill component).
   */
  useEffect(() => {
    if (isEditMode) {
      loadExistingCredential();
    } else if (serviceUrl) {
      const decodedUrl = decodeURIComponent(serviceUrl);
      const serviceName = extractServiceNameFromUrl(decodedUrl);
      setValue('ServiceUrl', decodedUrl);
      setValue('ServiceName', serviceName);

      // Focus and select the service name field
      setTimeout(() => {
        serviceNameRef.current?.focus();
        serviceNameRef.current?.selectAll();
      }, 100);
    }
  }, [id, isEditMode, serviceUrl, loadExistingCredential, setValue]);

  /**
   * Initialize the identity and password generators with settings from user's vault.
   * @returns {identityGenerator: BaseIdentityGenerator, passwordGenerator: PasswordGenerator}
   */
  const initializeGenerators = useCallback(async () : Promise<{ identityGenerator: BaseIdentityGenerator, passwordGenerator: PasswordGenerator }> => {
    // Get default identity language from database
    const identityLanguage = await dbContext.sqliteClient!.getDefaultIdentityLanguage();

    // Initialize identity generator based on language
    let identityGenerator: BaseIdentityGenerator;
    switch (identityLanguage) {
      case 'nl':
        identityGenerator = new IdentityGeneratorNl();
        break;
      case 'en':
      default:
        identityGenerator = new IdentityGeneratorEn();
        break;
    }

    // Get password settings from database
    const passwordSettings = await dbContext.sqliteClient!.getPasswordSettings();

    // Initialize password generator with settings
    const passwordGenerator = new PasswordGenerator(passwordSettings);

    return { identityGenerator, passwordGenerator };
  }, [dbContext.sqliteClient]);

  /**
   * Generate a random alias and password.
   */
  const generateRandomAlias = useCallback(async (): Promise<void> => {
    const { identityGenerator, passwordGenerator } = await initializeGenerators();

    const identity = await identityGenerator.generateRandomIdentity();
    const password = passwordGenerator.generateRandomPassword();
    const defaultEmailDomain = await dbContext.sqliteClient!.getDefaultEmailDomain();
    const email = defaultEmailDomain ? `${identity.emailPrefix}@${defaultEmailDomain}` : identity.emailPrefix;

    setValue('Alias.Email', email);
    setValue('Alias.FirstName', identity.firstName);
    setValue('Alias.LastName', identity.lastName);
    setValue('Alias.NickName', identity.nickName);
    setValue('Alias.Gender', identity.gender);
    setValue('Alias.BirthDate', IdentityHelperUtils.normalizeBirthDateForDisplay(identity.birthDate.toISOString()));

    // In edit mode, preserve existing username and password if they exist
    if (isEditMode && watch('Username')) {
      // Keep the existing username in edit mode, so don't do anything here.
    } else {
      // Use the newly generated username
      setValue('Username', identity.nickName);
    }

    if (isEditMode && watch('Password')) {
      // Keep the existing password in edit mode, so don't do anything here.
    } else {
      // Use the newly generated password
      setValue('Password', password);
      // Make password visible when newly generated
      setIsPasswordVisible(true);
    }
  }, [isEditMode, watch, setValue, setIsPasswordVisible, initializeGenerators, dbContext.sqliteClient]);

  /**
   * Submit the form for either creating or updating a credential.
   * @param {Credential} data - The form data.
   */
  const onSubmit = useCallback(async (data: Credential) : Promise<void> => {
    Keyboard.dismiss();

    setIsLoading(true);

    // If we're creating a new credential and mode is random, generate random values
    if (!isEditMode && mode === 'random') {
      await generateRandomAlias();
    }

    // Assemble the credential to save
    const credentialToSave: Credential = {
      Id: isEditMode ? id : '',
      Username: data.Username,
      Password: data.Password,
      ServiceName: data.ServiceName,
      ServiceUrl: data.ServiceUrl,
      Alias: {
        FirstName: data.Alias.FirstName,
        LastName: data.Alias.LastName,
        NickName: data.Alias.NickName,
        BirthDate: data.Alias.BirthDate,
        Gender: data.Alias.Gender,
        Email: data.Alias.Email
      }
    }

    // Convert user birthdate entry format (yyyy-mm-dd) into valid ISO 8601 format for database storage
    credentialToSave.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDb(credentialToSave.Alias.BirthDate);

    // Extract favicon from service URL if the credential has one
    if (credentialToSave.ServiceUrl) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Favicon extraction timed out')), 5000)
        );

        const faviconPromise = webApi.get<FaviconExtractModel>('Favicon/Extract?url=' + credentialToSave.ServiceUrl);
        const faviconResponse = await Promise.race([faviconPromise, timeoutPromise]) as FaviconExtractModel;
        if (faviconResponse?.image) {
          const decodedImage = Uint8Array.from(Buffer.from(faviconResponse.image as string, 'base64'));
          credentialToSave.Logo = decodedImage;
        }
      } catch {
        // Favicon extraction failed or timed out, this is not a critical error so we can ignore it.
      }
    }

    await executeVaultMutation(async () => {
      if (isEditMode) {
        await dbContext.sqliteClient!.updateCredentialById(credentialToSave);
      } else {
        const credentialId = await dbContext.sqliteClient!.createCredential(credentialToSave);
        credentialToSave.Id = credentialId;
      }

      // Emit an event to notify list and detail views to refresh
      emitter.emit('credentialChanged', credentialToSave.Id);
    });

    // If this was created from autofill (serviceUrl param), show confirmation screen
    if (serviceUrl && !isEditMode) {
      router.replace('/credentials/autofill-credential-created');
    } else {
      // First close the modal
      router.dismiss();

      // Then navigate after a short delay to ensure the modal has closed
      setTimeout(() => {
        router.push(`/credentials/${credentialToSave.Id}`);
      }, 100);

      // Show success toast
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: isEditMode ? 'Credential updated successfully' : 'Credential created successfully',
          position: 'bottom'
        });
      }, 200);

      setIsLoading(false);
    }
  }, [isEditMode, id, serviceUrl, router, executeVaultMutation, dbContext.sqliteClient, mode, generateRandomAlias, webApi]);

  /**
   * Extract the service name from the service URL.
   */
  function extractServiceNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostParts = urlObj.hostname.split('.');

      // Remove common subdomains
      const commonSubdomains = ['www', 'app', 'login', 'auth', 'account', 'portal'];
      while (hostParts.length > 2 && commonSubdomains.includes(hostParts[0].toLowerCase())) {
        hostParts.shift();
      }

      // For domains like google.com, return Google.com
      if (hostParts.length <= 2) {
        const domain = hostParts.join('.');
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }

      // For domains like app.example.com, return Example.com
      const mainDomain = hostParts.slice(-2).join('.');
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    } catch {
      // If URL parsing fails, return the original URL
      return url;
    }
  }

  /**
   * Generate a random username.
   */
  const generateRandomUsername = async () : Promise<void> => {
    try {
      const { identityGenerator } = await initializeGenerators();
      const identity = await identityGenerator.generateRandomIdentity();
      setValue('Username', identity.nickName);
    } catch (error) {
      console.error('Error generating random username:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to generate username',
        text2: 'Please try again'
      });
    }
  };

  /**
   * Generate a random password.
   */
  const generateRandomPassword = async () : Promise<void> => {
    try {
      const { passwordGenerator } = await initializeGenerators();
      const password = passwordGenerator.generateRandomPassword();
      setValue('Password', password);
      setIsPasswordVisible(true);
    } catch (error) {
      console.error('Error generating random password:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to generate password',
        text2: 'Please try again'
      });
    }
  };

  /**
   * Handle the delete button press.
   */
  const handleDelete = async () : Promise<void> => {
    if (!id) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      "Delete Credential",
      "Are you sure you want to delete this credential? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          /**
           * Delete the credential.
           */
          onPress: async () : Promise<void> => {
            await executeVaultMutation(async () => {
              await dbContext.sqliteClient!.deleteCredentialById(id);
            });

            // Show success toast
            setTimeout(() => {
              Toast.show({
                type: 'success',
                text1: 'Credential deleted successfully',
                position: 'bottom'
              });
            }, 200);

            /*
             * Hard navigate back to the credentials list as the credential that was
             * shown in the previous screen is now deleted.
             */
            router.replace('/credentials');
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      marginTop: 36,
      padding: 16,
      paddingTop: 0,
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.errorBackground,
      borderColor: colors.errorBorder,
      borderRadius: 8,
      borderWidth: 1,
      padding: 10,
    },
    deleteButtonText: {
      color: colors.errorText,
      fontWeight: '600',
    },
    generateButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 8,
      marginTop: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    generateButtonText: {
      color: colors.primarySurfaceText,
      fontWeight: '600',
      marginLeft: 6,
    },
    headerLeftButton: {
      padding: 10,
      paddingLeft: 0,
    },
    headerRightButton: {
      padding: 10,
      paddingRight: 0,
    },
    modeButton: {
      alignItems: 'center',
      borderRadius: 6,
      flex: 1,
      padding: 12,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    modeButtonTextActive: {
      color: colors.primarySurfaceText,
    },
    modeSelector: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 16,
      padding: 4,
    },
    section: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginBottom: 24,
      padding: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
  });

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Credential' : 'Add Credential',
      /**
       * Header left button.
       */
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerLeftButton}
        >
          <ThemedText style={{ color: colors.primary }}>Cancel</ThemedText>
        </TouchableOpacity>
      ),
      /**
       * Header right button.
       */
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          style={styles.headerRightButton}
        >
          <MaterialIcons name="save" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, mode, handleSubmit, onSubmit, colors.primary, isEditMode, router, styles.headerLeftButton, styles.headerRightButton]);

  return (
    <>
      {(isLoading) && (
        <LoadingOverlay status={syncStatus} />
      )}
      <ThemedSafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ScrollView
          >
            {!isEditMode && (
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'random' && styles.modeButtonActive]}
                  onPress={() => setMode('random')}
                >
                  <ThemedText style={[styles.modeButtonText, mode === 'random' && styles.modeButtonTextActive]}>
                    Random Alias
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
                  onPress={() => setMode('manual')}
                >
                  <ThemedText style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextActive]}>
                    Manual
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Service</ThemedText>
              <ValidatedFormField
                ref={serviceNameRef}
                control={control}
                name="ServiceName"
                label="Service Name"
                required
              />
              <ValidatedFormField
                control={control}
                name="ServiceUrl"
                label="Service URL"
              />
            </View>
            {(mode === 'manual' || isEditMode) && (
              <>
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Login credentials</ThemedText>

                  <ValidatedFormField
                    control={control}
                    name="Username"
                    label="Username"
                    buttons={[
                      {
                        icon: "refresh",
                        onPress: generateRandomUsername
                      }
                    ]}
                  />
                  <ValidatedFormField
                    control={control}
                    name="Password"
                    label="Password"
                    secureTextEntry={!isPasswordVisible}
                    buttons={[
                      {
                        icon: isPasswordVisible ? "visibility-off" : "visibility",
                        /**
                         * Toggle the visibility of the password.
                         */
                        onPress: () => setIsPasswordVisible(!isPasswordVisible)
                      },
                      {
                        icon: "refresh",
                        onPress: generateRandomPassword
                      }
                    ]}
                  />
                  <TouchableOpacity style={styles.generateButton} onPress={generateRandomAlias}>
                    <MaterialIcons name="auto-fix-high" size={20} color="#fff" />
                    <ThemedText style={styles.generateButtonText}>Generate Random Alias</ThemedText>
                  </TouchableOpacity>
                  <ValidatedFormField
                    control={control}
                    name="Alias.Email"
                    label="Email"
                  />
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Alias</ThemedText>
                  <ValidatedFormField
                    control={control}
                    name="Alias.FirstName"
                    label="First Name"
                  />
                  <ValidatedFormField
                    control={control}
                    name="Alias.LastName"
                    label="Last Name"
                  />
                  <ValidatedFormField
                    control={control}
                    name="Alias.NickName"
                    label="Nick Name"
                  />
                  <ValidatedFormField
                    control={control}
                    name="Alias.Gender"
                    label="Gender"
                  />
                  <ValidatedFormField
                    control={control}
                    name="Alias.BirthDate"
                    label="Birth Date"
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Metadata</ThemedText>

                  <ValidatedFormField
                    control={control}
                    name="Notes"
                    label="Notes"
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {/* TODO: Add TOTP management */}
                </View>

                {isEditMode && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <ThemedText style={styles.deleteButtonText}>Delete Credential</ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </ThemedView>
        <AliasVaultToast />
      </ThemedSafeAreaView>
    </>
  );
}