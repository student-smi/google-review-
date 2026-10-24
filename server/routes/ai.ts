import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { businesses, aiUsageDaily, aiDraftEvents, rateLimits } from '../db/schema';
import { generateCustomerReviewDraft, generateOwnerReplies, generateBusinessKeywords } from '../ai/provider';
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

