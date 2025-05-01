import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Platform, Animated, ActivityIndicator, Alert, Keyboard } from 'react-native';
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
import { IdentityGeneratorEn } from '@/utils/shared/identity-generator';
import { IdentityGeneratorNl } from '@/utils/shared/identity-generator';
import { PasswordGenerator } from '@/utils/shared/password-generator';
import { BaseIdentityGenerator } from '@/utils/shared/identity-generator';

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
  const [credential, setCredential] = useState<Partial<Credential>>({
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
      BirthDate: "0001-01-01",
      Gender: Gender.Other,
      Email: ""
    },
  });
  const webApi = useWebApi();

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
            onPress={handleSave}
            style={{ padding: 10, paddingRight: 0 }}
          >
            <MaterialIcons
                  name="save"
                  size={24}
                  color={colors.primary}
                />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, credential, mode]);

  const isEditMode = !!id;

  useEffect(() => {
    let serviceName = "";

    if (isEditMode) {
      loadExistingCredential();
    }
    else {
      // If serviceUrl is provided, extract the service name from the URL and prefill the form values.
      // This is used when the user opens the app from a deep link (e.g. from iOS autofill extension).
      if (serviceUrl) {
        // Decode the URL-encoded service URL
        const decodedUrl = decodeURIComponent(serviceUrl);

        // Extract service name from URL
        serviceName = extractServiceNameFromUrl(decodedUrl);

        // Set the form values
        // Note: You'll need to implement this based on your form state management
        setCredential(prev => ({
          ...prev,
          ServiceUrl: decodedUrl,
          ServiceName: serviceName,
          // ... other form fields
        }));
      }

      // In create mode, autofocus the service name field and select all default text
      // so user can start renaming the service immediately if they want.
      setTimeout(() => {
        serviceNameInputRef.current?.focus();
        if (serviceName.length > 0) {
          // If serviceUrl is provided, select all text
          serviceNameInputRef.current?.setSelection(0, serviceName.length || 0);
        }
      }, 200);
    }
  }, [id, isEditMode, serviceUrl]);

  useEffect(() => {

  }, [serviceUrl]);

  const loadExistingCredential = async () => {
    try {
      const existingCredential = await dbContext.sqliteClient!.getCredentialById(id);
      if (existingCredential) {
        setCredential(existingCredential);
        // If credential has custom values, switch to manual mode
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

  const generateRandomValues = async () : Promise<Credential> => {
    try {
      console.log('Generating random values');
      // Get default identity language and password settings from database
      const identityLanguage = await dbContext.sqliteClient!.getDefaultIdentityLanguage();
      const passwordSettings = await dbContext.sqliteClient!.getPasswordSettings();
      const defaultEmailDomain = await dbContext.sqliteClient!.getDefaultEmailDomain();

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

      // Initialize password generator with settings
      const passwordGenerator = new PasswordGenerator(passwordSettings);
      const password = passwordGenerator.generateRandomPassword();

      // Create email with domain if available
      const email = defaultEmailDomain ? `${identity.emailPrefix}@${defaultEmailDomain}` : identity.emailPrefix;

      // Assign generated values
      const updatedCredential: Partial<Credential> = {
        ...credential,
        Username: identity.nickName,
        Password: password,
        Alias: {
          ...(credential.Alias ?? {}),
          Email: email,
          FirstName: identity.firstName,
          LastName: identity.lastName,
          NickName: identity.nickName,
          Gender: identity.gender,
          BirthDate: identity.birthDate.toISOString(),
        }
      };

      setCredential(updatedCredential);

      return updatedCredential as Credential;
    } catch (error) {
      console.error('Error generating random values:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    let credentialToSave = credential as Credential;

    // If mode is random, generate random values for all fields before saving.
    if (mode === 'random') {
      console.log('Generating random values');
      credentialToSave = await generateRandomValues();
    }

    await executeVaultMutation(async () => {
      if (isEditMode) {
        await dbContext.sqliteClient!.updateCredentialById(credentialToSave);
      } else {
        // For new credentials, try to extract favicon
        if (credential.ServiceUrl) {
          try {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Favicon extraction timed out')), 5000)
            );

            const faviconPromise = webApi.get<FaviconExtractModel>('Favicon/Extract?url=' + credential.ServiceUrl);
            const faviconResponse = await Promise.race([faviconPromise, timeoutPromise]) as FaviconExtractModel;
            if (faviconResponse?.image) {
              const decodedImage = Uint8Array.from(Buffer.from(faviconResponse.image as string, 'base64'));
              credential.Logo = decodedImage;
            }
          } catch (error) {
            console.log('Favicon extraction failed or timed out:', error);
          }
        }

        await dbContext.sqliteClient!.createCredential(credentialToSave);
      }

      // Emit an event to notify list and detail views to refresh
      emitter.emit('credentialChanged', credentialToSave.Id);
    });

    // If this was created from autofill (serviceUrl param), show confirmation screen
    if (serviceUrl && !isEditMode) {
      router.replace('/credentials/autofill-credential-created');
    } else {
      router.back();

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

  const handleAliasChange = (field: keyof Credential['Alias'], value: string | Gender) => {
    setCredential(prev => ({
      ...prev,
      Alias: {
        ...prev.Alias,
        [field]: value,
        BirthDate: prev.Alias?.BirthDate || "0001-01-01" // Ensure BirthDate is always set
      }
    }));
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
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
    },
    generateButtonText: {
      color: '#fff',
      fontWeight: '600',
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    syncStatus: {
      marginTop: 16,
      textAlign: 'center',
      color: '#fff',
      fontSize: 16,
    },
    deleteButton: {
      padding: 12,
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
  });

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {(isLoading || syncStatus) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            {syncStatus && (
              <ThemedText style={styles.syncStatus}>{syncStatus}</ThemedText>
            )}
          </View>
        )}
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
            <ThemedText style={styles.sectionTitle}>Service Information</ThemedText>
            <TextInput
              ref={serviceNameInputRef}
              style={styles.input}
              placeholder="Service Name"
              placeholderTextColor={colors.textMuted}
              value={credential.ServiceName}
              onChangeText={(text) => setCredential(prev => ({ ...prev, ServiceName: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Service URL"
              placeholderTextColor={colors.textMuted}
              value={credential.ServiceUrl}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              onChangeText={(text) => setCredential(prev => ({ ...prev, ServiceUrl: text }))}
            />
          </View>

          {(mode === 'manual' || isEditMode) && (
            <>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Login Credentials</ThemedText>
              {!isEditMode && (
                <TouchableOpacity style={styles.generateButton} onPress={generateRandomValues}>
                  <ThemedText style={styles.generateButtonText}>Generate Random Values</ThemedText>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.Email}
                onChangeText={(text) => handleAliasChange('Email', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={colors.textMuted}
                value={credential.Username}
                onChangeText={(text) => setCredential(prev => ({ ...prev, Username: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={credential.Password}
                onChangeText={(text) => setCredential(prev => ({ ...prev, Password: text }))}
                secureTextEntry
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Alias Information</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.FirstName}
                onChangeText={(text) => handleAliasChange('FirstName', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.LastName}
                onChangeText={(text) => handleAliasChange('LastName', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Nick Name"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.NickName}
                onChangeText={(text) => handleAliasChange('NickName', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Gender"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.Gender}
                onChangeText={(text) => handleAliasChange('Gender', text === 'Male' ? Gender.Male : Gender.Female)}
              />
              <TextInput
                style={styles.input}
                placeholder="Birth Date (YYYY-MM-DD)"
                placeholderTextColor={colors.textMuted}
                value={credential.Alias?.BirthDate?.split(' ')[0]}
                onChangeText={(text) => handleAliasChange('BirthDate', text + ' 00:00:00')}
              />
            </View>
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Metadata</ThemedText>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Notes"
                  placeholderTextColor={colors.textMuted}
                  value={credential.Notes}
                  onChangeText={(text) => setCredential(prev => ({ ...prev, Notes: text }))}
                  multiline
                />
              {/* TODO: Add TOTP management */}
            </View>
            {isEditMode && (
              <TouchableOpacity
                style={[styles.deleteButton]}
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
  );
}