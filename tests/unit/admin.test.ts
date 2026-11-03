import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from '../helpers/mock-d1';
import { getDb } from '../../server/db/client';
import { users, businesses, sessions } from '../../server/db/schema';
import { adminRoutes } from '../../server/routes/admin';
import { eq } from 'drizzle-orm';

describe('Super Admin Control Center & User Blocking Suite', () => {
  let d1Mock: any;
  let db: ReturnType<typeof getDb>;
  const adminId = 'usr_admin_123';
  const victimUserId = 'usr_target_merchant_456';

  beforeEach(async () => {
    const testDb = createTestD1Database();
    d1Mock = testDb.d1Mock;
    db = getDb(d1Mock);

    const now = new Date();

    // 1. Seed Super Admin
    await db.insert(users).values({
      id: adminId,
      name: 'Super Admin',
      email: 'smitpanchal734@gmail.com',
      role: 'admin',
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    });

    // 2. Seed Normal User
    await db.insert(users).values({
      id: victimUserId,
      name: 'Bad Merchant',
      email: 'badactor@example.com',
      role: 'owner',
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    });

    // 3. Seed User's Store
    await db.insert(businesses).values({
      id: 'biz_victim_1',
      ownerId: victimUserId,
      name: 'Spam Store',
      slug: 'spam-store',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ123',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // 4. Seed an Active Session for the user
    await db.insert(sessions).values({
      id: 'sess_victim_live_1',
      userId: victimUserId,
      token: 'tok_victim_active_token',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: now,
      updatedAt: now
    });
  });

  it('GET /overview returns system statistics to super admin', async () => {
    const res = await adminRoutes.request('/overview', {
      method: 'GET',
      headers: { 'X-Owner-Id': adminId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.stats.totalUsers).toBe(2);
    expect(data.stats.totalBusinesses).toBe(1);
    expect(data.stats.blockedUsers).toBe(0);
  });

  it('GET /users lists all users with their stores and online status', async () => {
    const res = await adminRoutes.request('/users', {
      method: 'GET',
      headers: { 'X-Owner-Id': adminId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.users.length).toBe(2);

    const victim = data.users.find((u: any) => u.id === victimUserId);
    expect(victim).toBeDefined();
    expect(victim.businesses.length).toBe(1);
    expect(victim.businesses[0].name).toBe('Spam Store');
    expect(victim.isOnline).toBe(true);
  });

  it('POST /users/:id/block blocks user, records reason, and terminates sessions immediately', async () => {
    const res = await adminRoutes.request(`/users/${victimUserId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': adminId
      },
      body: JSON.stringify({ reason: 'Posting fake positive reviews and spamming' })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);

    // Verify in database: user is blocked
    const [userInDb] = await db.select().from(users).where(eq(users.id, victimUserId));
    expect(Boolean(userInDb.isBlocked)).toBe(true);
    expect(userInDb.blockReason).toBe('Posting fake positive reviews and spamming');

    // Verify all active sessions were wiped (immediate kick)
    const activeSessions = await db.select().from(sessions).where(eq(sessions.userId, victimUserId));
    expect(activeSessions.length).toBe(0);
  });

  it('POST /users/:id/unblock restores suspended user', async () => {
    // First block
    await db.update(users).set({ isBlocked: true, blockReason: 'Temporary hold' }).where(eq(users.id, victimUserId));

    const res = await adminRoutes.request(`/users/${victimUserId}/unblock`, {
      method: 'POST',
      headers: { 'X-Owner-Id': adminId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);

    const [userInDb] = await db.select().from(users).where(eq(users.id, victimUserId));
    expect(Boolean(userInDb.isBlocked)).toBe(false);
    expect(userInDb.blockReason).toBeNull();
  });

  it('prevents non-admin user from accessing admin endpoints', async () => {
    const res = await adminRoutes.request('/overview', {
      method: 'GET',
      headers: { 'X-Owner-Id': victimUserId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain('Super Administrator');
  });

  it('prevents a user with email containing admin@ from accessing admin routes', async () => {
    const imposterId = 'usr_imposter_admin';
    await db.insert(users).values({
      id: imposterId,
      name: 'Imposter Admin',
      email: 'admin@vampupmedia.com',
      role: 'owner',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await adminRoutes.request('/overview', {
      method: 'GET',
      headers: { 'X-Owner-Id': imposterId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain('Super Administrator');
  });
});

