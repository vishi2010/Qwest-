import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from './theme';

// ─── Animated page wrapper ──────────────────────────────────
export function FadeScreen({ children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Primary button ─────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading, disabled, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[styles.primaryBtn, (disabled || loading) && styles.primaryBtnDisabled]}
      >
        {loading
          ? <ActivityIndicator color={colors.textInverse} size="small" />
          : <Text style={styles.primaryBtnLabel}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Ghost / outline button ──────────────────────────────────
export function GhostButton({ label, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.ghostBtn, style]} activeOpacity={0.6}>
      <Text style={styles.ghostBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Text input ──────────────────────────────────────────────
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        style={styles.input}
        selectionColor={colors.text}
      />
    </View>
  );
}

// ─── Error banner ────────────────────────────────────────────
export function ErrorLine({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorLine}>
      <Text style={styles.errorText}>! {message}</Text>
    </View>
  );
}

// ─── Section divider ─────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Difficulty badge (text only, luminance-coded) ──────────
export function DiffBadge({ difficulty }) {
  const cfg = {
    easy:      { label: 'EASY',      color: colors.diffEasy },
    medium:    { label: 'MEDIUM',    color: colors.diffMedium },
    hard:      { label: 'HARD',      color: colors.diffHard },
    legendary: { label: 'LEGENDARY', color: colors.diffLegendary },
  };
  const c = cfg[difficulty] || cfg.easy;
  return (
    <View style={[styles.badge, { borderColor: c.color }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── XP pill ─────────────────────────────────────────────────
export function XPPill({ points, difficulty }) {
  const xpColors = {
    easy: colors.diffEasy,
    medium: colors.diffMedium,
    hard: colors.diffHard,
    legendary: colors.diffLegendary,
  };
  const col = xpColors[difficulty] || colors.textSecondary;
  return (
    <Text style={[styles.xpPill, { color: col }]}>+{points} XP</Text>
  );
}

// ─── XP progress bar ─────────────────────────────────────────
export function XPBar({ points, max = 5000 }) {
  const pct = Math.min(points / max, 1);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={styles.xpBarTrack}>
      <Animated.View
        style={[
          styles.xpBarFill,
          { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

// ─── Toast notification ──────────────────────────────────────
export function Toast({ message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    return () => {
      opacity.setValue(0);
      translateY.setValue(-20);
    };
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Back button ─────────────────────────────────────────────
export function BackButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn} activeOpacity={0.6}>
      <Text style={styles.backBtnText}>BACK</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.text,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  primaryBtnDisabled: {
    opacity: 0.35,
  },
  primaryBtnLabel: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  ghostBtnLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldWrapper: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...fonts.label(10),
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderRadius: radius.sm,
    fontFamily: Platform.OS === 'ios' ? undefined : undefined,
  },
  errorLine: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  xpPill: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  xpBarTrack: {
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.text,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    zIndex: 999,
    alignItems: 'center',
  },
  toastText: {
    color: colors.textInverse,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
