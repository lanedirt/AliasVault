import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, Image, ScrollView, useColorScheme, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDb } from '@/context/DbContext';
import { Credential } from '@/utils/types/Credential';
import SqliteClient from '@/utils/SqliteClient';

interface FormInputCopyToClipboardProps {
  label: string;
  value: string | undefined;
  type?: 'text' | 'password';
}

const FormInputCopyToClipboard: React.FC<FormInputCopyToClipboardProps> = ({
  label,
  value,
  type = 'text',
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const copyToClipboard = async () => {
    if (value) {
      await Clipboard.setStringAsync(value);
    }
  };

  const displayValue = type === 'password' && !isPasswordVisible
    ? '••••••••'
    : value;

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={[
        styles.inputContainer,
        {
          backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
          borderColor: isDarkMode ? '#374151' : '#d1d5db',
        },
      ]}
    >
      <View style={styles.inputContent}>
        <View>
          <Text style={[styles.label, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
            {label}
          </Text>
          <Text style={[styles.value, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
            {displayValue}
          </Text>
        </View>
        <View style={styles.actions}>
          {type === 'password' && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>
                {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
        setCredential(cred);
      } catch (err) {
        console.error('Error loading credential:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredential();
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

  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();
  const hasName = Boolean(credential.Alias?.FirstName?.trim() || credential.Alias?.LastName?.trim());
  const fullName = [credential.Alias?.FirstName, credential.Alias?.LastName].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        {credential.Logo && (
          <Image
            source={{ uri: SqliteClient.imgSrcFromBytes(credential.Logo) }}
            style={styles.logo}
          />
        )}
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

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Login Credentials</ThemedText>
        {email && (
          <FormInputCopyToClipboard
            label="Email"
            value={email}
          />
        )}
        {username && (
          <FormInputCopyToClipboard
            label="Username"
            value={username}
          />
        )}
        {password && (
          <FormInputCopyToClipboard
            label="Password"
            value={password}
            type="password"
          />
        )}
      </ThemedView>

      {(hasName || credential.Alias?.NickName) && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Alias</ThemedText>
          {hasName && (
            <FormInputCopyToClipboard
              label="Full Name"
              value={fullName}
            />
          )}
          {credential.Alias?.NickName && (
            <FormInputCopyToClipboard
              label="Nickname"
              value={credential.Alias.NickName}
            />
          )}
        </ThemedView>
      )}

      {credential.Notes && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Notes</ThemedText>
          <View style={[styles.notesContainer, {
            backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
            borderColor: isDarkMode ? '#374151' : '#d1d5db',
          }]}>
            <Text style={[styles.notes, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
              {credential.Notes}
            </Text>
          </View>
        </ThemedView>
      )}
    </ScrollView>
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
  section: {
    padding: 16,
    gap: 12,
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  inputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 16,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notes: {
    fontSize: 14,
  },
}); 