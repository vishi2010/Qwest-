import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius, getTitle } from '../theme';
import { FadeScreen, BackButton, XPBar } from '../components';
import { apiGet } from '../api';

export default function LeaderboardScreen({ navigate, token, user, setToast }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [refreshing, setRefreshing]   = useState(false);

  async function load() {
    try {
      const lb = await apiGet('/leaderboard/global', token);
      setLeaderboard(lb);
    } catch (e) {
      setToast('Could not load leaderboard');
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const top3 = leaderboard.slice(0, 3);
  const rest  = leaderboard.slice(3);

  return (
    <FadeScreen style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.topBar}>
          <BackButton onPress={() => navigate('quests', { token, user })} />
          <Text style={styles.pageTitle}>LEADERBOARD</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
        >

          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <View style={styles.podium}>
              {/* #2 */}
              {top3[1] && (
                <PodiumSpot entry={top3[1]} rank={2} currentUser={user?.username} />
              )}
              {/* #1 — centre, taller */}
              {top3[0] && (
                <PodiumSpot entry={top3[0]} rank={1} currentUser={user?.username} tall />
              )}
              {/* #3 */}
              {top3[2] && (
                <PodiumSpot entry={top3[2]} rank={3} currentUser={user?.username} />
              )}
            </View>
          )}

          {/* Section label */}
          <View style={styles.listHeader}>
            <Text style={styles.listLabel}>RANK</Text>
            <Text style={[styles.listLabel, { flex: 1, marginLeft: spacing.md }]}>PLAYER</Text>
            <Text style={styles.listLabel}>XP</Text>
          </View>
          <View style={styles.listDivider} />

          {/* Rows 4+ */}
          {rest.map((entry, i) => (
            <LeaderRow
              key={entry.username}
              entry={entry}
              rank={i + 4}
              isMe={entry.username === user?.username}
            />
          ))}

          {/* Also show user's own rank if they're in top 3 */}
          {top3.some(e => e.username === user?.username) && (
            <View style={styles.youTop3}>
              <Text style={styles.youTop3Text}>You are in the top 3</Text>
            </View>
          )}

          {leaderboard.length === 0 && !refreshing && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>NO DATA YET</Text>
              <Text style={styles.emptyBody}>Complete quests to appear here</Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </FadeScreen>
  );
}

function PodiumSpot({ entry, rank, currentUser, tall }) {
  const isMe = entry.username === currentUser;
  return (
    <View style={[styles.podiumSpot, tall && styles.podiumSpotTall]}>
      <View style={[styles.podiumInitial, isMe && styles.podiumInitialMe, tall && { width: 48, height: 48 }]}>
        <Text style={[styles.podiumInitialText, tall && { fontSize: 22 }]}>
          {entry.username[0].toUpperCase()}
        </Text>
      </View>
      <Text style={styles.podiumRank}>{rank === 1 ? '#1' : rank === 2 ? '#2' : '#3'}</Text>
      <Text style={[styles.podiumName, isMe && { color: colors.text }]} numberOfLines={1}>
        {entry.username}
      </Text>
      <Text style={styles.podiumXP}>{entry.total_points.toLocaleString()}</Text>
    </View>
  );
}

function LeaderRow({ entry, rank, isMe }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={styles.rowRank}>#{rank}</Text>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[styles.rowName, isMe && { color: colors.text }]}>
          {entry.username}
          {isMe ? '  (YOU)' : ''}
        </Text>
        <Text style={styles.rowMeta}>{entry.region}  /  {entry.quests_completed} QUESTS</Text>
      </View>
      <View style={styles.rowXPBlock}>
        <Text style={styles.rowXP}>{entry.total_points.toLocaleString()}</Text>
        <Text style={styles.rowXPLabel}>XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    letterSpacing: 3.5,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  podiumSpot: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    minHeight: 130,
    justifyContent: 'flex-end',
  },
  podiumSpotTall: {
    minHeight: 160,
    borderColor: colors.diffHard,
  },
  podiumInitial: {
    width: 40,
    height: 40,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  podiumInitialMe: {
    borderColor: colors.text,
  },
  podiumInitialText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  podiumRank: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textMuted,
    fontWeight: '800',
    marginBottom: 2,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  podiumXP: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  listLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 2.5,
    color: colors.textMuted,
    fontWeight: '700',
  },
  listDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
  },
  rowMe: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 2,
    borderLeftColor: colors.text,
  },
  rowRank: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 36,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  rowMeta: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '600',
  },
  rowXPBlock: {
    alignItems: 'flex-end',
  },
  rowXP: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  rowXPLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 8,
    letterSpacing: 2,
    color: colors.textMuted,
    fontWeight: '700',
  },
  youTop3: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  youTop3Text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  emptyState: {
    paddingTop: spacing.xxl * 2,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    letterSpacing: 3,
    color: colors.textMuted,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    color: colors.border,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
