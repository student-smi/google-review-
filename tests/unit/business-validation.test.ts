import { describe, it, expect } from 'vitest';

export function validateGoogleReviewUrl(url: string): { isValid: boolean; error?: string; placeId?: string } {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'Google Review URL is required' };
  }

  const clean = url.trim().toLowerCase();
  const isGoogleLink =
    clean.includes('google.com') ||
    clean.includes('g.page') ||
    clean.includes('maps.app.goo.gl') ||
    clean.includes('search.google.com') ||
    clean.includes('g.co');

  if (!isGoogleLink) {
    return { isValid: false, error: 'Please enter a valid Google Review or Google Maps link' };
  }

  // Extract placeId if present
  let placeId: string | undefined;
  const placeIdMatch = url.match(/placeid=([a-zA-Z0-9_-]+)/i);
  if (placeIdMatch) {
    placeId = placeIdMatch[1];
  }

  return { isValid: true, placeId };
}

describe('Phase 1: Google Review URL & Business Validation', () => {
  it('accepts search.google.com write review URL with place ID', () => {
    const url = 'https://search.google.com/local/writereview?placeid=ChIJ7zSUNEmFXjkRiNXfEEOmZgQ';
    const result = validateGoogleReviewUrl(url);
    expect(result.isValid).toBe(true);
    expect(result.placeId).toBe('ChIJ7zSUNEmFXjkRiNXfEEOmZgQ');
  });

  it('accepts g.page review short link', () => {
    const url = 'https://g.page/r/drpatel-dental/review';
    const result = validateGoogleReviewUrl(url);
    expect(result.isValid).toBe(true);
  });

  it('accepts maps.app.goo.gl link', () => {
    const url = 'https://maps.app.goo.gl/wS123sample';
    const result = validateGoogleReviewUrl(url);
    expect(result.isValid).toBe(true);
  });

  it('accepts g.co short link as in reference infographic', () => {
    const url = 'https://g.co/kgs/abc123';
    const result = validateGoogleReviewUrl(url);
    expect(result.isValid).toBe(true);
  });

  it('rejects non-Google or malicious URLs', () => {
    const badUrls = [
      'https://facebook.com/reviews',
      'https://phishing-site.xyz/login',
      'javascript:alert(1)',
      '',
      'not-a-link'
    ];

    for (const bad of badUrls) {
      const result = validateGoogleReviewUrl(bad);
      expect(result.isValid).toBe(false);
    }
  });
});
