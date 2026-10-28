import { describe, it, expect } from 'vitest';
import {
  extractLocalityAndCity,
  deduplicateKeywordSuggestions,
  buildDeterministicLocalSeoFallback,
  generateLocalSeoKeywords,
  LocalSeoKeywordSuggestion
} from '../../server/ai/provider';

describe('AI-Powered Local SEO Keyword Suggestion Engine', () => {
  describe('extractLocalityAndCity', () => {
    it('correctly extracts locality and city from an Indian address like Croma Nikol Ahmedabad', () => {
      const address = 'Croma, Raspan Arcade, Nikol Gam Rd, Nikol, Ahmedabad, Gujarat 382350';
      const result = extractLocalityAndCity(address);
      expect(result.city.toLowerCase()).toBe('ahmedabad');
      expect(result.locality.toLowerCase()).toBe('nikol');
    });

    it('handles addresses with only city and postal code gracefully', () => {
      const address = 'CG Road, Ahmedabad, Gujarat 380009';
      const result = extractLocalityAndCity(address, 'Ahmedabad');
      expect(result.city.toLowerCase()).toBe('ahmedabad');
    });

    it('handles empty or missing address gracefully with fallback city', () => {
      const result = extractLocalityAndCity(null, 'Surat');
      expect(result.city).toBe('Surat');
      expect(result.locality).toBe('');
    });
  });

  describe('deduplicateKeywordSuggestions', () => {
    it('removes duplicate keywords regardless of casing and trims whitespace', () => {
      const raw: LocalSeoKeywordSuggestion[] = [
        { keyword: 'Electronics store in Nikol', type: 'local_seo', reason: 'r1', source: 'place_data', confidence: 'high' },
        { keyword: 'electronics store in nikol', type: 'local_seo', reason: 'r2', source: 'place_data', confidence: 'high' },
        { keyword: '  Mobile Phones  ', type: 'product_service', reason: 'r3', source: 'place_data', confidence: 'high' },
        { keyword: 'mobile phones', type: 'product_service', reason: 'r4', source: 'inference', confidence: 'medium' },
        { keyword: 'staff helpfulness', type: 'experience_topic', reason: 'r5', source: 'available_review_themes', confidence: 'high' }
      ];

      const deduped = deduplicateKeywordSuggestions(raw);
      expect(deduped.length).toBe(3);
      expect(deduped.map((d) => d.keyword)).toEqual([
        'Electronics store in Nikol',
        'Mobile Phones',
        'staff helpfulness'
      ]);
    });
  });

  describe('buildDeterministicLocalSeoFallback (Croma - Nikol, Ahmedabad)', () => {
    it('generates high-intent local SEO, products, and customer experience topics for Croma Nikol', () => {
      const input = {
        businessName: 'Croma',
        category: 'Electronics Store',
        address: 'Raspan Arcade, Nikol, Ahmedabad, Gujarat 382350',
        types: ['electronics_store', 'store', 'point_of_interest'],
        summary: 'Leading electronics retail chain offering smartphones, laptops and home appliances.',
        reviews: [
          { text: 'Great staff helpfulness and quick product demonstration for Sony TV.', rating: 5 },
          { text: 'Billing experience was smooth and store cleanliness was impressive.', rating: 5 }
        ]
      };

      const output = buildDeterministicLocalSeoFallback(input);

      expect(output.businessName).toBe('Croma');
      expect(output.businessCategory).toBe('Electronics Store');
      expect(output.location).toContain('Nikol');
      expect(output.location).toContain('Ahmedabad');

      // Verify count is between 8 and 15
      expect(output.keywordSuggestions.length).toBeGreaterThanOrEqual(8);
      expect(output.keywordSuggestions.length).toBeLessThanOrEqual(15);

      const keywords = output.keywordSuggestions.map((k) => k.keyword.toLowerCase());

      // Local SEO check
      expect(keywords.some((k) => k.includes('nikol') && k.includes('electronics'))).toBe(true);

      // Product check
      expect(keywords.some((k) => k.includes('mobile') || k.includes('laptop') || k.includes('appliances'))).toBe(true);

      // Experience check from reviews
      expect(keywords.some((k) => k.includes('staff') || k.includes('billing') || k.includes('cleanliness'))).toBe(true);

      // Verify keyword suggestion schema
      for (const item of output.keywordSuggestions) {
        expect(['local_seo', 'product_service', 'experience_topic']).toContain(item.type);
        expect(['place_data', 'verified_business_data', 'available_review_themes', 'inference']).toContain(item.source);
        expect(['high', 'medium', 'low']).toContain(item.confidence);
        expect(typeof item.reason).toBe('string');
        expect(item.reason.length).toBeGreaterThan(5);
      }

      // Verify policy-safe customer questions
      expect(Array.isArray(output.customerQuestions)).toBe(true);
      expect(output.customerQuestions.length).toBeGreaterThanOrEqual(2);
      expect(output.customerQuestions[0]).toContain('?');
    });

    it('handles missing data (no reviews, no summary, no types, no address) gracefully', () => {
      const input = {
        businessName: 'Generic Shop'
      };

      const output = buildDeterministicLocalSeoFallback(input);

      expect(output.businessName).toBe('Generic Shop');
      expect(output.businessCategory).toBe('Local Business');
      expect(output.keywordSuggestions.length).toBeGreaterThanOrEqual(6);
      expect(output.customerQuestions.length).toBeGreaterThanOrEqual(2);
    });

    it('handles unsupported or custom business categories with safe professional defaults', () => {
      const input = {
        businessName: 'Apex Solar Energy Solutions',
        category: 'Solar Energy Equipment Supplier',
        city: 'Vadodara',
        address: 'Alkapuri, Vadodara, Gujarat'
      };

      const output = buildDeterministicLocalSeoFallback(input);

      expect(output.businessName).toBe('Apex Solar Energy Solutions');
      expect(output.keywordSuggestions.length).toBeGreaterThanOrEqual(6);
      const types = output.keywordSuggestions.map((k) => k.type);
      expect(types).toContain('local_seo');
      expect(types).toContain('product_service');
      expect(types).toContain('experience_topic');
    });
  });

  describe('generateLocalSeoKeywords AI Engine', () => {
    it('returns tailored deterministic fallback when aiBinding is null without throwing error', async () => {
      const result = await generateLocalSeoKeywords(null, {
        businessName: 'Croma',
        category: 'Electronics Store',
        address: 'Nikol, Ahmedabad'
      });

      expect(result).toHaveProperty('businessName', 'Croma');
      expect(result).toHaveProperty('businessCategory');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('keywordSuggestions');
      expect(result).toHaveProperty('customerQuestions');
      expect(result.keywordSuggestions.length).toBeGreaterThanOrEqual(8);
    });

    it('executes AI binding and parses structured JSON when available', async () => {
      const mockAiBinding = {
        run: async () => ({
          response: JSON.stringify({
            businessName: 'Croma',
            businessCategory: 'Electronics Store',
            location: 'Nikol, Ahmedabad',
            keywordSuggestions: [
              { keyword: 'electronics store in Nikol', type: 'local_seo', reason: 'Primary geo search', source: 'place_data', confidence: 'high' },
              { keyword: 'electronics shop in Nikol Ahmedabad', type: 'local_seo', reason: 'Secondary discovery phrase', source: 'place_data', confidence: 'high' },
              { keyword: 'Croma Nikol Ahmedabad', type: 'local_seo', reason: 'Brand search', source: 'verified_business_data', confidence: 'high' },
              { keyword: 'mobile phones', type: 'product_service', reason: 'Top selling gadget', source: 'place_data', confidence: 'high' },
              { keyword: 'laptops', type: 'product_service', reason: 'High intent queries', source: 'inference', confidence: 'medium' },
              { keyword: 'televisions', type: 'product_service', reason: 'Major display category', source: 'inference', confidence: 'medium' },
              { keyword: 'home appliances', type: 'product_service', reason: 'Core white goods', source: 'inference', confidence: 'medium' },
              { keyword: 'staff helpfulness', type: 'experience_topic', reason: 'Key review factor', source: 'available_review_themes', confidence: 'high' },
              { keyword: 'product demonstration', type: 'experience_topic', reason: 'Hands-on shopping', source: 'available_review_themes', confidence: 'high' },
              { keyword: 'billing experience', type: 'experience_topic', reason: 'Swift checkout', source: 'inference', confidence: 'medium' }
            ],
            customerQuestions: [
              'What electronic product or appliance did you explore or purchase today?',
              'How was your experience with our staff guidance and product demonstration?'
            ]
          })
        })
      };

      const result = await generateLocalSeoKeywords(mockAiBinding, {
        businessName: 'Croma',
        category: 'Electronics Store',
        address: 'Nikol, Ahmedabad'
      });

      expect(result.businessName).toBe('Croma');
      expect(result.keywordSuggestions.length).toBe(10);
      expect(result.keywordSuggestions[0].keyword).toBe('electronics store in Nikol');
      expect(result.customerQuestions.length).toBe(2);
    });

    it('recovers gracefully to deterministic fallback if AI returns malformed or invalid JSON', async () => {
      const mockAiBinding = {
        run: async () => ({
          response: 'Sorry, I cannot provide JSON right now. Here is some text.'
        })
      };

      const result = await generateLocalSeoKeywords(mockAiBinding, {
        businessName: 'Croma',
        category: 'Electronics Store',
        address: 'Nikol, Ahmedabad'
      });

      expect(result).toHaveProperty('keywordSuggestions');
      expect(result.keywordSuggestions.length).toBeGreaterThanOrEqual(8);
      expect(result.businessCategory).toBe('Electronics Store');
    });
  });
});
