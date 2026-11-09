import { Hono } from 'hono';
import { eq, and, or, gt, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  users,
  sessions,
  accounts,
  memberships,
  brands,
  businesses,
  locations,
  qrCodes,
  scans,
  scanDailyStats,
  customerReviews,
  replyDrafts,
  seoChecklistItems,
  mediaAssets,
  aiDraftEvents,
  aiUsageDaily,
  enquiries
} from '../db/schema';
import { requireAuth, requireAdmin } from '../middleware/auth';
import type { Env } from './public';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>();

// All admin routes require Super Admin authentication
adminRoutes.use('*', requireAuth, requireAdmin);

// ──────────────────────────────────────────────
// 1. Admin System Overview & KPI Metrics
// ──────────────────────────────────────────────
adminRoutes.get('/overview', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const now = new Date();

    // Query high-level counts
    const allUsers = await db.select({ id: users.id, isBlocked: users.isBlocked }).from(users);
    const totalUsers = allUsers.length;
    const blockedUsers = allUsers.filter((u) => u.isBlocked === true || (u.isBlocked as any) === 1).length;

    // Active sessions
    const activeSessions = await db
      .select({ id: sessions.id, userId: sessions.userId })
      .from(sessions)
      .where(gt(sessions.expiresAt, now));

    const uniqueActiveUsers = new Set(activeSessions.map((s) => s.userId)).size;

    // Total businesses
    const allBusinesses = await db.select({ id: businesses.id }).from(businesses);
    const totalBusinesses = allBusinesses.length;

    // Total reviews
    const allReviews = await db.select({ id: customerReviews.id }).from(customerReviews);
    const totalReviews = allReviews.length;

    // Total scans
    const allScans = await db.select({ id: scans.id }).from(scans);
    const totalScans = allScans.length;

    // Total business enquiries
    const allEnquiries = await db.select().from(enquiries).catch(() => []);
    const totalEnquiries = allEnquiries.length;
    const newEnquiries = allEnquiries.filter((e) => e.status === 'new').length;

    // AI Usage Telemetry
    const today = now.toISOString().split('T')[0];
    const allAiUsage = await db.select().from(aiUsageDaily).catch(() => []);

    const callsToday = allAiUsage
      .filter((u) => u.day === today)
      .reduce((sum, u) => sum + (u.callCount || 0), 0);

    const neuronsUsedToday = allAiUsage
      .filter((u) => u.day === today)
      .reduce((sum, u) => sum + (u.neuronEstimate || 0), 0);

    const allTimeCalls = allAiUsage.reduce((sum, u) => sum + (u.callCount || 0), 0);
    const allTimeNeurons = allAiUsage.reduce((sum, u) => sum + (u.neuronEstimate || 0), 0);

    // Live D1 Storage Telemetry (from Cloudflare D1 metadata size_after)
    let sizeBytes = 3125248; // Baseline calibrated size ~2.98 MB
    try {
      if (c.env.DB && typeof c.env.DB.prepare === 'function') {
        const ping = await c.env.DB.prepare('SELECT 1').run();
        if (ping && (ping.meta as any)?.size_after) {
          sizeBytes = Number((ping.meta as any).size_after);
        }
      }
    } catch (e) {
      console.warn('Could not read D1 size_after metadata:', e);
    }

    const usedMb = Number((sizeBytes / (1024 * 1024)).toFixed(2));
    const limitMb = 500;
    const remainingMb = Number(Math.max(0, limitMb - usedMb).toFixed(2));
    const percentUsed = Number(((usedMb / limitMb) * 100).toFixed(2));

    return c.json({
      success: true,
      stats: {
        totalUsers,
        activeUsersNow: uniqueActiveUsers,
        blockedUsers,
        totalBusinesses,
        totalReviews,
        totalScans,
        totalEnquiries,
        newEnquiries
      },
      telemetry: {
        ai: {
          callsToday,
          neuronsUsedToday,
          neuronsLimitDaily: 10000,
          neuronsRemainingToday: Math.max(0, 10000 - neuronsUsedToday),
          neuronsPercentUsed: Number(((neuronsUsedToday / 10000) * 100).toFixed(1)),
          tokensEstimatedToday: callsToday * 350,
          allTimeCalls,
          allTimeNeurons,
          allTimeTokens: allTimeCalls * 350
        },
        database: {
          sizeBytes,
          usedMb,
          limitMb,
          remainingMb,
          percentUsed,
          status: 'healthy',
          tableCounts: {
            users: totalUsers,
            businesses: totalBusinesses,
            reviews: totalReviews,
            scans: totalScans,
            sessions: activeSessions.length
          }
        }
      }
    });
  } catch (err: any) {
    console.error('Admin overview failed:', err);
    return c.json({ error: err.message || 'Failed to fetch admin overview' }, 500);
  }
});

