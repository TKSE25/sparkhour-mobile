import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthListener } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { registerForPushNotifications } from '../lib/push';
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
  const { isLoading, user } = useAuthStore();
  const router = useRouter();

  // Register this device for push once logged in.
  useEffect(() => {
    if (user?.id) registerForPushNotifications(user.id);
  }, [user?.id]);

  // Route taps on a notification to the right screen.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { screen?: string };
      if (data?.screen === 'messages') router.push('/(tabs)/messages' as never);
      else if (data?.screen === 'host') router.push('/host-dashboard' as never);
      else router.push('/(tabs)/bookings' as never);
    });
    return () => sub.remove();
  }, [router]);

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
        <Stack.Screen
          name="host-dashboard"
          options={{
            headerShown: true,
            headerTitle: 'Host Dashboard',
            headerTintColor: '#1e1245',
          }}
        />
        <Stack.Screen
          name="messages/[id]"
          options={{ headerShown: true, headerTintColor: '#1e1245' }}
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
