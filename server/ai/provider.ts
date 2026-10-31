import { validateReviewDraft, getFallbackTemplate, getFallbackTemplates } from './guardrails';

export interface GenerateReviewDraftParams {
  businessName: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  googlePlaceId?: string | null;
  rating?: number | null;
  summary?: string | null;
  chips: string[];
  freeText: string;
  language: 'en' | 'hi' | 'gu' | 'hinglish';
  tone: 'warm' | 'concise' | 'formal';
}

export async function generateCustomerReviewDraft(
  aiBinding: any,
  params: GenerateReviewDraftParams
): Promise<{ drafts: Array<{ id: string; title: string; text: string; wordCount: number }>; usedFallback: boolean; debug?: any }> {
  const { businessName, category, address, city, chips, freeText, language } = params;
  const fallbacks = getFallbackTemplates(businessName, chips, freeText, language, category, city);

  if (!aiBinding) {
    return { drafts: fallbacks, usedFallback: true };
  }

  const placeDetails: string[] = [];
  if (category) placeDetails.push(`Business Category: ${category}`);
  if (city) placeDetails.push(`City/Location: ${city}`);
  if (address) placeDetails.push(`Address: ${address}`);
  const placeContext = placeDetails.length > 0 ? `\nVerified Google Place Metadata: [${placeDetails.join(' | ')}]` : '';

  const selectedKeywordsText = chips.length > 0 ? chips.map((c) => `"${c}"`).join(', ') : '"great service", "positive experience"';

  const systemPrompt = `You are an expert Google Review assistant for genuine customers visiting "${businessName}".${placeContext}
TASK: Write THREE DISTINCT, NATURAL, 5-STAR Google reviews for this business.
CRITICAL INSTRUCTION:
You MUST naturally incorporate the customer's chosen highlights: [${selectedKeywordsText}] into each review option.
Do NOT just list the keywords with commas. Weave them grammatically and naturally into complete sentences that sound authentic, human, and conversational!

REVIEW VARIATIONS:
- Option 1 (Short & Crisp): 1-2 punchy sentences focusing directly on the key highlights (${selectedKeywordsText}) and great experience.
- Option 2 (Warm & Detailed): 2-4 sentences detailing what made the visit memorable, mentioning the business "${businessName}", specific highlights (${selectedKeywordsText}), and recommending it to others${city ? ` in ${city}` : ''}.
- Option 3 (Balanced & Friendly): 2-3 casual, upbeat sentences for Google Maps visitors praising the service and highlights.

RULES:
1. Every review must sound like a real customer wrote it.
2. Language: ${language === 'hi' ? 'Hindi in Devanagari script (concise, under 35 words per draft)' : language === 'gu' ? 'Gujarati script (concise, under 30 words per draft)' : language === 'hinglish' ? 'Hinglish (Hindi written in English alphabets, e.g. "Bohot achi service thi aur maza aa gaya")' : 'English'}.
3. Return ONLY valid JSON: {"drafts": ["review option 1", "review option 2", "review option 3"]}
4. Do NOT include markdown codeblocks or explanations outside the JSON.`;

  const userPrompt = `Business: ${businessName}${category ? ` (${category})` : ''}${city ? ` in ${city}` : ''}
Selected Customer Highlights: ${selectedKeywordsText}
${freeText ? `Customer Personal Note: "${freeText}"` : ''}
Generate 3 distinct 5-star reviews naturally weaving in these customer highlights.`;

  try {
    const response = await aiBinding.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 750,
      temperature: 0.6
    });

    // Check if Cloudflare AI already parsed the response into an object
    if (response && typeof response === 'object' && Array.isArray((response as any)?.drafts)) {
      const validatedDrafts = (response as any).drafts.slice(0, 3).map((text: any, i: number) => {
        const str = String(text || '').trim();
        const title = i === 0 ? 'Short & Crisp' : i === 1 ? 'Warm & Detailed' : 'Balanced & Friendly';
        return {
          id: `opt_${i + 1}`,
          title,
          text: str || fallbacks[i]?.text || fallbacks[0].text,
          wordCount: str.split(/\s+/).filter(Boolean).length
        };
      });
      return { drafts: validatedDrafts, usedFallback: false };
    }

    if (response?.response && typeof response.response === 'object' && Array.isArray((response.response as any)?.drafts)) {
      const validatedDrafts = (response.response as any).drafts.slice(0, 3).map((text: any, i: number) => {
        const str = String(text || '').trim();
        const title = i === 0 ? 'Short & Crisp' : i === 1 ? 'Warm & Detailed' : 'Balanced & Friendly';
        return {
          id: `opt_${i + 1}`,
          title,
          text: str || fallbacks[i]?.text || fallbacks[0].text,
          wordCount: str.split(/\s+/).filter(Boolean).length
        };
      });
      return { drafts: validatedDrafts, usedFallback: false };
    }

    let raw = '';
    if (typeof response === 'string') {
      raw = response;
    } else if (typeof response?.response === 'string') {
      raw = response.response;
    } else {
      raw = JSON.stringify(response || {});
    }

    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    if (raw.includes('{') && !raw.endsWith('}')) {
      if (raw.endsWith(']')) {
        raw = raw + '}';
      } else {
        const lastBracket = raw.lastIndexOf(']');
        if (lastBracket !== -1) {
          raw = raw.substring(0, lastBracket + 1) + '}';
        } else {
          const lastQuote = raw.lastIndexOf('"');
          if (lastQuote !== -1) {
            raw = raw.substring(0, lastQuote + 1) + ']}';
          }
        }
      }
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed?.drafts) && parsed.drafts.length >= 2) {
          const validatedDrafts = parsed.drafts.slice(0, 3).map((item: any, i: number) => {
            const text = (typeof item === 'string' ? item : (item?.review || item?.text || item?.draft || '')).trim();
            const v = validateReviewDraft(text, chips, freeText);
            const title = i === 0 ? 'Short & Crisp' : i === 1 ? 'Warm & Detailed' : 'Balanced & Friendly';
            return {
              id: `opt_${i + 1}`,
              title,
              text: v.isValid ? v.sanitizedDraft : (text || fallbacks[i]?.text || fallbacks[0].text),
              wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
            };
          });

          return { drafts: validatedDrafts, usedFallback: false };
        }
      } catch (parseErr) {
        console.warn('Failed to parse matched JSON from AI:', parseErr);
      }
    }
    return { drafts: fallbacks, usedFallback: true, debug: { error: 'parse_or_shape_error', raw } };
  } catch (err: any) {
    console.warn('Workers AI generation failed, using 3 fallback options:', err);
    return { drafts: fallbacks, usedFallback: true, debug: { error: String(err?.message || err) } };
  }
}

