import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Booking } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.orange,
  confirmed: Colors.success,
  cancelled: Colors.error,
  completed: Colors.purple,
};

export default function BookingsScreen() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  async function fetchBookings() {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, space_id, start_time, end_time, total_price, status, payment_status, created_at,
        spaces(id, name, images, image_urls, area, category)
      `)
      .eq('guest_id', user.id)
      .order('start_time', { ascending: false });
    setBookings((data as unknown as Booking[]) ?? []);
    setIsLoading(false);
  }

  useEffect(() => { fetchBookings(); }, [user]);

  const now = new Date().toISOString();
  const filtered = bookings.filter((b) =>
    activeTab === 'upcoming'
      ? b.end_time > now && b.status !== 'cancelled'
      : b.end_time <= now || b.status === 'cancelled'
  );

  function getImage(b: Booking) {
    const imgs = b.spaces?.images ?? b.spaces?.image_urls ?? [];
    return imgs.length > 0 ? imgs[0] : null;
  }

  async function handleCancel(id: string) {
    Alert.alert('Cancel booking?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', id);
          fetchBookings();
        },
      },
    ]);
  }

  const renderBooking = ({ item }: { item: Booking }) => {
    const img = getImage(item);
    const statusColor = STATUS_COLORS[item.status] ?? Colors.gray400;
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    return (
      <View style={styles.card}>
        {img ? (
          <Image source={{ uri: img }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Ionicons name="camera-outline" size={28} color={Colors.gray400} />
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.spaceName}>{item.spaces?.name ?? 'Studio'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {start.toLocaleDateString('en-AE', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.timeText}>
            {start.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {end.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>AED {item.total_price?.toLocaleString()}</Text>
            {item.status === 'confirmed' && item.end_time > now && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <View style={styles.tabs}>
        {(['upcoming', 'past'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={56} color={Colors.gray200} />
          <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchBookings} tintColor={Colors.purple} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.navy },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.gray100, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.purple },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.gray600 },
  tabTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: '100%', height: 130, backgroundColor: Colors.gray100 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spaceName: { fontSize: 15, fontWeight: '700', color: Colors.navy, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 13, color: Colors.gray600 },
  timeText: { fontSize: 13, color: Colors.gray400 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  cancelBtn: {
    borderWidth: 1, borderColor: Colors.error, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  cancelText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, color: Colors.gray400, fontWeight: '600' },
});
