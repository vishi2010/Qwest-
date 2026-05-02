import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth-context';
import { login } from '@/lib/api';

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onRegister() {
    // If backend has /auth/register this should be swapped in; keep UI ready.
    setError('Register endpoint not wired yet. If your server supports /auth/register, tell me and I will connect it.');
  }

  async function onBackToLogin() {
    router.back();
  }

  async function onQuickLogin() {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      const tok = await login(username.trim(), password);
      // AuthProvider will normally own token; this is only a fallback.
      await refreshUser();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.sub, { color: colors.icon }]}>
            If your backend supports registration, I’ll wire it in. For now this screen is UI-only.
          </Text>

          <Text style={[styles.label, { color: colors.icon }]}>USERNAME</Text>
          <TextInput value={username} onChangeText={setUsername} placeholder="your handle" placeholderTextColor={colors.icon + '88'} style={[styles.input, { color: colors.text, borderColor: colors.cardBorder ?? colors.icon + '33', backgroundColor: colors.card ?? '#161921' }]} />

          <Text style={[styles.label, { color: colors.icon }]}>EMAIL</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.icon + '88'} style={[styles.input, { color: colors.text, borderColor: colors.cardBorder ?? colors.icon + '33', backgroundColor: colors.card ?? '#161921' }]} autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.icon }]}>PASSWORD</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.icon + '88'} style={[styles.input, { color: colors.text, borderColor: colors.cardBorder ?? colors.icon + '33', backgroundColor: colors.card ?? '#161921' }]} secureTextEntry autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.icon }]}>REGION (OPTIONAL)</Text>
          <TextInput value={region} onChangeText={setRegion} placeholder="Toronto" placeholderTextColor={colors.icon + '88'} style={[styles.input, { color: colors.text, borderColor: colors.cardBorder ?? colors.icon + '33', backgroundColor: colors.card ?? '#161921' }]} />

          {error ? <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text> : null}

          <Pressable onPress={onRegister} disabled style={[styles.primaryBtn, { backgroundColor: colors.icon + '55' }]}>
            <Text style={[styles.primaryBtnLabel, { color: '#fff' }]}>COMING SOON</Text>
          </Pressable>

          <Pressable onPress={onBackToLogin} style={[styles.ghostBtn, { borderColor: colors.cardBorder ?? colors.icon + '33' }]}>
            <Text style={[styles.ghostBtnLabel, { color: colors.text }]}>BACK TO SIGN IN</Text>
          </Pressable>

          <Pressable onPress={onQuickLogin} style={[styles.ghostBtn, { borderColor: colors.tint + '55' }]}>
            {busy ? (
              <ActivityIndicator color={colors.tint} />
            ) : (
              <Text style={[styles.ghostBtnLabel, { color: colors.tint }]}>TRY SIGN IN ANYWAY</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: Platform.OS === 'ios' ? 72 : 52, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 2.2, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  error: { marginTop: 4, marginBottom: 12, fontSize: 13, fontWeight: '700' },
  primaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2.0 },
  ghostBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  ghostBtnLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
});

