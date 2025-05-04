import { Redirect } from 'expo-router';
import { install } from 'react-native-quick-crypto';

/**
 * App index which is the entry point of the app and redirects to the sync screen, which will
 * redirect to the login screen if the user is not logged in or to the main tabs screen if the user is logged in.
 */
export default function AppIndex() : React.ReactNode {
  // Install the react-native-quick-crypto library which is used by the EncryptionUtility
  install();

  return <Redirect href={'/sync'} />
}