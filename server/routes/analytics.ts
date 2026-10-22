import { Hono } from 'hono';
import { getDb } from '../db/client';
import { createScopedDb } from '../db/scoped';
import type { Env } from './public';

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// Daily analytics sparklines and chart data
analyticsRoutes.get('/business/:businessId', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('businessId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const dailyStats = await scoped.getDailyAnalytics(businessId, 30);
    return c.json({ stats: dailyStats });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});

// Usage & Free-Tier limits panel
analyticsRoutes.get('/business/:businessId/limits', async (c) => {
  const ownerId = c.get('ownerId');
  const businessId = c.req.param('businessId');
  const db = getDb(c.env.DB);
  const scoped = createScopedDb(db, ownerId);

  try {
    const limits = await scoped.getUsageAndLimits(businessId);
    return c.json({ limits });
  } catch (err: any) {
    return c.json({ error: err.message }, 403);
  }
});
