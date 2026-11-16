import { Hono } from 'hono';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { qrCodes, businesses, scanDailyStats, scans, mediaAssets, customerReviews, locations, users, sessions, enquiries } from '../db/schema';

export interface Env {
  DB: any;
  KV: any;
  R2: any;
  AI: any;
  ASSETS?: any;
  ENVIRONMENT?: string;
  APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_PLACES_API_KEY?: string;
}

export const publicRoutes = new Hono<{ Bindings: Env }>();

// Pure resolver for QR metadata (used by API endpoint and HTML pre-injection for zero-latency loading)
export async function resolveQrPayload(env: Env, rawCode: string, isPreview = false) {
  const code = (rawCode || '').trim().replace(/\/+$/, '');
  if (!code) return null;

  const cleanCode = code.toLowerCase().trim();
  const cleanParam = cleanCode.replace(/^qr_/, '');
  const kvKey = `qr:${cleanCode}`;

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

  // 1. KV Cache Look-up (Bypassed if preview/refresh requested)
  if (!isPreview) {
    try {
      if (env.KV) {
        const cached = await env.KV.get(kvKey, { type: 'json' });
        if (cached) {
          qrData = cached;
        }
      }
    } catch (err) {
      console.warn('KV read warning:', err);
    }
  }

  // 2. D1 Database Strict Priority Lookup on Cache Miss
  if (!qrData) {
    const db = getDb(env.DB);

    // Priority 1: Exact match on QR codes table
    try {
      const qrResults = await db
        .select({
          id: qrCodes.id,
          code: qrCodes.code,
          label: qrCodes.label,
          businessId: qrCodes.businessId,
          branchId: qrCodes.branchId,
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
        .where(
          and(
            or(
              eq(qrCodes.code, code),
              eq(qrCodes.code, cleanCode),
              eq(qrCodes.code, cleanParam)
            ),
            eq(qrCodes.isActive, 1)
          )
        )
        .limit(1);

      if (qrResults.length > 0) {
        const q = qrResults[0];
        let chipsJson = q.chipsJson;
        let reviewUrl = q.googleReviewUrl;
        let placeId = q.googlePlaceId;
        let address = q.address;
        let city = q.city;
        let name = q.businessName;

        if (q.branchId) {
          try {
            const [branchLoc] = await db
              .select()
              .from(locations)
              .where(eq(locations.id, q.branchId))
              .limit(1);
            if (branchLoc) {
              if (branchLoc.chipsJson) chipsJson = branchLoc.chipsJson;
              if (branchLoc.googleReviewUrl) reviewUrl = branchLoc.googleReviewUrl;
              if (branchLoc.googlePlaceId) placeId = branchLoc.googlePlaceId;
              if (branchLoc.address) address = branchLoc.address;
              if (branchLoc.city) city = branchLoc.city;
              if (branchLoc.name) name = branchLoc.name;
            }
          } catch (e) {
            console.warn('Branch enrich error:', e);
          }
        }

        qrData = {
          id: q.id,
          code: q.code,
          label: q.label,
          businessId: q.businessId,
          businessName: name,
          category: q.category,
          address: address || '',
          city: city || '',
          googlePlaceId: placeId || '',
          chipsJson: chipsJson,
          googleReviewUrl: reviewUrl.startsWith('http') ? reviewUrl : `https://${reviewUrl}`,
          logoUrl: q.logoUrl,
          brandColor: q.brandColor,
          brandColorSecondary: q.brandColorSecondary,
          styleJson: q.styleJson
        };
      }
    } catch (qrErr) {
      console.warn('QR code lookup error:', qrErr);
    }

    // Priority 2: Exact match on branch locations table (slug or id)
    if (!qrData) {
      try {
        const branchMatches = await db
          .select({
            locId: locations.id,
            locName: locations.name,
            locSlug: locations.slug,
            locAddress: locations.address,
            locCity: locations.city,
            locPlaceId: locations.googlePlaceId,
            locReviewUrl: locations.googleReviewUrl,
            locChipsJson: locations.chipsJson,
            businessId: businesses.id,
            businessName: businesses.name,
            category: businesses.category,
            bizChipsJson: businesses.chipsJson,
            bizReviewUrl: businesses.googleReviewUrl,
            logoUrl: businesses.logoUrl,
            brandColor: businesses.brandColor,
            brandColorSecondary: businesses.brandColorSecondary
          })
          .from(locations)
          .innerJoin(businesses, eq(locations.businessId, businesses.id))
          .where(
            or(
              eq(locations.slug, cleanCode),
              eq(locations.slug, cleanParam),
              eq(locations.id, cleanCode),
              eq(locations.id, code)
            )
          )
          .limit(1);

        if (branchMatches.length > 0) {
          const matchedLoc = branchMatches[0];
          const reviewUrl = matchedLoc.locReviewUrl || matchedLoc.bizReviewUrl || (matchedLoc.locPlaceId ? `https://search.google.com/local/writereview?placeid=${matchedLoc.locPlaceId}` : '');
          qrData = {
            id: `qr_${matchedLoc.locId}`,
            code,
            label: matchedLoc.locName,
            businessId: matchedLoc.businessId,
            businessName: matchedLoc.locName || matchedLoc.businessName,
            category: matchedLoc.category,
            address: matchedLoc.locAddress || '',
            city: matchedLoc.locCity || '',
            googlePlaceId: matchedLoc.locPlaceId || '',
            chipsJson: matchedLoc.locChipsJson || matchedLoc.bizChipsJson,
            googleReviewUrl: reviewUrl.startsWith('http') ? reviewUrl : `https://${reviewUrl}`,
            logoUrl: matchedLoc.logoUrl,
            brandColor: matchedLoc.brandColor,
            brandColorSecondary: matchedLoc.brandColorSecondary,
            styleJson: '{}'
          };
        }
      } catch (locErr) {
        console.warn('Branch location public check warning:', locErr);
      }
    }

    // Priority 3: Exact match on businesses table (slug or id)
    if (!qrData) {
      try {
        const bizMatches = await db
          .select()
          .from(businesses)
          .where(
            or(
              eq(businesses.slug, cleanCode),
              eq(businesses.slug, cleanParam),
              eq(businesses.id, cleanCode),
              eq(businesses.id, code)
            )
          )
          .limit(1);

        if (bizMatches.length > 0) {
          const matched = bizMatches[0];
          let effectiveChips = matched.chipsJson;
          let effectiveReviewUrl = matched.googleReviewUrl;
          let effectivePlaceId = matched.googlePlaceId;
          let effectiveAddress = matched.address;
          let effectiveCity = matched.city;

          // Check if primary branch has chips or updated review URL
          try {
            const locList = await db
              .select()
              .from(locations)
              .where(eq(locations.businessId, matched.id))
              .orderBy(desc(locations.isPrimary))
              .limit(5);

            const bestLoc = locList.find((l) => l.isPrimary && l.chipsJson) || locList.find((l) => l.chipsJson) || locList[0];
            if (bestLoc) {
              if (bestLoc.chipsJson) effectiveChips = bestLoc.chipsJson;
              if (bestLoc.googleReviewUrl) effectiveReviewUrl = bestLoc.googleReviewUrl;
              if (bestLoc.googlePlaceId) effectivePlaceId = bestLoc.googlePlaceId;
              if (bestLoc.address) effectiveAddress = bestLoc.address;
              if (bestLoc.city) effectiveCity = bestLoc.city;
            }
          } catch (e) {
            console.warn('Primary location lookup warning:', e);
          }

          qrData = {
            id: `qr_${matched.id}`,
            code,
            label: 'Main Standee',
            businessId: matched.id,
            businessName: matched.name,
            category: matched.category,
            address: effectiveAddress || '',
            city: effectiveCity || '',
            googlePlaceId: effectivePlaceId || '',
            chipsJson: effectiveChips || matched.chipsJson,
            googleReviewUrl: effectiveReviewUrl?.startsWith('http')
              ? effectiveReviewUrl
              : `https://${effectiveReviewUrl}`,
            logoUrl: matched.logoUrl,
            brandColor: matched.brandColor,
            brandColorSecondary: matched.brandColorSecondary,
            styleJson: '{}'
          };
        }
      } catch (bizErr) {
        console.warn('Exact business lookup warning:', bizErr);
      }
    }

    // Priority 4: Branch prefix matching (e.g. upmark-g6zq matching branch upmark-g6zq-main)
    if (!qrData) {
      try {
        const allLocs = await db
          .select({
            locId: locations.id,
            locName: locations.name,
            locSlug: locations.slug,
            locAddress: locations.address,
            locCity: locations.city,
            locPlaceId: locations.googlePlaceId,
            locReviewUrl: locations.googleReviewUrl,
            locChipsJson: locations.chipsJson,
            businessId: businesses.id,
            businessName: businesses.name,
            category: businesses.category,
            bizChipsJson: businesses.chipsJson,
            bizReviewUrl: businesses.googleReviewUrl,
            logoUrl: businesses.logoUrl,
            brandColor: businesses.brandColor,
            brandColorSecondary: businesses.brandColorSecondary
          })
          .from(locations)
          .innerJoin(businesses, eq(locations.businessId, businesses.id))
          .limit(100);

        const matchedLoc = allLocs.find((l) => {
          const locSlug = (l.locSlug || '').toLowerCase();
          return (
            locSlug &&
            (locSlug.startsWith(cleanCode) ||
              locSlug.startsWith(cleanParam) ||
              cleanCode.startsWith(locSlug) ||
              cleanParam.startsWith(locSlug))
          );
        });

        if (matchedLoc) {
          const reviewUrl = matchedLoc.locReviewUrl || matchedLoc.bizReviewUrl || (matchedLoc.locPlaceId ? `https://search.google.com/local/writereview?placeid=${matchedLoc.locPlaceId}` : '');
          qrData = {
            id: `qr_${matchedLoc.locId}`,
            code,
            label: matchedLoc.locName,
            businessId: matchedLoc.businessId,
            businessName: matchedLoc.locName || matchedLoc.businessName,
            category: matchedLoc.category,
            address: matchedLoc.locAddress || '',
            city: matchedLoc.locCity || '',
            googlePlaceId: matchedLoc.locPlaceId || '',
            chipsJson: matchedLoc.locChipsJson || matchedLoc.bizChipsJson,
            googleReviewUrl: reviewUrl.startsWith('http') ? reviewUrl : `https://${reviewUrl}`,
            logoUrl: matchedLoc.logoUrl,
            brandColor: matchedLoc.brandColor,
            brandColorSecondary: matchedLoc.brandColorSecondary,
            styleJson: '{}'
          };
        }
      } catch (locPrefixErr) {
        console.warn('Branch prefix lookup warning:', locPrefixErr);
      }
    }

    // Priority 5: Scored Fallback on Active Businesses (strict ranking to prevent cross-business hijacking)
    if (!qrData) {
      try {
        const candidateBizs = await db
          .select()
          .from(businesses)
          .where(eq(businesses.isArchived, false));

        let bestCandidate: any = null;
        let highestScore = 0;

        for (const b of candidateBizs) {
          const slug = (b.slug || '').toLowerCase();
          const baseSlug = slug.split('-')[0];
          const bizNameClean = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const codeClean = cleanCode.replace(/[^a-z0-9]/g, '');

          let score = 0;

          if (slug === cleanCode || slug === cleanParam) {
            score = 1000;
          } else if (slug.startsWith(cleanCode) || cleanCode.startsWith(slug)) {
            score = 500;
          } else if (baseSlug && baseSlug.length >= 3 && (baseSlug === cleanCode || cleanCode === baseSlug)) {
            score = 300;
          } else if (bizNameClean && bizNameClean.length >= 3 && bizNameClean === codeClean) {
            score = 200;
          } else if (baseSlug && baseSlug.length >= 4 && cleanCode.startsWith(baseSlug)) {
            score = 100;
          }

          if (score > 0) {
            if (b.status === 'active') score += 10;
            if (b.chipsJson && b.chipsJson !== '[]' && b.chipsJson.length > 20) score += 20;
            if (b.googleReviewUrl && b.googleReviewUrl.length > 10) score += 5;
          }

          if (score > highestScore) {
            highestScore = score;
            bestCandidate = b;
          }
        }

        const matched = highestScore >= 100 ? bestCandidate : null;

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
        }
      } catch (fallbackErr) {
        console.warn('Fallback business lookup warning:', fallbackErr);
      }
    }

    // Cache in KV for subsequent scans
    if (env.KV && qrData) {
      try {
        await env.KV.put(kvKey, JSON.stringify(qrData), { expirationTtl: 86400 });
      } catch (err) {
        console.warn('KV cache put failed:', err);
      }
    }
  }

  if (!qrData) return null;

  // Extract custom chips
  let customChips: string[] = [];
  if (qrData.chipsJson) {
    try {
      const parsed = JSON.parse(qrData.chipsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customChips = parsed;
      }
    } catch {}
  }

  return {
    ...qrData,
    chips: customChips
  };
}

// Resolve short-code with KV cache & async scan counter
const handleQrResolve = async (c: any) => {
  const rawCode = c.req.param('code') || '';
  const isPreview = c.req.query('preview') === 'true' || c.req.query('refresh') === 'true' || !!c.req.query('_t');

  const resolved = await resolveQrPayload(c.env, rawCode, isPreview);
  if (!resolved) {
    return c.json({ error: 'QR Code not found or inactive' }, 404);
  }

  // Count scan asynchronously via ctx.waitUntil (Non-blocking response)
  const userAgent = c.req.header('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const deviceClass = isMobile ? 'mobile' : /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'desktop';
  const referrer = c.req.header('referer') || '';
  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);

  const scanTrackingPromise = (async () => {
    try {
      const db = getDb(c.env.DB);
      const dailyId = `stat_${resolved.id}_${today}`;
      await db
        .insert(scanDailyStats)
        .values({
          id: dailyId,
          qrId: resolved.id,
          businessId: resolved.businessId,
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

      const scanId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(scans).values({
        id: scanId,
        qrId: resolved.id,
        businessId: resolved.businessId,
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
      .where(and(eq(mediaAssets.businessId, resolved.businessId), eq(mediaAssets.isRecommended, 1)))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(6);
  } catch (err) {
    console.warn('Could not fetch media for business:', err);
  }

  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  c.header('Surrogate-Control', 'no-store');

  return c.json({
    success: true,
    data: {
      ...resolved,
      media: mediaList
    }
  });
};

publicRoutes.get('/r/:code', handleQrResolve);
publicRoutes.get('/r/:code/', handleQrResolve);

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
        } else {
          const [matchedLoc] = await db
            .select({ id: locations.id, businessId: locations.businessId })
            .from(locations)
            .where(or(eq(locations.id, code), eq(locations.slug, cleanCode)))
            .limit(1);
          if (matchedLoc) {
            businessId = matchedLoc.businessId;
            qrId = `qr_${matchedLoc.id}`;
          }
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

  const apiKey = (c.env as any).GOOGLE_PLACES_API_KEY || 'AIzaSyB9e0-qVxnONGLRXMWVYCAjkc8hkTo0mwE';

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

  const apiKey = (c.env as any).GOOGLE_PLACES_API_KEY || 'AIzaSyB9e0-qVxnONGLRXMWVYCAjkc8hkTo0mwE';

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

    const lowerEmail = (payload.email || '').toLowerCase().trim();
    const isAdmin = lowerEmail === 'smitpanchal734@gmail.com';

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role: isAdmin ? 'admin' : 'owner',
      emailVerified: payload.email_verified
    };

    const sessionToken = `gauth_${payload.sub}_${Date.now()}`;
    const now = new Date();

    // Ensure user & session exist in D1 so all protected routes work smoothly
    try {
      const db = getDb(c.env.DB);
      await db.insert(users).values({
        id: payload.sub,
        name: payload.name || 'Google User',
        email: payload.email,
        emailVerified: true,
        image: payload.picture,
        role: isAdmin ? 'admin' : 'owner',
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          name: payload.name || 'Google User',
          email: payload.email,
          image: payload.picture,
          role: isAdmin ? 'admin' : sql`COALESCE(${users.role}, 'owner')`,
          lastLoginAt: now,
          updatedAt: now
        }
      });

      await db.insert(sessions).values({
        id: `sess_${payload.sub}_${Date.now()}`,
        userId: payload.sub,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing();
    } catch (dbErr) {
      console.warn('Google SSO user DB sync:', dbErr);
    }

    return c.json({
      success: true,
      user,
      sessionToken
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// ──────────────────────────────────────────────
// Submit Business Lead / Standee Order Enquiry
// ──────────────────────────────────────────────
publicRoutes.post('/enquiry', async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: 'Invalid enquiry payload' }, 400);
    }

    const company = String(body.company || '').trim();
    const contactPerson = String(body.contactPerson || body.contact || '').trim();
    const mobile = String(body.mobile || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!company || !contactPerson || !mobile || !email) {
      return c.json({
        error: 'Please provide company name, contact person, mobile number, and email.'
      }, 400);
    }

    const db = getDb(c.env.DB);
    const id = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);

    const enquiryRecord = {
      id,
      company,
      contactPerson,
      mobile,
      email,
      locations: Number(body.locations) || 1,
      quantity: String(body.quantity || '1 unit (Trial sample)').trim(),
      product: String(body.product || 'NFC + QR Smart Review Standee').trim(),
      message: body.message ? String(body.message).trim() : null,
      status: 'new',
      stage: 'new',
      assignedTo: 'Unassigned',
      dealValue: 999,
      followUpStatus: 'pending',
      followUpDate: null,
      activityLog: JSON.stringify([
        {
          id: `act_${Date.now()}`,
          text: `Inquiry submitted via landing page (Product: ${String(body.product || 'NFC Standee').trim()})`,
          author: 'Website Form',
          createdAt: Date.now(),
          type: 'created'
        }
      ]),
      notes: null,
      source: String(body.source || 'landing_page'),
      createdAt: now,
      updatedAt: now
    };

    await db.insert(enquiries).values(enquiryRecord);

    return c.json({
      success: true,
      id,
      message: 'Enquiry submitted successfully! Our team will reach out shortly.'
    }, 201);
  } catch (err: any) {
    console.error('Submit enquiry error:', err);
    return c.json({ error: err.message || 'Failed to submit enquiry' }, 500);
  }
});

// Public media asset serving (for Google Posts photo crawlers & previews)
publicRoutes.get('/media/:id', async (c) => {
  const id = c.req.param('id');
  if (!id || !c.env.KV) {
    return c.text('Not found', 404);
  }

  try {
    const metaStr = await c.env.KV.get(`media_meta:${id}`, { type: 'json' });
    const imageBase64 = await c.env.KV.get(`media_data:${id}`);

    if (!imageBase64) {
      return c.text('Media not found', 404);
    }

    const contentType = metaStr?.contentType || 'image/jpeg';

    const binaryStr = atob(imageBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    console.error('Failed to serve media:', err);
    return c.text('Media serve error', 500);
  }
});

