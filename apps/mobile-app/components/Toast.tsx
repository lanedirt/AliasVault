import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        backgroundColor: '#f97316', // AliasVault orange
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
        {props.text1}
      </Text>
    </View>
  ),
  error: (props: any) => (
    <View
      style={{
        backgroundColor: '#dc2626', // Red
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  info: (props: any) => (
    <View
      style={{
        backgroundColor: '#3b82f6', // Blue
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 70,
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
        {props.text1}
      </Text>
    </View>
  ),
};

export const AliasVaultToast = () => {
  return <Toast config={toastConfig} />;
};
