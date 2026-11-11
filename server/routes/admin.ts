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
  enquiries,
  invoices,
  plans
} from '../db/schema';
import { requireAuth, requireAdmin } from '../middleware/auth';
import type { Env } from './public';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>();

// All admin routes require Super Admin authentication
adminRoutes.use('*', requireAuth, requireAdmin);

async function ensurePlansTable(d1: D1Database) {
  try {
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        badge TEXT,
        price INTEGER NOT NULL,
        billing_period TEXT NOT NULL DEFAULT 'monthly',
        max_locations INTEGER NOT NULL DEFAULT 1,
        features_json TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run();
  } catch (e) {}

  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN plan_id TEXT`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN plan_name TEXT`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN plan_expires_at INTEGER`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN plan_status TEXT DEFAULT 'active'`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN last_upi_ref TEXT`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN billing_cycle TEXT DEFAULT 'monthly'`).run();
  } catch (e) {}
  try {
    await d1.prepare(`ALTER TABLE users ADD COLUMN phone TEXT`).run();
  } catch (e) {}

  // Seed default 3 plans if empty
  try {
    const existing = await d1.prepare(`SELECT COUNT(*) as cnt FROM plans`).first<{ cnt: number }>();
    if (!existing || existing.cnt === 0) {
      const now = Date.now();
      const defaultPlans = [
        {
          id: 'plan_starter',
          name: 'Starter',
          badge: 'Starter',
          price: 999,
          billing_period: 'one_time',
          max_locations: 1,
          features_json: JSON.stringify([
            '1 NFC + QR Smart Acrylic Standee',
            'Static Review QR Code',
            'Ungated Direct Google Review Flow',
            'WhatsApp Support'
          ]),
          is_active: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 'plan_growth',
          name: 'Growth (NFC + Review Sync)',
          badge: 'Popular',
          price: 2499,
          billing_period: 'monthly',
          max_locations: 3,
          features_json: JSON.stringify([
            '3 NFC + QR Smart Standees',
            'AI Multilingual Review Copilot',
            'AI-Powered Owner Reply Studio',
            'Real-Time Scan & Click Analytics',
            'Priority WhatsApp & Call Support'
          ]),
          is_active: 1,
          created_at: now,
          updated_at: now
        },
        {
          id: 'plan_enterprise',
          name: 'Enterprise (Multi-Outlet)',
          badge: 'Bestseller',
          price: 4999,
          billing_period: 'monthly',
          max_locations: 10,
          features_json: JSON.stringify([
            'Custom Branded Standees',
            'Multi-Outlet Franchise Dashboard',
            'Automated Daily Review Sync',
            'Role-Based Access Control (RBAC)',
            'Dedicated Account Manager'
          ]),
          is_active: 1,
          created_at: now,
          updated_at: now
        }
      ];

      for (const p of defaultPlans) {
        await d1.prepare(`
          INSERT INTO plans (id, name, badge, price, billing_period, max_locations, features_json, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(p.id, p.name, p.badge, p.price, p.billing_period, p.max_locations, p.features_json, p.is_active, p.created_at, p.updated_at).run();
      }
    }
  } catch (e) {}
}

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
    const allowedRoles = ['admin', 'manager', 'executive', 'agency', 'owner'];
    const newRole = allowedRoles.includes(body?.role) ? body.role : 'owner';

    const db = getDb(c.env.DB);
    const [target] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (target.email === 'smitpanchal734@gmail.com' && newRole !== 'admin') {
      return c.json({ error: 'Primary Super Administrator role cannot be demoted' }, 403);
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
      message: `User ${target.name} role successfully updated to ${newRole.toUpperCase()}.`,
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

// ──────────────────────────────────────────────
// 7. Full CRM Pipeline (Leads, Stages, Follow-ups, Activities)
// ──────────────────────────────────────────────
adminRoutes.get('/crm/leads', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const list = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
    return c.json({ success: true, leads: list });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch leads' }, 500);
  }
});

adminRoutes.post('/crm/leads', async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);
    const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const leadRecord = {
      id,
      company: body.company || 'Direct Inquiry',
      contactPerson: body.contactPerson || 'Prospect',
      mobile: body.mobile || '',
      email: body.email || '',
      locations: Number(body.locations) || 1,
      quantity: body.quantity || '1 unit',
      product: body.product || 'NFC + QR Standee',
      message: body.message || null,
      status: body.stage || 'new',
      stage: body.stage || 'new',
      notes: body.notes || null,
      source: body.source || 'direct_call',
      assignedTo: body.assignedTo || 'Unassigned',
      followUpDate: body.followUpDate || null,
      followUpStatus: 'pending',
      dealValue: Number(body.dealValue) || 999,
      activityLog: JSON.stringify([
        {
          id: `act_${Date.now()}`,
          text: `Lead created manually (Source: ${body.source || 'direct_call'})`,
          author: c.get('user')?.name || 'Admin',
          createdAt: Date.now(),
          type: 'created'
        }
      ]),
      createdAt: now,
      updatedAt: now
    };

    await db.insert(enquiries).values(leadRecord);
    return c.json({ success: true, message: 'Lead created successfully', lead: leadRecord }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create lead' }, 500);
  }
});

adminRoutes.patch('/crm/leads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const updateData: any = { updatedAt: now };
    if (body.stage !== undefined) {
      updateData.stage = String(body.stage);
      updateData.status = String(body.stage);
    }
    if (body.assignedTo !== undefined) updateData.assignedTo = String(body.assignedTo);
    if (body.followUpDate !== undefined) updateData.followUpDate = body.followUpDate;
    if (body.followUpStatus !== undefined) updateData.followUpStatus = String(body.followUpStatus);
    if (body.dealValue !== undefined) updateData.dealValue = Number(body.dealValue);
    if (body.notes !== undefined) updateData.notes = String(body.notes);
    if (body.company !== undefined) updateData.company = String(body.company);
    if (body.contactPerson !== undefined) updateData.contactPerson = String(body.contactPerson);
    if (body.mobile !== undefined) updateData.mobile = String(body.mobile);
    if (body.email !== undefined) updateData.email = String(body.email);
    if (body.source !== undefined) updateData.source = String(body.source);

    await db.update(enquiries).set(updateData).where(eq(enquiries.id, id));
    return c.json({ success: true, message: 'Lead updated successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update lead' }, 500);
  }
});

adminRoutes.post('/crm/leads/:id/notes', async (c) => {
  try {
    const id = c.req.param('id');
    const { text, type } = await c.req.json();
    if (!text) return c.json({ error: 'Note text is required' }, 400);

    const db = getDb(c.env.DB);
    const [lead] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
    if (!lead) return c.json({ error: 'Lead not found' }, 404);

    let activities = [];
    try {
      activities = lead.activityLog ? JSON.parse(lead.activityLog) : [];
    } catch {}

    const newActivity = {
      id: `act_${Date.now()}`,
      text: String(text).trim(),
      author: c.get('user')?.name || 'Admin',
      createdAt: Date.now(),
      type: type || 'note'
    };
    activities.unshift(newActivity);

    const now = Math.floor(Date.now() / 1000);
    await db.update(enquiries).set({
      activityLog: JSON.stringify(activities),
      updatedAt: now
    }).where(eq(enquiries.id, id));

    return c.json({ success: true, message: 'Conversation note recorded', activity: newActivity });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to add note' }, 500);
  }
});

adminRoutes.delete('/crm/leads/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(enquiries).where(eq(enquiries.id, id));
    return c.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete lead' }, 500);
  }
});

// Convert Lead to Registered Merchant Customer
adminRoutes.post('/crm/leads/:id/convert', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const leadId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    // 1. Fetch lead
    const [lead] = await db.select().from(enquiries).where(eq(enquiries.id, leadId)).limit(1);
    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    const assignedPlanName = body.planName || lead.product || 'Growth (NFC + Review Sync)';
    const assignedPlanId = body.planId || null;
    const leadEmail = (lead.email || '').trim().toLowerCase();
    const leadName = lead.contactPerson?.trim() || lead.company?.trim() || 'Valued Merchant';

    if (!leadEmail) {
      return c.json({ error: 'Lead must have a valid email address to convert' }, 400);
    }

    // 2. Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, leadEmail)).limit(1);
    let customerUser = existingUser;

    if (!customerUser) {
      const newUserId = 'usr_' + Math.random().toString(36).substring(2, 10);
      const now = new Date();
      const initialExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await db.insert(users).values({
        id: newUserId,
        name: leadName,
        email: leadEmail,
        phone: lead.mobile || null,
        role: 'owner',
        planId: assignedPlanId,
        planName: assignedPlanName,
        planExpiresAt: initialExpiresAt,
        planStatus: 'active',
        billingCycle: 'monthly',
        createdAt: now,
        updatedAt: now
      });
      customerUser = { id: newUserId, name: leadName, email: leadEmail, phone: lead.mobile, role: 'owner' } as any;
    } else {
      const curExpires = (customerUser as any).planExpiresAt;
      const newExpires = (curExpires && curExpires > Date.now())
        ? curExpires + 30 * 24 * 60 * 60 * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000;

      await db.update(users).set({
        planId: assignedPlanId,
        planName: assignedPlanName,
        planExpiresAt: newExpires,
        planStatus: 'active',
        phone: lead.mobile || (customerUser as any).phone || null,
        updatedAt: new Date()
      }).where(eq(users.id, customerUser.id));
    }

    // 3. Create initial business if merchant has no business yet
    const existingBiz = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, customerUser.id)).limit(1);
    if (existingBiz.length === 0) {
      const newBizId = 'biz_' + Math.random().toString(36).substring(2, 10);
      const companyName = lead.company?.trim() || `${leadName}'s Business`;
      const bizSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24).replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
      const nowEpoch = Math.floor(Date.now() / 1000);

      await db.insert(businesses).values({
        id: newBizId,
        ownerId: customerUser.id,
        name: companyName,
        slug: bizSlug,
        googleReviewUrl: `https://search.google.com/local/writereview?placeid=preview`,
        phone: lead.mobile || null,
        contactEmail: leadEmail,
        category: 'retail',
        brandVoice: 'warm_grateful',
        brandColor: '#2563EB',
        brandColorSecondary: '#F59E0B',
        isPrimary: true,
        status: 'active',
        createdAt: nowEpoch,
        updatedAt: nowEpoch
      });

      // Create primary QR code
      await db.insert(qrCodes).values({
        id: 'qr_' + Math.random().toString(36).substring(2, 10),
        businessId: newBizId,
        code: bizSlug,
        label: 'Main Cash Counter',
        destinationUrl: `/r/${bizSlug}`,
        styleJson: JSON.stringify({ color: '#2563EB' }),
        isActive: 1,
        createdAt: nowEpoch,
        updatedAt: nowEpoch
      }).catch(() => {});
    }

    // 4. Update Lead to Won / Converted & add conversion note in conversation timeline
    const currentActivities: any[] = lead.activityLog ? JSON.parse(lead.activityLog) : [];
    currentActivities.unshift({
      id: 'act_' + Date.now(),
      text: `Converted to Merchant Customer with "${assignedPlanName}" plan. Account created & visible in Customer 360.`,
      author: 'Super Admin',
      createdAt: Date.now(),
      type: 'conversion'
    });

    await db.update(enquiries).set({
      stage: 'won',
      status: 'converted',
      activityLog: JSON.stringify(currentActivities),
      updatedAt: Math.floor(Date.now() / 1000)
    }).where(eq(enquiries.id, leadId));

    return c.json({
      success: true,
      message: `Lead successfully converted! Customer "${leadName}" is now active in Customer 360 with plan "${assignedPlanName}".`,
      customerId: customerUser.id
    });
  } catch (err: any) {
    console.error('Lead conversion failed:', err);
    return c.json({ error: err.message || 'Failed to convert lead to customer' }, 500);
  }
});

