import { View, Image, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function Index() {
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Show branded loading screen while session is being restored
  if (isRestoring) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/logo-temp.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(feed)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 120,
  },
});
