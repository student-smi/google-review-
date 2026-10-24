import { Hono } from 'hono';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { qrCodes, businesses, scanDailyStats, scans, mediaAssets, customerReviews } from '../db/schema';

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
    category?: string | null;
    address?: string | null;
    city?: string | null;
    googlePlaceId?: string | null;
    chipsJson?: string | null;
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
        category: businesses.category,
        address: businesses.address,
        city: businesses.city,
        googlePlaceId: businesses.googlePlaceId,
        chipsJson: businesses.chipsJson,
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
      const cleanCode = code.toLowerCase().trim();
      
      // Fetch businesses ordered by latest created
      const allBiz = await db
        .select()
        .from(businesses)
        .orderBy(desc(businesses.createdAt))
        .limit(20);

      // Match best business:
      // a) exact or prefix match on slug
      // b) base slug match (e.g., 'upmark' from 'upmark-o9qi')
      // c) name match
      // d) fallback to latest created business
      const matched = allBiz.find((b) => {
        const slug = (b.slug || '').toLowerCase();
        const baseSlug = slug.split('-')[0];
        const bizNameClean = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const codeClean = cleanCode.replace(/[^a-z0-9]/g, '');

        return (
          cleanCode === slug ||
          cleanCode.startsWith(slug) ||
          slug.startsWith(cleanCode) ||
          (baseSlug && baseSlug.length >= 3 && cleanCode.includes(baseSlug)) ||
          (bizNameClean && bizNameClean.length >= 3 && codeClean.includes(bizNameClean))
        );
      }) || allBiz[0];

      if (matched) {
        qrData = {
          id: `qr_${matched.id}`,
          code,
          label: 'Main Standee',
          businessId: matched.id,
          businessName: matched.name,
          category: matched.category,
          address: matched.address,
          city: matched.city,
          googlePlaceId: matched.googlePlaceId,
          chipsJson: matched.chipsJson,
          googleReviewUrl: matched.googleReviewUrl.startsWith('http')
            ? matched.googleReviewUrl
            : `https://${matched.googleReviewUrl}`,
          logoUrl: matched.logoUrl,
          brandColor: matched.brandColor,
          brandColorSecondary: matched.brandColorSecondary,
          styleJson: '{}'
        };
      } else {
        return c.json({ error: 'QR Code not found or inactive' }, 404);
      }
    } else {
      qrData = {
        ...results[0],
        googleReviewUrl: results[0].googleReviewUrl.startsWith('http')
          ? results[0].googleReviewUrl
          : `https://${results[0].googleReviewUrl}`
      };
    }

    // Cache in KV for subsequent scans (only writes on cache miss, never per request)
    if (c.env.KV && qrData) {
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

  // Fetch recommended media photos for the business
  let mediaList: any[] = [];
  try {
    const db = getDb(c.env.DB);
    mediaList = await db
      .select({
        id: mediaAssets.id,
        title: mediaAssets.title,
        url: mediaAssets.url,
        category: mediaAssets.category,
        mimeType: mediaAssets.mimeType
      })
      .from(mediaAssets)
      .where(and(eq(mediaAssets.businessId, qrData.businessId), eq(mediaAssets.isRecommended, 1)))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(6);
  } catch (err) {
    console.warn('Could not fetch media for business:', err);
  }

  // Fetch custom chips configured by shopkeeper
  let customChips: string[] = [];
  if (qrData.chipsJson) {
    try {
      const parsed = JSON.parse(qrData.chipsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customChips = parsed;
      }
    } catch {}
  }

  return c.json({
    success: true,
    data: {
      ...qrData,
      chips: customChips,
      media: mediaList
    }
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
      let [qr] = await db
        .select({ id: qrCodes.id, businessId: qrCodes.businessId })
        .from(qrCodes)
        .where(eq(qrCodes.code, code))
        .limit(1);

      let businessId = qr?.businessId;
      let qrId = qr?.id;

      if (!businessId) {
        const cleanCode = code.toLowerCase().trim();
        const [matchedBiz] = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(or(eq(businesses.id, code), eq(businesses.slug, cleanCode)))
          .limit(1);

        if (matchedBiz) {
          businessId = matchedBiz.id;
          qrId = `qr_${matchedBiz.id}`;
        }
      }

      if (!businessId) return;

      const dailyId = `stat_${qrId || businessId}_${today}`;
      if (eventType === 'help_me_write') {
        await db
          .insert(scanDailyStats)
          .values({
            id: dailyId,
            qrId: qrId || `qr_${businessId}`,
            businessId: businessId,
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
            qrId: qrId || `qr_${businessId}`,
            businessId: businessId,
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

        // Persist customer review into customer_reviews table
        if (body.reviewText && typeof body.reviewText === 'string' && body.reviewText.trim().length > 0) {
          const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await db.insert(customerReviews).values({
            id: reviewId,
            businessId: businessId,
            customerName: typeof body.customerName === 'string' && body.customerName.trim() ? body.customerName.trim() : 'Verified Customer',
            rating: typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5 ? body.rating : 5,
            reviewText: body.reviewText.trim(),
            chipsJson: Array.isArray(body.chips) ? JSON.stringify(body.chips) : (typeof body.chipsJson === 'string' ? body.chipsJson : null),
            language: typeof body.language === 'string' ? body.language : 'en',
            createdAt: now
          });
        }
      }
    } catch (err) {
      console.error('Funnel event / review tracking error:', err);
    }
  })();

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(eventTrackingPromise);
  } else {
    eventTrackingPromise.catch(() => {});
  }

  return c.json({ success: true });
});