// ──────────────────────────────────────────────
// 8. Customer 360 Management & Subscriptions
// ──────────────────────────────────────────────
adminRoutes.get('/crm/customers', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);

    const [userList, bizList, scanList, reviewList, invoiceList, locationList, enquiryList] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(businesses),
      db.select({ id: scans.id, businessId: scans.businessId }).from(scans),
      db.select({ id: customerReviews.id, businessId: customerReviews.businessId, replyText: customerReviews.replyText }).from(customerReviews),
      db.select().from(invoices).catch(() => []),
      db.select({ id: locations.id, businessId: locations.businessId }).from(locations),
      db.select({ email: enquiries.email, mobile: enquiries.mobile }).from(enquiries).catch(() => [])
    ]);

    // Map lead mobile number by email
    const leadPhoneByEmail: Record<string, string> = {};
    for (const enq of (enquiryList as any[])) {
      if (enq.email && enq.mobile) {
        leadPhoneByEmail[enq.email.toLowerCase().trim()] = enq.mobile.trim();
      }
    }

    // Group businesses by owner
    const bizByOwner: Record<string, typeof bizList> = {};
    for (const b of bizList) {
      if (!bizByOwner[b.ownerId]) bizByOwner[b.ownerId] = [];
      bizByOwner[b.ownerId].push(b);
    }

    // Group scans by businessId
    const scansByBiz: Record<string, number> = {};
    for (const s of scanList) {
      scansByBiz[s.businessId] = (scansByBiz[s.businessId] || 0) + 1;
    }

    // Group reviews & replies by businessId
    const reviewsByBiz: Record<string, { count: number; replies: number }> = {};
    for (const r of reviewList) {
      if (!reviewsByBiz[r.businessId]) reviewsByBiz[r.businessId] = { count: 0, replies: 0 };
      reviewsByBiz[r.businessId].count += 1;
      if (r.replyText) reviewsByBiz[r.businessId].replies += 1;
    }

    // Group locations by businessId
    const locationsByBiz: Record<string, number> = {};
    for (const l of locationList) {
      locationsByBiz[l.businessId] = (locationsByBiz[l.businessId] || 0) + 1;
    }

    // Group invoices by customerId
    const invoicesByCustomer: Record<string, any[]> = {};
    for (const inv of invoiceList as any[]) {
      if (inv.customerId) {
        if (!invoicesByCustomer[inv.customerId]) invoicesByCustomer[inv.customerId] = [];
        invoicesByCustomer[inv.customerId].push(inv);
      }
    }

    const customers = userList.map((u) => {
      const myBusinesses = bizByOwner[u.id] || [];
      let totalScans = 0;
      let totalReviews = 0;
      let totalReplies = 0;
      let totalLocations = myBusinesses.length;

      for (const b of myBusinesses) {
        totalScans += scansByBiz[b.id] || 0;
        totalReviews += reviewsByBiz[b.id]?.count || 0;
        totalReplies += reviewsByBiz[b.id]?.replies || 0;
        totalLocations += locationsByBiz[b.id] || 0;
      }

      const myInvoices = invoicesByCustomer[u.id] || [];
      const totalBilled = myInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
      const totalPaid = myInvoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

      const planName = (u as any).planName || (myBusinesses.length > 3 ? 'Enterprise (Multi-Outlet)' : myBusinesses.length > 0 ? 'Growth (NFC + Review Sync)' : 'Starter');
      const planId = (u as any).planId || null;
      const planStatus = u.isBlocked ? 'suspended' : 'active';

      // Parse timestamp safely to number epoch ms
      const createdAtMs = u.createdAt instanceof Date ? u.createdAt.getTime() : typeof u.createdAt === 'number' ? (u.createdAt < 1e11 ? u.createdAt * 1000 : u.createdAt) : (new Date(u.createdAt).getTime() || Date.now());
      const lastLoginAtMs = u.lastLoginAt ? (u.lastLoginAt instanceof Date ? u.lastLoginAt.getTime() : typeof u.lastLoginAt === 'number' ? (u.lastLoginAt < 1e11 ? u.lastLoginAt * 1000 : u.lastLoginAt) : new Date(u.lastLoginAt).getTime()) : null;

      const nowMs = Date.now();
      let expiresAtMs = (u as any).planExpiresAt;
      if (!expiresAtMs) {
        expiresAtMs = createdAtMs + 30 * 24 * 60 * 60 * 1000;
      }
      if (typeof expiresAtMs === 'number' && expiresAtMs < 1e11) {
        expiresAtMs = expiresAtMs * 1000;
      }

      const diffMs = expiresAtMs - nowMs;
      const daysLeft = Math.ceil(diffMs / (86400 * 1000));

      let calculatedStatus: 'active' | 'expiring_soon' | 'expired' = 'active';
      if (u.isBlocked) {
        calculatedStatus = 'expired';
      } else if (daysLeft < 0) {
        calculatedStatus = 'expired';
      } else if (daysLeft <= 5) {
        calculatedStatus = 'expiring_soon';
      } else {
        calculatedStatus = 'active';
      }

      const lastUpiRef = (u as any).lastUpiRef || null;
      const billingCycle = (u as any).billingCycle || 'monthly';
      const userEmail = (u.email || '').toLowerCase().trim();
      const customerPhone = (u as any).phone || leadPhoneByEmail[userEmail] || myBusinesses.find((b) => b.phone)?.phone || null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: customerPhone,
        role: u.role || 'owner',
        isBlocked: Boolean(u.isBlocked),
        createdAt: createdAtMs,
        lastLoginAt: lastLoginAtMs,
        businesses: myBusinesses.map((b) => ({ id: b.id, name: b.name, city: b.city, slug: b.slug, phone: b.phone })),
        totalLocations: Math.max(1, totalLocations),
        totalScans,
        totalReviews,
        totalReplies,
        plan: {
          id: planId,
          name: planName,
          status: calculatedStatus,
          billingCycle,
          expiresAt: expiresAtMs,
          daysLeft,
          lastUpiRef
        },
        billing: {
          invoiceCount: myInvoices.length,
          totalBilled,
          totalPaid
        }
      };
    });

    return c.json({ success: true, customers });
  } catch (err: any) {
    console.error('Fetch CRM customers failed:', err);
    return c.json({ error: err.message || 'Failed to fetch customers' }, 500);
  }
});

