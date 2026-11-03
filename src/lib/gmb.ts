import { apiFetch } from './api';

export const GOOGLE_CLIENT_ID = '91010309450-5ohei09bcft5tgnhp9e3e0q641djftnf.apps.googleusercontent.com';

export interface GmbStatus {
  isConnected: boolean;
  isExpired?: boolean;
  expiresAt?: number | null;
  accountName?: string | null;
  locationName?: string | null;
  connectedEmail?: string | null;
  lastSyncedAt?: number | null;
  connectedAt?: number | null;
}

/**
 * Reusable helper to request fresh Google OAuth Access Token via Google Identity Services
 */
export function requestFreshGoogleToken(promptMode: '' | 'consent' = 'consent'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services script is loading. Please retry in 2 seconds.'));
    }
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/business.manage openid email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Google OAuth error:', tokenResponse);
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          if (tokenResponse.access_token) {
            const scopes = tokenResponse.scope || '';
            if (scopes && !scopes.includes('business.manage')) {
              alert(
                '⚠️ Google Business Permission Required:\n\nDuring Google sign-in, you MUST check the box:\n☑ "See, edit, create, and delete your Google business listings"\n\nWithout this permission, Google blocks ReviewQR from reading your Google Reviews.'
              );
              return reject(new Error('business.manage permission not granted'));
            }
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('No access_token returned by Google'));
          }
        }
      });
      tokenClient.requestAccessToken({ prompt: promptMode });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Fetch current GMB connection status for a business
 */
export async function fetchGmbStatus(businessId: string): Promise<GmbStatus> {
  try {
    const res = await apiFetch<GmbStatus>(`/api/gmb/status?businessId=${encodeURIComponent(businessId)}`);
    return res || { isConnected: false };
  } catch (err) {
    console.warn('Could not load GMB status:', err);
    return { isConnected: false };
  }
}

/**
 * Connect Google Business Profile via OAuth access token
 */
export async function connectGmb(businessId: string, accessToken: string): Promise<any> {
  const res = await apiFetch('/api/gmb/connect', {
    method: 'POST',
    body: JSON.stringify({ businessId, accessToken })
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmb-status-changed', { detail: { businessId } }));
  }
  return res;
}

/**
 * Disconnect Google Business Profile
 */
export async function disconnectGmb(businessId: string): Promise<any> {
  const res = await apiFetch('/api/gmb/disconnect', {
    method: 'POST',
    body: JSON.stringify({ businessId })
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gmb-status-changed', { detail: { businessId } }));
  }
  return res;
}

/**
 * Sync both live Google Places verified ratings and GMB customer reviews with automatic token refresh.
 */
export async function syncGmbAll(
  businessId: string,
  opts?: { directToken?: string; isConnected?: boolean; isExpired?: boolean }
): Promise<{ success: boolean; reviewsCount?: number; rating?: number; message?: string }> {
  // 1. Sync live Google Places API verified rating & review count
  let placesStats: any = null;
  try {
    const placesRes = await apiFetch<{ success: boolean; data?: { stats?: any; reviews?: any[] } }>(
      '/api/gmb/places-sync',
      {
        method: 'POST',
        body: JSON.stringify({ businessId })
      }
    );
    if (placesRes?.data?.stats) {
      placesStats = placesRes.data.stats;
    }
  } catch (err) {
    console.warn('Places sync warn:', err);
  }

  // 2. Sync GMB OAuth reviews if connected or directToken passed
  let isConnected = opts?.isConnected;
  let isExpired = opts?.isExpired;
  if (isConnected === undefined) {
    const st = await fetchGmbStatus(businessId);
    isConnected = st.isConnected;
    isExpired = st.isExpired;
  }

  let syncedReviewsCount = 0;
  if (isConnected || opts?.directToken) {
    let activeToken = opts?.directToken;
    if (!activeToken && isExpired) {
      try {
        activeToken = await requestFreshGoogleToken('consent');
        if (activeToken) {
          await connectGmb(businessId, activeToken);
        }
      } catch (tokErr) {
        console.warn('Proactive token refresh warning:', tokErr);
      }
    }

    let syncRes: any = null;
    try {
      syncRes = await apiFetch<{ reviews?: any[]; syncedCount?: number }>(
        '/api/gmb/sync-reviews',
        {
          method: 'POST',
          body: JSON.stringify({
            businessId,
            accessToken: activeToken || undefined
          })
        }
      );
    } catch (syncErr: any) {
      if (
        syncErr?.status === 401 ||
        syncErr?.message?.includes('expired') ||
        syncErr?.message?.includes('authorization') ||
        syncErr?.message?.includes('OAuth')
      ) {
        console.log('Token expired during sync, refreshing token automatically...');
        const freshToken = await requestFreshGoogleToken('consent');
        if (freshToken) {
          await connectGmb(businessId, freshToken);
          syncRes = await apiFetch<{ reviews?: any[]; syncedCount?: number }>(
            '/api/gmb/sync-reviews',
            {
              method: 'POST',
              body: JSON.stringify({
                businessId,
                accessToken: freshToken
              })
            }
          );
        }
      } else {
        throw syncErr;
      }
    }

    if (syncRes?.reviews) {
      syncedReviewsCount = syncRes.reviews.length;
    }
  }

  // Trigger global custom events so any visible page can reload its reviews/places immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reviews-synced', {
        detail: { businessId, syncedReviewsCount, placesStats }
      })
    );
    window.dispatchEvent(new CustomEvent('gmb-status-changed', { detail: { businessId } }));
  }

  return {
    success: true,
    reviewsCount: syncedReviewsCount,
    rating: placesStats?.rating
  };
}