export interface GenerateOwnerRepliesParams {
  businessName: string;
  customerName?: string;
  reviewText: string;
  rating?: number;
  category?: string;
  city?: string;
  brandVoice?: string;
  resolutionContact?: string;
}

export function sanitizeOwnerReply(text: string, businessName: string): string {
  if (!text) return '';
  return text
    // Replace [Your Name] (our management) or any placeholder variant with Team <BusinessName>
    .replace(/\[\s*(your\s*name|name|owner|owner's\s*name|insert\s*name|your\s*business|business\s*name|manager)\s*\]\s*(\(our\s*management\))?/gi, `Team ${businessName}`)
    // Remove standalone bracketed placeholders e.g. [xyz]
    .replace(/\[[^\]]+\]/g, '')
    // Remove trailing parenthetical "(our management)"
    .replace(/\s*\(our\s*management\)/gi, '')
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateOwnerReplies(
  aiBinding: any,
  params: GenerateOwnerRepliesParams
) {
  const { businessName, customerName, reviewText, rating, category, city, brandVoice, resolutionContact } = params;

  const locInfo = city ? ` (${city})` : '';
  const fallbackWarm = `Dear ${customerName || 'Guest'},\n\nThank you so much for visiting ${businessName}${locInfo} and sharing your feedback! We truly appreciate your patronage and hope to welcome you back again soon.\n\nWarm regards,\nThe ${businessName} Team`;
  const fallbackProf = `Dear ${customerName || 'Customer'},\n\nThank you for taking the time to review ${businessName}${locInfo}. Your feedback is valuable to our team. ${resolutionContact ? `If you have further suggestions, please contact us at ${resolutionContact}.` : ''}\n\nSincerely,\nTeam ${businessName}`;
  const fallbackConcise = `Hi ${customerName || 'there'}, thanks for the great review of ${businessName}! We look forward to serving you again.\n\n— Team ${businessName}`;

  if (!aiBinding) {
    return { warm: fallbackWarm, professional: fallbackProf, concise: fallbackConcise };
  }

  const prompt = `You are the owner of "${businessName}"${locInfo}${category ? ` (${category})` : ''}. Generate 3 review reply options for this Google review:
Review text: "${reviewText}"
Customer name: "${customerName || 'Customer'}"
Rating: ${rating ? `${rating} stars` : 'Not specified'}
${resolutionContact && resolutionContact !== 'our management' ? `Resolution contact: "${resolutionContact}"` : ''}

Return valid JSON with exactly three keys: "warm", "professional", and "concise".
RULES:
1. Acknowledge specific points mentioned in the review.
2. Sign off naturally as "The ${businessName} Team" or "Team ${businessName}".
3. STRICT CRITICAL RULE: NEVER use brackets or placeholder text like "[Your Name]", "[Name]", "[Owner]", "[Business Name]", or "(our management)". Everything must be 100% complete text ready to publish on Google Maps.
4. For negative points, apologize sincerely and offer offline resolution without arguing or making excuses.
5. Keep "concise" under 40 words.
6. Never promise cash refunds unless asked.`;

  try {
    const response = await aiBinding.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: 'You are an AI assistant helping business owners reply professionally to Google reviews. Respond strictly in valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 350,
      temperature: 0.5
    });

    const extractReplyString = (val: any, fallback: string): string => {
      let raw = fallback;
      if (typeof val === 'string') raw = val.trim();
      else if (val && typeof val === 'object') {
        if (typeof val.response === 'string') {
          const next = typeof val.next_steps === 'string' ? `\n\n${val.next_steps.trim()}` : '';
          raw = `${val.response.trim()}${next}`.trim();
        } else if (typeof val.text === 'string') raw = val.text.trim();
        else if (typeof val.reply === 'string') raw = val.reply.trim();
        else {
          const parts = Object.values(val).filter((v) => typeof v === 'string') as string[];
          if (parts.length > 0) raw = parts.join('\n\n').trim();
        }
      }
      return sanitizeOwnerReply(raw, businessName);
    };

    const text = typeof response === 'object' && typeof response?.response === 'string'
      ? response.response.trim()
      : typeof response === 'string' ? response.trim() : '';

    if (response && typeof response === 'object' && (response.warm || response.response?.warm)) {
      const src = response.warm ? response : response.response;
      return {
        warm: extractReplyString(src.warm, fallbackWarm),
        professional: extractReplyString(src.professional, fallbackProf),
        concise: extractReplyString(src.concise, fallbackConcise)
      };
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        warm: extractReplyString(parsed.warm, fallbackWarm),
        professional: extractReplyString(parsed.professional, fallbackProf),
        concise: extractReplyString(parsed.concise, fallbackConcise)
      };
    }
  } catch (err) {
    console.warn('AI reply generation failed, using defaults:', err);
  }

  return { warm: fallbackWarm, professional: fallbackProf, concise: fallbackConcise };
}

export interface GenerateBusinessKeywordsParams {
  businessName: string;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  summary?: string | null;
  types?: string[] | null;
}

