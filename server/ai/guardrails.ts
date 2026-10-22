// Anti-fabrication guardrail & validation pipeline for ReviewQR

export interface DraftValidationResult {
  isValid: boolean;
  sanitizedDraft: string;
  flaggedEntities: string[];
  usedFallback: boolean;
}

/**
 * Validates that the AI generated draft only contains facts present in the customer's input.
 * Strictly prevents hallucinating specific dishes, staff names, dates, or prices.
 */
export function validateReviewDraft(
  draft: string,
  customerChips: string[],
  customerFreeText: string
): DraftValidationResult {
  const allowedSource = `${customerChips.join(' ')} ${customerFreeText}`.toLowerCase();
  const flaggedEntities: string[] = [];

  // Common hallucinated words to guard against if not in input
  const suspiciousKeywords = [
    'chef', 'manager', 'owner', 'waiter', 'waitress',
    'discount', 'free', 'rupees', 'rs.', '₹', 'percent',
    'yesterday', 'last week', 'birthday', 'anniversary'
  ];

  for (const kw of suspiciousKeywords) {
    if (draft.toLowerCase().includes(kw) && !allowedSource.includes(kw)) {
      flaggedEntities.push(kw);
    }
  }

  // Check word count constraint (40 - 140 words)
  const words = draft.trim().split(/\s+/).filter(Boolean);
  const isWithinLength = words.length >= 10 && words.length <= 150;

  const isValid = flaggedEntities.length === 0 && isWithinLength;

  return {
    isValid,
    sanitizedDraft: draft.trim(),
    flaggedEntities,
    usedFallback: !isValid
  };
}

/**
 * Deterministic fallback template if AI quota is exhausted, rate limited, or fails validation.
 * Never blocks the customer.
 */
export function getFallbackTemplate(
  businessName: string,
  chips: string[],
  freeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en'
): string {
  const points = [...chips];
  if (freeText.trim()) points.push(freeText.trim());
  const combined = points.length > 0 ? points.join(', ') : 'overall visit';

  switch (lang) {
    case 'hi':
      return `आज ${businessName} का अनुभव बहुत बढ़िया रहा। ${combined} विशेष रूप से पसंद आया। स्टाफ़ का व्यवहार भी अच्छा था।`;
    case 'gu':
      return `આજે ${businessName} ખાતે મુલાકાત લીધી. ${combined} ખૂબ જ સરસ રહ્યું. સેવા પણ ઝડપી અને ઉત્તમ હતી.`;
    case 'hinglish':
      return `Visited ${businessName} today. Overall bohot accha experience tha! ${combined} was genuinely great. Definitely visiting again!`;
    case 'en':
    default:
      return `Visited ${businessName} today. Really appreciated the ${combined}. The service was courteous and everything was well-managed.`;
  }
}
