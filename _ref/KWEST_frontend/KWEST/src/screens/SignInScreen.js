import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { FadeScreen, Field, PrimaryButton, GhostButton, ErrorLine, Divider } from '../components';
import { apiPost, apiGet, saveToken } from '../api';

export default function SignInScreen({ navigate }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    if (!username.trim() || !password) {
      setError('Enter your credentials');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/auth/login', { username: username.trim(), password });
      await saveToken(data.access_token);
      const user = await apiGet('/auth/me', data.access_token);
      navigate('quests', { token: data.access_token, user });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <FadeScreen style={{ backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoK}>K</Text>
            </View>
            <View>
              <Text style={styles.logoName}>KWEST</Text>
              <Text style={styles.logoTagline}>YOUR WORLD IS THE GAME</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroLine1}>REAL PLACES.</Text>
            <Text style={styles.heroLine2}>REAL QUESTS.</Text>
            <Text style={styles.heroLine3}>REAL XP.</Text>
          </View>

          <Divider />

          <Text style={styles.sectionLabel}>SIGN IN</Text>

          <Field label="USERNAME" value={username} onChangeText={setUsername} placeholder="your handle" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <ErrorLine message={error} />

          <PrimaryButton label="ENTER" onPress={handleSignIn} loading={loading} style={{ marginTop: spacing.sm }} />
          <GhostButton label="CREATE ACCOUNT" onPress={() => navigate('register', {})} />
        </ScrollView>
      </KeyboardAvoidingView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl + spacing.md,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  logoK: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  logoName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 5,
  },
  logoTagline: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 7,
    letterSpacing: 1.5,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  hero: {
    marginBottom: spacing.sm,
  },
  heroLine1: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroLine2: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroLine3: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 50,
  },
  sectionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 3.5,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    fontWeight: '700',
  },
});
