import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useSpace } from '../../hooks/useStudios';
import { useStripe } from '@stripe/stripe-react-native';
import { apiPost } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { space, isLoading } = useSpace(id);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [hours, setHours] = useState('1');
  const [coupon, setCoupon] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!space) return null;

  const pricePerHour = space.price_per_hour ?? 0;
  const numHours = parseFloat(hours) || 0;
  const subtotal = pricePerHour * numHours;

  async function handleBook() {
    if (!date || !startHour) {
      Alert.alert('Missing info', 'Please select a date and start time.');
      return;
    }
    const hNum = parseInt(startHour);
    if (isNaN(hNum) || hNum < 0 || hNum > 23) {
      Alert.alert('Invalid time', 'Enter an hour between 0 and 23.');
      return;
    }
    if (numHours < 1) {
      Alert.alert('Invalid duration', 'Minimum booking is 1 hour.');
      return;
    }

    setIsSubmitting(true);

    // Build HH:MM window. The SERVER re-derives hours/price/VAT from these.
    const start = `${String(hNum).padStart(2, '0')}:00`;
    const end = `${String((hNum + Math.round(numHours)) % 24).padStart(2, '0')}:00`;

    try {
      // 1) Server creates the booking — pricing, VAT, commission base,
      //    availability + double-booking validation, and the sequential invoice
      //    are ALL derived server-side (same endpoint the website uses).
      const booking = await apiPost<{ id: string; total_amount: number; status: string }>(
        '/api/bookings',
        {
          space_id: id,
          date,
          start_time: start,
          end_time: end,
          guest_count: 1,
          special_requests: notes || undefined,
          coupon_code: coupon || undefined,
        }
      );

      // 2) Server creates the Stripe PaymentIntent: a HOLD for request-to-book
      //    (captured when the host approves) or an immediate charge for Instant
      //    Book. Returns the client secret.
      const { clientSecret } = await apiPost<{ clientSecret: string }>(
        '/api/payments/create-intent',
        { booking_id: booking.id }
      );

      // 3) Present Stripe PaymentSheet (cards + Apple Pay / Google Pay).
      const init = await initPaymentSheet({
        merchantDisplayName: 'SparkHour',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        googlePay: { merchantCountryCode: 'AE', testEnv: true, currencyCode: 'AED' },
        applePay: { merchantCountryCode: 'AE' },
        returnURL: 'sparkhour://stripe-redirect',
      });
      if (init.error) throw new Error(init.error.message);

      const { error: sheetErr } = await presentPaymentSheet();
      setIsSubmitting(false);
      if (sheetErr) {
        // Cancelled or failed — the booking stays pending/unpaid (the expire-holds
        // cron releases an unconfirmed hold). Only surface real failures.
        if (sheetErr.code !== 'Canceled') Alert.alert('Payment not completed', sheetErr.message);
        return;
      }

      // Success — the Stripe webhook finalizes (transaction + tax invoice email).
      const confirmed = booking.status === 'approved';
      Alert.alert(
        confirmed ? 'Booking confirmed! 🎉' : 'Payment secured! 🎉',
        confirmed
          ? 'Your studio is booked. See My Bookings for details.'
          : 'Your card is held — you are only charged when the host accepts. We will notify you.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (e) {
      setIsSubmitting(false);
      Alert.alert('Booking failed', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.studioName}>{space.name}</Text>
            {(space.area ?? space.location) && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={Colors.gray400} />
                <Text style={styles.location}>{space.area ?? space.location}</Text>
              </View>
            )}
            <Text style={styles.rate}>AED {pricePerHour.toLocaleString()} / hr</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Booking details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Start hour (0–23)</Text>
                <TextInput
                  style={styles.input}
                  value={startHour}
                  onChangeText={setStartHour}
                  keyboardType="number-pad"
                  placeholder="e.g. 14"
                  placeholderTextColor={Colors.gray400}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Duration (hrs)</Text>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor={Colors.gray400}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Coupon code (optional)</Text>
              <TextInput
                style={styles.input}
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
                placeholder="SPARK20"
                placeholderTextColor={Colors.gray400}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notes for host (optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Any special requirements?"
                placeholderTextColor={Colors.gray400}
              />
            </View>
          </View>

          {/* Price breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.priceTitle}>Price breakdown</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                AED {pricePerHour.toLocaleString()} × {numHours} hr{numHours !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceValue}>AED {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>AED {subtotal.toLocaleString()}</Text>
            </View>
            <Text style={styles.paymentNote}>
              Pay securely on the next step. For Request to Book, your card is only
              held until the host accepts. 5% VAT is added at checkout.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookBtn, isSubmitting && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>
              {isSubmitting ? 'Processing…' : 'Continue to Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  container: { padding: 16, gap: 16, paddingBottom: 24 },
  summaryCard: {
    backgroundColor: Colors.navy, borderRadius: 16, padding: 18, gap: 6,
  },
  studioName: { fontSize: 18, fontWeight: '800', color: Colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: Colors.gray400 },
  rate: { fontSize: 15, fontWeight: '700', color: Colors.orange, marginTop: 4 },
  form: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 4 },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  field: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray600, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.navy,
    backgroundColor: Colors.offWhite,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  priceCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10 },
  priceTitle: { fontSize: 14, fontWeight: '700', color: Colors.navy },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 14, color: Colors.gray600 },
  priceValue: { fontSize: 14, color: Colors.navy, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.gray100 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.navy },
  totalValue: { fontSize: 15, fontWeight: '800', color: Colors.purple },
  paymentNote: { fontSize: 11, color: Colors.gray400, marginTop: 4 },
  footer: { padding: 16, paddingBottom: 32, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.gray200 },
  bookBtn: { backgroundColor: Colors.purple, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  bookBtnDisabled: { opacity: 0.6 },
  bookBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
