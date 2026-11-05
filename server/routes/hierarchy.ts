import { Hono } from 'hono';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  brands,
  businesses,
  locations,
  memberships,
  users,
  accounts,
  customerReviews
} from '../db/schema';
import type { Env } from './public';

export const hierarchyRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>();

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':reviewboost_auth_salt_2026');
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getOwnerId(c: any): string {
  const headerOwnerId = c.req.header('X-Owner-Id') || c.req.header('X-Dev-Owner-Id');
  if (headerOwnerId) return headerOwnerId;
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer gauth_')) {
    return authHeader.replace('Bearer gauth_', '').split('_')[0];
  }
  return c.get('ownerId') || 'owner-default';
}

/**
 * GET /api/hierarchy
 * Returns the entire 3-tier hierarchy (Brands -> Businesses -> Branches)
 * accessible to the currently authenticated user with membership roles.
 */
hierarchyRoutes.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const ownerId = getOwnerId(c);

  try {
    // 1. Fetch user's explicit memberships
    const userMemberships = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, ownerId), eq(memberships.status, 'active')));

    const brandIdsFromMembership = userMemberships.map((m: any) => m.brandId).filter(Boolean) as string[];
    const businessIdsFromMembership = userMemberships.map((m: any) => m.businessId).filter(Boolean) as string[];
    const branchIdsFromMembership = userMemberships.map((m: any) => m.branchId).filter(Boolean) as string[];

    // 2. Fetch Brands (Owned by user OR permitted by membership)
    let userBrands = await db
      .select()
      .from(brands)
      .where(
        brandIdsFromMembership.length > 0
          ? sql`${brands.ownerId} = ${ownerId} OR ${brands.id} IN ${brandIdsFromMembership}`
          : eq(brands.ownerId, ownerId)
      )
      .orderBy(desc(brands.createdAt));

    // 3. Fetch Businesses
    let userBusinesses = await db
      .select()
      .from(businesses)
      .where(
        businessIdsFromMembership.length > 0
          ? sql`${businesses.ownerId} = ${ownerId} OR ${businesses.id} IN ${businessIdsFromMembership}`
          : eq(businesses.ownerId, ownerId)
      )
      .orderBy(desc(businesses.createdAt));

    // Check caller role & permissions
    const isOwner = userBrands.some((b: any) => b.ownerId === ownerId) || userBusinesses.some((b: any) => b.ownerId === ownerId);
    const isBrandAdmin = userMemberships.some((m: any) => m.role === 'super_admin' || m.role === 'brand_admin');
    const isBusinessAdmin = userMemberships.some((m: any) => m.role === 'business_admin');
    const isExecutive = !isOwner && !isBrandAdmin && !isBusinessAdmin && userMemberships.some((m: any) => m.role === 'review_executive' || m.role === 'branch_manager');

    // Backward-compatibility: If user has businesses but no brand yet, auto-generate a primary brand
    // ONLY for true owners, NEVER for executives or staff members!
    if (!isExecutive && userBrands.length === 0 && userBusinesses.length > 0 && userBusinesses.some((b: any) => b.ownerId === ownerId)) {
      const primaryBiz = userBusinesses[0];
      const defaultBrandId = `brand_${primaryBiz.id.replace('biz_', '')}`;
      const defaultBrandName = primaryBiz.name.includes('Group')
        ? primaryBiz.name
        : `${primaryBiz.name} Group`;
      const defaultBrandSlug = `${primaryBiz.slug}-group`;

      try {
        const now = Math.floor(Date.now() / 1000);
        await db.insert(brands).values({
          id: defaultBrandId,
          ownerId: ownerId,
          name: defaultBrandName,
          slug: defaultBrandSlug,
          plan: 'growth',
          status: 'active',
          createdAt: now,
          updatedAt: now
        }).onConflictDoNothing();

        // Link existing businesses to this brand
        await db
          .update(businesses)
          .set({ brandId: defaultBrandId, businessType: 'company_owned' })
          .where(eq(businesses.ownerId, ownerId));

        userBrands = await db.select().from(brands).where(eq(brands.id, defaultBrandId));
        userBusinesses = await db.select().from(businesses).where(eq(businesses.ownerId, ownerId));
      } catch (autoErr) {
        console.warn('Auto brand initialization note:', autoErr);
      }
    }

    // 4. Fetch Branches (Locations) for all retrieved businesses
    const allBusinessIds = userBusinesses.map((b: any) => b.id);
    let allBranches: any[] = [];
    if (allBusinessIds.length > 0) {
      allBranches = await db
        .select()
        .from(locations)
        .where(
          branchIdsFromMembership.length > 0
            ? sql`${locations.businessId} IN ${allBusinessIds} OR ${locations.id} IN ${branchIdsFromMembership}`
            : inArray(locations.businessId, allBusinessIds)
        )
        .orderBy(desc(locations.createdAt));
    }

    // STRICT ISOLATION FOR EXECUTIVES & BRANCH MANAGERS:
    if (isExecutive && branchIdsFromMembership.length > 0) {
      // 1. Only show the exact branch(es) this executive was assigned to
      allBranches = allBranches.filter((br: any) => branchIdsFromMembership.includes(br.id));

      // 2. Only show the parent business of their branch
      const assignedBizIds = Array.from(new Set(allBranches.map((br: any) => br.businessId)));
      userBusinesses = userBusinesses.filter((b: any) => assignedBizIds.includes(b.id));

      // 3. Executives do not have brand organization permissions
      userBrands = [];
    }

    // 5. Ensure each business has at least 1 primary branch (auto-map from business Google details if empty)
    for (const biz of userBusinesses) {
      const bizBranches = allBranches.filter((br: any) => br.businessId === biz.id);
      if (bizBranches.length === 0 && biz.googleReviewUrl) {
        const now = Math.floor(Date.now() / 1000);
        const branchId = `branch_${biz.id.replace('biz_', '')}_main`;
        try {
          await db.insert(locations).values({
            id: branchId,
            businessId: biz.id,
            name: `${biz.name} (Main Branch)`,
            slug: `${biz.slug}-main`,
            address: biz.address || 'Main Location',
            city: biz.city || 'India',
            phone: biz.phone,
            googlePlaceId: biz.googlePlaceId,
            googleReviewUrl: biz.googleReviewUrl,
            status: 'active',
            isPrimary: true,
            createdAt: now,
            updatedAt: now
          }).onConflictDoNothing();

          const [newBranch] = await db.select().from(locations).where(eq(locations.id, branchId));
          if (newBranch) allBranches.push(newBranch);
        } catch (branchErr) {
          console.warn('Auto branch creation note:', branchErr);
        }
      }
    }

    const hasPrimaryBiz = userBusinesses.some((b: any) => b.isPrimary);
    const finalBusinesses = userBusinesses.map((b: any, idx: number) => ({
      ...b,
      isPrimary: hasPrimaryBiz ? Boolean(b.isPrimary) : idx === (userBusinesses.length - 1)
    }));

    return c.json({
      success: true,
      brands: userBrands,
      businesses: finalBusinesses,
      branches: allBranches,
      memberships: userMemberships,
      roles: {
        isSuperAdmin: (c.get('user') as any)?.role === 'admin' || ownerId === 'admin_user',
        hasBrandAccess: isOwner || isBrandAdmin,
        hasBusinessAccess: isOwner || isBrandAdmin || isBusinessAdmin,
        hasBranchAccess: allBranches.length > 0,
        isExecutive: Boolean(isExecutive),
        assignedRole: userMemberships[0]?.role || (isOwner ? 'owner' : 'member'),
        assignedBranchId: userMemberships[0]?.branchId || (allBranches[0]?.id ?? null)
      }
    });
  } catch (err: any) {
    console.error('Error in /api/hierarchy:', err);
    return c.json({ error: err.message || 'Failed to fetch hierarchy' }, 500);
  }
});