// ====================================================================
// GOOGLE PLACES API (NEW) PROXY ENDPOINTS
// Powered by Google Cloud API Key (Server-side protected)
// ====================================================================

// 1. Google Places Autocomplete: Search business by name/location
publicRoutes.get('/places/search', async (c) => {
  const query = c.req.query('q');
  if (!query || query.trim().length < 2) {
    return c.json({ suggestions: [] });
  }

  const apiKey = (c.env as any).GOOGLE_PLACES_API_KEY || 'AIzaSyBDrPbnv1gHf0gaQVshWh4EywXpgHYQ_W8';

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify({
        input: query.trim(),
        includedRegionCodes: ['in']
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Places Autocomplete error:', err);
      return c.json({ error: 'Places search failed', details: err }, 502);
    }

    const data = await res.json() as any;
    const suggestions = (data.suggestions || [])
      .map((s: any) => ({
        placeId: s.placePrediction?.placeId || s.placePrediction?.place?.replace('places/', ''),
        name: s.placePrediction?.structuredFormat?.mainText?.text || s.placePrediction?.text?.text,
        address: s.placePrediction?.structuredFormat?.secondaryText?.text || s.placePrediction?.text?.text,
        fullText: s.placePrediction?.text?.text
      }))
      .filter((s: any) => s.placeId);

    return c.json({ suggestions });
  } catch (err: any) {
    console.error('Places API error:', err);
    return c.json({ error: 'Internal Places search error' }, 500);
  }
});

// 2. Google Places Details: Retrieve place rating, address, and review URL
publicRoutes.get('/places/details/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  if (!placeId) {
    return c.json({ error: 'Place ID is required' }, 400);
  }

  const apiKey = (c.env as any).GOOGLE_PLACES_API_KEY || 'AIzaSyBDrPbnv1gHf0gaQVshWh4EywXpgHYQ_W8';

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,googleMapsUri,rating,userRatingCount,primaryTypeDisplayName,types,editorialSummary`, {
      headers: {
        'X-Goog-Api-Key': apiKey
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Place Details error:', err);
      return c.json({ error: 'Place details lookup failed' }, 502);
    }

    const data = await res.json() as any;
    const name = data.displayName?.text || '';
    const address = data.formattedAddress || '';
    const rating = data.rating || null;
    const userRatingCount = data.userRatingCount || 0;
    const googleMapsUri = data.googleMapsUri || '';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const category = data.primaryTypeDisplayName?.text || data.types?.[0]?.replace(/_/g, ' ') || '';
    const summary = data.editorialSummary?.text || '';

    return c.json({
      placeId,
      name,
      address,
      rating,
      userRatingCount,
      googleMapsUri,
      googleReviewUrl,
      category,
      types: data.types || [],
      summary
    });
  } catch (err: any) {
    console.error('Place Details error:', err);
    return c.json({ error: 'Internal Place details error' }, 500);
  }
});

// ====================================================================
// GOOGLE OAUTH LOGIN & PROFILE VERIFICATION
// ====================================================================
publicRoutes.post('/auth/google', async (c) => {
  try {
    const body = await c.req.json() as any;
    const { credential } = body;
    if (!credential) {
      return c.json({ error: 'Google credential (ID token) is required' }, 400);
    }

    // Decode JWT payload (Google ID Token)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return c.json({ error: 'Invalid Google token format' }, 400);
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };

    return c.json({
      success: true,
      user,
      sessionToken: `gauth_${payload.sub}_${Date.now()}`
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});
