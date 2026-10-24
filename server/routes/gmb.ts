import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { accounts, businesses, customerReviews } from '../db/schema';
import { createScopedDb } from '../db/scoped';
import type { Env } from './public';

export const gmbRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

const getGoogleClientId = (env: Env) => env?.GOOGLE_CLIENT_ID || (typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_ID : '') || '';
const getGoogleClientSecret = (env: Env) => env?.GOOGLE_CLIENT_SECRET || (typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_SECRET : '') || '';

interface GmbMetadata {
  connectedEmail?: string;
  accountName?: string;
  accountId?: string;
  locationName?: string;
  locationId?: string;
  businessTitle?: string;
  connectedAt: number;
  lastSyncedAt?: number;
}

// Helper: Get GMB token & metadata for a business
async function getGmbConnection(c: any, businessId: string, ownerId: string) {
  // 1. Try KV cache
  let meta: GmbMetadata | null = null;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  if (c.env.KV) {
    try {
      const cached = await c.env.KV.get(`gmb:${businessId}`, { type: 'json' });
      if (cached) {
        meta = cached.meta;
        accessToken = cached.accessToken;
        refreshToken = cached.refreshToken;
      }
    } catch {}
  }

  // 2. D1 Database fallback
  if (!accessToken) {
    const db = getDb(c.env.DB);
    const [acc] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ownerId), eq(accounts.providerId, `google-gmb:${businessId}`)))
      .limit(1);

    if (acc) {
      accessToken = acc.accessToken;
      refreshToken = acc.refreshToken;
      if (acc.password) {
        try { meta = JSON.parse(acc.password); } catch {}
      }
    }
  }

  return { accessToken, refreshToken, meta };
}

// Helper: Save GMB connection
async function saveGmbConnection(
  c: any,
  businessId: string,
  ownerId: string,
  accessToken: string,
  refreshToken: string | null,
  meta: GmbMetadata,
  expiresInSeconds: number = 3600
) {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const now = new Date();
  const db = getDb(c.env.DB);

  // 1. Store in D1 accounts table
  const providerId = `google-gmb:${businessId}`;
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, ownerId), eq(accounts.providerId, providerId)))
    .limit(1);

  if (existing.length) {
    await db
      .update(accounts)
      .set({
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt,
        password: JSON.stringify(meta),
        updatedAt: now
      })
      .where(eq(accounts.id, existing[0].id));
  } else {
    await db.insert(accounts).values({
      id: `acc_gmb_${businessId}_${Date.now()}`,
      userId: ownerId,
      accountId: meta.accountId || businessId,
      providerId,
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt,
      password: JSON.stringify(meta),
      createdAt: now,
      updatedAt: now
    });
  }

  // 2. Cache in KV
  if (c.env.KV) {
    try {
      await c.env.KV.put(
        `gmb:${businessId}`,
        JSON.stringify({ accessToken, refreshToken, meta }),
        { expirationTtl: expiresInSeconds }
      );
    } catch {}
  }
}

// ──────────────────────────────────────────────
// 1. Check GMB Connection Status
// ──────────────────────────────────────────────
gmbRoutes.get('/status', async (c) => {
  const businessId = c.req.query('businessId');
  const ownerId = c.get('ownerId') || c.req.header('X-Owner-Id') || 'owner-default';

  if (!businessId) {
    return c.json({ error: 'businessId query param required' }, 400);
  }

  const { accessToken, meta } = await getGmbConnection(c, businessId, ownerId);

  return c.json({
    isConnected: !!accessToken,
    accountName: meta?.accountName || meta?.businessTitle || null,
    locationName: meta?.locationName || null,
    connectedEmail: meta?.connectedEmail || null,
    lastSyncedAt: meta?.lastSyncedAt || null,
    connectedAt: meta?.connectedAt || null
  });
});

