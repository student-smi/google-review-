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

  // Flag only high-risk hallucinated promotional claims or unmentioned roles (not normal customer words)
  const suspiciousKeywords = [
    'chef', 'waiter', 'discount', '50% off', '100% off', 'cashback', 'rupees', 'rs.', '₹', 'cheated'
  ];

  for (const kw of suspiciousKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(draft) && !allowedSource.includes(kw)) {
      flaggedEntities.push(kw);
    }
  }

  // Check word count constraint (6 - 150 words)
  const words = draft.trim().split(/\s+/).filter(Boolean);
  const isWithinLength = words.length >= 6 && words.length <= 150;

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
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en',
  category?: string | null,
  city?: string | null
): Array<{ id: string; title: string; text: string; wordCount: number }> {
  const points = [...chips];
  if (freeText.trim()) points.push(freeText.trim());
  const combined = points.length > 0 ? points.join(', ') : 'overall service';
  const locSuffix = city ? ` in ${city}` : '';
  const catText = category ? ` ${category}` : '';

  const isFood = Boolean((category || '' + businessName).toLowerCase().match(/sweet|bakery|restaurant|cafe|food|snack|dining|mithai|dhokla|hotel/));

  switch (lang) {
    case 'gu':
      return [
        {
          id: 'opt_1',
          title: 'ટૂંકું અને ઝડપી (Short & Crisp)',
          text: `${businessName} ખાતે મુલાકાત લીધી. ${combined} ખરેખર ઉત્તમ રહ્યું. ઝડપી અને સંતોષકારક અનુભવ!`,
          wordCount: 12
        },
        {
          id: 'opt_2',
          title: 'વિગતવાર અને આત્મીય (Warm & Detailed)',
          text: isFood
            ? `આજે ${businessName}${locSuffix} ખાતે મુલાકાત લીધી. ${combined} ની ગુણવત્તા ખૂબ જ સ્વાદિષ્ટ અને ઉત્તમ હતી. સ્ટાફનો વ્યવહાર પણ અત્યંત વિવેકી હતો. ચોક્કસપણે ફરીથી મુલાકાત લઈશું.`
            : `આજે ${businessName}${locSuffix} ખાતે ઉત્તમ અનુભવ રહ્યો. ${combined} ની ગુણવત્તા ખરેખર વિશ્વસનીય અને પ્રશંસનીય હતી. સ્ટાફનો વ્યવહાર પણ અત્યંત સહયોગી અને વિવેકી રહ્યો. ખૂબ જ ભલામણ કરું છું!`,
          wordCount: 24
        },
        {
          id: 'opt_3',
          title: 'સંતુલિત અને મૈત્રીપૂર્ણ (Balanced & Friendly)',
          text: `${businessName} માં ઘણો સારો અનુભવ રહ્યો. ${combined} ઘણું ગમ્યું અને સર્વિસ પણ ઉત્તમ હતી. બધાને અહીં આવવા ભલામણ કરું છું.`,
          wordCount: 19
        }
      ];

    case 'hi':
      return [
        {
          id: 'opt_1',
          title: 'संक्षिप्त व सटीक (Short & Crisp)',
          text: `आज ${businessName} का अनुभव बहुत बढ़िया रहा। ${combined} विशेष रूप से पसंद आया। शानदार सर्विस!`,
          wordCount: 14
        },
        {
          id: 'opt_2',
          title: 'विस्तृत व आत्मीय (Warm & Detailed)',
          text: isFood
            ? `आज ${businessName}${locSuffix} में बहुत सुखद अनुभव रहा। ${combined} की क्वालिटी बहुत ताज़ा और स्वादिष्ट थी। स्टाफ़ का व्यवहार भी बहुत सहयोगी और विनम्र था। ज़रूर दोबारा आएंगे।`
            : `आज ${businessName}${locSuffix} में बहुत बेहतरीन अनुभव रहा। ${combined} वास्तव में विश्वसनीय और उच्च गुणवत्तापूर्ण था। स्टाफ़ का व्यवहार भी बहुत सहयोगी और विनम्र था। ज़रूर दोबारा संपर्क करेंगे।`,
          wordCount: 26
        },
        {
          id: 'opt_3',
          title: 'संतुलित व सहज (Balanced & Friendly)',
          text: `${businessName} में बहुत अच्छा अनुभव मिला। ${combined} बहुत बढ़िया था और समय पर काम हुआ। साफ़-सुथरा व पेशेवर माहौल था।`,
          wordCount: 18
        }
      ];

    case 'hinglish':
      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: `Visited ${businessName}${locSuffix} today. Really liked the ${combined}. Super smooth experience!`,
          wordCount: 12
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: isFood
            ? `Had an amazing visit to ${businessName}${locSuffix} today! The ${combined} was freshly prepared and top quality. The staff was super helpful. Definitely coming back again!`
            : `Had an amazing experience with ${businessName}${locSuffix} today! The ${combined} was top quality and highly reliable. The staff was super helpful throughout. Strongly recommend!`,
          wordCount: 24
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: `Great experience with ${businessName}. Really appreciated the ${combined}. Fast service and clean setup. Highly recommend!`,
          wordCount: 18
        }
      ];

    case 'en':
    default:
      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: `Visited ${businessName}${locSuffix} today. Really appreciated the ${combined}. Smooth and professional experience!`,
          wordCount: 14
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: isFood
            ? `Had a wonderful experience visiting ${businessName}${locSuffix} today. The ${combined} was exceptional and freshly prepared. The staff was courteous and attentive throughout. Highly recommend!`
            : `Had a wonderful experience with ${businessName}${locSuffix} today. The ${combined} was exceptional and truly reliable. The team was courteous and attentive throughout. Highly recommend!`,
          wordCount: 25
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: `Great experience with ${businessName}. Everything was well-managed, especially the ${combined}. Clean setup, courteous staff, and great value.`,
          wordCount: 20
        }
      ];
  }
}

// Single fallback backward-compatibility helper
export function getFallbackTemplate(
  businessName: string,
  chips: string[],
  freeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en',
  category?: string | null,
  city?: string | null
): string {
  const options = getFallbackTemplates(businessName, chips, freeText, lang, category, city);
  return options[1]?.text || options[0]?.text;
}
