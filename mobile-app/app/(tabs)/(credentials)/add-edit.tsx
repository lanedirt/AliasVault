import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import { useDb } from '@/context/DbContext';
import { Credential, Alias } from '@/utils/types/Credential';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { Gender } from "../../../utils/generators/Identity/types/Gender";

type CredentialMode = 'random' | 'manual';

export default function AddEditCredentialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const dbContext = useDb();
  const [mode, setMode] = useState<CredentialMode>('random');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
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

    // Set navigation options
    useEffect(() => {
      navigation.setOptions({
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

      // Always use createCredential since updateCredentialById doesn't exist
      await dbContext.sqliteClient!.createCredential(credentialToSave);
      Toast.show({
        type: 'success',
        text1: 'Credential saved successfully',
        position: 'bottom'
      });
      router.back();
    } catch (error) {
      console.error('Error saving credential:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save credential',
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