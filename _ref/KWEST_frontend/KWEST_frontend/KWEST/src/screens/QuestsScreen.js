import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, getTitle } from '../theme';
import { FadeScreen, DiffBadge, XPPill, XPBar } from '../components';
import { apiGet } from '../api';

export default function QuestsScreen({ navigate, token, user, onSignOut, toast, setToast }) {
  const [quests, setQuests]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const q = await apiGet('/quests/', token);
      setQuests(q);
    } catch (e) {
      setToast('Could not load quests');
    }
  }, [token]);

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const grouped = {
    legendary: quests.filter(q => q.difficulty === 'legendary'),
    hard:      quests.filter(q => q.difficulty === 'hard'),
    medium:    quests.filter(q => q.difficulty === 'medium'),
    easy:      quests.filter(q => q.difficulty === 'easy'),
  };

  const title = getTitle(user?.total_points || 0);
  const pts   = user?.total_points || 0;

  return (
    <FadeScreen style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>

        {/* Top nav */}
        <View style={styles.topNav}>
          <View>
            <Text style={styles.navBrand}>KWEST</Text>
            
          </View>
          <View style={styles.navRight}>
            <TouchableOpacity
              onPress={() => navigate('leaderboard', { token, user })}
              style={styles.navBtn}
              activeOpacity={0.6}
            >
              <Text style={styles.navBtnText}>BOARD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSignOut}
              style={[styles.navBtn, { marginLeft: spacing.sm }]}
              activeOpacity={0.6}
            >
              <Text style={styles.navBtnText}>EXIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Player card */}
        <View style={styles.playerCard}>
          <View style={styles.playerRow}>
            <View style={styles.playerInitial}>
              <Text style={styles.playerInitialText}>
                {(user?.username || 'A')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{user?.username}</Text>
              <Text style={styles.playerMeta}>{title}  /  {user?.region}</Text>
            </View>
            <View style={styles.xpBlock}>
              <Text style={styles.xpNumber}>{pts.toLocaleString()}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <XPBar points={pts} />
          </View>
        </View>

        {/* Divider + title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE QUESTS</Text>
          <Text style={styles.sectionCount}>{quests.length} AVAILABLE</Text>
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
          {quests.length === 0 && !refreshing && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>NO ACTIVE QUESTS</Text>
              <Text style={styles.emptyBody}>Pull to refresh or seed the database</Text>
            </View>
          )}

          {['legendary', 'hard', 'medium', 'easy'].map(diff => {
            const group = grouped[diff];
            if (!group.length) return null;
            return (
              <View key={diff} style={styles.diffGroup}>
                <DiffGroupHeader diff={diff} count={group.length} />
                {group.map((quest, i) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onPress={() => navigate('detail', { token, user, quest })}
                    last={i === group.length - 1}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </FadeScreen>
  );
}

function DiffGroupHeader({ diff, count }) {
  const label = { legendary: 'LEGENDARY', hard: 'HARD', medium: 'MEDIUM', easy: 'EASY' }[diff];
  const col   = {
    legendary: colors.diffLegendary,
    hard:      colors.diffHard,
    medium:    colors.diffMedium,
    easy:      colors.diffEasy,
  }[diff];
  return (
    <View style={styles.diffGroupHeader}>
      <View style={[styles.diffGroupBar, { backgroundColor: col }]} />
      <Text style={[styles.diffGroupLabel, { color: col }]}>{label}</Text>
      <Text style={styles.diffGroupCount}>{count}</Text>
    </View>
  );
}

function QuestCard({ quest, onPress, last }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.questCard, last && { marginBottom: 0 }]}
    >
      <View style={styles.questCardTop}>
        <Text style={styles.questTitle} numberOfLines={2}>{quest.title}</Text>
        <Text style={styles.questXP}>+{quest.points}</Text>
      </View>
      <Text style={styles.questDesc} numberOfLines={2}>{quest.description}</Text>
      <View style={styles.questCardFoot}>
        <Text style={styles.questFootText}>TAP TO ACCEPT</Text>
        <Text style={styles.questArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBrand: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  navSub: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 4,
    color: colors.textMuted,
    fontWeight: '700',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  navBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  playerCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerInitial: {
    width: 40,
    height: 40,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitialText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  playerMeta: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '700',
  },
  xpBlock: {
    alignItems: 'flex-end',
  },
  xpNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  xpLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.textMuted,
    fontWeight: '700',
  },
  sectionCount: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textMuted,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  diffGroup: {
    marginBottom: spacing.xl,
  },
  diffGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  diffGroupBar: {
    width: 2,
    height: 14,
    borderRadius: 1,
  },
  diffGroupLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '800',
    flex: 1,
  },
  diffGroupCount: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
    fontWeight: '700',
  },
  questCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  questCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  questTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  questXP: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 1,
  },
  questDesc: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 17,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  questCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderDim,
    paddingTop: spacing.sm,
  },
  questFootText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textMuted,
    fontWeight: '700',
  },
  questArrow: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  emptyState: {
    paddingTop: spacing.xxl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
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
