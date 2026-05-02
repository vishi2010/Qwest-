import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function Label({ children }: { children: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return <Text style={[styles.label, { color: colors.icon }]}>{children}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon + '88'}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.tint}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.cardBorder ?? colors.icon + '33',
            backgroundColor: colors.card ?? '#161921',
          },
        ]}
      />
    </View>
  );
}

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy;

  const hero = useMemo(
    () => (
      <View style={{ marginTop: 16, marginBottom: 16 }}>
        <Text style={[styles.heroMuted, { color: colors.icon }]}>REAL PLACES.</Text>
        <Text style={[styles.heroMid, { color: colors.text }]}>REAL KWESTS.</Text>
        <Text style={[styles.heroBright, { color: colors.tint }]}>REAL XP.</Text>
      </View>
    ),
    [colors.icon, colors.text, colors.tint]
  );

  async function onLogin() {
    if (!canSubmit) return;
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { borderColor: colors.text }]}>
              <Text style={[styles.logoK, { color: colors.text }]}>K</Text>
            </View>
            <View>
              <Text style={[styles.logoName, { color: colors.text }]}>KWEST</Text>
              <Text style={[styles.logoTagline, { color: colors.icon }]}>YOUR WORLD IS THE GAME</Text>
            </View>
          </View>

          {hero}

          <View style={[styles.divider, { backgroundColor: colors.cardBorder ?? colors.icon + '22' }]} />

          <Text style={[styles.sectionLabel, { color: colors.icon }]}>SIGN IN</Text>

          <Field label="USERNAME" value={username} onChangeText={setUsername} placeholder="your handle" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          {error ? <Text style={[styles.error, { color: '#EF4444' }]}>! {error}</Text> : null}

          <Pressable
            onPress={onLogin}
            disabled={!canSubmit}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.tint },
              !canSubmit && { opacity: 0.45 },
            ]}>
            {busy ? (
              <ActivityIndicator color={scheme === 'dark' ? '#111' : '#fff'} />
            ) : (
              <Text style={[styles.primaryBtnLabel, { color: scheme === 'dark' ? '#111' : '#fff' }]}>ENTER</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/register')}
            style={[styles.ghostBtn, { borderColor: colors.cardBorder ?? colors.icon + '33' }]}>
            <Text style={[styles.ghostBtnLabel, { color: colors.text }]}>CREATE ACCOUNT</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: Platform.OS === 'ios' ? 78 : 58, paddingBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26 },
  logoBox: { width: 44, height: 44, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  logoK: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  logoName: { fontSize: 18, fontWeight: '900', letterSpacing: 5 },
  logoTagline: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginTop: 2,
  },
  heroMuted: { fontSize: 40, fontWeight: '900', letterSpacing: -1, lineHeight: 44 },
  heroMid: { fontSize: 40, fontWeight: '900', letterSpacing: -1, lineHeight: 44 },
  heroBright: { fontSize: 40, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
  divider: { height: 1, opacity: 0.7, marginTop: 6, marginBottom: 18 },
  sectionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 3.5,
    marginBottom: 18,
    fontWeight: '700',
  },
  label: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 2.2,
    marginBottom: 6,
    fontWeight: '700',
  },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  error: { marginTop: 4, marginBottom: 12, fontSize: 13, fontWeight: '700' },
  primaryBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 2.5 },
  ghostBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  ghostBtnLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8 },
});

