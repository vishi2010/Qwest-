import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/auth-context';
import { fetchMySubmissions } from '@/lib/api';
import type { SubmissionOut } from '@/lib/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function StatBox({
  label,
  value,
  emoji,
  accent,
  bg,
  border,
}: {
  label: string;
  value: string | number;
  emoji: string;
  accent: string;
  bg: string;
  border: string;
}) {
  return (
    <View style={[statStyles.box, { backgroundColor: bg, borderColor: border }]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={[statStyles.label, { color: accent + 'AA' }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  emoji: { fontSize: 22 },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
});

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { user, token, logout } = useAuth();
  const [subs, setSubs] = useState<SubmissionOut[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await fetchMySubmissions(token);
      setSubs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Not signed in</Text>
      </View>
    );
  }

  const verifiedCount = subs.filter((s) => s.verified).length;
  const totalSubmissions = subs.length;
  const successRate =
    totalSubmissions > 0 ? Math.round((verifiedCount / totalSubmissions) * 100) : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={colors.tint}
        />
      }>

      {/* Header */}
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: colors.card ?? '#161921',
            borderColor: colors.cardBorder ?? colors.icon + '22',
          },
        ]}>
        <View style={[styles.avatar, { backgroundColor: colors.tint + '22', borderColor: colors.tint + '55' }]}>
          <Text style={[styles.avatarText, { color: colors.tint }]}>
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
          <Text style={[styles.email, { color: colors.icon }]}>{user.email}</Text>
          {user.region ? (
            <Text style={[styles.region, { color: colors.icon }]}>📍 {user.region}</Text>
          ) : null}
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsRow}>
        <StatBox
          label="TOTAL PTS"
          value={user.total_points}
          emoji="🏅"
          accent={colors.tint}
          bg={(colors.card ?? '#161921')}
          border={(colors.tint + '33')}
        />
        <StatBox
          label="COMPLETED"
          value={verifiedCount}
          emoji="✅"
          accent="#22C55E"
          bg={(colors.card ?? '#161921')}
          border="#22C55E33"
        />
        <StatBox
          label="SUCCESS %"
          value={`${successRate}%`}
          emoji="🎯"
          accent="#60A5FA"
          bg={(colors.card ?? '#161921')}
          border="#60A5FA33"
        />
      </View>

      {/* Logout */}
      <Pressable
        style={[styles.logoutBtn, { borderColor: '#EF444455', backgroundColor: '#EF444411' }]}
        onPress={onLogout}>
        <Text style={[styles.logoutText, { color: '#EF4444' }]}>Sign out</Text>
      </Pressable>

      {/* Submission history */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>KWEST History</Text>
      {loading && subs.length === 0 ? (
        <ActivityIndicator color={colors.tint} style={{ marginTop: 16 }} />
      ) : null}
      {error ? <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text> : null}
      {!loading && subs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card ?? '#161921', borderColor: colors.cardBorder ?? colors.icon + '22' }]}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No submissions yet. Pick a quest and submit proof!
          </Text>
        </View>
      ) : (
        subs.map((s) => {
          const open = expandedId === s.id;
          const verified = s.verified;
          return (
            <Pressable
              key={s.id}
              onPress={() => setExpandedId(open ? null : s.id)}
              style={[
                styles.subRow,
                {
                  backgroundColor: colors.card ?? '#161921',
                  borderColor: verified
                    ? '#22C55E33'
                    : (colors.cardBorder ?? colors.icon + '22'),
                },
              ]}>
              {/* Left accent */}
              <View style={[styles.subAccent, { backgroundColor: verified ? '#22C55E' : '#EF4444' }]} />
              <View style={styles.subBody}>
                <View style={styles.subTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subTitle, { color: colors.text }]}>
                      Kwest #{s.quest_id}
                    </Text>
                    <Text style={[styles.subDate, { color: colors.icon }]}>
                      {new Date(s.submitted_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.subRight}>
                    <Text style={[styles.subStatus, { color: verified ? '#22C55E' : '#EF4444' }]}>
                      {verified ? '✅ Verified' : '❌ Rejected'}
                    </Text>
                    {verified ? (
                      <Text style={[styles.subPts, { color: colors.tint }]}>+{s.points_awarded} pts</Text>
                    ) : null}
                  </View>
                </View>
                {open && s.vision_response ? (
                  <View style={[styles.reasoningBox, { backgroundColor: colors.surface ?? colors.background, borderColor: colors.icon + '22' }]}>
                    <Text style={[styles.reasoningLabel, { color: colors.icon }]}>AI REASONING</Text>
                    <Text style={[styles.reasoningText, { color: colors.text }]}>
                      {s.vision_response}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.subHint, { color: colors.icon + '88' }]}>
                  {open ? '▲ Collapse' : '▼ See AI reasoning'}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },

  profileHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  profileInfo: { flex: 1, gap: 2 },
  username: { fontSize: 22, fontWeight: '900' },
  email: { fontSize: 13 },
  region: { fontSize: 13, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  logoutBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 28,
  },
  logoutText: { fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, letterSpacing: 0.3 },
  error: { fontSize: 14, marginBottom: 12 },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },

  subRow: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  subAccent: { width: 4 },
  subBody: { flex: 1, padding: 12, gap: 4 },
  subTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  subTitle: { fontSize: 15, fontWeight: '700' },
  subDate: { fontSize: 12, marginTop: 2 },
  subRight: { alignItems: 'flex-end', gap: 3 },
  subStatus: { fontSize: 13, fontWeight: '700' },
  subPts: { fontSize: 13, fontWeight: '800' },
  reasoningBox: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  reasoningLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  reasoningText: { fontSize: 13, lineHeight: 20 },
  subHint: { fontSize: 11, marginTop: 4 },
});
