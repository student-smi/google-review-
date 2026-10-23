import { Hono } from 'hono';
import { getDb } from '../db/client';
import { createScopedDb } from '../db/scoped';
import type { Env } from './public';

export const businessRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// List all businesses belonging to current owner
businessRoutes.get('/', async (c) => {
  const ownerId = c.get('ownerId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);
  const list = await scoped.getBusinesses();
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
    contactResolutionLine: body.contactResolutionLine || null
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

  try {
    const updated = await scoped.updateBusiness(businessId, body);
    return c.json({ business: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});