export async function generateBusinessKeywords(
  aiBinding: any,
  params: GenerateBusinessKeywordsParams
): Promise<{ keywords: string[]; usedFallback: boolean }> {
  const { businessName, category, city, address, summary, types } = params;

  if (aiBinding) {
    const details: string[] = [];
    if (category) details.push(`Category: "${category}"`);
    if (types && types.length > 0) details.push(`Google Types: [${types.join(', ')}]`);
    if (summary) details.push(`Google Place Summary: "${summary}"`);
    if (city || address) details.push(`Location: "${city || ''} ${address || ''}"`);

    const systemPrompt = `You are an expert local SEO & Google Business Profile consultant in India.
Your task is to analyze the user's specific business and generate 8 to 12 authentic, high-impact review highlight keywords/chips for customer Google Reviews.
Business Name: "${businessName}"
${details.join('\n')}

RULES:
1. Generate strictly 8 to 12 short review highlight phrases (2 to 4 words each).
2. Each keyword must be something a real, satisfied customer would proudly mention about THIS specific business type (e.g. food taste, cleanliness, specific treatment, staff behavior, pricing, ambiance, quick delivery).
3. Do NOT make generic filler. Must be highly tailored to "${businessName}" and "${category || 'local store'}".
4. Format strictly as JSON with a "keywords" array of strings:
{"keywords": ["Highlight 1", "Highlight 2", "Highlight 3", ...]}
5. Do NOT include markdown blocks or any other explanation.`;

    const userPrompt = `Generate 8-12 tailored Google review chips for ${businessName} (${category || 'Local Business'}, ${city || 'India'})${summary ? `. Business summary: ${summary}` : ''}.`;

    try {
      const response = await aiBinding.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      if (response && typeof response === 'object' && Array.isArray((response as any)?.keywords)) {
        return {
          keywords: (response as any).keywords.slice(0, 12),
          usedFallback: false
        };
      }

      let raw = '';
      if (typeof response === 'string') {
        raw = response;
      } else if (typeof response?.response === 'string') {
        raw = response.response;
      } else {
        raw = JSON.stringify(response || {});
      }
      raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

      // 1. Try JSON extraction
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed?.keywords) && parsed.keywords.length > 0) {
            const cleanKeywords = parsed.keywords
              .map((k: string) => String(k).replace(/^[-*•\d.]+\s*/, '').trim())
              .filter((k: string) => k.length > 1 && k.length < 40)
              .slice(0, 12);
            if (cleanKeywords.length >= 4) {
              return { keywords: cleanKeywords, usedFallback: false };
            }
          }
        } catch {}
      }

      // 2. Try line-by-line bullet points / numbered lists if JSON didn't parse
      const lineMatches = raw
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.)\]]+\s*/, '').trim())
        .filter((line) => line.length > 2 && line.length < 40 && !line.startsWith('{') && !line.startsWith('}'));

      if (lineMatches.length >= 4) {
        return { keywords: lineMatches.slice(0, 10), usedFallback: false };
      }
    } catch (err) {
      console.warn('AI keyword suggestion failed, falling back to specialized industry profiles:', err);
    }
  }

  // Specialized industry & business information profile mapping (100% tailored to actual business)
  const dynamicKeywords: string[] = [];
  const textContext = `${businessName} ${category || ''} ${(types || []).join(' ')} ${summary || ''} ${city || ''} ${address || ''}`.toLowerCase();

  if (
    textContext.includes('marketing') ||
    textContext.includes('agency') ||
    textContext.includes('seo') ||
    textContext.includes('digital') ||
    textContext.includes('advertising') ||
    textContext.includes('media') ||
    textContext.includes('upmark')
  ) {
    dynamicKeywords.push(
      'Creative Marketing Strategy',
      'Impressive SEO Growth',
      'Prompt & Quick Response',
      'Clear ROI & Results',
      'Professional & Dedicated Team',
      'Transparent Reporting',
      'High Quality Campaigns',
      'Great Value for Money'
    );
  } else if (
    textContext.includes('software') ||
    textContext.includes(' tech') ||
    textContext.includes('web') ||
    textContext.includes('developer') ||
    textContext.includes('application') ||
    category === 'it' ||
    category === 'software'
  ) {
    dynamicKeywords.push(
      'Expert Technical Support',
      'Fast Bug Resolution',
      'Custom Feature Development',
      'Clean UI/UX Design',
      'Smooth Implementation',
      'Reliable & Secure System',
      'Professional Guidance'
    );
  } else if (
    textContext.includes('sweet') ||
    textContext.includes('bakery') ||
    textContext.includes('cake') ||
    textContext.includes('mithai') ||
    textContext.includes('dairy') ||
    textContext.includes('farsan')
  ) {
    dynamicKeywords.push(
      'Fresh & Authentic Taste',
      'Pure Desi Ghee Preparation',
      'Clean & Hygienic Counter',
      'Neat Packaging',
      'Polite & Quick Staff',
      'Delicious Sweets',
      'High Quality Ingredients'
    );
  } else if (
    textContext.includes('dental') ||
    textContext.includes('clinic') ||
    textContext.includes('hospital') ||
    textContext.includes('doctor') ||
    textContext.includes('physio') ||
    textContext.includes('health') ||
    textContext.includes('pharma')
  ) {
    dynamicKeywords.push(
      'Painless & Gentle Treatment',
      'Experienced & Caring Doctor',
      'Minimal Wait Time',
      'Clean & Sanitized Clinic',
      'Helpful & Polite Staff',
      'Accurate Diagnosis',
      'Clear Medical Advice'
    );
  } else if (
    textContext.includes('cafe') ||
    textContext.includes('restaurant') ||
    textContext.includes('food') ||
    textContext.includes('dining') ||
    textContext.includes('kitchen') ||
    textContext.includes('hotel') ||
    textContext.includes('dhaba')
  ) {
    dynamicKeywords.push(
      'Delicious & Fresh Food',
      'Cozy & Pleasant Ambiance',
      'Fast & Attentive Service',
      'Clean & Hygienic Seating',
      'Courteous & Polite Staff',
      'Great Food Quality',
      'Pocket-Friendly Prices'
    );
  } else if (
    textContext.includes('salon') ||
    textContext.includes('spa') ||
    textContext.includes('beauty') ||
    textContext.includes('parlour') ||
    textContext.includes('hair') ||
    textContext.includes('makeup')
  ) {
    dynamicKeywords.push(
      'Skilled & Polite Stylist',
      'Hygienic & Clean Tools',
      'Relaxing Ambiance',
      'Punctual Appointment',
      'Trendy Hair Styling',
      'Great Skin & Hair Care',
      'Premium Quality Products'
    );
  } else if (
    textContext.includes('jewel') ||
    textContext.includes('gold') ||
    textContext.includes('diamond') ||
    textContext.includes('silver')
  ) {
    dynamicKeywords.push(
      '100% Certified Hallmarked',
      'Unique & Modern Designs',
      'Transparent Making Charges',
      'Helpful & Courteous Staff',
      'Honest & Trustworthy Dealing',
      'Exceptional Shopping Experience'
    );
  } else if (
    textContext.includes('saree') ||
    textContext.includes('cloth') ||
    textContext.includes('boutique') ||
    textContext.includes('fashion') ||
    textContext.includes('tailor') ||
    textContext.includes('garment')
  ) {
    dynamicKeywords.push(
      'Wide Variety & Latest Collection',
      'Perfect Fitting & Stitching',
      'Premium Fabric Quality',
      'Affordable & Fair Prices',
      'Friendly & Patient Staff',
      'Great Bridal & Party Wear'
    );
  } else if (
    textContext.includes('gym') ||
    textContext.includes('fitness') ||
    textContext.includes('workout') ||
    textContext.includes('trainer') ||
    textContext.includes('yoga')
  ) {
    dynamicKeywords.push(
      'Modern & Maintained Equipment',
      'Supportive & Certified Trainers',
      'Energetic & Positive Vibe',
      'Clean & Hygienic Gym',
      'Customized Workout Guidance',
      'Friendly Community'
    );
  } else if (
    textContext.includes('education') ||
    textContext.includes('class') ||
    textContext.includes('tuition') ||
    textContext.includes('coaching') ||
    textContext.includes('school') ||
    textContext.includes('academy')
  ) {
    dynamicKeywords.push(
      'Clear Concept Explanation',
      'Personal Attention to Students',
      'Exam-Oriented Preparation',
      'Dedicated & Friendly Teachers',
      'Quality Study Material',
      'Regular Doubt Clearing'
    );
  } else if (
    textContext.includes('car') ||
    textContext.includes('auto') ||
    textContext.includes('garage') ||
    textContext.includes('mechanic') ||
    textContext.includes('vehicle') ||
    textContext.includes('motor')
  ) {
    dynamicKeywords.push(
      'Quick & Professional Car Service',
      'Genuine Spare Parts Used',
      'Transparent Cost Estimate',
      'Experienced Mechanics',
      'Clean Car Delivery on Time',
      'Reliable & Honest Advice'
    );
  } else if (
    textContext.includes('ca') ||
    textContext.includes('tax') ||
    textContext.includes('accountant') ||
    textContext.includes('legal') ||
    textContext.includes('lawyer') ||
    textContext.includes('advocate')
  ) {
    dynamicKeywords.push(
      'Accurate & Timely Tax Filing',
      'Clear Financial Guidance',
      'Fast Documentation Handling',
      'Trustworthy & Honest Advice',
      'Prompt Query Resolution',
      'Professional Compliance'
    );
  } else if (
    textContext.includes('photo') ||
    textContext.includes('studio') ||
    textContext.includes('shoot') ||
    textContext.includes('wedding') ||
    textContext.includes('video')
  ) {
    dynamicKeywords.push(
      'Stunning & Creative Photography',
      'Natural Lighting & Poses',
      'Punctual Photo & Video Delivery',
      'Friendly & Patient Photographer',
      'Cinematic Video Quality',
      'High Resolution Album Prints'
    );
  } else {
    dynamicKeywords.push(
      `Excellent Service at ${businessName}`,
      'Polite & Helpful Staff',
      'Fair & Honest Dealing',
      'Prompt Customer Support',
      'Clean & Professional Setup',
      'Highly Recommended'
    );
  }

  return { keywords: dynamicKeywords, usedFallback: true };
}

