import type { DifficultyPointsOut, QuestDifficulty } from '@/lib/types';

export const FALLBACK_DIFFICULTY_POINTS: DifficultyPointsOut = {
  easy: 50,
  medium: 150,
  hard: 300,
  legendary: 750,
};

export const DIFFICULTY_ORDER: QuestDifficulty[] = ['easy', 'medium', 'hard', 'legendary'];

export function formatDifficultyLabel(d: QuestDifficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// Backward-compatible no-op helper so older cached bundles
// that still reference difficultyEmoji do not crash at runtime.
export function difficultyEmoji(_: QuestDifficulty): string {
  return '';
}

export function difficultyPalette(
  d: QuestDifficulty,
  scheme: 'light' | 'dark' = 'light'
): { bg: string; fg: string; accent: string; border: string } {
  if (scheme === 'dark') {
    switch (d) {
      case 'easy':
        return { bg: '#0B2016', fg: '#22C55E', accent: '#22C55E', border: '#16532D' };
      case 'medium':
        return { bg: '#0B1530', fg: '#60A5FA', accent: '#60A5FA', border: '#1E3A6E' };
      case 'hard':
        return { bg: '#261000', fg: '#FB923C', accent: '#FB923C', border: '#7C2D12' };
      case 'legendary':
        return { bg: '#160B2A', fg: '#C084FC', accent: '#C084FC', border: '#6B21A8' };
      default:
        return { bg: '#1A1B24', fg: '#9CA3AF', accent: '#9CA3AF', border: '#374151' };
    }
  }
  switch (d) {
    case 'easy':
      return { bg: '#DCFCE7', fg: '#15803D', accent: '#16A34A', border: '#86EFAC' };
    case 'medium':
      return { bg: '#DBEAFE', fg: '#1D4ED8', accent: '#2563EB', border: '#93C5FD' };
    case 'hard':
      return { bg: '#FFEDD5', fg: '#C2410C', accent: '#EA580C', border: '#FDBA74' };
    case 'legendary':
      return { bg: '#F3E8FF', fg: '#7E22CE', accent: '#9333EA', border: '#D8B4FE' };
    default:
      return { bg: '#F1F5F9', fg: '#475569', accent: '#64748B', border: '#CBD5E1' };
  }
}

export function pointsForDifficulty(
  tier: QuestDifficulty,
  map: DifficultyPointsOut | null | undefined
): number | undefined {
  const m = map ?? FALLBACK_DIFFICULTY_POINTS;
  return m[tier];
}
