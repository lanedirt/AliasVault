import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, RefreshControl, Platform } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { useWebApi } from '@/context/WebApiContext';
import { RefreshToken } from '@/utils/types/webapi/RefreshToken';
import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ThemedContainer } from '@/components/themed/ThemedContainer';
/**
 * Active sessions screen.
 */
export default function ActiveSessionsScreen() : React.ReactNode {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webApi = useWebApi();

  const [refreshTokens, setRefreshTokens] = useState<RefreshToken[]>([]);
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
    deviceName: {
      color: colors.text,
      flex: 1,
      flexWrap: 'wrap',
      fontSize: 16,
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
    header: {
      paddingTop: 12
    },
    headerText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    revokeButton: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    section: {
      marginTop: 20,
      overflow: 'hidden',
    },
    sessionDetails: {
      marginBottom: 8,
    },
    sessionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sessionItem: {
      backgroundColor: colors.accentBackground,
      borderRadius: 10,
      marginBottom: 16,
      padding: 16,
      paddingBottom: 2,
    },
  });

  /**
   * Load the active sessions from the server.
   */
  const loadSessions = useCallback(async () : Promise<void> => {
    try {
      setIsLoading(true);
      const response = await webApi.getActiveSessions();
      setRefreshTokens(response);
    } catch {
      Alert.alert('Error', 'Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  }, [webApi, setIsLoading, setRefreshTokens]);

  /**
   * Handle the revoke session action.
   */
  const handleRevokeSession = async (sessionId: string) : Promise<void> => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this session? This will log you out of the chosen device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          /**
           * Revoke the session and refresh the sessions.
           */
          onPress: async () : Promise<void> => {
            try {
              await webApi.revokeSession(sessionId);
              await loadSessions();

              // Show success toast
              Toast.show({
                text1: 'Session successfully revoked',
                type: 'success',
                position: 'bottom',
              });
            } catch {
              // Show error toast
              Toast.show({
                text1: 'Failed to revoke session',
                type: 'error',
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  /**
   * Refresh the sessions on pull to refresh.
   */
  const onRefresh = async () : Promise<void> => {
    // Trigger haptic feedback when pull-to-refresh is activated
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /**
   * Format date to yyyy-mm-dd hh:mm format.
   * @param date - The date to format
   * @returns The formatted date string
   */
  const formatDate = (date: string) : string => {
    const dateObject = new Date(date);
    return dateObject.toISOString().slice(0, 16).replace('T', ' ');
  };

  return (
    <ThemedContainer>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            Below is a list of devices where your account is currently logged in or has an active session. You can log out from any of these sessions here.
          </ThemedText>
        </View>
        <View style={styles.section}>
          {isLoading ? (
            <SkeletonLoader count={1} height={100} parts={3} />
          ) : refreshTokens.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>No active sessions</ThemedText>
            </View>
          ) : (
            refreshTokens.map((item) => (
              <View key={item.id} style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <ThemedText style={styles.deviceName} numberOfLines={2}>{item.deviceIdentifier}</ThemedText>
                  <TouchableOpacity onPress={() => handleRevokeSession(item.id)}>
                    <ThemedText style={styles.revokeButton}>Revoke</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={styles.sessionDetails}>
                  <ThemedText style={styles.detailText}>Last active: {formatDate(item.createdAt)}</ThemedText>
                  <ThemedText style={styles.detailText}>Expires: {formatDate(item.expireDate)}</ThemedText>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedContainer>
  );
}