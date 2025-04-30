import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { CredentialIcon } from '@/components/CredentialIcon';
import { useDb } from '@/context/DbContext';
import { Credential } from '@/utils/types/Credential';
import { LoginCredentials } from '@/components/credentialDetails/LoginCredentials';
import { AliasDetails } from '@/components/credentialDetails/AliasDetails';
import { NotesSection } from '@/components/credentialDetails/NotesSection';
import { EmailPreview } from '@/components/credentialDetails/EmailPreview';
import { TotpSection } from '@/components/credentialDetails/TotpSection';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColorScheme';
import emitter from '@/utils/EventEmitter';

export default function CredentialDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dbContext = useDb();
  const navigation = useNavigation();
  const colors = useColors();
  const router = useRouter();

  // Set header buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleEdit}
            style={{ padding: 10, paddingRight: 0 }}
          >
            <MaterialIcons
                  name="edit"
                  size={24}
                  color={colors.primary}
                />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, credential]);

  const handleEdit = () => {
    router.push(`/(tabs)/credentials/add-edit?id=${id}`);
  }

  useEffect(() => {
    const loadCredential = async () => {
      if (!dbContext.dbAvailable || !id) return;

      try {
        const cred = await dbContext.sqliteClient!.getCredentialById(id as string);
        setCredential(cred);
      } catch (err) {
        console.error('Error loading credential:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredential();

    // Add listener for credential changes
    const credentialChangedSub = emitter.addListener('credentialChanged', async (changedId: string) => {
      if (changedId === id) {
        console.log('This credential was changed, refreshing details');
        await loadCredential();
      }
    });

    return () => {
      credentialChangedSub.remove();
      Toast.hide();
    };
  }, [id, dbContext.dbAvailable]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!credential) {
    return null;
  }

  return (
    <ThemedScrollView style={styles.container}
    contentContainerStyle={{ paddingBottom: 40 }}
    scrollIndicatorInsets={{ bottom: 40 }}
    >
      <ThemedView style={styles.header}>
        <CredentialIcon logo={credential.Logo} style={styles.logo} />
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.serviceName}>
            {credential.ServiceName}
          </ThemedText>
          {credential.ServiceUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(credential.ServiceUrl!)}>
              <Text style={[styles.serviceUrl, { color: colors.primary }]}>
                {credential.ServiceUrl}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
      <EmailPreview email={credential.Alias.Email} />
      <TotpSection credential={credential} />
      <NotesSection credential={credential} />
      <LoginCredentials credential={credential} />
      <AliasDetails credential={credential} />
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginTop: 6,
  },
  headerText: {
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  serviceUrl: {
    fontSize: 14,
  },
});