// ====================================================================
// AI-POWERED LOCAL SEO KEYWORD SUGGESTION ENGINE (Google Places New)
// ====================================================================

export interface LocalSeoKeywordSuggestion {
  keyword: string;
  type: 'local_seo' | 'product_service' | 'experience_topic';
  reason: string;
  source: 'place_data' | 'verified_business_data' | 'available_review_themes' | 'inference';
  confidence: 'high' | 'medium' | 'low';
}

export interface LocalSeoAnalysisOutput {
  businessName: string;
  businessCategory: string;
  location: string;
  keywordSuggestions: LocalSeoKeywordSuggestion[];
  customerQuestions: string[];
}

export interface LocalSeoAnalysisInput {
  businessName: string;
  category?: string | null;
  locality?: string | null;
  city?: string | null;
  address?: string | null;
  types?: string[] | null;
  summary?: string | null;
  websiteUri?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  reviews?: Array<{ text: string; rating?: number }> | null;
}

/**
 * Extracts locality / neighborhood and city from Google Places formatted address
 */
export function extractLocalityAndCity(
  address?: string | null,
  fallbackCity?: string | null
): { locality: string; city: string } {
  if (!address || typeof address !== 'string') {
    return { locality: '', city: fallbackCity || '' };
  }

  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  let city = fallbackCity || '';
  let locality = '';

  const stateRegex = /^(gujarat|maharashtra|rajasthan|delhi|karnataka|tamil nadu|uttar pradesh|madhya pradesh|punjab|haryana|kerala|west bengal|telangana|andhra pradesh|goa|bihar)$/i;

  for (let i = parts.length - 1; i >= 0; i--) {
    let part = parts[i];
    if (/india/i.test(part)) continue;
    if (/^\d{6}$/.test(part) || /\b\d{6}\b/.test(part)) {
      part = part.replace(/\b\d{6}\b/g, '').trim();
    }
    if (!part || stateRegex.test(part)) continue;

    if (!city) {
      city = part;
      continue;
    }
    if (!locality && part.toLowerCase() !== city.toLowerCase()) {
      locality = part;
      break;
    }
  }

  return {
    locality: locality || '',
    city: city || fallbackCity || 'India'
  };
}

