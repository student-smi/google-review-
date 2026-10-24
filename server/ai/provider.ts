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

export async function generateOwnerReplies(
  aiBinding: any,
  params: GenerateOwnerRepliesParams
) {
  const { businessName, customerName, reviewText, rating, category, city, brandVoice, resolutionContact } = params;

  const locInfo = city ? ` (${city})` : '';
  const fallbackWarm = `Dear ${customerName || 'Guest'},\n\nThank you so much for visiting ${businessName}${locInfo} and sharing your feedback! We truly appreciate your patronage and hope to welcome you back again soon.\n\nWarm regards,\nManagement, ${businessName}`;
  const fallbackProf = `Dear ${customerName || 'Customer'},\n\nThank you for taking the time to review ${businessName}${locInfo}. Your feedback is valuable to our team. ${resolutionContact ? `If you have further suggestions, please contact us at ${resolutionContact}.` : ''}\n\nSincerely,\n${businessName}`;
  const fallbackConcise = `Hi ${customerName || 'there'}, thanks for the great review of ${businessName}! We look forward to serving you again.`;

  if (!aiBinding) {
    return { warm: fallbackWarm, professional: fallbackProf, concise: fallbackConcise };
  }

  const prompt = `You are the owner of "${businessName}"${locInfo}${category ? ` (${category})` : ''}. Generate 3 review reply options for this Google review:
Review text: "${reviewText}"
Customer name: "${customerName || 'Customer'}"
Rating: ${rating ? `${rating} stars` : 'Not specified'}
Resolution contact line: "${resolutionContact || 'our management'}"

Return valid JSON with exactly three keys: "warm", "professional", and "concise".
RULES:
- Acknowledge specific points mentioned in the review.
- Mention your business setting appropriately (${category || 'our store'}).
- For negative points, apologize sincerely and offer offline resolution without arguing or making excuses.
- Never promise cash refunds unless asked.`;

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
      if (typeof val === 'string') return val.trim();
      if (val && typeof val === 'object') {
        if (typeof val.response === 'string') {
          const next = typeof val.next_steps === 'string' ? `\n\n${val.next_steps.trim()}` : '';
          return `${val.response.trim()}${next}`.trim();
        }
        if (typeof val.text === 'string') return val.text.trim();
        if (typeof val.reply === 'string') return val.reply.trim();
        const parts = Object.values(val).filter((v) => typeof v === 'string') as string[];
        if (parts.length > 0) return parts.join('\n\n').trim();
      }
      return fallback;
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
