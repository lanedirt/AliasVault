import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, useColorScheme, StyleSheet } from 'react-native';
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

export default function CredentialDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dbContext = useDb();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const loadCredential = async () => {
      if (!dbContext.dbAvailable || !id) return;

      try {
        const cred = await dbContext.sqliteClient!.getCredentialById(id as string);
        if (cred?.Alias?.BirthDate) {
          // Convert the string date to a Date object
          const date = new Date(cred.Alias.BirthDate);
          if (!isNaN(date.getTime())) {
            cred.Alias.BirthDate = date;
          } else {
            cred.Alias.BirthDate = undefined;
          }
        }
        setCredential(cred);
      } catch (err) {
        console.error('Error loading credential:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredential();

    return () => {
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
    <ThemedScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <CredentialIcon logo={credential.Logo} style={styles.logo} />
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.serviceName}>
            {credential.ServiceName}
          </ThemedText>
          {credential.ServiceUrl && (
            <Text style={[styles.serviceUrl, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>
              {credential.ServiceUrl}
            </Text>
          )}
        </View>
      </ThemedView>
      <NotesSection credential={credential} />
      <LoginCredentials credential={credential} />
      <AliasDetails credential={credential} />
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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