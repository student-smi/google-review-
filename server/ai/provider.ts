import { validateReviewDraft, getFallbackTemplate } from './guardrails';

export interface GenerateReviewDraftParams {
  businessName: string;
  chips: string[];
  freeText: string;
  language: 'en' | 'hi' | 'gu' | 'hinglish';
  tone: 'warm' | 'concise' | 'formal';
}

export async function generateCustomerReviewDraft(
  aiBinding: any,
  params: GenerateReviewDraftParams
): Promise<{ draft: string; usedFallback: boolean }> {
  const { businessName, chips, freeText, language, tone } = params;

  if (!aiBinding) {
    return {
      draft: getFallbackTemplate(businessName, chips, freeText, language),
      usedFallback: true
    };
  }

  const systemPrompt = `You are a helpful assistant for real customers writing genuine Google reviews for "${businessName}".
RULES:
1. Use ONLY the facts provided by the customer in their chips or notes.
2. NEVER invent details (no fake staff names, no unmentioned dishes, no fabricated dates or prices).
3. Tone: ${tone}.
4. Language: ${language === 'hi' ? 'Hindi (Devanagari script)' : language === 'gu' ? 'Gujarati script' : language === 'hinglish' ? 'Hinglish (conversational Hindi in Latin alphabet)' : 'English'}.
5. Length: between 30 and 90 words. Short and genuine.
6. Output ONLY the review text. Do not include quotes, titles, greetings, or explanations.`;

  const userPrompt = `Customer selected points: ${chips.join(', ') || 'Good experience'}
Customer specific note: ${freeText || 'None'}`;

  try {
    const response = await aiBinding.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 180,
      temperature: 0.6
    });

    const rawDraft = response?.response?.trim() || '';

    // Validate anti-fabrication
    const validation = validateReviewDraft(rawDraft, chips, freeText);
    if (validation.isValid) {
      return { draft: validation.sanitizedDraft, usedFallback: false };
    }

    // If validation flagged hallucinated specifics, return clean template fallback
    return {
      draft: getFallbackTemplate(businessName, chips, freeText, language),
      usedFallback: true
    };
  } catch (err) {
    console.warn('Workers AI generation failed, using fallback template:', err);
    return {
      draft: getFallbackTemplate(businessName, chips, freeText, language),
      usedFallback: true
    };
  }
}

export interface GenerateOwnerRepliesParams {
  businessName: string;
  customerName?: string;
  reviewText: string;
  rating?: number;
  brandVoice?: string;
  resolutionContact?: string;
}

export async function generateOwnerReplies(
  aiBinding: any,
  params: GenerateOwnerRepliesParams
) {
  const { businessName, customerName, reviewText, rating, brandVoice, resolutionContact } = params;

  const fallbackWarm = `Dear ${customerName || 'Guest'},\n\nThank you so much for visiting ${businessName} and sharing your feedback! We truly appreciate your patronage and hope to welcome you back again soon.\n\nWarm regards,\nManagement, ${businessName}`;
  const fallbackProf = `Dear ${customerName || 'Customer'},\n\nThank you for taking the time to review ${businessName}. Your feedback is valuable to our team. ${resolutionContact ? `If you have further suggestions, please contact us at ${resolutionContact}.` : ''}\n\nSincerely,\n${businessName}`;
  const fallbackConcise = `Hi ${customerName || 'there'}, thanks for the great review of ${businessName}! We look forward to serving you again.`;

  if (!aiBinding) {
    return { warm: fallbackWarm, professional: fallbackProf, concise: fallbackConcise };
  }

  const prompt = `You are the owner of "${businessName}". Generate 3 review reply options for this Google review:
Review text: "${reviewText}"
Customer name: "${customerName || 'Customer'}"
Rating: ${rating ? `${rating} stars` : 'Not specified'}
Resolution contact line: "${resolutionContact || 'our management'}"

Return valid JSON with exactly three keys: "warm", "professional", and "concise".
RULES:
- Acknowledge specific points mentioned in the review.
- For negative points, apologize sincerely and offer offline resolution without arguing or making excuses.
- Never promise cash refunds unless asked.`;

  try {
    const response = await aiBinding.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are an AI assistant helping business owners reply professionally to Google reviews. Respond strictly in valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 350,
      temperature: 0.5
    });

    const text = response?.response?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        warm: parsed.warm || fallbackWarm,
        professional: parsed.professional || fallbackProf,
        concise: parsed.concise || fallbackConcise
      };
    }
  } catch (err) {
    console.warn('AI reply generation failed, using defaults:', err);
  }

  return { warm: fallbackWarm, professional: fallbackProf, concise: fallbackConcise };
}
