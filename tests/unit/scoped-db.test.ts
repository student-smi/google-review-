import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from '../helpers/mock-d1';
import { getDb } from '../../server/db/client';
import { createScopedDb, ScopedAuthorizationError } from '../../server/db/scoped';
import { users } from '../../server/db/schema';

describe('Scoped Database Access Layer (Tenant Isolation)', () => {
  let db: ReturnType<typeof getDb>;
  const ownerAId = 'owner_a_123';
  const ownerBId = 'owner_b_456';

  beforeEach(async () => {
    const { d1Mock } = createTestD1Database();
    db = getDb(d1Mock);

    // Seed Owner A and Owner B in users table
    const now = new Date();
    await db.insert(users).values([
      {
        id: ownerAId,
        name: 'Rajesh Sharma',
        email: 'rajesh@royalsweets.in',
        emailVerified: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: ownerBId,
        name: 'Priya Patel',
        email: 'priya@patelsalon.in',
        emailVerified: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  });

  it('proves Owner A can create businesses and QR codes', async () => {
    const scopedA = createScopedDb(db, ownerAId);

    const businessA = await scopedA.createBusiness({
      id: 'biz_a',
      name: 'Royal Sweets & Bakery',
      slug: 'royal-sweets',
      googleReviewUrl: 'https://g.page/r/sample-royal-sweets/review',
      city: 'Ahmedabad'
    });

    expect(businessA.id).toBe('biz_a');
    expect(businessA.name).toBe('Royal Sweets & Bakery');
    expect(businessA.ownerId).toBe(ownerAId);

    const qrA = await scopedA.createQrCode('biz_a', {
      id: 'qr_a_1',
      code: 'royal-counter',
      label: 'Main Billing Counter',
      destinationUrl: 'https://reviewqr.in/r/royal-counter',
      styleJson: JSON.stringify({ dots: 'rounded', color: '#4338CA' })
    });

    expect(qrA.code).toBe('royal-counter');
    expect(qrA.businessId).toBe('biz_a');
  });

  it('strictly isolates business listings between owners', async () => {
    const scopedA = createScopedDb(db, ownerAId);
    const scopedB = createScopedDb(db, ownerBId);

    await scopedA.createBusiness({
      id: 'biz_a',
      name: 'Royal Sweets',
      slug: 'royal-sweets',
      googleReviewUrl: 'https://g.page/r/royal/review'
    });

    await scopedB.createBusiness({
      id: 'biz_b',
      name: 'Patel Beauty Studio',
      slug: 'patel-beauty',
      googleReviewUrl: 'https://g.page/r/patel/review'
    });

    const listA = await scopedA.getBusinesses();
    const listB = await scopedB.getBusinesses();

    expect(listA).toHaveLength(1);
    expect(listA[0].id).toBe('biz_a');

    expect(listB).toHaveLength(1);
    expect(listB[0].id).toBe('biz_b');
  });

  it('prevents Owner A from reading Owner B business directly', async () => {
    const scopedA = createScopedDb(db, ownerAId);
    const scopedB = createScopedDb(db, ownerBId);

    await scopedB.createBusiness({
      id: 'biz_b',
      name: 'Patel Beauty Studio',
      slug: 'patel-beauty',
      googleReviewUrl: 'https://g.page/r/patel/review'
    });

    const attempt = await scopedA.getBusiness('biz_b');
    expect(attempt).toBeNull();
  });

  it('prevents Owner A from mutating or deleting Owner B business', async () => {
    const scopedA = createScopedDb(db, ownerAId);
    const scopedB = createScopedDb(db, ownerBId);

    await scopedB.createBusiness({
      id: 'biz_b',
      name: 'Patel Beauty Studio',
      slug: 'patel-beauty',
      googleReviewUrl: 'https://g.page/r/patel/review'
    });

    await expect(
      scopedA.updateBusiness('biz_b', { name: 'Hacked Business Name' })
    ).rejects.toThrow(ScopedAuthorizationError);

    await expect(
      scopedA.deleteBusiness('biz_b')
    ).rejects.toThrow(ScopedAuthorizationError);
  });

  it('prevents Owner A from viewing, modifying or deleting Owner B QR codes', async () => {
    const scopedA = createScopedDb(db, ownerAId);
    const scopedB = createScopedDb(db, ownerBId);

    await scopedB.createBusiness({
      id: 'biz_b',
      name: 'Patel Beauty Studio',
      slug: 'patel-beauty',
      googleReviewUrl: 'https://g.page/r/patel/review'
    });

    const qrB = await scopedB.createQrCode('biz_b', {
      id: 'qr_b_1',
      code: 'patel-salon',
      label: 'Reception Desk',
      destinationUrl: 'https://reviewqr.in/r/patel-salon',
      styleJson: '{}'
    });

    // Owner A cannot list QR codes for Owner B business
    await expect(scopedA.getQrCodes('biz_b')).rejects.toThrow(ScopedAuthorizationError);

    // Owner A cannot fetch QR B by ID
    const fetched = await scopedA.getQrCode(qrB.id);
    expect(fetched).toBeNull();

    // Owner A cannot update QR B
    await expect(
      scopedA.updateQrCode(qrB.id, { label: 'Compromised Label' })
    ).rejects.toThrow(ScopedAuthorizationError);

    // Owner A cannot delete QR B
    await expect(scopedA.deleteQrCode(qrB.id)).rejects.toThrow(ScopedAuthorizationError);
  });

  it('prevents Owner A from accessing Owner B analytics or SEO checklist', async () => {
    const scopedA = createScopedDb(db, ownerAId);
    const scopedB = createScopedDb(db, ownerBId);

    await scopedB.createBusiness({
      id: 'biz_b',
      name: 'Patel Beauty Studio',
      slug: 'patel-beauty',
      googleReviewUrl: 'https://g.page/r/patel/review'
    });

    await expect(scopedA.getDailyAnalytics('biz_b')).rejects.toThrow(ScopedAuthorizationError);
    await expect(scopedA.getUsageAndLimits('biz_b')).rejects.toThrow(ScopedAuthorizationError);
    await expect(scopedA.getSeoChecklist('biz_b')).rejects.toThrow(ScopedAuthorizationError);
    await expect(scopedA.toggleSeoItem('biz_b', 'add_photos', true)).rejects.toThrow(ScopedAuthorizationError);
    await expect(scopedA.saveReplyDraft('biz_b', { replyText: 'Test', style: 'warm' })).rejects.toThrow(ScopedAuthorizationError);
  });
});
