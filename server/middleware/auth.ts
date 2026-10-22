import { Context, Next } from 'hono';
import { getDb } from '../db/client';
import { sessions, users } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { Env } from '../routes/public';

export async function requireAuth(c: Context<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const sessionCookie = c.req.header('Cookie')?.match(/better-auth\.session_token=([^;]+)/)?.[1];
  const token = authHeader?.replace('Bearer ', '') || sessionCookie;

  if (token) {
    try {
      const db = getDb(c.env.DB);
      const now = new Date();

      const [session] = await db
        .select({
          userId: sessions.userId,
          user: users
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
        .limit(1);

      if (session) {
        c.set('ownerId', session.userId);
        c.set('user', session.user);
        return next();
      }
    } catch (err) {
      console.warn('Session check failed:', err);
    }
  }

  // Development fallback for local dev when test header is passed or local demo owner
  const devOwnerHeader = c.req.header('X-Dev-Owner-Id');
  if (devOwnerHeader && (c.env.ENVIRONMENT === 'development' || !c.env.ENVIRONMENT)) {
    c.set('ownerId', devOwnerHeader);
    return next();
  }

  // Default demo owner in local dev mode if enabled
  if (c.env.ENVIRONMENT === 'development' || !c.env.ENVIRONMENT) {
    c.set('ownerId', 'demo-owner-default');
    return next();
  }

  return c.json({ error: 'Unauthorized: Session missing or expired' }, 401);
}