// ──────────────────────────────────────────────
// 2. List All Registered Users with Stores & Activity
// ──────────────────────────────────────────────
adminRoutes.get('/users', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const now = new Date();

    // Fetch all users
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isBlocked: users.isBlocked,
        blockReason: users.blockReason,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Fetch all businesses
    const bizList = await db
      .select({
        id: businesses.id,
        ownerId: businesses.ownerId,
        name: businesses.name,
        slug: businesses.slug,
        googlePlaceId: businesses.googlePlaceId,
        city: businesses.city
      })
      .from(businesses);

    // Fetch active sessions
    const activeSessions = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        ipAddress: sessions.ipAddress
      })
      .from(sessions)
      .where(gt(sessions.expiresAt, now));

    // Group businesses by ownerId
    const bizByOwner: Record<string, typeof bizList> = {};
    for (const b of bizList) {
      if (!bizByOwner[b.ownerId]) bizByOwner[b.ownerId] = [];
      bizByOwner[b.ownerId].push(b);
    }

    // Group active sessions by userId
    const sessionsByUser: Record<string, typeof activeSessions> = {};
    for (const s of activeSessions) {
      if (!sessionsByUser[s.userId]) sessionsByUser[s.userId] = [];
      sessionsByUser[s.userId].push(s);
    }

    const enrichedUsers = userList.map((u) => {
      const isSuperAdminEmail = (u.email || '').toLowerCase().trim() === 'smitpanchal734@gmail.com';
      const userRole = isSuperAdminEmail ? 'admin' : 'owner';
      const userBusinesses = bizByOwner[u.id] || [];
      const userSessions = sessionsByUser[u.id] || [];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: userRole,
        isBlocked: Boolean(u.isBlocked),
        blockReason: u.blockReason || null,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : null,
        createdAt: u.createdAt ? new Date(u.createdAt).getTime() : null,
        businesses: userBusinesses,
        businessCount: userBusinesses.length,
        activeSessionCount: userSessions.length,
        isOnline: userSessions.length > 0
      };
    });

    return c.json({
      success: true,
      users: enrichedUsers
    });
  } catch (err: any) {
    console.error('Admin fetch users failed:', err);
    return c.json({ error: err.message || 'Failed to fetch users list' }, 500);
  }
});

// ──────────────────────────────────────────────
// 3. Block User & Invalidate All Sessions (Instant Kick)
// ──────────────────────────────────────────────
adminRoutes.post('/users/:userId/block', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    const currentAdmin = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const reason = (body?.reason || 'Account suspended by administrator').trim();

    if (!targetUserId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    // Protection: Admin cannot block themselves
    if (currentAdmin && currentAdmin.id === targetUserId) {
      return c.json({ error: 'You cannot block your own administrator account!' }, 400);
    }

    const db = getDb(c.env.DB);

    const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (target.email === 'smitpanchal734@gmail.com') {
      return c.json({ error: 'Primary Super Administrator cannot be blocked' }, 403);
    }

    // 1. Mark user as blocked
    await db
      .update(users)
      .set({
        isBlocked: true,
        blockReason: reason,
        updatedAt: new Date()
      })
      .where(eq(users.id, targetUserId));

    // 2. Kill all active sessions immediately so user is kicked out
    await db.delete(sessions).where(eq(sessions.userId, targetUserId));

    return c.json({
      success: true,
      message: `User ${target.name} (${target.email}) has been blocked and logged out immediately.`,
      userId: targetUserId
    });
  } catch (err: any) {
    console.error('Block user failed:', err);
    return c.json({ error: err.message || 'Failed to block user' }, 500);
  }
});

// ──────────────────────────────────────────────
// 4. Unblock User (Restore Account)
// ──────────────────────────────────────────────
adminRoutes.post('/users/:userId/unblock', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    if (!targetUserId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const db = getDb(c.env.DB);
    const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target) {
      return c.json({ error: 'User not found' }, 404);
    }

    await db
      .update(users)
      .set({
        isBlocked: false,
        blockReason: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, targetUserId));

    return c.json({
      success: true,
      message: `User ${target.name} (${target.email}) has been unblocked.`,
      userId: targetUserId
    });
  } catch (err: any) {
    console.error('Unblock user failed:', err);
    return c.json({ error: err.message || 'Failed to unblock user' }, 500);
  }
});

// ──────────────────────────────────────────────
// 5. Toggle Admin Role
// ──────────────────────────────────────────────
adminRoutes.post('/users/:userId/role', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    const body = await c.req.json().catch(() => ({}));
    const newRole = body?.role === 'admin' ? 'admin' : 'owner';

    const db = getDb(c.env.DB);
    const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (target.email === 'smitpanchal734@gmail.com' && newRole !== 'admin') {
      return c.json({ error: 'Primary Super Administrator role cannot be changed' }, 403);
    }

    if (newRole === 'admin' && target.email !== 'smitpanchal734@gmail.com') {
      return c.json({ error: 'Only smitpanchal734@gmail.com is authorized as Super Administrator' }, 403);
    }

    await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.id, targetUserId));

    return c.json({
      success: true,
      message: `User ${target.name} role updated to ${newRole}.`,
      role: newRole
    });
  } catch (err: any) {
    console.error('Toggle role failed:', err);
    return c.json({ error: err.message || 'Failed to update user role' }, 500);
  }
});