/**
 * Deduplicate keyword suggestions case-insensitively
 */
export function deduplicateKeywordSuggestions(
  suggestions: LocalSeoKeywordSuggestion[]
): LocalSeoKeywordSuggestion[] {
  const seen = new Set<string>();
  const result: LocalSeoKeywordSuggestion[] = [];

  for (const s of suggestions) {
    if (!s || !s.keyword || typeof s.keyword !== 'string') continue;
    const norm = s.keyword.toLowerCase().trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    result.push({
      ...s,
      keyword: s.keyword.trim()
    });
  }

  return result;
}

/**
 * Deterministic local SEO keyword fallback generator tailored to verified business signals
 */
export function buildDeterministicLocalSeoFallback(
  input: LocalSeoAnalysisInput
): LocalSeoAnalysisOutput {
  const { businessName, category, types, address, summary, reviews } = input;
  const { locality, city } = extractLocalityAndCity(address, input.city);

  const locString = locality && city && locality !== city
    ? `${locality}, ${city}`
    : locality || city || 'Local Area';

  const contextStr = `${businessName} ${category || ''} ${(types || []).join(' ')} ${summary || ''} ${address || ''}`.toLowerCase();

  const suggestions: LocalSeoKeywordSuggestion[] = [];

  // Determine detected category display name (prioritizing user-inputted category)
  const catLower = (category || '').toLowerCase().trim();
  let detectedCategory = category || 'Local Business';

  if (catLower.includes('electronic') || catLower.includes('gadget') || catLower.includes('mobile') || contextStr.includes('croma')) {
    detectedCategory = 'Electronics Store';
  } else if (catLower.includes('dental') || catLower.includes('clinic') || catLower.includes('dentist')) {
    detectedCategory = 'Dental Clinic';
  } else if (catLower.includes('sweet') || catLower.includes('bakery') || catLower.includes('cake') || catLower.includes('mithai')) {
    detectedCategory = 'Sweets & Bakery';
  } else if (catLower.includes('restaurant') || catLower.includes('cafe') || catLower.includes('food') || catLower.includes('dining')) {
    detectedCategory = 'Restaurant & Cafe';
  } else if (catLower.includes('salon') || catLower.includes('spa') || catLower.includes('beauty') || catLower.includes('parlour')) {
    detectedCategory = 'Salon & Spa';
  } else if (catLower.includes('marketing') || catLower.includes('agency') || catLower.includes('seo') || catLower.includes('digital') || contextStr.includes('upmark')) {
    detectedCategory = 'Digital Marketing Agency';
  } else if (catLower.includes('garage') || catLower.includes('car') || catLower.includes('auto') || catLower.includes('repair')) {
    detectedCategory = 'Automobile Service';
  } else if (catLower.includes('coaching') || catLower.includes('classes') || catLower.includes('education') || catLower.includes('tuition')) {
    detectedCategory = 'Education & Coaching';
  } else if (catLower.includes('jewel') || catLower.includes('gold') || catLower.includes('diamond')) {
    detectedCategory = 'Jewellery Showroom';
  } else if (catLower.includes('gym') || catLower.includes('fitness')) {
    detectedCategory = 'Gym & Fitness Center';
  } else if (catLower.includes('tax') || catLower.includes('legal') || catLower.includes('accountant') || catLower.includes('ca')) {
    detectedCategory = 'CA & Legal Services';
  } else if (catLower.includes('hospital') || catLower.includes('healthcare') || catLower.includes('doctor')) {
    detectedCategory = 'Healthcare & Hospital';
  } else if (category && category !== 'services' && category !== 'Local Business') {
    detectedCategory = category;
  } else if (contextStr.includes('dental') || contextStr.includes('clinic')) {
    detectedCategory = 'Dental Clinic';
  } else if (contextStr.includes('sweet') || contextStr.includes('bakery')) {
    detectedCategory = 'Sweets & Bakery';
  } else if (contextStr.includes('restaurant') || contextStr.includes('cafe')) {
    detectedCategory = 'Restaurant & Cafe';
  } else if (contextStr.includes('salon') || contextStr.includes('spa')) {
    detectedCategory = 'Salon & Spa';
  } else if (contextStr.includes('marketing') || contextStr.includes('agency') || contextStr.includes('seo')) {
    detectedCategory = 'Digital Marketing Agency';
  }

  const categoryLower = detectedCategory.toLowerCase();

  // 1. LOCAL SEO SEARCHES (Location-based high-intent queries)
  if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
    suggestions.push({
      keyword: `${categoryLower} in ${locality}`,
      type: 'local_seo',
      reason: `Primary local pack query for nearby customers searching in ${locality}.`,
      source: 'place_data',
      confidence: 'high'
    });
    suggestions.push({
      keyword: `${categoryLower} in ${locality} ${city}`,
      type: 'local_seo',
      reason: `High intent geo-qualified discovery query for ${city} residents.`,
      source: 'place_data',
      confidence: 'high'
    });
    suggestions.push({
      keyword: `${businessName} ${locality} ${city}`,
      type: 'local_seo',
      reason: `Brand + location exact match query for directions and store hours.`,
      source: 'verified_business_data',
      confidence: 'high'
    });
  } else {
    suggestions.push({
      keyword: `${categoryLower} in ${city || 'my area'}`,
      type: 'local_seo',
      reason: `Primary city-wide local discovery phrase for ${city}.`,
      source: 'place_data',
      confidence: 'high'
    });
    suggestions.push({
      keyword: `best ${categoryLower} near me`,
      type: 'local_seo',
      reason: `High-frequency "near me" mobile search query with immediate buyer intent.`,
      source: 'inference',
      confidence: 'high'
    });
    suggestions.push({
      keyword: `${businessName} ${city}`,
      type: 'local_seo',
      reason: `Direct brand navigational query for customers searching for this specific business.`,
      source: 'verified_business_data',
      confidence: 'high'
    });
  }

  // 2. PRODUCTS & SERVICES (Verified or inferred from industry category)
  if (detectedCategory === 'Electronics Store') {
    suggestions.push(
      { keyword: 'mobile phones', type: 'product_service', reason: 'High-volume consumer category for electronics retailers.', source: 'place_data', confidence: 'high' },
      { keyword: 'laptops', type: 'product_service', reason: 'Core product category with frequent in-store inquiries.', source: 'inference', confidence: 'medium' },
      { keyword: 'televisions', type: 'product_service', reason: 'Major home entertainment department.', source: 'inference', confidence: 'medium' },
      { keyword: 'home appliances', type: 'product_service', reason: 'Essential large appliance category.', source: 'inference', confidence: 'medium' },
      { keyword: 'smart watches & accessories', type: 'product_service', reason: 'High-attachment gadget category.', source: 'inference', confidence: 'medium' }
    );
  } else if (detectedCategory === 'Dental Clinic') {
    suggestions.push(
      { keyword: 'root canal treatment', type: 'product_service', reason: 'High-search clinical dental procedure.', source: 'inference', confidence: 'high' },
      { keyword: 'teeth whitening', type: 'product_service', reason: 'Popular cosmetic dental service.', source: 'inference', confidence: 'medium' },
      { keyword: 'dental implants', type: 'product_service', reason: 'High-value restorative treatment.', source: 'inference', confidence: 'medium' },
      { keyword: 'routine dental checkup', type: 'product_service', reason: 'Standard recurring preventive service.', source: 'place_data', confidence: 'high' }
    );
  } else if (detectedCategory === 'Sweets & Bakery') {
    suggestions.push(
      { keyword: 'pure desi ghee sweets', type: 'product_service', reason: 'Top quality signal for Indian sweet customers.', source: 'inference', confidence: 'high' },
      { keyword: 'kaju katli', type: 'product_service', reason: 'Highest-demand traditional delicacy.', source: 'inference', confidence: 'high' },
      { keyword: 'custom birthday cakes', type: 'product_service', reason: 'Frequent celebration order inquiry.', source: 'inference', confidence: 'medium' },
      { keyword: 'fresh traditional farsan', type: 'product_service', reason: 'Daily high-velocity snack item.', source: 'place_data', confidence: 'high' }
    );
  } else if (detectedCategory === 'Restaurant & Cafe') {
    suggestions.push(
      { keyword: 'delicious multicuisine dining', type: 'product_service', reason: 'Primary food experience offering.', source: 'place_data', confidence: 'high' },
      { keyword: 'special lunch thali', type: 'product_service', reason: 'Popular daytime meal choice.', source: 'inference', confidence: 'medium' },
      { keyword: 'fresh brewed coffee', type: 'product_service', reason: 'Core cafe beverage draw.', source: 'inference', confidence: 'medium' },
      { keyword: 'takeaway & fast delivery', type: 'product_service', reason: 'Essential modern dining convenience.', source: 'inference', confidence: 'medium' }
    );
  } else if (detectedCategory === 'Salon & Spa') {
    suggestions.push(
      { keyword: 'hair styling & haircut', type: 'product_service', reason: 'Core grooming service.', source: 'place_data', confidence: 'high' },
      { keyword: 'keratin hair treatment', type: 'product_service', reason: 'High-ticket salon treatment.', source: 'inference', confidence: 'medium' },
      { keyword: 'bridal makeup', type: 'product_service', reason: 'Peak festival and wedding demand service.', source: 'inference', confidence: 'medium' },
      { keyword: 'skin facial & spa', type: 'product_service', reason: 'Standard wellness offering.', source: 'inference', confidence: 'medium' }
    );
  } else if (detectedCategory === 'Digital Marketing Agency') {
    suggestions.push(
      { keyword: 'creative marketing strategy', type: 'product_service', reason: 'Core strategic business offering.', source: 'verified_business_data', confidence: 'high' },
      { keyword: 'SEO ranking growth', type: 'product_service', reason: 'High-intent client search objective.', source: 'verified_business_data', confidence: 'high' },
      { keyword: 'social media management', type: 'product_service', reason: 'Continuous retainer service.', source: 'inference', confidence: 'medium' },
      { keyword: 'Google ads & paid campaigns', type: 'product_service', reason: 'Direct performance marketing service.', source: 'inference', confidence: 'medium' }
    );
  } else if (detectedCategory === 'Automobile Service') {
    suggestions.push(
      { keyword: 'periodic car service', type: 'product_service', reason: 'Core vehicle scheduled maintenance.', source: 'place_data', confidence: 'high' },
      { keyword: 'wheel alignment & balancing', type: 'product_service', reason: 'High-frequency garage service.', source: 'inference', confidence: 'high' },
      { keyword: 'engine diagnosis & tune-up', type: 'product_service', reason: 'Essential mechanical health check.', source: 'inference', confidence: 'medium' },
      { keyword: 'genuine spare parts', type: 'product_service', reason: 'Major customer trust factor.', source: 'inference', confidence: 'high' }
    );
  } else if (detectedCategory === 'Education & Coaching') {
    suggestions.push(
      { keyword: 'concept clarity & doubts', type: 'product_service', reason: 'Core academic coaching outcome.', source: 'place_data', confidence: 'high' },
      { keyword: 'exam-oriented preparation', type: 'product_service', reason: 'Key differentiator for competitive tests.', source: 'inference', confidence: 'high' },
      { keyword: 'quality study material', type: 'product_service', reason: 'Valuable student learning resource.', source: 'inference', confidence: 'medium' },
      { keyword: 'experienced faculty guidance', type: 'product_service', reason: 'Primary trust driver for parents and students.', source: 'inference', confidence: 'high' }
    );
  } else if (detectedCategory === 'Jewellery Showroom') {
    suggestions.push(
      { keyword: 'hallmarked gold jewellery', type: 'product_service', reason: 'Essential purity benchmark for gold buyers.', source: 'place_data', confidence: 'high' },
      { keyword: 'certified diamond jewellery', type: 'product_service', reason: 'High-intent fine jewellery offering.', source: 'inference', confidence: 'high' },
      { keyword: 'custom bridal jewellery designs', type: 'product_service', reason: 'Major wedding season demand category.', source: 'inference', confidence: 'medium' },
      { keyword: 'transparent gold rate & making charges', type: 'product_service', reason: 'Key purchase consideration for buyers.', source: 'inference', confidence: 'high' }
    );
  } else if (detectedCategory === 'Gym & Fitness Center') {
    suggestions.push(
      { keyword: 'personal fitness training', type: 'product_service', reason: 'High-value fitness membership service.', source: 'place_data', confidence: 'high' },
      { keyword: 'modern gym equipment & weights', type: 'product_service', reason: 'Primary facility attraction.', source: 'inference', confidence: 'high' },
      { keyword: 'weight loss & muscle building programs', type: 'product_service', reason: 'Most common workout goals.', source: 'inference', confidence: 'medium' },
      { keyword: 'certified trainers & workout plans', type: 'product_service', reason: 'Crucial guidance factor for gym-goers.', source: 'inference', confidence: 'high' }
    );
  } else if (detectedCategory === 'CA & Legal Services') {
    suggestions.push(
      { keyword: 'income tax return (ITR) filing', type: 'product_service', reason: 'Annual recurring financial compliance service.', source: 'place_data', confidence: 'high' },
      { keyword: 'GST registration & monthly returns', type: 'product_service', reason: 'Essential ongoing business service.', source: 'inference', confidence: 'high' },
      { keyword: 'company incorporation & compliance', type: 'product_service', reason: 'High-intent startup and corporate advisory.', source: 'inference', confidence: 'medium' },
      { keyword: 'auditing & tax planning', type: 'product_service', reason: 'Core professional accounting service.', source: 'inference', confidence: 'high' }
    );
  } else if (detectedCategory === 'Healthcare & Hospital') {
    suggestions.push(
      { keyword: 'specialist doctor consultation', type: 'product_service', reason: 'Primary patient care offering.', source: 'place_data', confidence: 'high' },
      { keyword: 'pathology lab & diagnostics', type: 'product_service', reason: 'Essential clinical testing service.', source: 'inference', confidence: 'high' },
      { keyword: 'emergency medical care', type: 'product_service', reason: '24/7 urgent healthcare reassurance.', source: 'inference', confidence: 'medium' },
      { keyword: 'caring nursing & patient support', type: 'product_service', reason: 'Key customer satisfaction driver.', source: 'inference', confidence: 'high' }
    );
  } else {
    suggestions.push(
      { keyword: `${categoryLower} services`, type: 'product_service', reason: `Core professional offering for ${detectedCategory}.`, source: 'place_data', confidence: 'high' },
      { keyword: 'custom solutions', type: 'product_service', reason: 'Tailored client requests.', source: 'inference', confidence: 'medium' },
      { keyword: 'quality consultation', type: 'product_service', reason: 'Professional advisory offering.', source: 'inference', confidence: 'medium' }
    );
  }

  // 3. CUSTOMER EXPERIENCE TOPICS (Verified from reviews or proven sentiment signals)
  let reviewThemesFound = false;
  if (reviews && Array.isArray(reviews) && reviews.length > 0) {
    const combinedReviewText = reviews.map((r) => r.text || '').join(' ').toLowerCase();

    if (combinedReviewText.includes('staff') || combinedReviewText.includes('helpful') || combinedReviewText.includes('polite')) {
      suggestions.push({
        keyword: 'staff helpfulness',
        type: 'experience_topic',
        reason: 'Repeatedly praised by customers in Google Maps reviews.',
        source: 'available_review_themes',
        confidence: 'high'
      });
      reviewThemesFound = true;
    }
    if (combinedReviewText.includes('clean') || combinedReviewText.includes('hygien')) {
      suggestions.push({
        keyword: 'store cleanliness & hygiene',
        type: 'experience_topic',
        reason: 'Highlighted by visitors as an important comfort factor.',
        source: 'available_review_themes',
        confidence: 'high'
      });
      reviewThemesFound = true;
    }
    if (combinedReviewText.includes('price') || combinedReviewText.includes('worth') || combinedReviewText.includes('rate')) {
      suggestions.push({
        keyword: 'value for money',
        type: 'experience_topic',
        reason: 'Verified theme in customer sentiment regarding pricing fairness.',
        source: 'available_review_themes',
        confidence: 'high'
      });
      reviewThemesFound = true;
    }
    if (combinedReviewText.includes('demo') || combinedReviewText.includes('explain') || combinedReviewText.includes('guid')) {
      suggestions.push({
        keyword: 'product demonstration & guidance',
        type: 'experience_topic',
        reason: 'Validated in customer reviews for attentive in-store walkthroughs.',
        source: 'available_review_themes',
        confidence: 'high'
      });
      reviewThemesFound = true;
    }
  }

  // Fallback experience topics if review snippets are sparse or not permitted
  if (!reviewThemesFound) {
    suggestions.push(
      { keyword: 'staff helpfulness', type: 'experience_topic', reason: 'Critical sentiment factor directly driving 5-star ratings.', source: 'inference', confidence: 'high' },
      { keyword: 'product demonstration', type: 'experience_topic', reason: 'Builds customer confidence and post-purchase satisfaction.', source: 'inference', confidence: 'medium' },
      { keyword: 'billing experience', type: 'experience_topic', reason: 'Smooth, swift checkout creates positive lasting impression.', source: 'inference', confidence: 'medium' },
      { keyword: 'shopping experience', type: 'experience_topic', reason: 'Comprehensive measure of visitor satisfaction.', source: 'inference', confidence: 'high' }
    );
  }

  const deduplicated = deduplicateKeywordSuggestions(suggestions);

  return {
    businessName,
    businessCategory: detectedCategory,
    location: locString,
    keywordSuggestions: deduplicated.slice(0, 15),
    customerQuestions: [
      'What product or service did you use or explore today?',
      'How was your in-person experience with our staff, service, and guidance?'
    ]
  };
}

