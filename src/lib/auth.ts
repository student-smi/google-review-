export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

const TOKEN_KEY = 'reviewqr_token';
const SESSION_KEY = 'reviewqr_session';
const USER_KEY = 'reviewqr_user';
const OWNER_ID_KEY = 'reviewqr_owner_id';
const BUSINESSES_KEY = 'reviewqr_businesses';
const ACTIVE_BIZ_KEY = 'reviewqr_active_business_id';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getCurrentUser();
  return Boolean(token && user?.id);
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(OWNER_ID_KEY, user.id);
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(OWNER_ID_KEY);
  localStorage.removeItem(BUSINESSES_KEY);
  localStorage.removeItem(ACTIVE_BIZ_KEY);
}

export async function signupApi(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = (await res.json()) as any;
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Registration failed. Please try again.');
  }

  setAuthSession(data.token, data.user);
  return data;
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = (await res.json()) as any;
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid email or password.');
  }

  setAuthSession(data.token, data.user);
  return data;
}

export async function logoutApi(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (err) {
    console.warn('Logout API failed:', err);
  } finally {
    clearAuthSession();
  }
}
