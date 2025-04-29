import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import { useDb } from '@/context/DbContext';
import { Credential } from '@/utils/types/Credential';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { Gender } from "@/utils/generators/Identity/types/Gender";
import emitter from '@/utils/EventEmitter';

type CredentialMode = 'random' | 'manual';

export default function AddEditCredentialScreen() {
  const { id, serviceUrl } = useLocalSearchParams<{ id: string, serviceUrl?: string }>();
  const router = useRouter();
  const colors = useColors();
  const dbContext = useDb();
  const [mode, setMode] = useState<CredentialMode>('random');
  const [isLoading, setIsLoading] = useState(false);
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
    if (isEditMode) {
      loadExistingCredential();
    }
  }, [id]);

  useEffect(() => {
    // If serviceUrl is provided, extract the service name from the URL and prefill the form values.
    // This is used when the user opens the app from a deep link (e.g. from iOS autofill extension).
    if (serviceUrl) {
      // Decode the URL-encoded service URL
      const decodedUrl = decodeURIComponent(serviceUrl);

      // Extract service name from URL
      const serviceName = extractServiceNameFromUrl(decodedUrl);
      // Set the form values
      // Note: You'll need to implement this based on your form state management
      setCredential(prev => ({
        ...prev,
        ServiceUrl: decodedUrl,
        ServiceName: serviceName,
        // ... other form fields
      }));

      // In create mode, autofocus the service name field and select all default text
      // so user can start renaming the service immediately if they want.
      if (!isEditMode) {
        setTimeout(() => {
          serviceNameInputRef.current?.focus();
          if (serviceUrl) {
            // If serviceUrl is provided, select all text
            serviceNameInputRef.current?.setSelection(0, serviceName.length || 0);
          }
        }, 200);
      }
    }
  }, [serviceUrl]);

  useEffect(() => {
    // Focus and select text logic
    if (!isEditMode) {
      // In create mode, always focus the service name field
      setTimeout(() => {
        serviceNameInputRef.current?.focus();
      }, 100);
    }
  }, [isEditMode, serviceUrl]);

  const loadExistingCredential = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomValues = () : Credential => {
    // Placeholder for random generation - will be replaced with actual generators
    const randomString = (length: number) => Math.random().toString(36).substring(2, length + 2);

    // Get the current credential
    const updatedCredential = credential;

    // Assign random values to all fields
    updatedCredential.Username = randomString(8);
    updatedCredential.Password = randomString(12);

    updatedCredential.Alias = {
      ...(updatedCredential.Alias ?? {}),
      Email: `${randomString(8)}@example.com`,
      FirstName: randomString(6),
      LastName: randomString(6),
      NickName: randomString(6),
      Gender: Math.random() > 0.5 ? Gender.Male : Gender.Female,
      BirthDate: '0001-01-01 00:00:00',
    };

    setCredential(updatedCredential);

    return updatedCredential as Credential;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      let credentialToSave = credential as Credential;

      // If mode is random, generate random values for all fields before saving.
      // TODO: replace this with actual identity generator logic.
      if (mode === 'random') {
        console.log('Generating random values');
        credentialToSave = generateRandomValues();
      }

      if (isEditMode) {
        // Update existing credential
        await dbContext.sqliteClient!.updateCredentialById(credentialToSave);
        Toast.show({
          type: 'success',
          text1: 'Credential updated successfully',
          position: 'bottom'
        });
      } else {
        // Create new credential
        await dbContext.sqliteClient!.createCredential(credentialToSave);
        Toast.show({
          type: 'success',
          text1: 'Credential created successfully',
          position: 'bottom'
        });
      }

      // Emit an event to notify list and detail views to refresh
      emitter.emit('credentialChanged', credentialToSave.Id);

      router.back();
    } catch (error) {
      console.error('Error saving credential:', error);
      Toast.show({
        type: 'error',
        text1: isEditMode ? 'Failed to update credential' : 'Failed to create credential',
        text2: error instanceof Error ? error.message : 'Unknown error',
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
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
  });

  return (
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
          </>
          )}
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}