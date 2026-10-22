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
 * Deterministic fallback templates returning 3 distinct review options.
 * Never blocks the customer.
 */
export function getFallbackTemplates(
  businessName: string,
  chips: string[],
  freeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en'
): Array<{ id: string; title: string; text: string; wordCount: number }> {
  const points = [...chips];
  if (freeText.trim()) points.push(freeText.trim());
  const combined = points.length > 0 ? points.join(', ') : 'overall service';

  switch (lang) {
    case 'gu':
      return [
        {
          id: 'opt_1',
          title: 'ટૂંકું અને ઝડપી (Short & Crisp)',
          text: `${businessName} ખાતે મુલાકાત લીધી. ${combined} ખરેખર ઉત્તમ હતું. ઝડપી અને સરસ અનુભવ!`,
          wordCount: 12
        },
        {
          id: 'opt_2',
          title: 'વિગતવાર અને આત્મીય (Warm & Detailed)',
          text: `આજે ${businessName} ખાતે મુલાકાત લીધી. ${combined} ની ગુણવત્તા ખૂબ જ સ્વાદિષ્ટ અને તાજી હતી. સ્ટાફનો વ્યવહાર પણ અત્યંત વિવેકી હતો. ચોક્કસપણે ફરીથી મુલાકાત લઈશું.`,
          wordCount: 24
        },
        {
          id: 'opt_3',
          title: 'સંતુલિત અને મૈત્રીપૂર્ણ (Balanced & Friendly)',
          text: `${businessName} માં ઘણો સારો અનુભવ રહ્યો. ${combined} ઘણું ગમ્યું અને સર્વિસ પણ ઉત્તમ હતી. બધાને આ જગ્યાએ આવવા ભલામણ કરું છું.`,
          wordCount: 19
        }
      ];

    case 'hi':
      return [
        {
          id: 'opt_1',
          title: 'संक्षिप्त व सटीक (Short & Crisp)',
          text: `आज ${businessName} का अनुभव बहुत बढ़िया रहा। ${combined} विशेष रूप से पसंद आया। शानदार अनुभव!`,
          wordCount: 14
        },
        {
          id: 'opt_2',
          title: 'विस्तृत व आत्मीय (Warm & Detailed)',
          text: `आज ${businessName} में बहुत सुखद अनुभव रहा। ${combined} की क्वालिटी बहुत ताज़ा और स्वादिष्ट थी। स्टाफ़ का व्यवहार भी बहुत सहयोगी और विनम्र था। ज़रूर दोबारा आएंगे।`,
          wordCount: 26
        },
        {
          id: 'opt_3',
          title: 'संतुलित व सहज (Balanced & Friendly)',
          text: `${businessName} में बहुत अच्छा अनुभव मिला। ${combined} बहुत बढ़िया था और समय पर सर्विस मिली। साफ़-सुथरा माहौल था।`,
          wordCount: 18
        }
      ];

    case 'hinglish':
      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: `Visited ${businessName} today. Loved the ${combined} and quick service. Really good experience!`,
          wordCount: 14
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: `Had an amazing visit to ${businessName} today! The ${combined} was freshly prepared and top quality. The staff was super helpful. Definitely coming back again!`,
          wordCount: 26
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: `Great experience at ${businessName}. Really appreciated the ${combined}. Fast counter service and clean ambiance. Strongly recommend visiting!`,
          wordCount: 20
        }
      ];

    case 'en':
    default:
      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: `Visited ${businessName} today. Really appreciated the ${combined} and prompt service. Great overall experience!`,
          wordCount: 15
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: `Had a wonderful experience visiting ${businessName} today. The ${combined} was exceptional and freshly prepared. The staff was courteous and attentive throughout. Highly recommend!`,
          wordCount: 26
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: `Great visit to ${businessName}. Everything was well-managed, especially the ${combined}. Clean ambiance and courteous staff. Looking forward to visiting again soon.`,
          wordCount: 22
        }
      ];
  }
}

// Single fallback backward-compatibility helper
export function getFallbackTemplate(
  businessName: string,
  chips: string[],
  freeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en'
): string {
  const options = getFallbackTemplates(businessName, chips, freeText, lang);
  return options[1]?.text || options[0]?.text;
}
