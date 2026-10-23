import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db/client';
import { mediaAssets, businesses } from '../db/schema';
import type { Env } from './public';

export const mediaRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// List media for a business
mediaRoutes.get('/business/:businessId', async (c) => {
  const businessId = c.req.param('businessId');
  const db = getDb(c.env.DB);

  try {
    const list = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.businessId, businessId))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(50);

    return c.json({ media: list });
  } catch (err: any) {
    return c.json({ error: err.message, media: [] }, 500);
  }
});

// Add media for a business
mediaRoutes.post('/business/:businessId', async (c) => {
  const businessId = c.req.param('businessId');
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  if (!body.url || !body.title) {
    return c.json({ error: 'Title and image URL or Data URI are required' }, 400);
  }

  try {
    const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Math.floor(Date.now() / 1000);

    const asset = {
      id,
      businessId,
      title: body.title,
      url: body.url,
      category: body.category || 'general',
      mimeType: body.mimeType || 'image/jpeg',
      isRecommended: body.isRecommended !== undefined ? (body.isRecommended ? 1 : 0) : 1,
      createdAt: now
    };

    await db.insert(mediaAssets).values(asset);

    return c.json({ success: true, media: asset });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Delete media asset
mediaRoutes.delete('/:mediaId', async (c) => {
  const mediaId = c.req.param('mediaId');
  const db = getDb(c.env.DB);

  try {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Toggle recommended status
mediaRoutes.patch('/:mediaId/toggle', async (c) => {
  const mediaId = c.req.param('mediaId');
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  try {
    const isRecommended = body.isRecommended ? 1 : 0;
    await db
      .update(mediaAssets)
      .set({ isRecommended })
      .where(eq(mediaAssets.id, mediaId));

    return c.json({ success: true, isRecommended });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
