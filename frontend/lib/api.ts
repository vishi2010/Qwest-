import type {
  AuthTokenResponse,
  DifficultyPointsOut,
  LeaderboardEntry,
  QuestDifficulty,
  QuestOut,
  SubmissionOut,
  UserOut,
} from '@/lib/types';

const API_BASE =
  // @ts-expect-error: Expo injects env via babel/metro config when present
  (process?.env?.EXPO_PUBLIC_API_BASE as string | undefined) ||
  'http://localhost:8000';

type FetchJsonOptions = {
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
};

async function fetchJson<T>(path: string, opts: FetchJsonOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data && 'detail' in data ? String((data as any).detail) : res.statusText;
    throw new Error(`${res.status} ${detail}`.trim());
  }
  return data as T;
}

export async function login(username: string, password: string): Promise<AuthTokenResponse> {
  return fetchJson<AuthTokenResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

export async function fetchMe(token: string): Promise<UserOut> {
  return fetchJson<UserOut>('/auth/me', { token });
}

export async function fetchQuests(): Promise<QuestOut[]> {
  return fetchJson<QuestOut[]>('/quests');
}

export async function fetchQuest(id: number): Promise<QuestOut> {
  return fetchJson<QuestOut>(`/quests/${id}`);
}

export async function generateQuest(token: string, difficulty: QuestDifficulty): Promise<QuestOut> {
  return fetchJson<QuestOut>('/quests/generate', { method: 'POST', token, body: { difficulty } });
}

export async function fetchMySubmissions(token: string): Promise<SubmissionOut[]> {
  return fetchJson<SubmissionOut[]>('/submissions/my', { token });
}

export async function fetchLeaderboard(params: { region?: string; limit?: number }): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams();
  if (params.region) q.set('region', params.region);
  if (params.limit != null) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return fetchJson<LeaderboardEntry[]>(`/leaderboard${suffix}`);
}

export async function fetchDifficultyPoints(): Promise<DifficultyPointsOut> {
  return fetchJson<DifficultyPointsOut>('/difficulty-points');
}

export async function submitQuestPhoto(
  token: string,
  questId: number,
  uri: string,
  mime: string | null,
  name: string | null
): Promise<SubmissionOut> {
  const form = new FormData();
  form.append('photo', {
    // React Native FormData file shape
    uri,
    type: mime ?? 'image/jpeg',
    name: name ?? 'kwest.jpg',
  } as any);

  const res = await fetch(`${API_BASE}/submissions/${questId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as any) : undefined;
  if (!res.ok) {
    const detail = data?.detail ? String(data.detail) : res.statusText;
    throw new Error(`${res.status} ${detail}`.trim());
  }
  return data as SubmissionOut;
}

