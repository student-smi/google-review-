import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { publicRoutes, type Env } from './routes/public';
import { businessRoutes } from './routes/businesses';
import { qrRoutes } from './routes/qr';
import { analyticsRoutes } from './routes/analytics';
import { aiRoutes } from './routes/ai';
import { mediaRoutes } from './routes/media';
import { authRoutes } from './routes/auth';
import { gmbRoutes } from './routes/gmb';
import { requireAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// Security & CORS
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Dev-Owner-Id', 'X-Owner-Id'],
  credentials: true
}));

// Public Routes (KV cache, Customer resolution, Funnel tracking, Customer AI draft, Auth)
app.route('/api/public', publicRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/auth', authRoutes);

// Authenticated Owner Routes
app.use('/api/businesses/*', requireAuth);
app.use('/api/qr/*', requireAuth);
app.use('/api/analytics/*', requireAuth);
app.use('/api/media/*', requireAuth);
app.use('/api/gmb/*', requireAuth);

app.route('/api/businesses', businessRoutes);
app.route('/api/qr', qrRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/gmb', gmbRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'ReviewQR API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback: Serve static assets & SPA routes via Workers ASSETS binding
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    if (res.status === 404 && !c.req.path.startsWith('/api')) {
      // SPA fallback: return index.html for client-side routing
      const url = new URL(c.req.url);
      url.pathname = '/index.html';
      return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
    }
    return res;
  }
  return c.text('Not Found', 404);
});

export default {
  fetch: app.fetch,

  // Scheduled Cron: Daily midnight cleanup — prune expired rate-limit rows & old raw scan events
  async scheduled(_event: any, env: Env, _ctx: ExecutionContext) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const db = (await import('./db/client')).getDb(env.DB);
      const { rateLimits, scans } = await import('./db/schema');
      const { lt } = await import('drizzle-orm');

      // 1. Delete expired rate-limit rows (TTL based)
      await db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));

      // 2. Prune raw scan events older than 90 days (keep aggregated daily stats)
      const cutoff90 = now - 90 * 24 * 60 * 60;
      await db.delete(scans).where(lt(scans.createdAt, cutoff90));

      console.log('[Cron] Nightly cleanup complete at', new Date().toISOString());
    } catch (err) {
      console.error('[Cron] Cleanup error:', err);
    }
  }
};