// Upgrade / Downgrade customer subscription plan
adminRoutes.patch('/crm/customers/:id/plan', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const customerId = c.req.param('id');
    const body = await c.req.json();
    const { planId, planName } = body;
    if (!planName) {
      return c.json({ error: 'Plan name is required' }, 400);
    }

    await db.update(users).set({
      planId: planId || null,
      planName: planName.trim(),
      updatedAt: new Date()
    }).where(eq(users.id, customerId));

    return c.json({ success: true, message: `Customer plan successfully updated to "${planName}"` });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update customer plan' }, 500);
  }
});

// Update customer profile details (phone, name)
adminRoutes.patch('/crm/customers/:id', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const customerId = c.req.param('id');
    const body = await c.req.json();
    const { name, phone } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    await db.update(users).set(updateData).where(eq(users.id, customerId));

    // Also update phone on primary business if available
    if (phone !== undefined) {
      await db.update(businesses).set({ phone: phone ? phone.trim() : null }).where(eq(businesses.ownerId, customerId));
    }

    return c.json({ success: true, message: 'Customer details updated successfully!' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update customer details' }, 500);
  }
});

// Record direct UPI payment and renew subscription (+1 Month / +X Months)
adminRoutes.post('/crm/customers/:id/renew', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const customerId = c.req.param('id');
    const body = await c.req.json();
    const {
      monthsToAdd = 1,
      upiRef = '',
      amount = 999,
      planId,
      planName,
      generateInvoice = true
    } = body;

    const [user] = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
    if (!user) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const now = Date.now();
    const currentExpires = (user as any).planExpiresAt;
    const baseTimestamp = (currentExpires && currentExpires > now) ? currentExpires : now;
    const durationMs = Number(monthsToAdd) * 30 * 24 * 60 * 60 * 1000;
    const newExpiresAt = baseTimestamp + durationMs;

    const finalPlanName = planName || (user as any).planName || 'Growth (NFC + Review Sync)';
    const finalPlanId = planId || (user as any).planId || null;

    // Update user record
    await db.update(users).set({
      planExpiresAt: newExpiresAt,
      planStatus: 'active',
      lastUpiRef: upiRef ? upiRef.trim() : (user as any).lastUpiRef,
      planId: finalPlanId,
      planName: finalPlanName,
      updatedAt: new Date()
    }).where(eq(users.id, customerId));

    let createdInvoice = null;
    if (generateInvoice && amount > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const invNumber = `INV-${new Date().getFullYear()}-${randomNum}`;
      
      const subtotal = Math.round(Number(amount) / 1.18);
      const taxAmount = Number(amount) - subtotal;

      const items = [
        {
          id: 'item_1',
          name: `${finalPlanName} Subscription (${monthsToAdd} Month Renewal)`,
          quantity: 1,
          rate: subtotal,
          amount: subtotal
        }
      ];

      await db.insert(invoices).values({
        id: invId,
        invoiceNumber: invNumber,
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        itemsJson: JSON.stringify(items),
        subtotal,
        taxRate: 18,
        taxAmount,
        totalAmount: Number(amount),
        status: 'paid',
        paymentMethod: 'upi',
        paymentId: upiRef ? upiRef.trim() : `UPI-${Date.now().toString().slice(-6)}`,
        paidAt: nowSec,
        dueDate: nowSec,
        notes: `Subscription renewed via direct UPI for ${monthsToAdd} month(s). UTR: ${upiRef || 'Direct Transfer'}`,
        createdAt: nowSec,
        updatedAt: nowSec
      });

      createdInvoice = { id: invId, invoiceNumber: invNumber, totalAmount: Number(amount) };
    }

    return c.json({
      success: true,
      message: `Subscription successfully renewed! Valid until ${new Date(newExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
      newExpiresAt,
      invoice: createdInvoice
    });
  } catch (err: any) {
    console.error('Customer renewal failed:', err);
    return c.json({ error: err.message || 'Failed to renew customer subscription' }, 500);
  }
});

// ──────────────────────────────────────────────
// 9. Billing, Invoices & Payment Receipts
// ──────────────────────────────────────────────
adminRoutes.get('/crm/invoices', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const list = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    return c.json({ success: true, invoices: list });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch invoices' }, 500);
  }
});

adminRoutes.post('/crm/invoices', async (c) => {
  try {
    const body = await c.req.json();
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = body.invoiceNumber || `INV-${new Date().getFullYear()}-${randomNum}`;

    const items = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : [{ description: body.itemDescription || 'Smart Review Standee Hardware', qty: 1, unitPrice: Number(body.subtotal) || 999, amount: Number(body.subtotal) || 999 }];

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.amount) || (Number(it.qty) * Number(it.unitPrice))), 0);
    const taxRate = 18; // 18% GST standard
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalAmount = subtotal + taxAmount;

    const invoiceRecord = {
      id,
      invoiceNumber,
      customerId: body.customerId || null,
      customerName: body.customerName || 'Valued Merchant',
      customerEmail: body.customerEmail || '',
      customerPhone: body.customerPhone || null,
      businessId: body.businessId || null,
      businessName: body.businessName || 'Business Outlet',
      itemsJson: JSON.stringify(items),
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      status: body.status || 'paid',
      paymentMethod: body.paymentMethod || 'upi',
      paymentId: body.paymentId || `TXN_${Date.now()}`,
      paidAt: body.status === 'paid' ? now : null,
      dueDate: now + 7 * 24 * 60 * 60,
      notes: body.notes || 'Thank you for choosing Loctimize ReviewQR!',
      createdAt: now,
      updatedAt: now
    };

    await db.insert(invoices).values(invoiceRecord);
    return c.json({ success: true, message: 'Invoice generated successfully', invoice: invoiceRecord }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create invoice' }, 500);
  }
});

adminRoutes.patch('/crm/invoices/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, paymentMethod, paymentId } = await c.req.json();
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const updateData: any = { updatedAt: now };
    if (status) updateData.status = String(status);
    if (status === 'paid') updateData.paidAt = now;
    if (paymentMethod) updateData.paymentMethod = String(paymentMethod);
    if (paymentId) updateData.paymentId = String(paymentId);

    await db.update(invoices).set(updateData).where(eq(invoices.id, id));
    return c.json({ success: true, message: 'Invoice status updated successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update invoice' }, 500);
  }
});

adminRoutes.delete('/crm/invoices/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(invoices).where(eq(invoices.id, id));
    return c.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete invoice' }, 500);
  }
});

// ──────────────────────────────────────────────
// 10. Team & Roles Management (Admin, Manager, Executive, Agency)
// ──────────────────────────────────────────────
adminRoutes.get('/crm/team', async (c) => {
  try {
    const db = getDb(c.env.DB);
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allLeads = await db.select({ assignedTo: enquiries.assignedTo }).from(enquiries);

    // Count workload per team member
    const workload: Record<string, number> = {};
    for (const l of allLeads) {
      if (l.assignedTo) {
        workload[l.assignedTo] = (workload[l.assignedTo] || 0) + 1;
      }
    }

    const team = allUsers.map((u) => {
      const isSuperAdmin = (u.email || '').toLowerCase().trim() === 'smitpanchal734@gmail.com';
      const role = isSuperAdmin ? 'admin' : (u.role || 'owner');
      const createdAtMs = u.createdAt instanceof Date ? u.createdAt.getTime() : typeof u.createdAt === 'number' ? (u.createdAt < 1e11 ? u.createdAt * 1000 : u.createdAt) : (new Date(u.createdAt).getTime() || Date.now());
      const lastLoginAtMs = u.lastLoginAt ? (u.lastLoginAt instanceof Date ? u.lastLoginAt.getTime() : typeof u.lastLoginAt === 'number' ? (u.lastLoginAt < 1e11 ? u.lastLoginAt * 1000 : u.lastLoginAt) : new Date(u.lastLoginAt).getTime()) : null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        isBlocked: Boolean(u.isBlocked),
        assignedLeadsCount: workload[u.name] || workload[u.email] || 0,
        createdAt: createdAtMs,
        lastLoginAt: lastLoginAtMs
      };
    });

    return c.json({ success: true, team });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch team' }, 500);
  }
});

// ──────────────────────────────────────────────
// 11. Plans Catalog Management (Add, Edit, Delete)
// ──────────────────────────────────────────────
adminRoutes.get('/crm/plans', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const list = await db.select().from(plans).orderBy(desc(plans.createdAt));
    return c.json({ success: true, plans: list });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch plans' }, 500);
  }
});

adminRoutes.post('/crm/plans', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const body = await c.req.json();
    if (!body.name || body.price === undefined) {
      return c.json({ error: 'Plan name and price are required' }, 400);
    }

    const planId = 'plan_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const newPlan = {
      id: planId,
      name: body.name.trim(),
      badge: body.badge?.trim() || null,
      price: Number(body.price) || 0,
      billingPeriod: body.billingPeriod || 'monthly',
      maxLocations: Number(body.maxLocations) || 1,
      featuresJson: typeof body.features === 'string' ? body.features : JSON.stringify(body.features || []),
      isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
      createdAt: now,
      updatedAt: now
    };

    await db.insert(plans).values(newPlan);
    return c.json({ success: true, message: 'Plan created successfully', plan: newPlan }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create plan' }, 500);
  }
});

adminRoutes.put('/crm/plans/:id', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const updateData: any = { updatedAt: Date.now() };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.badge !== undefined) updateData.badge = body.badge?.trim() || null;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.billingPeriod !== undefined) updateData.billingPeriod = body.billingPeriod;
    if (body.maxLocations !== undefined) updateData.maxLocations = Number(body.maxLocations);
    if (body.features !== undefined) {
      updateData.featuresJson = typeof body.features === 'string' ? body.features : JSON.stringify(body.features);
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

    await db.update(plans).set(updateData).where(eq(plans.id, id));
    return c.json({ success: true, message: 'Plan updated successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update plan' }, 500);
  }
});

adminRoutes.delete('/crm/plans/:id', async (c) => {
  try {
    await ensurePlansTable(c.env.DB);
    const db = getDb(c.env.DB);
    const id = c.req.param('id');
    await db.delete(plans).where(eq(plans.id, id));
    return c.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete plan' }, 500);
  }
});


