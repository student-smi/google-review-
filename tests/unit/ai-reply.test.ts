import { describe, it, expect } from 'vitest';
import { generateOwnerReplies } from '../../server/ai/provider';

describe('AI Owner Reply Generator (Phase 3)', () => {
  it('returns warm/professional/concise fallback when aiBinding is null', async () => {
    const result = await generateOwnerReplies(null, {
      businessName: 'Shree Sweets',
      customerName: 'Ramesh Patel',
      reviewText: 'Great sweets, very fresh and hygienic!',
      rating: 5
    });
    expect(result).toHaveProperty('warm');
    expect(result).toHaveProperty('professional');
    expect(result).toHaveProperty('concise');
  });

  it('includes the business name in all three reply variants', async () => {
    const biz = 'Panchal Medical Store';
    const result = await generateOwnerReplies(null, {
      businessName: biz,
      reviewText: 'Very helpful pharmacist and quick service.',
      rating: 5
    });
    expect(result.warm).toContain(biz);
    expect(result.professional).toContain(biz);
    expect(result.concise).toContain(biz);
  });

  it('personalizes replies with customer name when provided', async () => {
    const result = await generateOwnerReplies(null, {
      businessName: 'My Cafe',
      customerName: 'Ananya Shah',
      reviewText: 'The coffee was excellent.',
      rating: 4
    });
    expect(result.warm).toContain('Ananya Shah');
    expect(result.professional).toContain('Ananya Shah');
  });

  it('generates different content for each tone style', async () => {
    const result = await generateOwnerReplies(null, {
      businessName: 'Test Shop',
      customerName: 'Test User',
      reviewText: 'Good service.',
      rating: 4
    });
    expect(result.warm).not.toEqual(result.professional);
    expect(result.professional).not.toEqual(result.concise);
  });

  it('gracefully handles negative reviews with resolution contact', async () => {
    const result = await generateOwnerReplies(null, {
      businessName: 'XYZ Store',
      customerName: 'Upset Customer',
      reviewText: 'Service was very slow and the staff was rude.',
      rating: 2,
      resolutionContact: 'manager@xyzstore.com'
    });
    expect(result.warm).toBeTruthy();
    expect(result.professional).toBeTruthy();
    expect(result.concise).toBeTruthy();
  });
});
