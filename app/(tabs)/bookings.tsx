import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { apiGet, apiPatch } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface GuestBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  space?: { title?: string; cover_image?: string; area?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.orange,
  approved: Colors.success,
  completed: Colors.purple,
  cancelled: Colors.error,
  declined: Colors.error,
  expired: Colors.gray400,
  no_show: Colors.gray400,
};

// Build a Date from a booking's date (YYYY-MM-DD) + start_time (HH:MM[:SS]) in UAE.
function bookingStart(b: GuestBooking): number {
  if (!b.date) return 0;
  const hhmm = String(b.start_time || '00:00').slice(0, 5);
  return new Date(`${b.date}T${hhmm}:00+04:00`).getTime();
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<{ bookings: GuestBooking[] }>('/api/bookings?role=guest');
      setBookings(res.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    const isCancelled = b.status === 'cancelled' || b.status === 'declined' || b.status === 'expired';
    const isFuture = bookingStart(b) >= now && b.status !== 'completed';
    return activeTab === 'upcoming' ? isFuture && !isCancelled : !isFuture || isCancelled;
  });

  function handleCancel(b: GuestBooking) {
    Alert.alert(
      'Cancel booking?',
      'A refund is applied based on the studio\'s cancellation policy.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiPatch<{ refund?: { refund_amount?: number } }>(
                `/api/bookings/${b.id}`,
                { status: 'cancelled' }
              );
              const refund = res?.refund?.refund_amount ?? 0;
              Alert.alert(
                'Booking cancelled',
                refund > 0 ? `AED ${refund.toFixed(2)} will be refunded to your card.` : 'No refund is due per the cancellation policy.'
              );
              fetchBookings();
            } catch (e) {
              Alert.alert('Could not cancel', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ]
    );
  }

  const renderBooking = ({ item }: { item: GuestBooking }) => {
    const img = item.space?.cover_image || null;
    const statusColor = STATUS_COLORS[item.status] ?? Colors.gray400;
    const d = item.date ? new Date(`${item.date}T00:00:00`) : null;
    const canCancel = (item.status === 'pending' || item.status === 'approved') && bookingStart(item) >= now;

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
            <Text style={styles.spaceName} numberOfLines={1}>{item.space?.title ?? 'Studio'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status === 'approved' ? 'Confirmed' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
          {item.space?.area ? <Text style={styles.areaText}>{item.space.area}</Text> : null}
          <Text style={styles.dateText}>
            {d ? d.toLocaleDateString('en-AE', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
            {'  ·  '}
            {String(item.start_time).slice(0, 5)}–{String(item.end_time).slice(0, 5)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>AED {Number(item.total_amount || 0).toLocaleString()}</Text>
            {canCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
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
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.gray100, alignItems: 'center' },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  spaceName: { fontSize: 15, fontWeight: '700', color: Colors.navy, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  areaText: { fontSize: 12, color: Colors.gray400 },
  dateText: { fontSize: 13, color: Colors.gray600 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  cancelBtn: { borderWidth: 1, borderColor: Colors.error, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  cancelText: { fontSize: 12, color: Colors.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, color: Colors.gray400, fontWeight: '600' },
});
