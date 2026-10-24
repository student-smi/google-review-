import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from '../helpers/mock-d1';
import { getDb } from '../../server/db/client';
import { users, businesses, customerReviews, accounts } from '../../server/db/schema';
import { gmbRoutes } from '../../server/routes/gmb';

describe('Google Business Profile (GMB) API Routes', () => {
  let d1Mock: any;
  let db: ReturnType<typeof getDb>;
  const ownerId = 'usr_test_owner';
  const bizId = 'biz_test_gmb';

  beforeEach(async () => {
    const testDb = createTestD1Database();
    d1Mock = testDb.d1Mock;
    db = getDb(d1Mock);

    const now = new Date();
    await db.insert(users).values({
      id: ownerId,
      name: 'Owner Test',
      email: 'owner@test.com',
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    });

    await db.insert(businesses).values({
      id: bizId,
      ownerId,
      name: 'Upmark Marketing',
      slug: 'upmark-test',
      googlePlaceId: 'ChIJ7zSUNEmFXjkRiNXfEEOmZgQ',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ7zSUNEmFXjkRiNXfEEOmZgQ',
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });
  });

  it('GET /status returns isConnected: false when not connected', async () => {
    const res = await gmbRoutes.request(`/status?businessId=${bizId}`, {
      method: 'GET',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.isConnected).toBe(false);
  });

  it('POST /connect stores connection details in accounts', async () => {
    const res = await gmbRoutes.request('/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': ownerId
      },
      body: JSON.stringify({
        accessToken: 'mock_oauth_access_token_123',
        businessId: bizId,
        email: 'owner@test.com'
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);

    // Verify status now shows connected
    const statusRes = await gmbRoutes.request(`/status?businessId=${bizId}`, {
      method: 'GET',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    const statusData = await statusRes.json() as any;
    expect(statusData.isConnected).toBe(true);
    expect(statusData.connectedEmail).toBe('owner@test.com');
  });

  it('POST /reply updates review with owner reply', async () => {
    // Insert a review to reply to
    const revId = 'gmb_rev_123';
    await db.insert(customerReviews).values({
      id: revId,
      businessId: bizId,
      customerName: 'Aarav Mehta',
      rating: 5,
      reviewText: 'Outstanding service and guidance!',
      language: 'en',
      createdAt: Math.floor(Date.now() / 1000)
    });

    const replyRes = await gmbRoutes.request('/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Owner-Id': ownerId
      },
      body: JSON.stringify({
        businessId: bizId,
        reviewId: revId,
        replyText: 'Thank you Aarav for your kind words! We look forward to serving you again.',
        replyStyle: 'warm'
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(replyRes.status).toBe(200);
    const replyData = await replyRes.json() as any;
    expect(replyData.success).toBe(true);
    expect(replyData.review.replyText).toContain('Thank you Aarav');
    expect(replyData.review.replyStyle).toBe('warm');
    expect(replyData.review.repliedAt).toBeTypeOf('number');
  });

  it('POST /disconnect removes connection', async () => {
    // First connect
    await gmbRoutes.request('/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Owner-Id': ownerId },
      body: JSON.stringify({
        accessToken: 'mock_token',
        businessId: bizId
      })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    // Then disconnect
    const discRes = await gmbRoutes.request('/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Owner-Id': ownerId },
      body: JSON.stringify({ businessId: bizId })
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    expect(discRes.status).toBe(200);

    // Verify status is now false
    const statusRes = await gmbRoutes.request(`/status?businessId=${bizId}`, {
      method: 'GET',
      headers: { 'X-Owner-Id': ownerId }
    }, { DB: d1Mock, KV: null, R2: null, AI: null });

    const statusData = await statusRes.json() as any;
    expect(statusData.isConnected).toBe(false);
  });
});
