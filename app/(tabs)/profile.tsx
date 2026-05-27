import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../hooks/useAuth';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function MenuItem({ icon, label, onPress, danger = false, badge }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={danger ? Colors.error : Colors.purple}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile } = useAuthStore();

  async function handleSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile?.role === 'host' ? '🏠 Host' : '🎨 Creator'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
        </View>

        {profile?.role === 'host' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Host</Text>
            <MenuItem icon="home-outline" label="My Listings" onPress={() => {}} />
            <MenuItem icon="stats-chart-outline" label="Earnings" onPress={() => {}} />
            <MenuItem icon="calendar-outline" label="Manage Availability" onPress={() => {}} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <MenuItem icon="gift-outline" label="Referrals & Rewards" onPress={() => {}} badge="New" />
          <MenuItem icon="star-outline" label="My Reviews" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
        </View>

        <Text style={styles.version}>SparkHour v1.0.0 · sparkhour.ae</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  container: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.navy, alignItems: 'center',
    paddingTop: 32, paddingBottom: 32, paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: Colors.white },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  email: { fontSize: 13, color: Colors.gray400, marginBottom: 12 },
  roleBadge: {
    backgroundColor: Colors.purpleLight, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.purple },
  section: {
    backgroundColor: Colors.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.gray400, textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.purpleLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  menuIconDanger: { backgroundColor: '#fee2e2' },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.navy, fontWeight: '500' },
  menuLabelDanger: { color: Colors.error },
  badge: {
    backgroundColor: Colors.orange, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  version: { textAlign: 'center', fontSize: 12, color: Colors.gray400, marginTop: 8 },
});
