import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { businesses, aiUsageDaily, aiDraftEvents, rateLimits } from '../db/schema';
import {
  generateCustomerReviewDraft,
  generateOwnerReplies,
  generateBusinessKeywords,
  generateLocalSeoKeywords
} from '../ai/provider';
import type { Env } from './public';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// Customer AI Review Draft Endpoint
aiRoutes.post('/review-draft', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    businessId,
    businessName = 'Local Business',
    category,
    address,
    city,
    googlePlaceId,
    rating,
    summary,
    chips = [],
    freeText = '',
    language = 'en',
    tone = 'warm',
    turnstileToken
  } = body;

  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);
  const db = getDb(c.env.DB);

  // If category/city/address are missing, query from businesses table in D1
  let resolvedCategory = category;
  let resolvedCity = city;
  let resolvedAddress = address;

  if (businessId && (!resolvedCategory || !resolvedCity || !resolvedAddress)) {
    try {
      const [biz] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      if (biz) {
        resolvedCategory = resolvedCategory || biz.category;
        resolvedCity = resolvedCity || biz.city;
        resolvedAddress = resolvedAddress || biz.address;
      }
    } catch (err) {
      console.warn('Could not query business metadata for AI context:', err);
    }
  }

  // 1. Sliding IP Rate Limiter (No KV writes!)
  const clientIp = c.req.header('cf-connecting-ip') || 'anonymous-ip';
  const hourWindow = new Date().toISOString().slice(0, 13); // 'YYYY-MM-DDTHH'
  const rateLimitKey = `rate:ai:${clientIp}:${hourWindow}`;

  try {
    const [rateCheck] = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, rateLimitKey))
      .limit(1);

    if (rateCheck && rateCheck.count >= 100) {
      // Return fallback without blocking customer
      const fallback = await generateCustomerReviewDraft(null, {
        businessName,
        category: resolvedCategory,
        address: resolvedAddress,
        city: resolvedCity,
        googlePlaceId,
        rating,
        summary,
        chips,
        freeText,
        language,
        tone
      });
      return c.json({ ...fallback, draft: fallback.drafts[0]?.text || '', rateLimited: true });
    }

    // Increment rate counter
    await db
      .insert(rateLimits)
      .values({
        key: rateLimitKey,
        count: 1,
        expiresAt: now + 3600
      })
      .onConflictDoUpdate({
        target: [rateLimits.key],
        set: { count: sql`${rateLimits.count} + 1` }
      });
  } catch (err) {
    console.warn('Rate limiter error:', err);
  }

  // 2. Per-Business Daily Quota Safeguard (Free Tier: 100/day max per business)
  let quotaAvailable = true;
  if (businessId) {
    try {
      const [usage] = await db
        .select()
        .from(aiUsageDaily)
        .where(and(eq(aiUsageDaily.businessId, businessId), eq(aiUsageDaily.day, today)))
        .limit(1);

      if (usage && usage.callCount >= 100) {
        quotaAvailable = false;
      }
    } catch (err) {
      console.warn('Quota check error:', err);
    }
  }

  // 3. Generate Draft (Workers AI with Google Place details if quota available, otherwise instant fallback)
  const result = await generateCustomerReviewDraft(quotaAvailable ? c.env.AI : null, {
    businessName,
    category: resolvedCategory,
    address: resolvedAddress,
    city: resolvedCity,
    googlePlaceId,
    rating,
    summary,
    chips,
    freeText,
    language,
    tone
  });

  // 4. Log Anonymized Event & Increment Usage
  if (businessId && quotaAvailable && !result.usedFallback) {
    const recordPromise = (async () => {
      try {
        const usageId = `ai_use_${businessId}_${today}`;
        await db
          .insert(aiUsageDaily)
          .values({
            id: usageId,
            businessId,
            day: today,
            callCount: 1,
            neuronEstimate: 45,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: [aiUsageDaily.businessId, aiUsageDaily.day],
            set: {
              callCount: sql`${aiUsageDaily.callCount} + 1`,
              neuronEstimate: sql`${aiUsageDaily.neuronEstimate} + 45`,
              updatedAt: now
            }
          });

        // Store anonymized metadata (zero customer private text)
        const primaryText = result.drafts[0]?.text || '';
        const eventId = `aiev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.insert(aiDraftEvents).values({
          id: eventId,
          businessId,
          language,
          tone,
          wordCount: primaryText.split(/\s+/).filter(Boolean).length,
          copied: 0,
          createdAt: now
        });
      } catch (err) {
        console.warn('AI telemetry logging error:', err);
      }
    })();

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(recordPromise);
    } else {
      recordPromise.catch(() => {});
    }
  }

  return c.json({
    success: true,
    drafts: result.drafts,
    draft: result.drafts[0]?.text || '',
    usedFallback: result.usedFallback,
    quotaAvailable,
    debug: (result as any).debug
  });
});

// Owner AI Review Reply Assistant Endpoint (Supports both /reply-draft and /suggest-reply)
const handleReplyDraft = async (c: any) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    businessName = 'Our Business',
    customerName,
    reviewText,
    rating,
    brandVoice,
    resolutionContact,
    city,
    category
  } = body;

  if (!reviewText) {
    return c.json({ error: 'Review text is required' }, 400);
  }

  const replies = await generateOwnerReplies(c.env.AI, {
    businessName,
    customerName,
    reviewText,
    rating,
    city,
    category,
    brandVoice,
    resolutionContact
  });

  return c.json({ success: true, replies });
};

aiRoutes.post('/reply-draft', handleReplyDraft);
aiRoutes.post('/suggest-reply', handleReplyDraft);

// AI Keyword / Highlights Suggestion Endpoint for Businesses
aiRoutes.post('/suggest-keywords', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  let { businessId, businessName, category, city, address, summary, types } = body;

  const db = getDb(c.env.DB);

  if (businessId && (!businessName || !category || !city)) {
    try {
      const [biz] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      if (biz) {
        businessName = businessName || biz.name;
        category = category || biz.category;
        city = city || biz.city;
        address = address || biz.address;
      }
    } catch (err) {
      console.warn('Could not query business info for keyword generation:', err);
    }
  }

  if (body.detailed) {
    const detailedResult = await generateLocalSeoKeywords(c.env.AI, {
      businessName: businessName || 'Local Business',
      category,
      city,
      address,
      summary,
      types
    });
    return c.json({
      success: true,
      data: detailedResult,
      keywords: detailedResult.keywordSuggestions.map((k) => k.keyword)
    });
  }

  const result = await generateBusinessKeywords(c.env.AI, {
    businessName: businessName || 'Local Business',
    category,
    city,
    address,
    summary,
    types
  });

  return c.json({
    success: true,
    keywords: result.keywords,
    usedFallback: result.usedFallback
  });
});

// Dedicated Google Places AI-Powered Local SEO Keyword Engine
aiRoutes.post('/local-seo-keywords', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  let {
    businessId,
    placeId,
    businessName,
    category,
    city,
    address,
    summary,
    refresh
  } = body;

  const db = getDb(c.env.DB);
  let targetPlaceId = placeId;
  const userSpecifiedCategory = typeof category === 'string' && category.trim() ? category.trim() : null;

  // 1. If businessId provided, look up in database
  if (businessId) {
    try {
      const [biz] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      if (biz) {
        businessName = businessName || biz.name;
        category = userSpecifiedCategory || biz.category;
        city = city || biz.city;
        address = address || biz.address;
        targetPlaceId = targetPlaceId || biz.googlePlaceId;
      }
    } catch (err) {
      console.warn('Could not query business for local SEO keywords:', err);
    }
  }

  const cacheKey = `localseo:${targetPlaceId || businessId || (businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}:${(userSpecifiedCategory || category || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // 2. Check KV cache if available and refresh not forced
  if (!refresh && c.env.KV) {
    try {
      const cached = await c.env.KV.get(cacheKey, { type: 'json' });
      if (cached && (cached as any).keywordSuggestions?.length > 0) {
        return c.json({
          success: true,
          data: cached,
          fromCache: true
        });
      }
    } catch (kvErr) {
      console.warn('KV cache read error:', kvErr);
    }
  }

  // 3. Retrieve verified data from Google Places API (New) if placeId is present
  const apiKey = (c.env as any).GOOGLE_PLACES_API_KEY || 'AIzaSyB9e0-qVxnONGLRXMWVYCAjkc8hkTo0mwE';
  let types: string[] = [];
  let websiteUri: string | null = null;
  let rating: number | null = null;
  let userRatingCount: number | null = null;
  let reviews: Array<{ text: string; rating?: number }> = [];

  if (targetPlaceId) {
    try {
      const placesUrl = `https://places.googleapis.com/v1/places/${targetPlaceId}`;
      const placeRes = await fetch(placesUrl, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,primaryType,primaryTypeDisplayName,types,formattedAddress,websiteUri,rating,userRatingCount,editorialSummary,reviews'
        }
      });

      if (placeRes.ok) {
        const placeData = (await placeRes.json()) as any;
        businessName = placeData.displayName?.text || businessName;
        category = userSpecifiedCategory || placeData.primaryTypeDisplayName?.text || placeData.primaryType?.replace(/_/g, ' ') || category;
        address = placeData.formattedAddress || address;
        types = Array.isArray(placeData.types) ? placeData.types : [];
        summary = placeData.editorialSummary?.text || summary;
        websiteUri = placeData.websiteUri || null;
        rating = placeData.rating || null;
        userRatingCount = placeData.userRatingCount || null;

        // Extract limited review text snippets according to policy
        if (Array.isArray(placeData.reviews)) {
          reviews = placeData.reviews
            .filter((r: any) => r?.text?.text)
            .slice(0, 5)
            .map((r: any) => ({
              text: r.text.text,
              rating: r.rating
            }));
        }
      } else {
        const errText = await placeRes.text();
        console.warn('Google Places API response status:', placeRes.status, errText);
      }
    } catch (placesErr) {
      console.warn('Google Places API lookup failed, falling back to database parameters:', placesErr);
    }
  }

  // 4. Run AI Keyword Analysis
  const result = await generateLocalSeoKeywords(c.env.AI, {
    businessName: businessName || 'Local Business',
    category,
    city,
    address,
    types,
    summary,
    websiteUri,
    rating,
    userRatingCount,
    reviews
  });

  // 5. Store in KV Cache (24h TTL)
  if (c.env.KV && result?.keywordSuggestions?.length > 0) {
    try {
      await c.env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
    } catch (kvPutErr) {
      console.warn('KV cache write error:', kvPutErr);
    }
  }

  return c.json({
    success: true,
    data: result,
    fromCache: false
  });
});


