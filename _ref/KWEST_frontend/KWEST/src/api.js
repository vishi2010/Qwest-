// ── Change this to your FastAPI server URL ──────────────────
export const API_BASE = 'http://localhost:8000';
// ────────────────────────────────────────────────────────────

export async function apiPost(path, body, token = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

export async function apiGet(path, token = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

export async function apiUpload(path, imageUri, token) {
  const formData = new FormData();
  const filename = imageUri.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type,
  });

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}

// Cached token helpers (AsyncStorage wrapper)
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveToken(token) {
  await AsyncStorage.setItem('sq_token', token);
}

export async function loadToken() {
  return AsyncStorage.getItem('sq_token');
}

export async function clearToken() {
  await AsyncStorage.removeItem('sq_token');
}
