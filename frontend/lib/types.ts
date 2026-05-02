export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type QuestOut = {
  id: number;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  points: number;
  vision_prompt?: string | null;
  is_active?: boolean;
};

export type SubmissionOut = {
  id: number;
  user_id?: number;
  quest_id: number;
  verified: boolean;
  points_awarded: number;
  vision_response?: string | null;
  submitted_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  region?: string | null;
  quests_completed: number;
  total_points: number;
};

export type DifficultyPointsOut = Record<QuestDifficulty, number>;

export type AuthTokenResponse = {
  access_token: string;
  token_type?: string;
};

export type UserOut = {
  id?: number;
  username: string;
  email: string;
  region?: string | null;
  total_points: number;
};