/**
 * Main AI-Powered Local SEO Keyword Suggestion Engine
 */
export async function generateLocalSeoKeywords(
  aiBinding: any,
  input: LocalSeoAnalysisInput
): Promise<LocalSeoAnalysisOutput> {
  const fallback = buildDeterministicLocalSeoFallback(input);

  if (!aiBinding) {
    return fallback;
  }

  const { locality, city } = extractLocalityAndCity(input.address, input.city);
  const locationDesc = locality && city && locality !== city
    ? `${locality}, ${city}`
    : locality || city || 'India';

  const reviewSnippets = (input.reviews || [])
    .slice(0, 5)
    .map((r, i) => `Review ${i + 1} (${r.rating || 5}★): "${r.text.substring(0, 200)}"`)
    .join('\n');

  const systemPrompt = `You are a Senior Digital Marketer, Local SEO Expert, Google Business Profile Specialist, and AI Engineer.
Your task is to analyze real business data retrieved from Google Places API (New) and generate an explainable, category-specific, location-specific Local SEO keyword report.

RULES:
1. Generate strictly between 8 and 15 tailored suggestions.
2. Every suggestion MUST have:
   - "keyword": 2 to 4 words search phrase.
   - "type": strictly "local_seo" | "product_service" | "experience_topic".
     * "local_seo": Location-based local search phrases (e.g. "[category] in [locality]", "[businessName] [locality] [city]").
     * "product_service": Verified or strongly inferred offerings of this business. Never invent products not sold by this business.
     * "experience_topic": Customer experience themes (e.g. staff helpfulness, product demonstration, billing speed, cleanliness).
   - "reason": A 1-sentence digital marketing rationale explaining why this keyword matters for local discovery or customer sentiment.
   - "source": strictly "place_data" | "verified_business_data" | "available_review_themes" | "inference".
   - "confidence": strictly "high" | "medium" | "low".
3. Formulate 2 open-ended, policy-safe "customerQuestions" (e.g. "What product or service did you use?", "How was your overall experience?"). Never tell customers what words to include.
4. Output strictly valid JSON with this exact structure:
{
  "businessName": "${input.businessName}",
  "businessCategory": "${fallback.businessCategory}",
  "location": "${locationDesc}",
  "keywordSuggestions": [
    {
      "keyword": "string",
      "type": "local_seo",
      "reason": "string",
      "source": "place_data",
      "confidence": "high"
    }
  ],
  "customerQuestions": [
    "string",
    "string"
  ]
}
5. Do NOT include markdown blocks or any other text outside the JSON object.`;

  const userPrompt = `Analyze Google Place:
Business Name: "${input.businessName}"
Category: "${fallback.businessCategory}"
Google Types: [${(input.types || []).join(', ')}]
Address: "${input.address || ''}"
Locality: "${locality}"
City: "${city}"
${input.summary ? `Editorial Summary: "${input.summary}"` : ''}
${input.rating ? `Rating: ${input.rating}★ (${input.userRatingCount || 0} reviews)` : ''}
${reviewSnippets ? `Recent Review Snippets:\n${reviewSnippets}` : ''}

Generate the JSON report.`;

  try {
    const response = await aiBinding.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.2
    });

    let raw = '';
    if (typeof response === 'string') {
      raw = response;
    } else if (typeof response?.response === 'string') {
      raw = response.response;
    } else {
      raw = JSON.stringify(response || {});
    }

    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (Array.isArray(parsed?.keywordSuggestions) && parsed.keywordSuggestions.length >= 4) {
        const validTypes = new Set(['local_seo', 'product_service', 'experience_topic']);
        const validSources = new Set(['place_data', 'verified_business_data', 'available_review_themes', 'inference']);
        const validConf = new Set(['high', 'medium', 'low']);

        const sanitizedSuggestions: LocalSeoKeywordSuggestion[] = [];

        for (const item of parsed.keywordSuggestions) {
          if (!item?.keyword || typeof item.keyword !== 'string') continue;
          const cleanKw = item.keyword.replace(/^[-*•\d.]+\s*/, '').trim();
          if (!cleanKw || cleanKw.length < 2 || cleanKw.length > 50) continue;

          sanitizedSuggestions.push({
            keyword: cleanKw,
            type: validTypes.has(item.type) ? item.type : 'local_seo',
            reason: typeof item.reason === 'string' && item.reason.length > 5 ? item.reason : `Relevant keyword for ${cleanKw}`,
            source: validSources.has(item.source) ? item.source : 'inference',
            confidence: validConf.has(item.confidence) ? item.confidence : 'medium'
          });
        }

        const deduplicated = deduplicateKeywordSuggestions(sanitizedSuggestions);

        if (deduplicated.length >= 6) {
          return {
            businessName: parsed.businessName || input.businessName,
            businessCategory: parsed.businessCategory || fallback.businessCategory,
            location: parsed.location || locationDesc,
            keywordSuggestions: deduplicated.slice(0, 15),
            customerQuestions: Array.isArray(parsed.customerQuestions) && parsed.customerQuestions.length >= 2
              ? parsed.customerQuestions
              : fallback.customerQuestions
          };
        }
      }
    }
  } catch (err) {
    console.warn('AI local SEO keyword generation failed, using tailored deterministic fallback:', err);
  }

  return fallback;
}

