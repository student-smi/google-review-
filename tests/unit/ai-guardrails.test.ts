import { describe, it, expect } from 'vitest';
import { validateReviewDraft, getFallbackTemplate } from '../../server/ai/guardrails';

describe('AI Guardrails & Anti-Fabrication Pipeline', () => {
  it('approves legitimate drafts reflecting customer input', () => {
    const chips = ['Delicious & fresh', 'Friendly staff'];
    const freeText = 'The kaju katli was freshly made and very soft.';
    const draft = 'Visited today and thoroughly enjoyed the experience. The kaju katli was freshly made and very soft, and the friendly staff made the visit pleasant. Delicious & fresh quality all around.';

    const result = validateReviewDraft(draft, chips, freeText);
    expect(result.isValid).toBe(true);
    expect(result.usedFallback).toBe(false);
    expect(result.flaggedEntities).toHaveLength(0);
  });

  it('detects and flags hallucinated unmentioned staff, prices, or dishes', () => {
    const chips = ['Fast service'];
    const freeText = 'Quick checkout.';
    // Draft fabricates chef name, birthday and discount rupees
    const hallucinatedDraft = 'I spoke with chef Ramesh yesterday who gave me a 20 percent discount of 500 rupees for my birthday. Fast service and quick checkout.';

    const result = validateReviewDraft(hallucinatedDraft, chips, freeText);
    expect(result.isValid).toBe(false);
    expect(result.usedFallback).toBe(true);
    expect(result.flaggedEntities.length).toBeGreaterThan(0);
    expect(result.flaggedEntities).toContain('chef');
    expect(result.flaggedEntities).toContain('rupees');
  });

  it('produces valid deterministic multilingual fallbacks without blocking the customer', () => {
    const business = 'Royal Sweets';
    const chips = ['Tasty sweets', 'Clean counter'];
    const note = 'Soft rasgulla';

    const enFallback = getFallbackTemplate(business, chips, note, 'en');
    expect(enFallback).toContain('Royal Sweets');
    expect(enFallback).toContain('Soft rasgulla');

    const hiFallback = getFallbackTemplate(business, chips, note, 'hi');
    expect(hiFallback).toContain('Royal Sweets');
    expect(hiFallback).toContain('अनुभव');

    const guFallback = getFallbackTemplate(business, chips, note, 'gu');
    expect(guFallback).toContain('Royal Sweets');
    expect(guFallback).toContain('મુલાકાત');
  });
});
