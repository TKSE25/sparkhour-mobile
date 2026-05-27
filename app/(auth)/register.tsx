import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/colors';
import { signUp } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) Alert.alert('Sign up failed', error.message);
    else
      Alert.alert('Check your email', 'We sent you a confirmation link.', [
        { text: 'OK' },
      ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.appName}>SparkHour</Text>
          <Text style={styles.tagline}>Join Dubai's creative community</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Create account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder="Ahmad Al Rashid"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min 8 characters"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <View style={styles.roleNote}>
            <Text style={styles.roleNoteText}>
              You'll sign up as a guest (creator). You can apply to list a studio from your profile.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navy },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoText: { fontSize: 32 },
  appName: { fontSize: 24, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 13, color: Colors.gray400, marginTop: 4 },
  form: { backgroundColor: Colors.white, borderRadius: 24, padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: Colors.navy, marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray600, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 16,
    color: Colors.navy, backgroundColor: Colors.offWhite,
  },
  roleNote: {
    backgroundColor: Colors.purpleLight,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  roleNoteText: { fontSize: 12, color: Colors.purple, lineHeight: 18 },
  btn: {
    backgroundColor: Colors.purple, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: Colors.gray600, fontSize: 14 },
  footerLink: { color: Colors.purple, fontWeight: '700', fontSize: 14 },
});
