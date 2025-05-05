import { StyleSheet, View } from 'react-native';

import LoadingIndicator from './LoadingIndicator';
import { useColors } from '@/hooks/useColorScheme';

type LoadingOverlayProps = {
  status: string;
};

/**
 * LoadingOverlay component
 *
 * This component displays a loading indicator overlay over the entire screen.
 * It is used to indicate that a process is in progress and the user should wait.
 *
 */
export default function LoadingOverlay({ status }: LoadingOverlayProps): React.ReactNode {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background,
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 1000,
    },
  });

  return (
    <View style={styles.container}>
      <LoadingIndicator status={status} />
    </View>
  );
}