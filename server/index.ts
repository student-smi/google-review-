import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { publicRoutes, type Env } from './routes/public';
import { businessRoutes } from './routes/businesses';
import { qrRoutes } from './routes/qr';
import { analyticsRoutes } from './routes/analytics';
import { aiRoutes } from './routes/ai';
import { requireAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

// Security & CORS
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Dev-Owner-Id'],
  credentials: true
}));

// Public Routes (KV cache, Customer resolution, Funnel tracking, Customer AI draft)
app.route('/api/public', publicRoutes);
app.route('/api/ai', aiRoutes);

// Authenticated Owner Routes
app.use('/api/businesses/*', requireAuth);
app.use('/api/qr/*', requireAuth);
app.use('/api/analytics/*', requireAuth);

app.route('/api/businesses', businessRoutes);
app.route('/api/qr', qrRoutes);
app.route('/api/analytics', analyticsRoutes);

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

  // Scheduled Cron Handler for Free-Tier Database Rollups and Pruning
  async scheduled(event: any, env: Env, ctx: ExecutionContext) {
    console.log('Daily midnight cron triggered at:', new Date().toISOString());
    // Daily cleanup logic will be refined in Phase 4
  }
};
