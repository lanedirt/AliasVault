import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColorScheme';
import LoadingIndicator from './LoadingIndicator';

interface LoadingOverlayProps {
  status: string;
}

/**
 * LoadingOverlay component
 *
 * This component displays a loading indicator overlay over the entire screen.
 * It is used to indicate that a process is in progress and the user should wait.
 *
 */
export default function LoadingOverlay({ status }: LoadingOverlayProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });

  return (
    <View style={styles.container}>
      <LoadingIndicator status={status} />
    </View>
  );
}