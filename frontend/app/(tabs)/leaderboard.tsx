import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/auth-context';
import { fetchDifficultyPoints, fetchLeaderboard } from '@/lib/api';
import {
  DIFFICULTY_ORDER,
  FALLBACK_DIFFICULTY_POINTS,
  formatDifficultyLabel,
  pointsForDifficulty,
} from '@/lib/difficulty';
import type { DifficultyPointsOut, LeaderboardEntry } from '@/lib/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function difficultyEmoji(): string {
  return '';
}

function rankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function rankColor(rank: number, tint: string): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return tint;
}

export default function LeaderboardScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tierPoints, setTierPoints] = useState<DifficultyPointsOut>(FALLBACK_DIFFICULTY_POINTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sameRegionOnly, setSameRegionOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const region =
      sameRegionOnly && user?.region?.trim() ? user.region.trim() : undefined;
    try {
      const data = await fetchLeaderboard({ region: region ?? undefined, limit: 50 });
      setEntries(data);
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : 'Could not load leaderboard');
    }
    try {
      const tiers = await fetchDifficultyPoints();
      setTierPoints(tiers);
    } catch {
      setTierPoints(FALLBACK_DIFFICULTY_POINTS);
    }
    setLoading(false);
    setRefreshing(false);
  }, [sameRegionOnly, user?.region]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && entries.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.tint} />
      }>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.card ?? '#161921',
            borderColor: colors.cardBorder ?? colors.icon + '22',
          },
        ]}>
        <Text style={[styles.heading, { color: colors.text }]}>🏆 Rankings</Text>
        <Text style={[styles.subheading, { color: colors.icon }]}>
          Compete globally, or toggle to your local region.
        </Text>
      </View>

      {/* Region filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.card ?? '#161921', borderColor: colors.cardBorder ?? colors.icon + '33' }]}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>Local region only</Text>
        <Switch
          value={sameRegionOnly}
          onValueChange={setSameRegionOnly}
          trackColor={{ false: '#374151', true: colors.tint + '66' }}
          thumbColor={sameRegionOnly ? colors.tint : '#9CA3AF'}
        />
      </View>
      {sameRegionOnly && user?.region ? (
        <Text style={[styles.regionHint, { color: colors.tint }]}>📍 {user.region}</Text>
      ) : null}

      {error ? <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text> : null}

      {/* Top 3 podium */}
      {topThree.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.icon }]}>HALL OF FAME</Text>
          {topThree.map((row) => (
            <View
              key={`top-${row.rank}-${row.username}`}
              style={[
                styles.podiumRow,
                {
                  backgroundColor: colors.card ?? '#161921',
                  borderColor: rankColor(row.rank, colors.tint) + '44',
                },
              ]}>
              <View style={[styles.medalContainer, { backgroundColor: rankColor(row.rank, colors.tint) + '22' }]}>
                <Text style={styles.medal}>{rankMedal(row.rank)}</Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={[styles.podiumName, { color: colors.text }]}>{row.username}</Text>
                <Text style={[styles.rowMeta, { color: colors.icon }]}>
                  {row.region ? `📍 ${row.region}  ` : ''}{row.quests_completed} quests
                </Text>
              </View>
              <View style={styles.pointsBlock}>
                <Text style={[styles.podiumPoints, { color: rankColor(row.rank, colors.tint) }]}>
                  {row.total_points}
                </Text>
                <Text style={[styles.ptsLabel, { color: colors.icon }]}>pts</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Rest of rankings */}
      {rest.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.icon, marginTop: 20 }]}>THE REST</Text>
          {rest.map((row) => (
            <View
              key={`${row.rank}-${row.username}`}
              style={[
                styles.row,
                {
                  backgroundColor: colors.card ?? '#161921',
                  borderColor: colors.cardBorder ?? colors.icon + '22',
                },
              ]}>
              <Text style={[styles.rank, { color: colors.icon }]}>{row.rank}</Text>
              <View style={styles.rowMain}>
                <Text style={[styles.rowName, { color: colors.text }]}>{row.username}</Text>
                <Text style={[styles.rowMeta, { color: colors.icon }]}>
                  {row.region ? `${row.region}  ·  ` : ''}{row.quests_completed} quests
                </Text>
              </View>
              <Text style={[styles.rowPoints, { color: colors.tint }]}>{row.total_points}</Text>
            </View>
          ))}
        </>
      )}

      {/* Points per tier */}
      <Text style={[styles.sectionLabel, { color: colors.icon, marginTop: 28 }]}>POINTS PER TIER</Text>
      <View style={styles.tierGrid}>
        {DIFFICULTY_ORDER.map((tier) => (
          <View
            key={tier}
            style={[
              styles.tierCard,
              { backgroundColor: colors.card ?? '#161921', borderColor: colors.cardBorder ?? colors.icon + '22' },
            ]}>
            <Text style={[styles.tierName, { color: colors.text }]}>{formatDifficultyLabel(tier)}</Text>
            <Text style={[styles.tierPts, { color: colors.tint }]}>
              {pointsForDifficulty(tier, tierPoints)}
            </Text>
            <Text style={[styles.tierPtsLabel, { color: colors.icon }]}>pts</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  heading: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  subheading: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterLabel: { fontSize: 15, fontWeight: '600' },
  regionHint: { fontSize: 13, fontWeight: '600', marginBottom: 14 },
  error: { marginBottom: 12, fontSize: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 12,
  },
  medalContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medal: { fontSize: 26 },
  podiumName: { fontSize: 17, fontWeight: '800' },
  podiumPoints: { fontSize: 22, fontWeight: '900' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rank: { width: 28, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  rowMain: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12 },
  rowPoints: { fontSize: 16, fontWeight: '800' },
  pointsBlock: { alignItems: 'flex-end' },
  ptsLabel: { fontSize: 11, fontWeight: '600' },

  tierGrid: { flexDirection: 'row', gap: 8 },
  tierCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  tierName: { fontSize: 12, fontWeight: '700' },
  tierPts: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  tierPtsLabel: { fontSize: 11 },
});
