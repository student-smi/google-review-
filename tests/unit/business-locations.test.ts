import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from '../helpers/mock-d1';
import { getDb } from '../../server/db/client';
import { users, businesses, locations } from '../../server/db/schema';
import { businessRoutes } from '../../server/routes/businesses';
import { eq } from 'drizzle-orm';

describe('Business & Location Manager Test Suite (Section 2)', () => {
  let d1Mock: any;
  let db: ReturnType<typeof getDb>;
  const ownerId = 'usr_mgr_test_1';
  let createdBizId = '';

  beforeEach(async () => {
    const testDb = createTestD1Database();
    d1Mock = testDb.d1Mock;
    db = getDb(d1Mock);

    const now = new Date();
    await db.insert(users).values({
      id: ownerId,
      name: 'Manager Owner',
      email: 'owner@manager.com',
      role: 'owner',
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    });
  });

  it('adds a business with category, contact info, assigned manager and primary location', async () => {
    const res = await businessRoutes.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': ownerId
      },
      body: JSON.stringify({
        name: 'Apex Dental Care',
        category: 'clinics',
        address: 'Navrangpura, Ahmedabad',
        city: 'Ahmedabad',
        phone: '+91 99999 88888',
        contactEmail: 'contact@apexdental.com',
        assignedManager: 'Dr. Rajesh Patel',
        status: 'active',
        googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ12345',
        googlePlaceId: 'ChIJ12345'
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.business).toBeDefined();
    expect(data.business.name).toBe('Apex Dental Care');
    expect(data.business.assignedManager).toBe('Dr. Rajesh Patel');
    expect(data.business.status).toBe('active');
    createdBizId = data.business.id;

    // Verify primary location was automatically created
    const locs = await db.select().from(locations).where(eq(locations.businessId, createdBizId));
    expect(locs.length).toBeGreaterThanOrEqual(1);
    expect(locs[0].isPrimary).toBe(true);
  });

  it('edits an existing business profile', async () => {
    // Insert business first
    const bizId = 'biz_edit_1';
    await db.insert(businesses).values({
      id: bizId,
      ownerId,
      name: 'Old Name Cafe',
      slug: 'old-name-cafe',
      category: 'restaurants',
      googleReviewUrl: 'https://g.page/r/test/review',
      status: 'active',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    const res = await businessRoutes.request(`/${bizId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': ownerId
      },
      body: JSON.stringify({
        name: 'New Name Bistro',
        assignedManager: 'Ketan Trivedi',
        phone: '+91 77777 66666'
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.business.name).toBe('New Name Bistro');
    expect(data.business.assignedManager).toBe('Ketan Trivedi');
  });

  it('archives and unarchives a business', async () => {
    const bizId = 'biz_archive_1';
    await db.insert(businesses).values({
      id: bizId,
      ownerId,
      name: 'To Archive Store',
      slug: 'to-archive-store',
      googleReviewUrl: 'https://g.page/r/test/review',
      isArchived: false,
      status: 'active',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // 1. Archive
    const archRes = await businessRoutes.request(`/${bizId}/archive`, {
      method: 'POST',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(archRes.status).toBe(200);
    const archData = await archRes.json() as any;
    expect(archData.business.isArchived).toBe(true);
    expect(archData.business.status).toBe('inactive');

    // 2. Unarchive
    const unarchRes = await businessRoutes.request(`/${bizId}/unarchive`, {
      method: 'POST',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(unarchRes.status).toBe(200);
    const unarchData = await unarchRes.json() as any;
    expect(unarchData.business.isArchived).toBe(false);
    expect(unarchData.business.status).toBe('active');
  });

  it('supports multiple Google locations per business (add, list, delete)', async () => {
    const bizId = 'biz_multiloc_1';
    await db.insert(businesses).values({
      id: bizId,
      ownerId,
      name: 'Multi Outlet Store',
      slug: 'multi-outlet-store',
      googleReviewUrl: 'https://g.page/r/test/review',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // 1. Add branch location
    const addRes = await businessRoutes.request(`/${bizId}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': ownerId
      },
      body: JSON.stringify({
        name: 'Bodakdev Branch',
        address: 'Bodakdev, Ahmedabad',
        phone: '+91 91111 22222',
        googlePlaceId: 'ChIJBodakdev123',
        assignedManager: 'Priya Sharma'
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(addRes.status).toBe(201);
    const addData = await addRes.json() as any;
    expect(addData.location.name).toBe('Bodakdev Branch');
    expect(addData.location.assignedManager).toBe('Priya Sharma');
    const branchLocId = addData.location.id;

    // 2. List locations
    const listRes = await businessRoutes.request(`/${bizId}/locations`, {
      method: 'GET',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(listRes.status).toBe(200);
    const listData = await listRes.json() as any;
    expect(listData.locations.length).toBe(1);

    // 3. Delete branch location
    const delRes = await businessRoutes.request(`/${bizId}/locations/${branchLocId}`, {
      method: 'DELETE',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(delRes.status).toBe(200);
    const remaining = await db.select().from(locations).where(eq(locations.id, branchLocId));
    expect(remaining.length).toBe(0);
  });

  it('guarantees tenant isolation: a new user with 0 businesses receives an empty list, not other users stores', async () => {
    const newOwnerId = 'usr_brand_new_isolated_user';
    const res = await businessRoutes.request('/', {
      method: 'GET',
      headers: { 'X-Owner-Id': newOwnerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.businesses).toBeDefined();
    expect(data.businesses.length).toBe(0);
  });
});

