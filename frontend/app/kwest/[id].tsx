import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/auth-context';
import { fetchMySubmissions, fetchQuest, submitQuestPhoto } from '@/lib/api';
import { difficultyPalette, formatDifficultyLabel } from '@/lib/difficulty';
import type { QuestOut, SubmissionOut } from '@/lib/types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ConfettiBurst } from '@/lib/confetti';

function difficultyEmoji(_: QuestOut['difficulty']): string {
  return '';
}

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const questId = Number(id);
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { token, refreshUser } = useAuth();

  const [quest, setQuest] = useState<QuestOut | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedMime, setPickedMime] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionOut | null>(null);
  const [confettiOn, setConfettiOn] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(questId)) return;
    try {
      const q = await fetchQuest(questId);
      setQuest(q);
    } catch (e) {
      Alert.alert('Quest unavailable', e instanceof Error ? e.message : 'Unknown error');
      router.back();
      return;
    }
    // Check if already completed
    if (token) {
      try {
        const subs = await fetchMySubmissions(token);
        const done = subs.some((s) => s.quest_id === questId && s.verified);
        setAlreadyCompleted(done);
      } catch {
        // best-effort
      }
    }
    setLoading(false);
  }, [questId, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function pick(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to submit proof.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedUri(asset.uri);
    setPickedMime(asset.mimeType ?? 'image/jpeg');
    setPickedName(asset.fileName ?? 'quest.jpg');
  }

  async function submit() {
    if (!token || !pickedUri || !quest) {
      Alert.alert('Missing proof', 'Choose or capture a photo first.');
      return;
    }
    // Client-side ETA: gives players feedback while we wait on upload + model.
    // Not exact, but feels better than a spinner.
    const initialEta = pickedMime?.toLowerCase().includes('heic') ? 18 : 12;
    setEtaSec(initialEta);
    const iv = setInterval(() => {
      setEtaSec((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    setBusy(true);
    try {
      const submission = await submitQuestPhoto(token, quest.id, pickedUri, pickedMime, pickedName);
      await refreshUser();
      setSubmissionResult(submission);
      setResultOpen(true);
      if (submission.verified) {
        setAlreadyCompleted(true);
        setConfettiOn(true);
        setTimeout(() => setConfettiOn(false), 1600);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg.includes('409') || msg.toLowerCase().includes('already completed')) {
        setAlreadyCompleted(true);
        Alert.alert("Already crushed! 💪", "You've already earned points for this quest. Time to find a new challenge!");
      } else {
        Alert.alert('Submit failed', msg);
      }
    } finally {
      setBusy(false);
      clearInterval(iv);
      setEtaSec(null);
    }
  }

  if (loading || !quest) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const pal = difficultyPalette(quest.difficulty, scheme);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <ConfettiBurst active={confettiOn} />

      {/* Difficulty banner */}
      <View style={[styles.diffBanner, { backgroundColor: pal.bg, borderColor: pal.border }]}>
        <Text style={[styles.diffText, { color: pal.fg }]}>
          {formatDifficultyLabel(quest.difficulty)}
        </Text>
        <Text style={[styles.diffPts, { color: pal.fg + 'BB' }]}>{quest.points} pts</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{quest.title}</Text>
      <Text style={[styles.body, { color: colors.icon }]}>{quest.description}</Text>

      {/* Verification prompt box */}
      <Text style={[styles.promptHeading, { color: colors.text }]}>📸 What to photograph</Text>
      <View style={[styles.promptBox, { backgroundColor: pal.bg, borderColor: pal.border }]}>
        <Text style={[styles.promptBody, { color: pal.fg }]}>
          {quest.vision_prompt?.trim() || 'No verification prompt on this quest.'}
        </Text>
      </View>

      {/* Already completed state */}
      {alreadyCompleted && (
        <View style={[styles.completedBanner, { backgroundColor: '#22C55E11', borderColor: '#22C55E44' }]}>
          <Text style={styles.completedBannerEmoji}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.completedBannerTitle, { color: '#22C55E' }]}>Kwest Complete!</Text>
            <Text style={[styles.completedBannerSub, { color: '#22C55E99' }]}>
              You already earned points for this one. Pick another kwest!
            </Text>
          </View>
        </View>
      )}

      {/* Photo picker — hide if already completed */}
      {!alreadyCompleted && (
        <>
          {pickedUri ? (
            <Image source={{ uri: pickedUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.card ?? '#161921', borderColor: colors.cardBorder ?? colors.icon + '33' }]}>
              <Text style={styles.photoPlaceholderEmoji}>📷</Text>
              <Text style={[styles.photoPlaceholderText, { color: colors.icon }]}>
                No photo selected yet
              </Text>
            </View>
          )}

          <View style={styles.photoActions}>
            <Pressable
              style={[styles.photoBtn, { borderColor: colors.tint, backgroundColor: colors.tint + '11' }]}
              onPress={() => pick(false)}
              disabled={busy}>
              <Text style={[styles.photoBtnText, { color: colors.tint }]}>🖼  Library</Text>
            </Pressable>
            <Pressable
              style={[styles.photoBtn, { borderColor: colors.tint, backgroundColor: colors.tint + '11' }]}
              onPress={() => pick(true)}
              disabled={busy}>
              <Text style={[styles.photoBtnText, { color: colors.tint }]}>📷  Camera</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.submitBtn,
              { backgroundColor: pickedUri ? pal.accent : colors.icon + '44' },
              busy && styles.disabled,
            ]}
            onPress={submit}
            disabled={busy || !pickedUri}>
            {busy ? (
              <View style={styles.submitBusy}>
                <ActivityIndicator color="#fff" />
                <View style={{ gap: 2 }}>
                  <Text style={styles.submitBusyText}>Processing your photo…</Text>
                  <Text style={styles.submitEtaText}>
                    ETA: {etaSec == null ? 'estimating…' : `${etaSec}s`}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>
                {pickedUri ? '🚀  Submit for Verification' : 'Select a photo first'}
              </Text>
            )}
          </Pressable>
        </>
      )}

      {/* Result modal */}
      <Modal visible={resultOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card ?? '#161921', borderColor: submissionResult?.verified ? '#22C55E55' : '#EF444455' }]}>
            <Text style={[styles.modalTitle, { color: submissionResult?.verified ? '#22C55E' : '#EF4444' }]}>
              {submissionResult?.verified ? '🎉 Verified!' : '❌ Not Verified'}
            </Text>
            {submissionResult ? (
              <>
                {submissionResult.verified ? (
                  <View style={[styles.ptsDisplay, { backgroundColor: colors.tint + '22', borderColor: colors.tint + '44' }]}>
                    <Text style={[styles.ptsDisplayNum, { color: colors.tint }]}>
                      +{submissionResult.points_awarded}
                    </Text>
                    <Text style={[styles.ptsDisplayLabel, { color: colors.tint + 'AA' }]}>POINTS EARNED</Text>
                  </View>
                ) : (
                  <Text style={[styles.rejectedHint, { color: colors.icon }]}>
                    Try again with a clearer photo that matches the prompt exactly.
                  </Text>
                )}
                <Text style={[styles.modalSectionLabel, { color: colors.icon }]}>AI VERDICT</Text>
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.modalBody, { color: colors.text }]}>
                    {submissionResult.vision_response?.trim() || 'No reasoning returned.'}
                  </Text>
                </ScrollView>
              </>
            ) : null}
            <Pressable
              style={[styles.modalBtn, { backgroundColor: submissionResult?.verified ? '#22C55E' : colors.tint }]}
              onPress={() => { setResultOpen(false); setSubmissionResult(null); router.back(); }}>
              <Text style={styles.modalBtnText}>
                {submissionResult?.verified ? 'Collect Reward →' : 'Back to Kwests'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },

  diffBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  diffText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  diffPts: { fontSize: 14, fontWeight: '700' },

  title: { fontSize: 24, fontWeight: '900', marginBottom: 10, lineHeight: 32 },
  body: { fontSize: 15, lineHeight: 24, marginBottom: 20 },

  promptHeading: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  promptBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  promptBody: { fontSize: 14, lineHeight: 22, fontWeight: '500' },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  completedBannerEmoji: { fontSize: 32 },
  completedBannerTitle: { fontSize: 17, fontWeight: '800' },
  completedBannerSub: { fontSize: 13, marginTop: 2 },

  photoPlaceholder: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
  },
  photoPlaceholderEmoji: { fontSize: 36 },
  photoPlaceholderText: { fontSize: 14 },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: '#00000022',
  },

  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  photoBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  photoBtnText: { fontWeight: '700', fontSize: 14 },

  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  submitBusy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitBusyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitEtaText: { color: '#ffffffcc', fontWeight: '700', fontSize: 12 },
  disabled: { opacity: 0.5 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 26, fontWeight: '900', marginBottom: 16 },
  ptsDisplay: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  ptsDisplayNum: { fontSize: 48, fontWeight: '900' },
  ptsDisplayLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  rejectedHint: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  modalSectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  modalScroll: { maxHeight: 200, marginBottom: 16 },
  modalBody: { fontSize: 14, lineHeight: 21 },
  modalBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
