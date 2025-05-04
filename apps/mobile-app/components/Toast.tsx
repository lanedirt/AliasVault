import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

type ToastProps = {
  text1?: string;
  text2?: string;
};

const primaryColor = '#f97316';
const errorColor = '#dc2626';
const infoColor = '#3b82f6';
const shadowColor = '#000';
const textColor = '#fff';

const styles = StyleSheet.create({
  text1: {
    color: textColor,
    fontSize: 14,
    fontWeight: '500',
  },
  text2: {
    color: textColor,
    fontSize: 12,
    marginTop: 4,
  },
  toast: {
    backgroundColor: primaryColor,
    borderRadius: 8,
    elevation: 5,
    marginBottom: 70,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 12,
    shadowColor: shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastError: {
    backgroundColor: errorColor,
  },
  toastInfo: {
    backgroundColor: infoColor,
  },
  toastSuccess: {
    backgroundColor: primaryColor,
  },
});

export const toastConfig = {
  /**
   * Success toast.
   */
  success: (props: ToastProps): React.ReactNode => (
    <View
      style={[styles.toast, styles.toastSuccess]}
    >
      <Text style={styles.text1}>
        {props.text1 ?? ''}
      </Text>
    </View>
  ),
  /**
   * Error toast.
   */
  error: (props: ToastProps): React.ReactNode => (
    <View
      style={[styles.toast, styles.toastError]}
    >
      <Text style={styles.text1}>
        {props.text1 ?? ''}
      </Text>
      {props.text2 && (
        <Text style={styles.text2}>
          {props.text2 ?? ''}
        </Text>
      )}
    </View>
  ),
  /**
   * Info toast.
   */
  info: (props: ToastProps): React.ReactNode => (
    <View
      style={[styles.toast, styles.toastInfo]}
    >
      <Text style={styles.text1}>
        {props.text1 ?? ''}
      </Text>
    </View>
  ),
};

/**
 * AliasVault toast component.
 */
export const AliasVaultToast = (): React.ReactNode => {
  return <Toast config={toastConfig} />;
};
