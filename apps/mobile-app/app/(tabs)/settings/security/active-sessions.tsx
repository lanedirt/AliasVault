import { StyleSheet, View, TouchableOpacity, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { useWebApi } from '@/context/WebApiContext';
import { InlineSkeletonLoader } from '@/components/ui/InlineSkeletonLoader';

interface Session {
  id: string;
  deviceName: string;
  lastActive: string;
  ipAddress: string;
}

/**
 * Active sessions screen.
 */
export default function ActiveSessionsScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webApi = useWebApi();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: insets.bottom,
      paddingHorizontal: 14,
    },
    section: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      overflow: 'hidden',
    },
    sessionItem: {
      padding: 16,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    deviceName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    sessionDetails: {
      marginBottom: 8,
    },
    detailText: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 4,
    },
    revokeButton: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    emptyStateText: {
      color: colors.textMuted,
      fontSize: 16,
      textAlign: 'center',
    },
  });

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await webApi.getActiveSessions();
      setSessions(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await webApi.revokeSession(sessionId);
              await loadSessions();
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke session');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const renderSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionHeader}>
        <ThemedText style={styles.deviceName}>{item.deviceName}</ThemedText>
        <TouchableOpacity onPress={() => handleRevokeSession(item.id)}>
          <ThemedText style={styles.revokeButton}>Revoke</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.sessionDetails}>
        <ThemedText style={styles.detailText}>Last active: {item.lastActive}</ThemedText>
        <ThemedText style={styles.detailText}>IP Address: {item.ipAddress}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.section}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <InlineSkeletonLoader width={200} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No active sessions</ThemedText>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ThemedView>
  );
}