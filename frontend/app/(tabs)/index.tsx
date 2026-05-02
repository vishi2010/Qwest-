import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/auth-context';
import { fetchDifficultyPoints, fetchMySubmissions, fetchQuests, generateQuest } from '@/lib/api';
import {
  DIFFICULTY_ORDER,
  FALLBACK_DIFFICULTY_POINTS,
  difficultyPalette,
  formatDifficultyLabel,
  pointsForDifficulty,
} from '@/lib/difficulty';
import type { DifficultyPointsOut, QuestDifficulty, QuestOut } from '@/lib/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function QuestsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { token } = useAuth();
  const [quests, setQuests] = useState<QuestOut[]>([]);
  const [pointsMap, setPointsMap] = useState<DifficultyPointsOut>(FALLBACK_DIFFICULTY_POINTS);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<QuestDifficulty>('easy');
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<QuestOut | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchQuests();
      setQuests(data);
    } catch (e) {
      setQuests([]);
      setError(e instanceof Error ? e.message : 'Could not load quests');
    }
    try {
      const tiers = await fetchDifficultyPoints();
      setPointsMap(tiers);
    } catch {
      setPointsMap(FALLBACK_DIFFICULTY_POINTS);
    }
    if (token) {
      try {
        const subs = await fetchMySubmissions(token);
        const verified = new Set(subs.filter((s) => s.verified).map((s) => s.quest_id));
        setCompletedIds(verified);
      } catch {
        // best-effort — not critical
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  async function onGenerate() {
    if (!token) {
      Alert.alert('Sign in required', 'Log in to generate quests.');
      return;
    }
    if (generating) return;
    setGenerating(true);
    try {
      const createQuest = async () => {
        try {
          return await generateQuest(token, selectedTier);
        } catch (firstErr) {
          const message =
            firstErr instanceof Error ? firstErr.message.toLowerCase() : String(firstErr).toLowerCase();
          const retryable =
            message.includes('network request failed') ||
            message.includes('timeout') ||
            message.startsWith('5');
          if (!retryable) throw firstErr;
          await new Promise((resolve) => setTimeout(resolve, 700));
          return generateQuest(token, selectedTier);
        }
      };
      const created = await createQuest();
      setGeneratedPreview(created);
      try {
        const data = await fetchQuests();
        setQuests(data);
      } catch {
        await load();
      }
    } catch (e) {
      Alert.alert('Generation failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  if (loading && quests.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading quests…</Text>
      </View>
    );
  }

  const completedCount = quests.filter((q) => completedIds.has(q.id)).length;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card ?? '#161921',
            borderColor: colors.cardBorder ?? colors.icon + '22',
          },
        ]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.icon }]}>THE ADVENTURE BOARD</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>⚔️ KWEST</Text>
        </View>
        {token && quests.length > 0 && (
          <View style={[styles.progressPill, { backgroundColor: colors.surface ?? colors.card }]}>
            <Text style={[styles.progressText, { color: colors.tint }]}>
              {completedCount}/{quests.length} done
            </Text>
          </View>
        )}
      </View>

      {/* Generate section */}
      <View
        style={[
          styles.generateCard,
          styles.elevatedCard,
          {
            backgroundColor: colors.card ?? '#161921',
            borderColor: colors.cardBorder ?? colors.icon + '33',
            shadowColor: scheme === 'dark' ? colors.tint : '#1F2937',
          },
        ]}>
        <Text style={[styles.sectionLabel, { color: colors.icon }]}>FORGE A NEW KWEST</Text>
        <View style={styles.tierRow}>
          {DIFFICULTY_ORDER.map((tier) => {
            const sel = tier === selectedTier;
            const pal = difficultyPalette(tier, scheme);
            const pts = pointsForDifficulty(tier, pointsMap);
            return (
              <Pressable
                key={tier}
                onPress={() => setSelectedTier(tier)}
                style={[
                  styles.tierChip,
                  {
                    backgroundColor: sel ? pal.bg : 'transparent',
                    borderColor: sel ? pal.accent : colors.cardBorder ?? colors.icon + '33',
                    borderWidth: sel ? 2 : 1,
                  },
                ]}>
                <Text style={[styles.tierLabel, { color: sel ? pal.fg : colors.text }]}>
                  {formatDifficultyLabel(tier)}
                </Text>
                <Text style={[styles.tierPts, { color: sel ? pal.fg + 'AA' : colors.icon }]}>
                  {pts != null ? `${pts}pts` : '—'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.generateBtn,
            { backgroundColor: colors.tint },
            generating && styles.disabled,
          ]}
          onPress={onGenerate}
          disabled={generating}>
          {generating ? (
            <ActivityIndicator color={scheme === 'dark' ? '#111' : '#fff'} />
          ) : (
            <Text style={[styles.generateBtnText, { color: scheme === 'dark' ? '#111' : '#fff' }]}>
              Generate {formatDifficultyLabel(selectedTier)} Kwest
            </Text>
          )}
        </Pressable>
      </View>

      {/* Kwest list */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Kwests</Text>
      {error ? (
        <Text style={[styles.error, { color: '#EF4444' }]}>{error}</Text>
      ) : null}

      {quests.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card ?? '#161921', borderColor: colors.cardBorder ?? colors.icon + '33' }]}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            No quests yet. Forge one above or run seed_quests on the server.
          </Text>
        </View>
      ) : (
        quests.map((q) => {
          const pal = difficultyPalette(q.difficulty, scheme);
          const completed = completedIds.has(q.id);
          return (
            <Pressable
              key={q.id}
              style={[
                styles.card,
                styles.elevatedCard,
                {
                  backgroundColor: colors.card ?? '#161921',
                  borderColor: completed ? '#22C55E33' : colors.cardBorder ?? colors.icon + '22',
                  opacity: completed ? 0.6 : 1,
                  shadowColor: scheme === 'dark' ? pal.accent : '#1F2937',
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/kwest/[id]',
                  params: { id: String(q.id) },
                })
              }>
              {/* Left accent bar */}
              <View style={[styles.cardAccent, { backgroundColor: completed ? '#22C55E' : pal.accent }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {q.title}
                  </Text>
                  {completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓ DONE</Text>
                    </View>
                  ) : (
                    <View style={[styles.diffBadge, { backgroundColor: pal.bg, borderColor: pal.border }]}>
                      <Text style={[styles.diffBadgeText, { color: pal.fg }]}>
                        {formatDifficultyLabel(q.difficulty)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.cardDesc, { color: colors.icon }]} numberOfLines={2}>
                  {q.description}
                </Text>

                <View style={styles.cardFooter}>
                  {completed ? (
                    <Text style={styles.completedPoints}>✅ Points earned</Text>
                  ) : (
                    <Text style={[styles.cardPoints, { color: colors.tint }]}>
                      🏅 {q.points} pts if verified
                    </Text>
                  )}
                  {!completed && (
                    <Text style={[styles.cardCta, { color: pal.accent }]}>Start →</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      {/* Generated quest preview modal */}
      <Modal visible={generatedPreview != null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card ?? '#161921', borderColor: colors.tint + '44' }]}>
            <Text style={[styles.modalTitle, { color: colors.tint }]}>✨ New Kwest Forged!</Text>
            {generatedPreview ? (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalLabel, { color: colors.icon }]}>KWEST</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{generatedPreview.title}</Text>
                <Text style={[styles.modalLabel, { color: colors.icon }]}>OBJECTIVE</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{generatedPreview.description}</Text>
                <Text style={[styles.modalLabel, { color: colors.icon }]}>PROOF REQUIRED</Text>
                <View style={[styles.modalPromptBox, { borderColor: colors.tint + '44', backgroundColor: colors.surface ?? colors.background }]}>
                  <Text style={[styles.modalPromptText, { color: colors.text }]}>
                    {generatedPreview.vision_prompt?.trim() || 'No verification prompt set.'}
                  </Text>
                </View>
                <Text style={[styles.modalMeta, { color: colors.icon }]}>
                  {formatDifficultyLabel(generatedPreview.difficulty)} · {generatedPreview.points} pts on completion
                </Text>
              </ScrollView>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalSecondary, { borderColor: colors.icon + '55' }]}
                onPress={() => setGeneratedPreview(null)}>
                <Text style={{ color: colors.icon, fontWeight: '600' }}>Dismiss</Text>
              </Pressable>
              {generatedPreview ? (
                <Pressable
                  style={[styles.modalPrimary, { backgroundColor: colors.tint }]}
                  onPress={() => {
                    const id = generatedPreview.id;
                    setGeneratedPreview(null);
                    router.push({ pathname: '/kwest/[id]', params: { id: String(id) } });
                  }}>
                  <Text style={{ color: scheme === 'dark' ? '#111' : '#fff', fontWeight: '700' }}>
                    Begin Kwest →
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.8 },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  progressText: { fontSize: 13, fontWeight: '700' },

  generateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  elevatedCard: {
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  tierChip: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  tierLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  tierPts: { fontSize: 11 },
  generateBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.55 },

  sectionTitle: { fontSize: 19, fontWeight: '900', marginBottom: 12, letterSpacing: 0.3 },
  error: { marginBottom: 12, fontSize: 14 },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 15, gap: 6 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffBadgeText: { fontSize: 11, fontWeight: '700' },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#22C55E22',
    borderWidth: 1,
    borderColor: '#22C55E55',
  },
  completedBadgeText: { fontSize: 11, fontWeight: '800', color: '#22C55E' },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPoints: { fontSize: 13, fontWeight: '700' },
  completedPoints: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
  cardCta: { fontSize: 13, fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 16, letterSpacing: 0.5 },
  modalScroll: { maxHeight: 380, marginBottom: 16 },
  modalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 12, marginBottom: 4 },
  modalValue: { fontSize: 16, lineHeight: 24 },
  modalPromptBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  modalPromptText: { fontSize: 14, lineHeight: 21 },
  modalMeta: { fontSize: 13, marginTop: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalPrimary: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
});
