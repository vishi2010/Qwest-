import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../theme';
import { FadeScreen, PrimaryButton, BackButton, DiffBadge, Divider } from '../components';
import { apiUpload, apiGet } from '../api';

export default function QuestDetailScreen({ navigate, token, user, quest, setToast }) {
  const [imageUri, setImageUri]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [updatedUser, setUpdatedUser] = useState(user);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo access in Settings to submit proof.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow camera access in Settings.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  }

  async function handleSubmit() {
    if (!imageUri) {
      setToast('Attach a photo first');
      return;
    }
    setLoading(true);
    try {
      const res = await apiUpload(`/submissions/${quest.id}`, imageUri, token);
      setResult(res);
      if (res.verified) {
        const u = await apiGet('/auth/me', token);
        setUpdatedUser(u);
        setToast(`VERIFIED  +${res.points_awarded} XP`);
      } else {
        setToast('Not verified — try a clearer photo');
      }
    } catch (e) {
      setToast(e.message);
    }
    setLoading(false);
  }

  const diff = quest.difficulty;
  const diffCol = {
    easy:      colors.diffEasy,
    medium:    colors.diffMedium,
    hard:      colors.diffHard,
    legendary: colors.diffLegendary,
  }[diff] || colors.diffEasy;

  return (
    <FadeScreen style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header bar */}
        <View style={styles.topBar}>
          <BackButton onPress={() => navigate('quests', { token, user: updatedUser })} />
          <View style={styles.topBarRight}>
            <DiffBadge difficulty={diff} />
            <Text style={[styles.xpTag, { color: diffCol }]}>+{quest.points} XP</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quest title */}
          <Text style={styles.questTitle}>{quest.title}</Text>

          {/* Objective */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OBJECTIVE</Text>
            <Text style={styles.sectionBody}>{quest.description}</Text>
          </View>

          {/* Verification hint */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PROOF REQUIRED</Text>
            <View style={styles.proofBox}>
              <Text style={styles.proofText}>{quest.vision_prompt}</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: spacing.xl }} />

          {/* Upload section */}
          <Text style={styles.sectionLabel}>ATTACH PROOF</Text>

          {imageUri ? (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>CHANGE</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadRow}>
              <TouchableOpacity onPress={takePhoto} style={styles.uploadBtn} activeOpacity={0.7}>
                <Text style={styles.uploadIcon}>[]</Text>
                <Text style={styles.uploadBtnLabel}>CAMERA</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImage} style={styles.uploadBtn} activeOpacity={0.7}>
                <Text style={styles.uploadIcon}>/\/</Text>
                <Text style={styles.uploadBtnLabel}>GALLERY</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Result */}
          {result && (
            <View style={[styles.resultBox, {
              borderColor: result.verified ? 'rgba(255,255,255,0.2)' : 'rgba(255,59,48,0.3)',
              backgroundColor: result.verified ? 'rgba(255,255,255,0.04)' : 'rgba(255,59,48,0.05)',
            }]}>
              <Text style={[styles.resultStatus, { color: result.verified ? colors.text : colors.error }]}>
                {result.verified ? `VERIFIED  +${result.points_awarded} XP` : 'NOT VERIFIED'}
              </Text>
              {result.vision_response ? (
                <Text style={styles.resultBody}>{result.vision_response}</Text>
              ) : null}
            </View>
          )}

          {/* Submit */}
          <PrimaryButton
            label={loading ? 'VERIFYING...' : 'SUBMIT PROOF'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!imageUri}
            style={{ marginTop: spacing.xl }}
          />

          {result?.verified && (
            <TouchableOpacity
              style={styles.backToQuestsBtn}
              onPress={() => navigate('quests', { token, user: updatedUser })}
              activeOpacity={0.6}
            >
              <Text style={styles.backToQuestsBtnText}>BACK TO QUESTS</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  xpTag: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.xxl,
  },
  questTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  sectionBody: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    lineHeight: 22,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  proofBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  proofText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    lineHeight: 20,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  uploadBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadIcon: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  uploadBtnLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.textMuted,
    fontWeight: '700',
  },
  imagePreview: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    aspectRatio: 4 / 3,
    marginTop: spacing.sm,
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.sm,
    alignItems: 'center',
  },
  imageOverlayText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  resultBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  resultStatus: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  resultBody: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    lineHeight: 18,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  backToQuestsBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  backToQuestsBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
