import { describe, it, expect } from 'vitest';
import { validateReviewDraft, getFallbackTemplate, getFallbackTemplates, enforceWordCount, countWords } from '../../server/ai/guardrails';

describe('AI Guardrails & Anti-Fabrication Pipeline', () => {
  it('approves legitimate drafts reflecting customer input', () => {
    const chips = ['Delicious & fresh', 'Friendly staff'];
    const freeText = 'The kaju katli was freshly made and very soft.';
    const draft = 'Visited today and thoroughly enjoyed the experience. The kaju katli was freshly made and very soft, and the friendly staff made the visit pleasant. Delicious & fresh quality all around.';

    const result = validateReviewDraft(draft, chips, freeText);
    expect(result.isValid).toBe(true);
    expect(result.usedFallback).toBe(false);
    expect(result.flaggedEntities).toHaveLength(0);
    const words = countWords(result.sanitizedDraft);
    expect(words).toBeGreaterThanOrEqual(30);
    expect(words).toBeLessThanOrEqual(50);
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

  it('strictly enforces word count limits: minimum 30 and maximum 50 words', () => {
    // 1. Under-length text (< 30 words) gets padded with authentic closing
    const shortDraft = 'Great business and lovely atmosphere. The sweets were very delicious and fresh.';
    expect(countWords(shortDraft)).toBeLessThan(30);

    const padded = enforceWordCount(shortDraft, 30, 50, 'en', 'Royal Sweets');
    const paddedCount = countWords(padded);
    expect(paddedCount).toBeGreaterThanOrEqual(30);
    expect(paddedCount).toBeLessThanOrEqual(50);

    // 2. Over-length text (> 50 words) gets cleanly trimmed
    const longDraft = [
      'We visited this shop today with all our friends and relatives.',
      'Everything from the ambiance to the service and cleanliness was top notch.',
      'The sweets were extremely fresh, flavorful, and served with great care by the attentive staff.',
      'Prices were very reasonable and we loved the prompt checkout process.',
      'We will definitely recommend this place to all our neighbors and colleagues for special occasions!'
    ].join(' ');
    expect(countWords(longDraft)).toBeGreaterThan(50);

    const trimmed = enforceWordCount(longDraft, 30, 50, 'en', 'Royal Sweets');
    const trimmedCount = countWords(trimmed);
    expect(trimmedCount).toBeGreaterThanOrEqual(30);
    expect(trimmedCount).toBeLessThanOrEqual(50);
  });

  it('produces valid deterministic multilingual fallbacks within 30 to 50 words', () => {
    const business = 'Royal Sweets';
    const chips = ['Tasty sweets', 'Clean counter'];
    const note = 'Soft rasgulla';

    const enFallback = getFallbackTemplate(business, chips, note, 'en');
    expect(enFallback).toContain('Royal Sweets');
    expect(enFallback).toContain('Soft rasgulla');
    expect(countWords(enFallback)).toBeGreaterThanOrEqual(30);
    expect(countWords(enFallback)).toBeLessThanOrEqual(50);

    const hiFallback = getFallbackTemplate(business, chips, note, 'hi');
    expect(hiFallback).toContain('Royal Sweets');
    expect(hiFallback).toContain('अनुभव');
    expect(countWords(hiFallback)).toBeGreaterThanOrEqual(30);
    expect(countWords(hiFallback)).toBeLessThanOrEqual(50);

    const guFallback = getFallbackTemplate(business, chips, note, 'gu');
    expect(guFallback).toContain('Royal Sweets');
    expect(guFallback).toContain('મુલાકાત');
    expect(countWords(guFallback)).toBeGreaterThanOrEqual(30);
    expect(countWords(guFallback)).toBeLessThanOrEqual(50);
  });

  it('produces 3 distinct review options in Gujarati, Hindi, Hinglish and English all between 30 and 50 words', () => {
    const business = 'Royal Sweets';
    const chips = ['Delicious & fresh', 'Fast service'];
    const note = 'Loved the kaju katli';

    const languages: Array<'en' | 'hi' | 'gu' | 'hinglish'> = ['en', 'hi', 'gu', 'hinglish'];

    for (const lang of languages) {
      for (let seed = 0; seed < 4; seed++) {
        const options = getFallbackTemplates(business, chips, note, lang, 'sweet bakery', 'Ahmedabad', seed);
        expect(options).toHaveLength(3);
        options.forEach((opt, idx) => {
          const words = countWords(opt.text);
          expect(
            words,
            `Expected ${lang} seed ${seed} option ${idx + 1} ("${opt.text}") to be between 30 and 50 words, got ${words}`
          ).toBeGreaterThanOrEqual(30);
          expect(
            words,
            `Expected ${lang} seed ${seed} option ${idx + 1} ("${opt.text}") to be between 30 and 50 words, got ${words}`
          ).toBeLessThanOrEqual(50);
        });
      }
    }
  });
});