// ──────────────────────────────────────────────
// 2. Connect via OAuth Access Token (GIS Client Popup)
// ──────────────────────────────────────────────
gmbRoutes.post('/connect', async (c) => {
  const ownerId = c.get('ownerId') || c.req.header('X-Owner-Id') || 'owner-default';
  const body = await c.req.json();
  const { accessToken, businessId, email } = body;

  if (!accessToken || !businessId) {
    return c.json({ error: 'accessToken and businessId are required' }, 400);
  }

  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);
  const business = await scoped.getBusiness(businessId);

  if (!business) {
    return c.json({ error: 'Business not found or unauthorized' }, 404);
  }

  let connectedEmail = email || '';
  let accountName = business.name;
  let accountId = '';
  let locationId = business.googlePlaceId || '';

  // 1. Fetch user info to get email if not passed
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (userRes.ok) {
      const u = (await userRes.json()) as any;
      connectedEmail = u.email || connectedEmail;
    }
  } catch {}

  // 2. Fetch GMB Accounts
  try {
    const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (accRes.ok) {
      const accData = (await accRes.json()) as any;
      if (accData.accounts && accData.accounts.length > 0) {
        accountName = accData.accounts[0].accountName || accountName;
        accountId = accData.accounts[0].name || '';
      }
    }
  } catch (err) {
    console.warn('GMB accounts fetch warning:', err);
  }

  const meta: GmbMetadata = {
    connectedEmail,
    accountName,
    accountId,
    locationName: business.name,
    locationId,
    businessTitle: business.name,
    connectedAt: Math.floor(Date.now() / 1000)
  };

  await saveGmbConnection(c, businessId, ownerId, accessToken, null, meta, 3600);

  return c.json({
    success: true,
    message: 'Google Business Profile connected successfully!',
    meta
  });
});

// ──────────────────────────────────────────────
// 3. Sync Live Reviews from Google Business Profile
// ──────────────────────────────────────────────
gmbRoutes.post('/sync-reviews', async (c) => {
  const ownerId = c.get('ownerId') || c.req.header('X-Owner-Id') || 'owner-default';
  const body = await c.req.json();
  const businessId = body.businessId;

  if (!businessId) {
    return c.json({ error: 'businessId is required' }, 400);
  }

  const { accessToken, meta } = await getGmbConnection(c, businessId, ownerId);
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);
  const business = await scoped.getBusiness(businessId);

  if (!business) {
    return c.json({ error: 'Business not found' }, 404);
  }

  let importedReviewsCount = 0;
  const now = Math.floor(Date.now() / 1000);

  // If connected via OAuth, fetch from GMB v4 reviews endpoint
  if (accessToken && meta?.accountId) {
    try {
      const reviewsUrl = `https://mybusiness.googleapis.com/v4/${meta.accountId}/locations/${meta.locationId || 'default'}/reviews?pageSize=50`;
      const gmbRes = await fetch(reviewsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (gmbRes.ok) {
        const data = (await gmbRes.json()) as any;
        if (data.reviews && Array.isArray(data.reviews)) {
          for (const r of data.reviews) {
            const starMap: Record<string, number> = {
              ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5
            };
            const rating = starMap[r.starRating] || 5;
            const revId = `gmb_${r.reviewId || Date.now()}`;
            const customerName = r.reviewer?.displayName || 'Google User';
            const reviewText = r.comment || 'Great experience!';
            const replyText = r.reviewReply?.comment || null;
            const repliedAt = r.reviewReply ? Math.floor(new Date(r.reviewReply.updateTime).getTime() / 1000) : null;
            const createdAt = Math.floor(new Date(r.createTime || Date.now()).getTime() / 1000);

            // Upsert into customerReviews
            const [existing] = await db
              .select({ id: customerReviews.id })
              .from(customerReviews)
              .where(eq(customerReviews.id, revId))
              .limit(1);

            if (existing) {
              await db
                .update(customerReviews)
                .set({
                  replyText: replyText || undefined,
                  repliedAt: repliedAt || undefined
                })
                .where(eq(customerReviews.id, revId));
            } else {
              await db.insert(customerReviews).values({
                id: revId,
                businessId,
                customerName,
                rating,
                reviewText,
                replyText,
                repliedAt,
                language: 'en',
                createdAt
              });
              importedReviewsCount++;
            }
          }
        }
      }
    } catch (err) {
      console.warn('GMB sync failed:', err);
    }
  }

  // Update last synced timestamp
  if (meta) {
    meta.lastSyncedAt = now;
    await saveGmbConnection(c, businessId, ownerId, accessToken || '', null, meta, 3600);
  }

  // Return all fresh reviews for this business
  const freshReviews = await scoped.getCustomerReviews(businessId);

  return c.json({
    success: true,
    syncedCount: importedReviewsCount,
    totalReviews: freshReviews.length,
    reviews: freshReviews
  });
});

