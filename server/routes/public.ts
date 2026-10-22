import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { qrCodes, businesses, scanDailyStats, scans } from '../db/schema';

export interface Env {
  DB: any;
  KV: any;
  R2: any;
  AI: any;
  ASSETS?: any;
  ENVIRONMENT?: string;
  APP_URL?: string;
}

export const publicRoutes = new Hono<{ Bindings: Env }>();

// Resolve short-code with KV cache & async scan counter
publicRoutes.get('/r/:code', async (c) => {
  const code = c.req.param('code');
  if (!code) {
    return c.json({ error: 'Code is required' }, 400);
  }

  const kvKey = `qr:${code}`;
  let qrData: {
    id: string;
    code: string;
    label: string;
    businessId: string;
    businessName: string;
    googleReviewUrl: string;
    logoUrl?: string | null;
    brandColor: string;
    brandColorSecondary: string;
    styleJson: string;
  } | null = null;

  // 1. KV Cache Look-up (Free Tier friendly: 100k reads/day)
  try {
    if (c.env.KV) {
      const cached = await c.env.KV.get(kvKey, { type: 'json' });
      if (cached) {
        qrData = cached;
      }
    }
  } catch (err) {
    console.warn('KV read warning:', err);
  }

  // 2. D1 Database Fallback on Cache Miss
  if (!qrData) {
    const db = getDb(c.env.DB);
    const results = await db
      .select({
        id: qrCodes.id,
        code: qrCodes.code,
        label: qrCodes.label,
        businessId: qrCodes.businessId,
        businessName: businesses.name,
        googleReviewUrl: businesses.googleReviewUrl,
        logoUrl: businesses.logoUrl,
        brandColor: businesses.brandColor,
        brandColorSecondary: businesses.brandColorSecondary,
        styleJson: qrCodes.styleJson
      })
      .from(qrCodes)
      .innerJoin(businesses, eq(qrCodes.businessId, businesses.id))
      .where(and(eq(qrCodes.code, code), eq(qrCodes.isActive, 1)))
      .limit(1);

    if (!results.length) {
      return c.json({ error: 'QR Code not found or inactive' }, 404);
    }

    qrData = results[0];

    // Cache in KV for subsequent scans (only writes on cache miss, never per request)
    if (c.env.KV) {
      try {
        await c.env.KV.put(kvKey, JSON.stringify(qrData), { expirationTtl: 86400 * 7 });
      } catch (err) {
        console.warn('KV cache put failed:', err);
      }
    }
  }

  // 3. Count scan asynchronously via ctx.waitUntil (Non-blocking response)
  const userAgent = c.req.header('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const deviceClass = isMobile ? 'mobile' : /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'desktop';
  const referrer = c.req.header('referer') || '';
  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);

  const scanTrackingPromise = (async () => {
    try {
      const db = getDb(c.env.DB);

      // Upsert daily counter
      const dailyId = `stat_${qrData.id}_${today}`;
      await db
        .insert(scanDailyStats)
        .values({
          id: dailyId,
          qrId: qrData.id,
          businessId: qrData.businessId,
          day: today,
          scanCount: 1,
          helpMeWriteCount: 0,
          googleClickCount: 0,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: [scanDailyStats.qrId, scanDailyStats.day],
          set: {
            scanCount: sql`${scanDailyStats.scanCount} + 1`,
            updatedAt: now
          }
        });

      // Insert short-lived ephemeral scan
      const scanId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(scans).values({
        id: scanId,
        qrId: qrData.id,
        businessId: qrData.businessId,
        deviceClass,
        referrer: referrer.substring(0, 255),
        createdAt: now
      });
    } catch (err) {
      console.error('Async scan tracking error:', err);
    }
  })();

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(scanTrackingPromise);
  } else {
    // Local / test fallback
    scanTrackingPromise.catch(() => {});
  }

  return c.json({
    success: true,
    data: qrData
  });
});

// Endpoint to track funnel progression: "help_me_write" or "google_click"
publicRoutes.post('/r/:code/event', async (c) => {
  const code = c.req.param('code');
  const body = await c.req.json().catch(() => ({}));
  const eventType = body?.event as 'help_me_write' | 'google_click';

  if (!eventType || !['help_me_write', 'google_click'].includes(eventType)) {
    return c.json({ error: 'Valid event type is required' }, 400);
  }

  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);

  const eventTrackingPromise = (async () => {
    try {
      const db = getDb(c.env.DB);
      const [qr] = await db
        .select({ id: qrCodes.id, businessId: qrCodes.businessId })
        .from(qrCodes)
        .where(eq(qrCodes.code, code))
        .limit(1);

      if (!qr) return;

      const dailyId = `stat_${qr.id}_${today}`;
      if (eventType === 'help_me_write') {
        await db
          .insert(scanDailyStats)
          .values({
            id: dailyId,
            qrId: qr.id,
            businessId: qr.businessId,
            day: today,
            scanCount: 0,
            helpMeWriteCount: 1,
            googleClickCount: 0,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [scanDailyStats.qrId, scanDailyStats.day],
            set: {
              helpMeWriteCount: sql`${scanDailyStats.helpMeWriteCount} + 1`,
              updatedAt: now
            }
          });
      } else if (eventType === 'google_click') {
        await db
          .insert(scanDailyStats)
          .values({
            id: dailyId,
            qrId: qr.id,
            businessId: qr.businessId,
            day: today,
            scanCount: 0,
            helpMeWriteCount: 0,
            googleClickCount: 1,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [scanDailyStats.qrId, scanDailyStats.day],
            set: {
              googleClickCount: sql`${scanDailyStats.googleClickCount} + 1`,
              updatedAt: now
            }
          });
      }
    } catch (err) {
      console.error('Funnel event tracking error:', err);
    }
  })();

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(eventTrackingPromise);
  } else {
    eventTrackingPromise.catch(() => {});
  }

  return c.json({ success: true });
});
