import { Hono } from 'hono';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  brands,
  businesses,
  locations,
  memberships,
  users,
  customerReviews
} from '../db/schema';
import type { Env } from './public';

export const hierarchyRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string; user?: any } }>();

/**
 * GET /api/hierarchy
 * Returns the entire 3-tier hierarchy (Brands -> Businesses -> Branches)
 * accessible to the currently authenticated user with membership roles.
 */
hierarchyRoutes.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const ownerId = c.get('ownerId');

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

    // Backward-compatibility: If user has businesses but no brand yet, auto-generate a primary brand
    if (userBrands.length === 0 && userBusinesses.length > 0) {
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

    return c.json({
      success: true,
      brands: userBrands,
      businesses: userBusinesses,
      branches: allBranches,
      memberships: userMemberships,
      roles: {
        isSuperAdmin: (c.get('user') as any)?.role === 'admin' || ownerId === 'admin_user',
        hasBrandAccess: userBrands.length > 0,
        hasBusinessAccess: userBusinesses.length > 0,
        hasBranchAccess: allBranches.length > 0
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
  const ownerId = c.get('ownerId');
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

    // Ensure user row exists in users table so foreign key constraint never fails
    try {
      await db.insert(users).values({
        id: ownerId,
        name: 'Store Owner',
        email: `${ownerId}@reviewqr.local`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    } catch {}

    // Create owner membership
    await db.insert(memberships).values({
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: ownerId,
      role: 'brand_admin',
      brandId: brandId,
      status: 'active',
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();

    const [created] = await db.select().from(brands).where(eq(brands.id, brandId));
    return c.json({ success: true, brand: created }, 201);
  } catch (err: any) {
    console.error('Failed to create brand:', err);
    return c.json({ error: err.message || 'Failed to create brand' }, 500);
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
 * Invite / Assign a team member to a role
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

  try {
    // Check if user already exists
    let [targetUser] = await db.select().from(users).where(eq(users.email, body.email.trim())).limit(1);
    const now = Math.floor(Date.now() / 1000);

    if (!targetUser) {
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(users).values({
        id: newUserId,
        name: body.name || body.email.split('@')[0],
        email: body.email.trim().toLowerCase(),
        role: 'owner',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      [targetUser] = await db.select().from(users).where(eq(users.id, newUserId));
    }

    const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(memberships).values({
      id: membershipId,
      userId: targetUser.id,
      role: body.role,
      brandId: body.brandId || null,
      businessId: body.businessId || null,
      branchId: body.branchId || null,
      status: 'active',
      invitedEmail: body.email.trim(),
      createdAt: now,
      updatedAt: now
    });

    return c.json({
      success: true,
      message: `Role ${body.role} assigned to ${body.email}`,
      memberId: membershipId
    }, 201);
  } catch (err: any) {
    console.error('Failed to assign membership:', err);
    return c.json({ error: err.message || 'Failed to assign role' }, 500);
  }
});