// ──────────────────────────────────────────────
// 6. Delete User Profile & Associated Records
// ──────────────────────────────────────────────
adminRoutes.delete('/users/:userId', async (c) => {
  try {
    const targetUserId = c.req.param('userId');
    const currentAdmin = c.get('user');

    if (!targetUserId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    if (currentAdmin && currentAdmin.id === targetUserId) {
      return c.json({ error: 'You cannot delete your own administrator account!' }, 400);
    }

    const db = getDb(c.env.DB);
    const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target) {
      return c.json({ error: 'User not found' }, 404);
    }

    const targetEmail = (target.email || '').toLowerCase().trim();
    if (targetEmail === 'smitpanchal734@gmail.com') {
      return c.json({ error: 'Primary Super Administrator account cannot be deleted' }, 403);
    }

    // Find all businesses associated with this user
    const userBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(or(eq(businesses.ownerId, targetUserId), eq(businesses.ownerId, target.email)));

    const bizIds = userBusinesses.map((b) => b.id);

    // 1. Delete dependent entities for all user's businesses
    for (const bizId of bizIds) {
      await db.delete(customerReviews).where(eq(customerReviews.businessId, bizId)).catch(() => {});
      await db.delete(replyDrafts).where(eq(replyDrafts.businessId, bizId)).catch(() => {});
      await db.delete(scans).where(eq(scans.businessId, bizId)).catch(() => {});
      await db.delete(scanDailyStats).where(eq(scanDailyStats.businessId, bizId)).catch(() => {});
      await db.delete(qrCodes).where(eq(qrCodes.businessId, bizId)).catch(() => {});
      await db.delete(locations).where(eq(locations.businessId, bizId)).catch(() => {});
      await db.delete(mediaAssets).where(eq(mediaAssets.businessId, bizId)).catch(() => {});
      await db.delete(seoChecklistItems).where(eq(seoChecklistItems.businessId, bizId)).catch(() => {});
      await db.delete(aiDraftEvents).where(eq(aiDraftEvents.businessId, bizId)).catch(() => {});
      await db.delete(aiUsageDaily).where(eq(aiUsageDaily.businessId, bizId)).catch(() => {});
    }

    // 2. Delete businesses
    if (bizIds.length > 0) {
      await db.delete(businesses).where(or(eq(businesses.ownerId, targetUserId), eq(businesses.ownerId, target.email))).catch(() => {});
    }

    // 3. Delete user memberships, brands, sessions & accounts
    await db.delete(memberships).where(eq(memberships.userId, targetUserId)).catch(() => {});
    await db.delete(brands).where(eq(brands.ownerId, targetUserId)).catch(() => {});
    await db.delete(sessions).where(eq(sessions.userId, targetUserId)).catch(() => {});
    await db.delete(accounts).where(eq(accounts.userId, targetUserId)).catch(() => {});

    // 4. Delete the user profile
    await db.delete(users).where(eq(users.id, targetUserId));

    return c.json({
      success: true,
      message: `User ${target.name} (${target.email}) and all related data have been permanently deleted.`,
      userId: targetUserId
    });
  } catch (err: any) {
    console.error('Delete user failed:', err);
    return c.json({ error: err.message || 'Failed to delete user' }, 500);
  }
});

// ──────────────────────────────────────────────
// 6. Business Standee & Multi-Location Enquiries
// ──────────────────────────────────────────────
adminRoutes.get('/enquiries', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const list = await db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt));

    return c.json({
      success: true,
      enquiries: list
    });
  } catch (err: any) {
    console.error('Fetch enquiries failed:', err);
    return c.json({ error: err.message || 'Failed to fetch enquiries' }, 500);
  }
});

adminRoutes.patch('/enquiries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const updateData: any = { updatedAt: now };
    if (body.status !== undefined) updateData.status = String(body.status);
    if (body.notes !== undefined) updateData.notes = String(body.notes);

    await db.update(enquiries).set(updateData).where(eq(enquiries.id, id));

    return c.json({
      success: true,
      message: 'Enquiry updated successfully'
    });
  } catch (err: any) {
    console.error('Update enquiry failed:', err);
    return c.json({ error: err.message || 'Failed to update enquiry' }, 500);
  }
});

adminRoutes.delete('/enquiries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.delete(enquiries).where(eq(enquiries.id, id));

    return c.json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (err: any) {
    console.error('Delete enquiry failed:', err);
    return c.json({ error: err.message || 'Failed to delete enquiry' }, 500);
  }
});


