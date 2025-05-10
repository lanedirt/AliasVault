import { StyleSheet, View, TouchableOpacity, Animated, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { useColors } from '@/hooks/useColorScheme';
import { TitleContainer } from '@/components/ui/TitleContainer';
import { CollapsibleHeader } from '@/components/ui/CollapsibleHeader';
import { useWebApi } from '@/context/WebApiContext';
import { InlineSkeletonLoader } from '@/components/ui/InlineSkeletonLoader';

interface IAuthLog {
  id: string;
  timestamp: string;
  eventType: string;
  ipAddress: string;
  deviceName: string;
  success: boolean;
}

/**
 * Auth logs screen.
 */
export default function AuthLogsScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const webApi = useWebApi();

  const [logs, setLogs] = useState<IAuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: insets.bottom,
      paddingHorizontal: 14,
      paddingTop: insets.top,
    },
    scrollContent: {
      paddingBottom: 40,
      paddingTop: 42,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginTop: 20,
      overflow: 'hidden',
    },
    logItem: {
      padding: 16,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    eventType: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    status: {
      fontSize: 14,
      fontWeight: '600',
    },
    statusSuccess: {
      color: colors.success,
    },
    statusFailure: {
      color: colors.error,
    },
    logDetails: {
      marginBottom: 8,
    },
    detailText: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 4,
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

  /**
   * Loads the authentication logs from the server.
   */
  const loadLogs = async () : Promise<void> => {
    try {
      setIsLoading(true);
      const response = await webApi.getAuthLogs();
      setLogs(response);
    } catch (error) {
      // Error handling is done by the WebApiService
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const renderLog = ({ item }: { item: IAuthLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <ThemedText style={styles.eventType}>{item.eventType}</ThemedText>
        <ThemedText style={[
          styles.status,
          item.success ? styles.statusSuccess : styles.statusFailure
        ]}>
          {item.success ? 'Success' : 'Failed'}
        </ThemedText>
      </View>
      <View style={styles.logDetails}>
        <ThemedText style={styles.detailText}>Time: {item.timestamp}</ThemedText>
        <ThemedText style={styles.detailText}>Device: {item.deviceName}</ThemedText>
        <ThemedText style={styles.detailText}>IP Address: {item.ipAddress}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.scrollContent}>
        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <InlineSkeletonLoader width={200} />
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>No auth logs found</ThemedText>
            </View>
          ) : (
            <FlatList
              data={logs}
              renderItem={renderLog}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>
    </ThemedView>
  );
}