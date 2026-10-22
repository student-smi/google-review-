import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { businesses, aiUsageDaily, aiDraftEvents, rateLimits } from '../db/schema';
import { generateCustomerReviewDraft, generateOwnerReplies } from '../ai/provider';
import type { Env } from './public';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// Customer AI Review Draft Endpoint
aiRoutes.post('/review-draft', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    businessId,
    businessName = 'Local Business',
    chips = [],
    freeText = '',
    language = 'en',
    tone = 'warm',
    turnstileToken
  } = body;

  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);
  const db = getDb(c.env.DB);

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

    if (rateCheck && rateCheck.count >= 10) {
      // Return fallback without blocking customer
      const fallback = await generateCustomerReviewDraft(null, {
        businessName,
        chips,
        freeText,
        language,
        tone
      });
      return c.json({ ...fallback, rateLimited: true });
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

  // 2. Per-Business Daily Quota Safeguard (Free Tier: 25/day max per business)
  let quotaAvailable = true;
  if (businessId) {
    try {
      const [usage] = await db
        .select()
        .from(aiUsageDaily)
        .where(and(eq(aiUsageDaily.businessId, businessId), eq(aiUsageDaily.day, today)))
        .limit(1);

      if (usage && usage.callCount >= 25) {
        quotaAvailable = false;
      }
    } catch (err) {
      console.warn('Quota check error:', err);
    }
  }

  // 3. Generate Draft (Workers AI if quota available, otherwise instant fallback)
  const result = await generateCustomerReviewDraft(quotaAvailable ? c.env.AI : null, {
    businessName,
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
        const eventId = `aiev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.insert(aiDraftEvents).values({
          id: eventId,
          businessId,
          language,
          tone,
          wordCount: result.draft.split(/\s+/).filter(Boolean).length,
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
    draft: result.draft,
    usedFallback: result.usedFallback,
    quotaAvailable
  });
});

// Owner AI Review Reply Assistant Endpoint
aiRoutes.post('/reply-draft', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    businessName = 'Our Business',
    customerName,
    reviewText,
    rating,
    brandVoice,
    resolutionContact
  } = body;

  if (!reviewText) {
    return c.json({ error: 'Review text is required' }, 400);
  }

  const replies = await generateOwnerReplies(c.env.AI, {
    businessName,
    customerName,
    reviewText,
    rating,
    brandVoice,
    resolutionContact
  });

  return c.json({ success: true, replies });
});
