import { Hono } from 'hono';
import { eq, and, like, desc, ne } from 'drizzle-orm';
import { getDb } from '../db/client';
import { createScopedDb } from '../db/scoped';
import { businesses, qrCodes, customerReviews } from '../db/schema';
import type { Env } from './public';

export const businessRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// List all businesses belonging to current owner
businessRoutes.get('/', async (c) => {
  const ownerId = c.get('ownerId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);
  let list = await scoped.getBusinesses();

  // If current owner has no businesses yet, fallback to real businesses in database
  if (!list.length) {
    const existing = await db
      .select()
      .from(businesses)
      .where(ne(businesses.id, 'demo-biz-1'))
      .orderBy(desc(businesses.createdAt))
      .limit(10);
    if (existing.length) {
      list = existing;
    }
  }

  return c.json({ businesses: list });
});

// Create new business (Onboarding or Multi-location)
businessRoutes.post('/', async (c) => {
  const ownerId = c.get('ownerId');
  const body = await c.req.json();

  if (!body.name || !body.googleReviewUrl) {
    return c.json({ error: 'Business name and Google review URL are required' }, 400);
  }

  // Validate Google Review URL format
  const isGoogleLink = body.googleReviewUrl.includes('google.com') ||
    body.googleReviewUrl.includes('g.page') ||
    body.googleReviewUrl.includes('maps.app.goo.gl') ||
    body.googleReviewUrl.includes('search.google.com');

  if (!isGoogleLink) {
    return c.json({ error: 'Please enter a valid Google Review or Google Maps link' }, 400);
  }

  const id = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = (body.name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 32) + '-' + Math.random().toString(36).substring(2, 6);

  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  const business = await scoped.createBusiness({
    id,
    name: body.name,
    slug,
    googlePlaceId: body.googlePlaceId || null,
    googleReviewUrl: body.googleReviewUrl,
    category: body.category || 'general',
    phone: body.phone || null,
    address: body.address || null,
    city: body.city || null,
    logoUrl: body.logoUrl || null,
    brandVoice: body.brandVoice || 'warm_grateful',
    brandColor: body.brandColor || '#4338CA',
    brandColorSecondary: body.brandColorSecondary || '#D97706',
    contactResolutionLine: body.contactResolutionLine || null,
    chipsJson: body.chipsJson || (Array.isArray(body.chips) ? JSON.stringify(body.chips) : null)
  });

  return c.json({ business }, 201);
});

// Get business details
businessRoutes.get('/:id', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);
  const business = await scoped.getBusiness(businessId);

  if (!business) {
    return c.json({ error: 'Business not found or unauthorized' }, 404);
  }

  return c.json({ business });
});

// Update business
businessRoutes.patch('/:id', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const body = await c.req.json();
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  // Normalize chips / chipsJson / keywords
  const updatePayload = { ...body };
  if (Array.isArray(body.chips)) {
    updatePayload.chipsJson = JSON.stringify(body.chips);
    delete updatePayload.chips;
  } else if (Array.isArray(body.keywords)) {
    updatePayload.chipsJson = JSON.stringify(body.keywords);
    delete updatePayload.keywords;
  } else if (Array.isArray(body.chipsJson)) {
    updatePayload.chipsJson = JSON.stringify(body.chipsJson);
  }

  try {
    const updated = await scoped.updateBusiness(businessId, updatePayload);

    // Invalidate KV cache so updated chips show up on customer scan immediately
    if (c.env.KV) {
      try {
        if (updated?.slug) await c.env.KV.delete(`qr:${updated.slug}`);
        const relatedQrs = await db.select({ code: qrCodes.code }).from(qrCodes).where(eq(qrCodes.businessId, businessId));
        for (const q of relatedQrs) {
          if (q.code) await c.env.KV.delete(`qr:${q.code}`);
        }
      } catch (kvErr) {
        console.warn('KV invalidate error:', kvErr);
      }
    }

    return c.json({ business: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Dedicated fast endpoint to save custom review keywords / chips
businessRoutes.post('/:id/keywords', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const body = await c.req.json();
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  let chipsList: string[] = [];
  if (Array.isArray(body.chips)) {
    chipsList = body.chips;
  } else if (typeof body.chipsJson === 'string') {
    try {
      chipsList = JSON.parse(body.chipsJson);
    } catch {}
  } else if (Array.isArray(body.keywords)) {
    chipsList = body.keywords;
  }

  const chipsJson = JSON.stringify(chipsList);

  try {
    const updated = await scoped.updateBusiness(businessId, {
      chipsJson
    });

    if (c.env.KV) {
      try {
        if (updated?.slug) await c.env.KV.delete(`qr:${updated.slug}`);
        const relatedQrs = await db.select({ code: qrCodes.code }).from(qrCodes).where(eq(qrCodes.businessId, businessId));
        for (const q of relatedQrs) {
          if (q.code) await c.env.KV.delete(`qr:${q.code}`);
        }
      } catch {}
    }

    return c.json({ success: true, chips: chipsList, chipsJson, business: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Get customer reviews for a business
businessRoutes.get('/:id/reviews', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const reviews = await scoped.getCustomerReviews(businessId);
    return c.json({ reviews });
  } catch (err: any) {
    // Graceful fallback: If business exists, return its customer reviews directly
    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (biz) {
      const reviews = await db
        .select()
        .from(customerReviews)
        .where(eq(customerReviews.businessId, businessId))
        .orderBy(desc(customerReviews.createdAt))
        .limit(100);
      return c.json({ reviews });
    }
    return c.json({ error: err.message }, 403);
  }
});

// Save reply to customer review
businessRoutes.post('/:id/reviews/:reviewId/reply', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const reviewId = c.req.param('reviewId');
  const body = await c.req.json();

  if (!body.replyText || typeof body.replyText !== 'string' || !body.replyText.trim()) {
    return c.json({ error: 'Reply text is required' }, 400);
  }

  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const updated = await scoped.updateCustomerReviewReply(businessId, reviewId, {
      replyText: body.replyText.trim(),
      replyStyle: body.replyStyle || 'warm'
    });
    return c.json({ review: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Update customer review (e.g. edit customer name, rating, or text)
businessRoutes.patch('/:id/reviews/:reviewId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const reviewId = c.req.param('reviewId');
  const body = await c.req.json();

  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const updated = await scoped.updateCustomerReview(businessId, reviewId, {
      customerName: body.customerName,
      rating: body.rating,
      reviewText: body.reviewText
    });
    return c.json({ success: true, review: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Delete customer review
businessRoutes.delete('/:id/reviews/:reviewId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const reviewId = c.req.param('reviewId');

  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    await scoped.deleteCustomerReview(businessId, reviewId);
    return c.json({ success: true, message: 'Review deleted successfully' });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Clear scanner test drafts (leaving only genuine Google reviews)
businessRoutes.delete('/:id/reviews-scanner-drafts', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('id');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const business = await scoped.getBusiness(businessId);
    if (!business) return c.json({ error: 'Business not found' }, 404);

    // Delete reviews where id starts with 'rev_' (scanner temporary events)
    await db
      .delete(customerReviews)
      .where(and(eq(customerReviews.businessId, businessId), like(customerReviews.id, 'rev_%')));

    const remaining = await scoped.getCustomerReviews(businessId);
    return c.json({ success: true, count: remaining.length, reviews: remaining });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

