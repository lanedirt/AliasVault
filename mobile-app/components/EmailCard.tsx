import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedText } from './ThemedText';
import { MailboxEmail } from '@/utils/types/webapi/MailboxEmail';
import { router } from 'expo-router';

type EmailCardProps = {
  email: MailboxEmail;
};

export function EmailCard({ email }: EmailCardProps) {
  const colors = useColors();

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
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    emailHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    emailSubject: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
      color: colors.text,
    },
    emailDate: {
      fontSize: 12,
      opacity: 0.6,
      color: colors.textMuted,
    },
    emailPreview: {
      fontSize: 14,
      opacity: 0.8,
      color: colors.text,
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