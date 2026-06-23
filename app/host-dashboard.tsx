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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { apiGet, apiPatch } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface HostBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  space?: { title?: string } | null;
  guest?: { full_name?: string } | null;
}

const pillColor = (status: string) =>
  status === 'approved' ? Colors.purple
  : status === 'completed' ? Colors.success
  : status === 'declined' || status === 'cancelled' ? Colors.error
  : Colors.gray400;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HostDashboard() {
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ bookings: HostBooking[] }>('/api/bookings?role=host');
      setBookings(res.bookings || []);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pending = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings.filter((b) => b.status === 'approved');
  const completed = bookings.filter((b) => b.status === 'completed');
  const completedGross = completed.reduce((s, b) => s + Number(b.total_amount || 0), 0);

  async function act(id: string, status: 'approved' | 'declined') {
    setActingId(id);
    try {
      await apiPatch(`/api/bookings/${id}`, { status });
      await load();
    } catch (e) {
      Alert.alert(
        status === 'approved' ? 'Approve failed' : 'Decline failed',
        e instanceof Error ? e.message : 'Please try again.'
      );
    } finally {
      setActingId(null);
    }
  }

  function confirmApprove(b: HostBooking) {
    Alert.alert(
      'Approve booking?',
      `This charges ${b.guest?.full_name || 'the guest'}'s held card (AED ${Number(b.total_amount || 0).toFixed(2)}) and confirms the booking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => act(b.id, 'approved') },
      ]
    );
  }

  function confirmDecline(b: HostBooking) {
    Alert.alert(
      'Decline booking?',
      "The guest's held payment is released — they are not charged.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => act(b.id, 'declined') },
      ]
    );
  }

  const renderItem = ({ item }: { item: HostBooking }) => {
    const d = item.date ? new Date(`${item.date}T00:00:00`) : null;
    const busy = actingId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.studio} numberOfLines={1}>{item.space?.title || 'Studio'}</Text>
          <Text style={styles.amount}>AED {Number(item.total_amount || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={Colors.gray400} />
          <Text style={styles.meta}>{item.guest?.full_name || 'Creator'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.gray400} />
          <Text style={styles.meta}>
            {d ? d.toLocaleDateString('en-AE', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
            {'  ·  '}
            {String(item.start_time).slice(0, 5)}–{String(item.end_time).slice(0, 5)}
          </Text>
        </View>

        {item.status === 'pending' ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.declineBtn]}
              disabled={busy}
              onPress={() => confirmDecline(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => confirmApprove(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.approveText}>{busy ? '…' : 'Approve'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: pillColor(item.status) + '22' }]}>
            <Text style={[styles.statusPillText, { color: pillColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              <View style={styles.stats}>
                <Stat label="Pending" value={pending.length} />
                <Stat label="Upcoming" value={upcoming.length} />
                <Stat label="Completed" value={completed.length} />
              </View>
              <Text style={styles.earned}>
                Completed bookings value:{' '}
                <Text style={styles.earnedVal}>AED {completedGross.toLocaleString()}</Text>
                {'  '}(gross). Detailed payouts on sparkhour.ae.
              </Text>
              {pending.length > 0 && <Text style={styles.section}>Pending requests</Text>}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={52} color={Colors.gray200} />
              <Text style={styles.emptyText}>No bookings yet.</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.purple} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.navy },
  statLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray400 },
  earned: { fontSize: 12, color: Colors.gray600, marginBottom: 16 },
  earnedVal: { fontWeight: '800', color: Colors.purple },
  section: { fontSize: 14, fontWeight: '700', color: Colors.navy, marginBottom: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  studio: { fontSize: 15, fontWeight: '700', color: Colors.navy, flex: 1 },
  amount: { fontSize: 15, fontWeight: '800', color: Colors.purple },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: Colors.gray600 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  approveBtn: { backgroundColor: Colors.purple },
  approveText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  declineBtn: { borderWidth: 1.5, borderColor: Colors.error },
  declineText: { color: Colors.error, fontSize: 14, fontWeight: '700' },
  statusPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
  emptyText: { fontSize: 16, color: Colors.gray400, fontWeight: '600' },
});
