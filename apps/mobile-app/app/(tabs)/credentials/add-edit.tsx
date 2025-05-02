import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { Credential } from '@/utils/types/Credential';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import emitter from '@/utils/EventEmitter';
import { FaviconExtractModel } from '@/utils/types/webapi/FaviconExtractModel';
import { AliasVaultToast } from '@/components/Toast';
import { useVaultMutate } from '@/hooks/useVaultMutate';
import { Gender } from '@/utils/shared/identity-generator';
import { IdentityGeneratorEn, IdentityGeneratorNl, IdentityHelperUtils, BaseIdentityGenerator } from '@/utils/shared/identity-generator';
import { PasswordGenerator } from '@/utils/shared/password-generator';
import { ValidatedFormField } from '@/components/ValidatedFormField';
import { Resolver, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { credentialSchema } from '@/utils/validationSchema';
import LoadingIndicator from '@/components/LoadingIndicator';
import LoadingOverlay from '@/components/LoadingOverlay';

type CredentialMode = 'random' | 'manual';

export default function AddEditCredentialScreen() {
  const { id, serviceUrl } = useLocalSearchParams<{ id: string, serviceUrl?: string }>();
  const router = useRouter();
  const colors = useColors();
  const dbContext = useDb();
  const [mode, setMode] = useState<CredentialMode>('random');
  const { executeVaultMutation, isLoading, syncStatus } = useVaultMutate();
  const navigation = useNavigation();
  const serviceNameInputRef = useRef<TextInput>(null);
  const webApi = useWebApi();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<Credential>({
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
        Gender: "",
        Email: ""
      }
    }
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      loadExistingCredential();
    } else if (serviceUrl) {
      const decodedUrl = decodeURIComponent(serviceUrl);
      const serviceName = extractServiceNameFromUrl(decodedUrl);
      setValue('ServiceUrl', decodedUrl);
      setValue('ServiceName', serviceName);
    }
  }, [id, isEditMode, serviceUrl]);

  const loadExistingCredential = async () => {
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
  };

  const onSubmit = async (data: Credential) => {
    Keyboard.dismiss();

    // Deep clone to avoid mutating state
    let credentialToSave: Credential = JSON.parse(JSON.stringify(data));

    // Convert user birthdate entry format (yyyy-mm-dd) into valid ISO 8601 format for database storage
    credentialToSave.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDb(credentialToSave.Alias.BirthDate);

    // If we're creating a new credential and mode is random, generate random values
    if (!isEditMode && mode === 'random') {
      console.log('Generating random values');
      credentialToSave = await generateRandomAlias();
    }

    await executeVaultMutation(async () => {
      if (isEditMode) {
        await dbContext.sqliteClient!.updateCredentialById(credentialToSave);
      } else {
        // For new credentials, try to extract favicon
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
          } catch (error) {
            console.log('Favicon extraction failed or timed out:', error);
          }
        }

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
      if (isEditMode) {
        // If editing existing credential, go back to the detail screen via back.
        router.back();
      } else {
        // If creating new credential, go to the newly created credential via push.
        router.replace(`/credentials/${credentialToSave.Id}`);
      }

      // Show success toast
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: isEditMode ? 'Credential updated successfully' : 'Credential created successfully',
          position: 'bottom'
        });
      }, 200);
    }
  };

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
    } catch (e) {
      // If URL parsing fails, return the original URL
      return url;
    }
  }

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Credential' : 'Add Credential',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 10, paddingLeft: 0 }}
        >
          <ThemedText style={{ color: colors.primary }}>Cancel</ThemedText>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            style={{ padding: 10, paddingRight: 0 }}
          >
            <MaterialIcons name="save" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, mode]);

  const generateRandomAlias = async (): Promise<Credential> => {
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

    // Generate random identity
    const identity = await identityGenerator.generateRandomIdentity();

    // Get password settings from database
    const passwordSettings = await dbContext.sqliteClient!.getPasswordSettings();

    // Initialize password generator with settings
    const passwordGenerator = new PasswordGenerator(passwordSettings);
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
      // Keep the existing username in edit mode
      setValue('Username', watch('Username'));
    } else {
      // Use the newly generated username
      setValue('Username', identity.nickName);
    }

    if (isEditMode && watch('Password')) {
      // Keep the existing password in edit mode
      setValue('Password', watch('Password'));
    } else {
      // Use the newly generated password
      setValue('Password', password);
      // Make password visible when newly generated
      setIsPasswordVisible(true);
    }

    return {
      Id: "",
      Username: identity.emailPrefix,
      Password: password,
      ServiceName: watch('ServiceName'),
      ServiceUrl: watch('ServiceUrl'),
      Notes: "",
      Alias: {
        FirstName: identity.firstName,
        LastName: identity.lastName,
        NickName: identity.nickName,
        BirthDate: IdentityHelperUtils.normalizeBirthDateForDisplay(identity.birthDate.toISOString()),
        Gender: identity.gender,
        Email: email
      }
    };
  };

  const generateRandomUsername = async () => {
    try {
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

      // Generate random identity
      const identity = await identityGenerator.generateRandomIdentity();

      // Update only the username
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

  const generateRandomPassword = async () => {
    try {
      // Get password settings from database
      const passwordSettings = await dbContext.sqliteClient!.getPasswordSettings();

      // Initialize password generator with settings
      const passwordGenerator = new PasswordGenerator(passwordSettings);
      const password = passwordGenerator.generateRandomPassword();

      // Update only the password
      setValue('Password', password);

      // Make password visible when regenerated
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

  const handleAliasChange = (field: keyof Credential['Alias'], value: string | Gender) => {
    if (field === 'BirthDate') {
      setValue('Alias.BirthDate', value);
    }
    else {
      setValue(`Alias.${field}`, value);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

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
          onPress: async () => {

            await executeVaultMutation(async () => {
              console.log('Starting delete operation');
              await dbContext.sqliteClient!.deleteCredentialById(id);
              console.log('Credential deleted successfully');
            });

            // Show success toast
            setTimeout(() => {
              Toast.show({
                type: 'success',
                text1: 'Credential deleted successfully',
                position: 'bottom'
              });
            }, 200);

            // Hard navigate back to the credentials list as the credential that was
            // shown in the previous screen is now deleted.
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
      padding: 16,
      paddingTop: 0,
      marginTop: 36,
    },
    modeSelector: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      padding: 4,
    },
    modeButton: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
      borderRadius: 6,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    modeButtonTextActive: {
      color: '#fff',
    },
    section: {
      marginBottom: 24,
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 16,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
      marginTop: 16,
    },
    generateButtonText: {
      color: '#fff',
      fontWeight: '600',
      marginLeft: 6,
    },
    notesInput: {
      backgroundColor: colors.background,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 16,
      height: 100,
      textAlignVertical: 'top',
    },
    syncStatus: {
      marginTop: 16,
      textAlign: 'center',
      color: '#fff',
      fontSize: 16,
    },
    deleteButton: {
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.errorBackground,
      borderWidth: 1,
      borderColor: colors.errorBorder,
    },
    deleteButtonText: {
      color: colors.errorText,
      fontWeight: '600',
    },
    inputGroup: {
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 12,
      marginBottom: 4,
      color: colors.textMuted,
    },
    inputWithButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 12,
    },
    inputField: {
      flex: 1,
      color: colors.text,
      padding: 12,
      fontSize: 16,
    },
    inputButton: {
      padding: 12,
      borderLeftWidth: 1,
      borderLeftColor: colors.accentBorder,
    },
  });

  return (
    <>
      {(isLoading) && (
        <LoadingOverlay status={syncStatus} />
      )}
      <ThemedSafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ScrollView>
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
                control={control}
                name="ServiceName"
                label="Service Name"
                required
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
              />

              <ValidatedFormField
                control={control}
                name="ServiceUrl"
                label="Service URL"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
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
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
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
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Alias</ThemedText>

                <ValidatedFormField
                  control={control}
                  name="Alias.FirstName"
                  label="First Name"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />

                <ValidatedFormField
                  control={control}
                  name="Alias.LastName"
                  label="Last Name"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />

                <ValidatedFormField
                  control={control}
                  name="Alias.NickName"
                  label="Nick Name"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />

                <ValidatedFormField
                  control={control}
                  name="Alias.Gender"
                  label="Gender"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />

                <ValidatedFormField
                  control={control}
                  name="Alias.BirthDate"
                  label="Birth Date"
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Metadata</ThemedText>

                <ValidatedFormField
                  control={control}
                  name="Notes"
                  label="Notes"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
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