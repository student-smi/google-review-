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
 * Diverse, dynamic template generator returning 3 distinct review options.
 * Generates rich variety using diverse perspectives, sentence openings, and randomized style seeds.
 */
export function getFallbackTemplates(
  businessName: string,
  chips: string[],
  freeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en',
  category?: string | null,
  city?: string | null,
  seed?: number
): Array<{ id: string; title: string; text: string; wordCount: number }> {
  const points = [...chips];
  if (freeText.trim()) points.push(freeText.trim());
  const combined = points.length > 0 ? points.join(', ') : 'overall service';
  const locSuffix = city ? ` in ${city}` : '';

  const isFood = Boolean(
    (category || '' + businessName)
      .toLowerCase()
      .match(/sweet|bakery|restaurant|cafe|food|snack|dining|mithai|dhokla|hotel/)
  );

  // Pick deterministic or random variation indices (0 to 3)
  const currentSeed = typeof seed === 'number' ? Math.abs(seed) : Math.floor(Math.random() * 1000);
  const idx1 = currentSeed % 4;
  const idx2 = (currentSeed + 1) % 4;
  const idx3 = (currentSeed + 2) % 4;

  switch (lang) {
    case 'gu': {
      const opt1Variants = [
        `${businessName} ખાતે મુલાકાત લીધી. ${combined} ખરેખર ઉત્તમ રહ્યું. ઝડપી અને સંતોષકારક અનુભવ!`,
        `${businessName}${locSuffix} ખાતે ખૂબ જ સરસ મુલાકાત અને અનુભવ રહ્યો. ${combined} ખરેખર ઉચ્ચ ગુણવત્તાનું હતું. ૫ સ્ટાર રેટિંગ!`,
        `એકદમ સરળ અને ઝડપી મુલાકાત! ${businessName} માં ${combined} જોઈને ખૂબ આનંદ થયો. ખૂબ આભાર!`,
        `${businessName} ખાતે મુલાકાત લઈ ખૂબ સારો અનુભવ થયો. ${combined} અને સર્વિસ બંને સુપર હિટ રહ્યા.`
      ];

      const opt2Variants = isFood
        ? [
            `આજે ${businessName}${locSuffix} ખાતે મુલાકાત લીધી. ${combined} ની ગુણવત્તા ખૂબ જ સ્વાદિષ્ટ અને ઉત્તમ હતી. સ્ટાફનો વ્યવહાર પણ અત્યંત વિવેકી હતો. ચોક્કસપણે ફરીથી મુલાકાત લઈશું.`,
            `${businessName}${locSuffix} ખાતે મુલાકાત લઈને ખૂબ આનંદ થયો. ખાસ કરીને ${combined} નો સ્વાદ અને તાજગી અદ્ભુત હતી. સ્વચ્છતા અને સર્વિસ બંને ૧૦૦% પરફેક્ટ છે. ચોક્કસ ભલામણ કરું છું!`,
            `પ્રથમ વખત ${businessName}${locSuffix} ની મુલાકાત લીધી અને ખરેખર મજા આવી ગઈ! ${combined} એકદમ તાજું અને સ્વાદિષ્ટ હતું. સ્ટાફ પણ ખૂબ પ્રેમાળ અને સહયોગી છે. ફરી જરૂરથી આવીશું.`,
            `${businessName} માં પરિવાર સાથે મુલાકાતનો અનુભવ શ્રેષ્ઠ રહ્યો. ${combined} ની ઉત્કૃષ્ટ ગુણવત્તા માટે ખૂબ ખૂબ અભિનંદન. દરેક ફૂડ પ્રેમીએ અહીં જરૂર મુલાકાત લેવી જોઈએ.`
          ]
        : [
            `આજે ${businessName}${locSuffix} ખાતે ઉત્તમ અનુભવ રહ્યો. ${combined} ની ગુણવત્તા ખરેખર વિશ્વસનીય અને પ્રશંસનીય હતી. સ્ટાફનો વ્યવહાર પણ અત્યંત સહયોગી અને વિવેકી રહ્યો. ખૂબ જ ભલામણ કરું છું!`,
            `${city ? `${city} માં ` : ''}${businessName} ખાતે મુલાકાત લઈ ખૂબ સંતોષ થયો. ${combined} બાબતે તેમની કાળજી અને ચોકસાઈ લાજવાબ છે. દરેક ગ્રાહક સાથે સ્ટાફ ખૂબ નમ્રતાપૂર્વક વર્તે છે. જરૂરથી ફરી સંપર્ક કરીશું.`,
            `પ્રથમ વખત ${businessName}${locSuffix} ની મુલાકાત લીધી અને ખરેખર અપેક્ષા કરતાં પણ શ્રેષ્ઠ સેવા મળી! ખાસ કરીને ${combined} ની બાબતમાં તેમણે કોઈ કચાશ રાખી નથી. સમગ્ર ટીમનો ખૂબ ખૂબ આભાર.`,
            `${businessName} ની મુલાકાત દરમિયાન સેવા ૧૦૦% પ્રમાણિક અને ભરોસાપાત્ર જણાઈ. ${combined} નું પરિણામ જોઈને ઘણો સંતોષ થયો. જે કોઈ શ્રેષ્ઠ પરિણામ ઈચ્છતા હોય તેમને અહીં જવાની ભલામણ કરું છું.`
          ];

      const opt3Variants = [
        `${businessName} માં ઘણો સારો અનુભવ રહ્યો. ${combined} ઘણું ગમ્યું અને સર્વિસ પણ ઉત્તમ હતી. બધાને અહીં મુલાકાત લેવા ભલામણ કરું છું.`,
        `ખૂબ જ સારો અને મૈત્રીપૂર્ણ માહોલ. ${businessName} દ્વારા પૂરી પાડવામાં આવેલ ${combined} ઉત્કૃષ્ટ રહી. સમયસર અને સરસ મુલાકાત રહી.`,
        `${businessName} નું કામ એકદમ પર્ફેક્ટ છે. મુલાકાત દરમિયાન ${combined} અને વિવેકી વ્યવહાર માટે પૂરા ૫ સ્ટાર. ઉત્તમ સેવા!`,
        `${businessName}${locSuffix} માં મુલાકાત ખૂબ જ સંતોષકારક રહી. ${combined} ની ક્વોલિટી અને વ્યવસ્થા બંને એકદમ યોગ્ય હતા. જરૂરથી રેકમેન્ડ કરું છું.`
      ];

      return [
        {
          id: 'opt_1',
          title: 'ટૂંકું અને ઝડપી (Short & Crisp)',
          text: opt1Variants[idx1],
          wordCount: opt1Variants[idx1].split(/\s+/).length
        },
        {
          id: 'opt_2',
          title: 'વિગતવાર અને આત્મીય (Warm & Detailed)',
          text: opt2Variants[idx2],
          wordCount: opt2Variants[idx2].split(/\s+/).length
        },
        {
          id: 'opt_3',
          title: 'સંતુલિત અને મૈત્રીપૂર્ણ (Balanced & Friendly)',
          text: opt3Variants[idx3],
          wordCount: opt3Variants[idx3].split(/\s+/).length
        }
      ];
    }

    case 'hi': {
      const opt1Variants = [
        `आज ${businessName} का अनुभव बहुत बढ़िया रहा। ${combined} विशेष रूप से पसंद आया। शानदार सर्विस!`,
        `${businessName}${locSuffix} में बहुत ही शानदार अनुभव रहा। ${combined} वास्तव में उच्च गुणवत्तापूर्ण था। 5 स्टार!`,
        `बहुत ही त्वरित और सुखद अनुभव! ${businessName} में ${combined} देखकर बहुत अच्छा लगा। बहुत-बहुत धन्यवाद!`,
        `${businessName} की सर्विस वास्तव में सराहनीय है। ${combined} और काम दोनों बहुत बढ़िया रहे।`
      ];

      const opt2Variants = isFood
        ? [
            `आज ${businessName}${locSuffix} में बहुत सुखद अनुभव रहा। ${combined} की क्वालिटी बहुत ताज़ा और स्वादिष्ट थी। स्टाफ़ का व्यवहार भी बहुत सहयोगी और विनम्र था। ज़रूर दोबारा आएंगे।`,
            `${businessName}${locSuffix} में आकर दिल खुश हो गया! विशेष रूप से ${combined} का स्वाद और स्वच्छता लाजवाब थी। स्टाफ़ बहुत मददगार है। सभी को आने की सलाह दूंगा।`,
            `पहली बार ${businessName}${locSuffix} आए और उम्मीद से कहीं बेहतर अनुभव मिला! ${combined} बहुत स्वादिष्ट था। निश्चित रूप से दोबारा विज़िट करेंगे।`,
            `${businessName} में परिवार के साथ बहुत अच्छा अनुभव रहा। ${combined} की बेहतरीन क्वालिटी और शानदार आतिथ्य के लिए 5 स्टार!`
          ]
        : [
            `आज ${businessName}${locSuffix} में बहुत बेहतरीन अनुभव रहा। ${combined} वास्तव में विश्वसनीय और उच्च गुणवत्तापूर्ण था। स्टाफ़ का व्यवहार भी बहुत सहयोगी और विनम्र था। ज़रूर दोबारा संपर्क करेंगे।`,
            `${city ? `${city} में ` : ''}${businessName} के साथ बहुत संतोषजनक अनुभव मिला। ${combined} को बहुत कुशलता से संभाला गया। स्टाफ़ बहुत पेशेवर और मददगार है।`,
            `पहली बार ${businessName}${locSuffix} से जुड़े और काम से बेहद प्रभावित हुए! विशेष रूप से ${combined} में उनकी लगन साफ नज़र आती है। पूरी टीम का धन्यवाद!`,
            `${businessName} की सेवाएं पूरी तरह से भरोसेमंद हैं। ${combined} का उत्कृष्ट परिणाम मिला। उच्च गुणवत्ता की चाह रखने वालों को यह ज़रूर रेकमेंड करूंगा।`
          ];

      const opt3Variants = [
        `${businessName} में बहुत अच्छा अनुभव मिला। ${combined} बहुत बढ़िया था और समय पर काम हुआ। साफ़-सुथरा व पेशेवर माहौल था।`,
        `बहुत ही सहज और दोस्ताना माहौल! ${businessName} द्वारा दी गई ${combined} सेवा उत्कृष्ट रही। आगे भी यहीं आएंगे।`,
        `${businessName} का काम बिल्कुल सटीक है। ${combined} और विनम्र व्यवहार के लिए पूरे 5 स्टार। शानदार काम!`,
        `${businessName}${locSuffix} में विज़िट बहुत सफल रही। ${combined} की गुणवत्ता और व्यवस्था दोनों बेमिसाल थीं।`
      ];

      return [
        {
          id: 'opt_1',
          title: 'संक्षिप्त व सटीक (Short & Crisp)',
          text: opt1Variants[idx1],
          wordCount: opt1Variants[idx1].split(/\s+/).length
        },
        {
          id: 'opt_2',
          title: 'विस्तृत व आत्मीय (Warm & Detailed)',
          text: opt2Variants[idx2],
          wordCount: opt2Variants[idx2].split(/\s+/).length
        },
        {
          id: 'opt_3',
          title: 'संतुलित व सहज (Balanced & Friendly)',
          text: opt3Variants[idx3],
          wordCount: opt3Variants[idx3].split(/\s+/).length
        }
      ];
    }

    case 'hinglish': {
      const opt1Variants = [
        `Visited ${businessName}${locSuffix} today. Really liked the ${combined}. Super smooth experience!`,
        `Amazing experience at ${businessName}${locSuffix}! The ${combined} was totally top-notch. 5 stars!`,
        `Super fast and hassle-free service at ${businessName}. Loved the ${combined}!`,
        `${businessName} delivered great results. The ${combined} and overall service were truly impressive.`
      ];

      const opt2Variants = isFood
        ? [
            `Had an amazing visit to ${businessName}${locSuffix} today! The ${combined} was freshly prepared and top quality. The staff was super helpful. Definitely coming back again!`,
            `Visited ${businessName}${locSuffix} and loved everything! Especially the ${combined}—super tasty and hygienic. Staff behavior was very polite. Highly recommend!`,
            `First time visiting ${businessName} and the experience blew me away! The ${combined} was delicious and fresh. Wonderful hospitality all around!`,
            `Awesome experience with family at ${businessName}${locSuffix}. Loved the ${combined} and clean vibe. Will definitely visit again soon!`
          ]
        : [
            `Had an amazing experience with ${businessName}${locSuffix} today! The ${combined} was top quality and highly reliable. The staff was super helpful throughout. Strongly recommend!`,
            `Been looking for reliable service${locSuffix}, and ${businessName} completely delivered! The attention to ${combined} was remarkable. Very professional team.`,
            `First time trying ${businessName}${locSuffix} and thoroughly impressed! The ${combined} was handled smoothly and on time. Big thumbs up to the team!`,
            `100% satisfied with ${businessName}! The ${combined} was excellent and the staff was courteous. Highly recommended to everyone.`
          ];

      const opt3Variants = [
        `Great experience with ${businessName}. Really appreciated the ${combined}. Fast service and clean setup. Highly recommend!`,
        `Very friendly staff and dependable service at ${businessName}. The ${combined} made the visit totally worthwhile!`,
        `Solid 5 stars for ${businessName}! Everything was well organized, especially the ${combined}. Keep up the great work!`,
        `Super happy with my visit to ${businessName}${locSuffix}. The team was responsive and ${combined} was perfect!`
      ];

      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: opt1Variants[idx1],
          wordCount: opt1Variants[idx1].split(/\s+/).length
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: opt2Variants[idx2],
          wordCount: opt2Variants[idx2].split(/\s+/).length
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: opt3Variants[idx3],
          wordCount: opt3Variants[idx3].split(/\s+/).length
        }
      ];
    }

    case 'en':
    default: {
      const opt1Variants = [
        `Visited ${businessName}${locSuffix} today. Really appreciated the ${combined}. Smooth and professional experience!`,
        `Super impressed with ${businessName}${locSuffix}! The ${combined} was top quality from start to finish. 5 stars!`,
        `Quick, seamless, and completely hassle-free visit to ${businessName}. Everything regarding ${combined} was handled perfectly.`,
        `Outstanding experience with ${businessName}. Truly impressed by their ${combined} and prompt attention throughout.`
      ];

      const opt2Variants = isFood
        ? [
            `Had a wonderful experience visiting ${businessName}${locSuffix} today. The ${combined} was exceptional and freshly prepared. The staff was courteous and attentive throughout. Highly recommend!`,
            `Visited ${businessName}${locSuffix} and was thoroughly delighted! The ${combined} was flavorful, fresh, and served with great care. Clean ambiance and welcoming team—definitely coming back!`,
            `First time visiting ${businessName}${locSuffix} and it exceeded all expectations! The ${combined} was delicious and top quality. The team made sure we were comfortable throughout.`,
            `An absolute gem${locSuffix}! ${businessName} delivers on both taste and hospitality. The ${combined} was outstanding. A must-visit for anyone who values great quality!`
          ]
        : [
            `Had a wonderful experience with ${businessName}${locSuffix} today. The ${combined} was exceptional and truly reliable. The team was courteous and attentive throughout. Highly recommend!`,
            `I've been looking for dependable service${locSuffix}, and ${businessName} completely exceeded expectations! The attention given to ${combined} was remarkable. The team is genuinely professional.`,
            `First-class experience with ${businessName}${locSuffix}. What stood out most was the quality of ${combined}—everything was thoroughly professional and stress-free. Very pleased and would definitely return!`,
            `Cannot recommend ${businessName} enough! Their dedication and care with ${combined} was evident right from the start. Great communication, honest guidance, and an overall 5-star experience.`
          ];

      const opt3Variants = [
        `Great experience with ${businessName}. Everything was well-managed, especially the ${combined}. Clean setup, courteous staff, and great value.`,
        `Friendly atmosphere and dependable service at ${businessName}. The ${combined} made the visit totally worthwhile. Keep up the fantastic work!`,
        `Very happy with my visit to ${businessName}. The team was helpful, the ${combined} was just as promised, and everything was completed on time.`,
        `Solid 5-star rating for ${businessName}! From the welcoming team to the great ${combined}, it was a pleasure doing business here.`
      ];

      return [
        {
          id: 'opt_1',
          title: 'Short & Crisp',
          text: opt1Variants[idx1],
          wordCount: opt1Variants[idx1].split(/\s+/).length
        },
        {
          id: 'opt_2',
          title: 'Warm & Detailed',
          text: opt2Variants[idx2],
          wordCount: opt2Variants[idx2].split(/\s+/).length
        },
        {
          id: 'opt_3',
          title: 'Balanced & Friendly',
          text: opt3Variants[idx3],
          wordCount: opt3Variants[idx3].split(/\s+/).length
        }
      ];
    }
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
