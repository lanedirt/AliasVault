import { Redirect } from 'expo-router';
import { install } from 'react-native-quick-crypto';

export default function AppIndex() {
  // Install the react-native-quick-crypto library which is used by the EncryptionUtility
  install();

  return <Redirect href={'/sync'} />
}