/**
 * POST /api/brands
 * Create a new Brand / Organization (e.g. ABC Wellness Group)
 */
hierarchyRoutes.post('/brands', async (c) => {
  const db = getDb(c.env.DB);
  const ownerId = getOwnerId(c);
  const body = await c.req.json().catch(() => ({}));

  if (!body.name || !body.name.trim()) {
    return c.json({ error: 'Brand name is required' }, 400);
  }

  const brandName = body.name.trim();
  const rawSlug = (body.slug || brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '') || 'brand';
  const slug = `${rawSlug}-${Math.random().toString(36).substring(2, 6)}`;
  const brandId = `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // 1. Ensure user row exists in users table FIRST so foreign key constraint never fails!
    try {
      await db.insert(users).values({
        id: ownerId,
        name: 'Store Owner',
        email: `${ownerId}@reviewqr.local`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    } catch (uErr) {
      console.warn('Pre-insert user notice:', uErr);
    }

    // 2. Insert Brand
    await db.insert(brands).values({
      id: brandId,
      ownerId: ownerId,
      name: brandName,
      slug: slug,
      logoUrl: body.logoUrl || null,
      description: body.description || null,
      plan: body.plan || 'growth',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    // 3. Create owner membership
    try {
      await db.insert(memberships).values({
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: ownerId,
        role: 'brand_admin',
        brandId: brandId,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing();
    } catch (mErr) {
      console.warn('Pre-insert membership notice:', mErr);
    }

    const [created] = await db.select().from(brands).where(eq(brands.id, brandId));
    return c.json({ success: true, brand: created }, 201);
  } catch (err: any) {
    console.error('Failed to create brand:', err);
    return c.json({ error: err.message || 'Failed to create brand' }, 500);
  }
});

/**
 * PATCH /api/hierarchy/brands/:brandId
 * Update Brand Profile (name, logoUrl, description, plan)
 */
hierarchyRoutes.patch('/brands/:brandId', async (c) => {
  const db = getDb(c.env.DB);
  const ownerId = getOwnerId(c);
  const brandId = c.req.param('brandId');
  const body = await c.req.json().catch(() => ({}));

  try {
    const [existing] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, brandId), eq(brands.ownerId, ownerId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Brand not found or unauthorized' }, 404);
    }

    const now = Math.floor(Date.now() / 1000);
    const updatePayload: Record<string, any> = { updatedAt: now };

    if (body.name !== undefined && body.name.trim()) {
      updatePayload.name = body.name.trim();
    }
    if (body.logoUrl !== undefined) {
      updatePayload.logoUrl = body.logoUrl ? body.logoUrl.trim() : null;
    }
    if (body.description !== undefined) {
      updatePayload.description = body.description ? body.description.trim() : null;
    }
    if (body.plan !== undefined && body.plan.trim()) {
      updatePayload.plan = body.plan.trim();
    }

    await db
      .update(brands)
      .set(updatePayload)
      .where(eq(brands.id, brandId));

    const [updated] = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    return c.json({ success: true, brand: updated });
  } catch (err: any) {
    console.error('Failed to update brand:', err);
    return c.json({ error: err.message || 'Failed to update brand' }, 500);
  }
});

/**
 * GET /api/brands/:brandId/summary
 * Consolidated statistics across all businesses and branches in a Brand
 */
hierarchyRoutes.get('/brands/:brandId/summary', async (c) => {
  const db = getDb(c.env.DB);
  const brandId = c.req.param('brandId');

  try {
    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
    if (!brand) {
      return c.json({ error: 'Brand not found' }, 404);
    }

    const brandBusinesses = await db.select().from(businesses).where(eq(businesses.brandId, brandId));
    const bizIds = brandBusinesses.map((b: any) => b.id);

    let brandBranches: any[] = [];
    let brandReviews: any[] = [];

    if (bizIds.length > 0) {
      brandBranches = await db.select().from(locations).where(inArray(locations.businessId, bizIds));
      brandReviews = await db.select().from(customerReviews).where(inArray(customerReviews.businessId, bizIds));
    }

    const totalReviews = brandReviews.length;
    const repliedCount = brandReviews.filter((r: any) => Boolean(r.replyText)).length;
    const avgRating = totalReviews > 0
      ? (brandReviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

    return c.json({
      success: true,
      summary: {
        brand,
        totalBusinesses: brandBusinesses.length,
        companyOwnedCount: brandBusinesses.filter((b: any) => b.businessType === 'company_owned').length,
        franchiseCount: brandBusinesses.filter((b: any) => b.businessType === 'franchise').length,
        totalBranches: brandBranches.length,
        totalReviews,
        repliedReviews: repliedCount,
        responseRate: totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 100,
        averageRating: Number(avgRating),
        businesses: brandBusinesses.map((b: any) => ({
          id: b.id,
          name: b.name,
          businessType: b.businessType,
          city: b.city,
          branchesCount: brandBranches.filter((br: any) => br.businessId === b.id).length
        }))
      }
    });
  } catch (err: any) {
    console.error('Brand summary error:', err);
    return c.json({ error: err.message || 'Failed to fetch brand summary' }, 500);
  }
});

/**
 * GET /api/memberships
 * List team members and their roles
 */
hierarchyRoutes.get('/memberships', async (c) => {
  const db = getDb(c.env.DB);
  const brandId = c.req.query('brandId');
  const businessId = c.req.query('businessId');
  const branchId = c.req.query('branchId');

  try {
    let query = db.select({
      id: memberships.id,
      userId: memberships.userId,
      role: memberships.role,
      brandId: memberships.brandId,
      businessId: memberships.businessId,
      branchId: memberships.branchId,
      status: memberships.status,
      invitedEmail: memberships.invitedEmail,
      createdAt: memberships.createdAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id));

    const conditions: any[] = [];
    if (brandId) conditions.push(eq(memberships.brandId, brandId));
    if (businessId) conditions.push(eq(memberships.businessId, businessId));
    if (branchId) conditions.push(eq(memberships.branchId, branchId));

    const members = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(memberships.createdAt))
      : await query.orderBy(desc(memberships.createdAt));

    return c.json({ success: true, members });
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch memberships' }, 500);
  }
});

/**
 * POST /api/memberships
 * Invite / Assign a team member to a role with Login Password
 */
hierarchyRoutes.post('/memberships', async (c) => {
  const db = getDb(c.env.DB);
  const body = await c.req.json().catch(() => ({}));

  if (!body.email || !body.role) {
    return c.json({ error: 'Email and role are required' }, 400);
  }

  const validRoles = [
    'super_admin',
    'brand_admin',
    'business_admin',
    'branch_manager',
    'review_executive',
    'finance_manager'
  ];

  if (!validRoles.includes(body.role)) {
    return c.json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const cleanName = (body.name || '').trim() || cleanEmail.split('@')[0];
  const password = body.password ? String(body.password).trim() : '';

  if (password && password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters long' }, 400);
  }

  try {
    // 1. Check if user already exists
    let [targetUser] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const now = Math.floor(Date.now() / 1000);
    const nowDate = new Date();

    if (!targetUser) {
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(users).values({
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        emailVerified: true,
        role: 'owner',
        createdAt: nowDate,
        updatedAt: nowDate
      });
      [targetUser] = await db.select().from(users).where(eq(users.id, newUserId));
    } else if (body.name && body.name.trim()) {
      await db.update(users).set({ name: cleanName, updatedAt: nowDate }).where(eq(users.id, targetUser.id));
    }

    // 2. Set or Update Password in accounts table so this team member can log in separately!
    if (password) {
      const hashedPassword = await hashPassword(password);
      const [existingAccount] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.userId, targetUser.id), eq(accounts.providerId, 'credentials')))
        .limit(1);

      if (existingAccount) {
        await db.update(accounts)
          .set({ password: hashedPassword, updatedAt: nowDate })
          .where(eq(accounts.id, existingAccount.id));
      } else {
        const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await db.insert(accounts).values({
          id: accountId,
          userId: targetUser.id,
          accountId: cleanEmail,
          providerId: 'credentials',
          password: hashedPassword,
          createdAt: nowDate,
          updatedAt: nowDate
        });
      }
    }

    // 3. Create active membership scoped to Brand, Business, or Branch
    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(memberships).values({
      id: membershipId,
      userId: targetUser.id,
      role: body.role,
      brandId: body.brandId || null,
      businessId: body.businessId || null,
      branchId: body.branchId || null,
      status: 'active',
      invitedEmail: cleanEmail,
      createdAt: now,
      updatedAt: now
    });

    return c.json({
      success: true,
      message: `Role ${body.role} assigned to ${cleanEmail}`,
      memberId: membershipId,
      email: cleanEmail,
      name: cleanName
    }, 201);
  } catch (err: any) {
    console.error('Failed to assign membership:', err);
    return c.json({ error: err.message || 'Failed to assign role' }, 500);
  }
});

/**
 * POST /api/memberships/:id/reset-password
 * Reset / Update a team member's login password
 */
hierarchyRoutes.post('/memberships/:id/reset-password', async (c) => {
  const db = getDb(c.env.DB);
  const membershipId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const password = body.password ? String(body.password).trim() : '';

  if (!password || password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters long' }, 400);
  }

  try {
    const [membership] = await db
      .select({ id: memberships.id, userId: memberships.userId, invitedEmail: memberships.invitedEmail })
      .from(memberships)
      .where(eq(memberships.id, membershipId))
      .limit(1);

    if (!membership) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    const hashedPassword = await hashPassword(password);
    const nowDate = new Date();

    const [existingAccount] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, membership.userId), eq(accounts.providerId, 'credentials')))
      .limit(1);

    if (existingAccount) {
      await db.update(accounts)
        .set({ password: hashedPassword, updatedAt: nowDate })
        .where(eq(accounts.id, existingAccount.id));
    } else {
      const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(accounts).values({
        id: accountId,
        userId: membership.userId,
        accountId: membership.invitedEmail || `user_${membership.userId}`,
        providerId: 'credentials',
        password: hashedPassword,
        createdAt: nowDate,
        updatedAt: nowDate
      });
    }

    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('Failed to reset password:', err);
    return c.json({ error: err.message || 'Failed to reset password' }, 500);
  }
});

/**
 * DELETE /api/memberships/:id
 * Revoke team member access
 */
hierarchyRoutes.delete('/memberships/:id', async (c) => {
  const db = getDb(c.env.DB);
  const membershipId = c.req.param('id');
  try {
    await db.delete(memberships).where(eq(memberships.id, membershipId));
    return c.json({ success: true, message: 'Membership access revoked' });
  } catch (err: any) {
    console.error('Failed to revoke membership:', err);
    return c.json({ error: err.message || 'Failed to revoke membership' }, 500);
  }
});
