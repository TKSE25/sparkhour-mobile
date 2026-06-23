// ============================================================
// SparkHour mobile — push notifications (Expo).
// Registers the device's Expo push token and stores it on profiles.expo_push_token
// so the server (web backend) can push booking requests/approvals/messages.
// ============================================================

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Foreground display behaviour.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#7c3aed',
      });
    }

    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenData?.data;
    if (token) {
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    }
  } catch {
    // Simulator / permission denied / offline — non-fatal.
  }
}