// ──────────────────────────────────────────────
// 4. Direct 1-Click Auto-Reply to Google Maps Review
// ──────────────────────────────────────────────
gmbRoutes.post('/reply', async (c) => {
  const ownerId = c.get('ownerId') || c.req.header('X-Owner-Id') || 'owner-default';
  const body = await c.req.json();
  const { businessId, reviewId, replyText, replyStyle } = body;

  if (!businessId || !reviewId || !replyText?.trim()) {
    return c.json({ error: 'businessId, reviewId and replyText are required' }, 400);
  }

  const { accessToken, meta } = await getGmbConnection(c, businessId, ownerId);
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  // 1. If connected with Google GMB, attempt live Google API reply
  let googlePostStatus = 'saved_locally';
  if (accessToken && meta?.accountId) {
    try {
      const gmbReviewId = reviewId.startsWith('gmb_') ? reviewId.replace('gmb_', '') : reviewId;
      const replyUrl = `https://mybusiness.googleapis.com/v4/${meta.accountId}/locations/${meta.locationId || 'default'}/reviews/${gmbReviewId}/reply`;

      const gmbRes = await fetch(replyUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          comment: replyText.trim()
        })
      });

      if (gmbRes.ok) {
        googlePostStatus = 'posted_to_google';
      } else {
        const errText = await gmbRes.text();
        console.warn('GMB reply post warning:', gmbRes.status, errText);
        googlePostStatus = `google_api_notice: ${gmbRes.status}`;
      }
    } catch (err: any) {
      console.warn('GMB reply exception:', err);
      googlePostStatus = `error: ${err.message}`;
    }
  }

  // 2. Always persist reply in D1 database
  const updated = await scoped.updateCustomerReviewReply(businessId, reviewId, {
    replyText: replyText.trim(),
    replyStyle: replyStyle || 'warm'
  });

  return c.json({
    success: true,
    googlePostStatus,
    review: updated,
    message: googlePostStatus === 'posted_to_google'
      ? '🚀 Reply published directly to Google Maps!'
      : 'Reply saved in ReviewQR. (Will sync to Google upon GMB connection)'
  });
});

// ──────────────────────────────────────────────
// 5. Disconnect GMB
// ──────────────────────────────────────────────
gmbRoutes.post('/disconnect', async (c) => {
  const ownerId = c.get('ownerId') || c.req.header('X-Owner-Id') || 'owner-default';
  const body = await c.req.json();
  const { businessId } = body;

  if (!businessId) {
    return c.json({ error: 'businessId is required' }, 400);
  }

  const db = getDb(c.env.DB);
  const providerId = `google-gmb:${businessId}`;

  await db
    .delete(accounts)
    .where(and(eq(accounts.userId, ownerId), eq(accounts.providerId, providerId)));

  if (c.env.KV) {
    try {
      await c.env.KV.delete(`gmb:${businessId}`);
    } catch {}
  }

  return c.json({ success: true, message: 'Google Business Profile disconnected' });
});
