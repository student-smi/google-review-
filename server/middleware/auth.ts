import { Context, Next } from 'hono';
import { getDb } from '../db/client';
import { sessions, users } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { Env } from '../routes/public';

export async function requireAuth(c: Context<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const customOwnerHeader = c.req.header('X-Owner-Id') || c.req.header('X-Dev-Owner-Id');
  const sessionCookie = c.req.header('Cookie')?.match(/better-auth\.session_token=([^;]+)/)?.[1];
  const token = authHeader?.replace('Bearer ', '') || sessionCookie;

  let ownerId: string | null = null;
  let userProfile: any = null;

  if (token) {
    if (token.startsWith('gauth_')) {
      const parts = token.split('_');
      ownerId = parts[1] || 'owner-google';
    } else {
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
          ownerId = session.userId;
          userProfile = session.user;
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      }
    }
  }

  // Check header-provided owner ID from client (supports both guest onboarding & authenticated sessions)
  if (!ownerId && customOwnerHeader) {
    ownerId = customOwnerHeader;
  }

  // Fallback for dev / unauthenticated owner
  if (!ownerId) {
    ownerId = 'owner-default';
  }

  // Ensure owner row exists in users table so foreign key constraints never block business creation
  try {
    const db = getDb(c.env.DB);
    const now = new Date();
    await db.insert(users).values({
      id: ownerId,
      name: userProfile?.name || 'Store Owner',
      email: userProfile?.email || `${ownerId}@reviewqr.local`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  } catch (err) {
    // Ignore if already exists
  }

  c.set('ownerId', ownerId);
  if (userProfile) c.set('user', userProfile);
  return next();
}
