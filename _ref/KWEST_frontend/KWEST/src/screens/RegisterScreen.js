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

export default function RegisterScreen({ navigate }) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password || !city.trim()) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiPost('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password,
        region: city.trim(),
      });
      const loginData = await apiPost('/auth/login', {
        username: username.trim(),
        password,
      });
      await saveToken(loginData.access_token);
      const user = await apiGet('/auth/me', loginData.access_token);
      navigate('quests', { token: loginData.access_token, user, newUser: true });
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
          {/* Header */}
          <View style={styles.topRow}>
            <GhostButton label="BACK" onPress={() => navigate('signin', {})} style={styles.backBtn} />
            <View style={styles.logoMini}>
              <Text style={styles.logoMiniText}>K</Text>
            </View>
          </View>

          <Text style={styles.pageTitle}>JOIN{'\\n'}KWEST.</Text>
          <Text style={styles.pageSub}>Pick a city. Start your first quest.</Text>

          <Divider />

          <Text style={styles.sectionLabel}>YOUR PROFILE</Text>

          <Field
            label="USERNAME"
            value={username}
            onChangeText={setUsername}
            placeholder="unique handle"
          />
          <Field
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <Field
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="min 8 characters"
            secureTextEntry
          />

          <Divider style={{ marginVertical: spacing.lg }} />

          <Text style={styles.sectionLabel}>YOUR CITY</Text>
          <Text style={styles.cityNote}>
            Enter any city or neighbourhood. This is how you appear on local leaderboards.
          </Text>

          <Field
            label="CITY / AREA"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Toronto, Hamilton, NYC..."
            autoCapitalize="words"
          />

          <ErrorLine message={error} />

          <PrimaryButton
            label="DEPLOY"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
          <GhostButton
            label="ALREADY HAVE AN ACCOUNT"
            onPress={() => navigate('signin', {})}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  backBtn: {
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  logoMini: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  logoMiniText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  pageTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  pageSub: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 3.5,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  cityNote: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 18,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
});
