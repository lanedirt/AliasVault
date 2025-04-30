import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { useColors } from '@/hooks/useColorScheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect } from 'react';

export default function AutofillConfirmationScreen() {
  const router = useRouter();
  const colors = useColors();
  const navigation = useNavigation();

    // Set header buttons
    useEffect(() => {
        navigation.setOptions({
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={handleStayInApp}
                style={{ padding: 10, paddingRight: 0 }}
              >
                <ThemedText style={{ color: colors.primary }}>Dismiss</ThemedText>
              </TouchableOpacity>
            </View>
          ),
        });
      }, [navigation]);

  const handleStayInApp = () => {
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
    },
    message: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
    },
  });

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="task-alt"
            size={80}
            color={colors.primary}
          />
        </View>

        <ThemedText style={styles.title}>Credential Created Successfully!</ThemedText>

        <ThemedText style={styles.message}>
          Your new credential has been created and is now available for password autofill.
        </ThemedText>
        <ThemedText style={[styles.message, { fontWeight: 'bold', marginTop: 20 }]}>
            Switch back to your browser to continue.
        </ThemedText>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}