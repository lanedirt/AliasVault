import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';
import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';

type EmailCardProps = {
  email: MailboxEmail;
};

/**
 * Email card component.
 */
export function EmailCard({ email }: EmailCardProps) : React.ReactNode {
  const colors = useColors();

  /**
   * Format the email date.
   */
  const formatEmailDate = (dateSystem: string): string => {
    const now = new Date();
    const emailDate = new Date(dateSystem);
    const secondsAgo = Math.floor((now.getTime() - emailDate.getTime()) / 1000);

    if (secondsAgo < 60) {
      return 'just now';
    } else if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (secondsAgo < 172800) {
      return 'yesterday';
    } else {
      return emailDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const styles = StyleSheet.create({
    emailCard: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      elevation: 3,
      marginBottom: 12,
      padding: 12,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    emailDate: {
      color: colors.textMuted,
      fontSize: 12,
      opacity: 0.6,
    },
    emailHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    emailPreview: {
      color: colors.text,
      fontSize: 14,
      opacity: 0.8,
    },
    emailSubject: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
    },
  });

  return (
    <TouchableOpacity
      style={styles.emailCard}
      onPress={() => router.push(`/(tabs)/emails/${email.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.emailHeader}>
        <ThemedText style={styles.emailSubject} numberOfLines={1}>
          {email.subject}
        </ThemedText>
        <ThemedText style={styles.emailDate}>
          {formatEmailDate(email.dateSystem)}
        </ThemedText>
      </View>
      <ThemedText style={styles.emailPreview} numberOfLines={2}>
        {email.messagePreview}
      </ThemedText>
    </TouchableOpacity>
  );
}