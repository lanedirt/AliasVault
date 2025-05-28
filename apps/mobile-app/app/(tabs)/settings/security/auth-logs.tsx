import { StyleSheet, View, ScrollView, RefreshControl, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { useWebApi } from '@/context/WebApiContext';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AuthLogModel } from '@/utils/types/webapi/AuthLog';
import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';
import { AuthEventType } from '@/utils/types/webapi/AuthEventType';
import { ThemedContainer } from '@/components/themed/ThemedContainer';
import { ThemedScrollView } from '@/components/themed/ThemedScrollView';

/**
 * Auth logs screen.
 */
export default function AuthLogsScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webApi = useWebApi();

  const [logs, setLogs] = useState<AuthLogModel[]>([]);
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 200);
  const [isRefreshing, setIsRefreshing] = useMinDurationLoading(false, 200);

  const styles = StyleSheet.create({
    contentContainer: {
      paddingBottom: 40,
      paddingTop: Platform.OS === 'ios' ? insets.top : 0,
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
    eventType: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      paddingTop: 12,
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    loadingContainer: {
      flex: 1,
    },
    logHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    logItem: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginBottom: 16,
      padding: 16,
      paddingBottom: 8,
    },
    section: {
      marginTop: 20,
      overflow: 'hidden',
    },
    status: {
      fontSize: 14,
      fontWeight: '600',
    },
    statusFailure: {
      color: colors.red,
    },
    statusSuccess: {
      color: colors.greenBackground,
    },
  });

  /**
   * Loads the authentication logs from the server.
   */
  const loadLogs = useCallback(async () : Promise<void> => {
    try {
      setIsLoading(true);
      const response = await webApi.getAuthLogs();
      setLogs(response);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to load auth logs',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  }, [webApi, setIsLoading, setLogs]);

  /**
   * Refresh the logs on pull to refresh.
   */
  const onRefresh = async () : Promise<void> => {
    // Trigger haptic feedback when pull-to-refresh is activated
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRefreshing(true);
    await loadLogs();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /**
   * Format date to yyyy-mm-dd hh:mm format.
   * @param date - The date to format
   * @returns The formatted date string
   */
  const formatDate = (date: string) : string => {
    const dateObject = new Date(date);
    return dateObject.toISOString().slice(0, 16).replace('T', ' ');
  };

  /**
   * Render the content.
   */
  const renderContent = () : React.ReactNode => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader count={3} height={120} parts={4} />
        </View>
      );
    }

    if (logs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>No auth logs found</ThemedText>
        </View>
      );
    }

    return logs.map((item) => {
      const eventType = AuthEventType[item.eventType];

      return (
        <View key={item.id} style={styles.logItem}>
          <View style={styles.logHeader}>
            <ThemedText style={styles.eventType}>{eventType}</ThemedText>
            <ThemedText style={[
              styles.status,
              item.isSuccess ? styles.statusSuccess : styles.statusFailure
            ]}>
              {item.isSuccess ? 'Success' : 'Failed'}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.detailText}>Time: {formatDate(item.timestamp)}</ThemedText>
            <ThemedText style={styles.detailText}>Device: {item.userAgent}</ThemedText>
            <ThemedText style={styles.detailText}>IP Address: {item.ipAddress}</ThemedText>
            <ThemedText style={styles.detailText}>Client: {item.client}</ThemedText>
          </View>
        </View>
      );
    });
  };

  return (
    <ThemedContainer>
      <ThemedScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <ThemedText style={styles.headerText}>
          Below you can find an overview of recent login attempts to your account.
        </ThemedText>
        <View style={styles.section}>
          {renderContent()}
        </View>
      </ThemedScrollView>
    </ThemedContainer>
  );
}