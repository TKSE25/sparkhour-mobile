import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StyleSheet } from 'react-native';
import { useAuthListener } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

function AuthGate() {
  const { session, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  useAuthListener();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.ae.sparkhour.app"
      >
      <StatusBar style="light" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="studio/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
            headerTintColor: '#ffffff',
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Book Studio',
            headerTintColor: '#1e1245',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
