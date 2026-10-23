import type { BusinessItem } from '@/pages/dashboard/DashboardLayout';

const OWNER_ID_KEY = 'reviewqr_owner_id';
const SESSION_KEY = 'reviewqr_session';
const BUSINESSES_KEY = 'reviewqr_businesses';
const ACTIVE_BIZ_KEY = 'reviewqr_active_business_id';

export function getOwnerId(): string {
  if (typeof window === 'undefined') return 'server_owner';

  // If user signed in with Google, use user ID
  try {
    const userStr = localStorage.getItem('reviewqr_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.id) return u.id;
    }
  } catch {}

  // Check persistent owner id
  let ownerId = localStorage.getItem(OWNER_ID_KEY);
  if (!ownerId) {
    ownerId = `owner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(OWNER_ID_KEY, ownerId);
  }
  return ownerId;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Owner-Id': getOwnerId(),
    'X-Dev-Owner-Id': getOwnerId()
  };

  if (typeof window !== 'undefined') {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
  }

  return headers;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const res = await fetch(path, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errText = await res.text();
    let errJson: any;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = { error: errText || `HTTP ${res.status}` };
    }
    throw new Error(errJson.error || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getStoredBusinesses(): BusinessItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BUSINESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredBusinesses(list: BusinessItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(list));
  } catch {}
}

export function getActiveBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_BIZ_KEY);
}

export function saveActiveBusinessId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_BIZ_KEY, id);
}
