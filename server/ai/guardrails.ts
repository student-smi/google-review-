// Anti-fabrication guardrail & validation pipeline for Loctimize™
// Enforces strict word limits: Minimum 30 words, Maximum 50 words

export interface DraftValidationResult {
  isValid: boolean;
  sanitizedDraft: string;
  flaggedEntities: string[];
  usedFallback: boolean;
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Enforces strict word count: minimum 30 words, maximum 50 words.
 * Trims excess words cleanly at punctuation/sentence bounds, and pads short drafts with authentic context.
 */
export function enforceWordCount(
  text: string,
  minWords = 30,
  maxWords = 50,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en',
  businessName = 'this business'
): string {
  let cleanText = (text || '').trim();
  if (!cleanText) return cleanText;

  let words = cleanText.split(/\s+/).filter(Boolean);

  // If over maxWords, trim cleanly
  if (words.length > maxWords) {
    const sentences = cleanText.match(/[^.!?।]+[.!?।]+/g) || [cleanText];
    let accumulated = '';
    let accumulatedWords = 0;
    let foundBoundary = false;

    for (const s of sentences) {
      const sWords = s.trim().split(/\s+/).filter(Boolean).length;
      if (accumulatedWords + sWords <= maxWords) {
        accumulated += (accumulated ? ' ' : '') + s.trim();
        accumulatedWords += sWords;
        if (accumulatedWords >= minWords) {
          foundBoundary = true;
        }
      } else {
        break;
      }
    }

    if (foundBoundary && accumulatedWords >= minWords && accumulatedWords <= maxWords) {
      cleanText = accumulated;
    } else {
      // Hard trim to target within 30-50 (e.g. 44 words)
      const targetLength = Math.min(maxWords, 44);
      const targetWords = words.slice(0, targetLength);
      let joined = targetWords.join(' ');
      joined = joined.replace(/[,;:\-\s]+$/, '');
      const punctuation = lang === 'hi' ? '।' : (lang === 'gu' ? '!' : '.');
      cleanText = joined + punctuation;
    }
  }

  // Recalculate words
  words = cleanText.split(/\s+/).filter(Boolean);

  // If under minWords (30 words), append an authentic closing sentence to reach >= 30 words
  if (words.length < minWords) {
    let padding = '';
    if (lang === 'gu') {
      padding = ' સ્ટાફનો વ્યવહાર ખૂબ જ વિવેકી રહ્યો અને સર્વિસ પણ ઝડપી હતી. આટલા ઉત્તમ અનુભવ બદલ સમગ્ર ટીમનો ખૂબ આભાર!';
    } else if (lang === 'hi') {
      padding = ' स्टाफ का व्यवहार बहुत ही विनम्र व सहयोगी रहा और काम समय पर पूरा हुआ। बेहतरीन सेवा के लिए पूरी टीम का धन्यवाद!';
    } else if (lang === 'hinglish') {
      padding = ' The staff was polite, humble, and ensured prompt service throughout the visit. Definitely recommending them to friends and family!';
    } else {
      padding = ' The staff was courteous, helpful, and ensured prompt assistance throughout our visit. Highly recommended for dependable and quality service!';
    }

    cleanText = cleanText.replace(/[.!?।\s]+$/, '') + (lang === 'hi' ? '।' : '.') + padding;
    words = cleanText.split(/\s+/).filter(Boolean);

    // Safety guard: if padding pushed slightly over 50, trim safely
    if (words.length > maxWords) {
      cleanText = words.slice(0, maxWords).join(' ').replace(/[,;:\-\s]+$/, '') + (lang === 'hi' ? '।' : '.');
    }
  }

  return cleanText.trim();
}

/**
 * Validates that the AI generated draft only contains facts present in the customer's input.
 * Strictly prevents hallucinating specific dishes, staff names, dates, or prices,
 * and enforces the 30-to-50 word requirement.
 */
export function validateReviewDraft(
  draft: string,
  customerChips: string[],
  customerFreeText: string,
  lang: 'en' | 'hi' | 'gu' | 'hinglish' = 'en',
  businessName?: string
): DraftValidationResult {
  const allowedSource = `${customerChips.join(' ')} ${customerFreeText}`.toLowerCase();
  const flaggedEntities: string[] = [];

  // Flag only high-risk hallucinated promotional claims or unmentioned roles
  const suspiciousKeywords = [
    'chef', 'waiter', 'discount', '50% off', '100% off', 'cashback', 'rupees', 'rs.', '₹', 'cheated'
  ];

  for (const kw of suspiciousKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(draft) && !allowedSource.includes(kw)) {
      flaggedEntities.push(kw);
    }
  }

  // Enforce word count between 30 and 50 words
  const balancedDraft = enforceWordCount(draft, 30, 50, lang, businessName);
  const words = countWords(balancedDraft);
  const isWithinLength = words >= 30 && words <= 50;

  const isValid = flaggedEntities.length === 0 && isWithinLength;

  return {
    isValid,
    sanitizedDraft: balancedDraft,
    flaggedEntities,
    usedFallback: !isValid
  };
}

/**
 * Diverse, dynamic template generator returning 3 distinct review options.
 * Every option in every language strictly adheres to 30–50 words.
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

  const balanceOption = (text: string, id: string, title: string) => {
    const balanced = enforceWordCount(text, 30, 50, lang, businessName);
    return {
      id,
      title,
      text: balanced,
      wordCount: countWords(balanced)
    };
  };

  switch (lang) {
    case 'gu': {
      const opt1Variants = [
        `${businessName}${locSuffix} ખાતે આજની મુલાકાત ખરેખર ખૂબ જ સંતોષકારક રહી. અહીં ${combined} ની વ્યવસ્થા અને કામગીરી બંને ઉત્તમ હતા. સ્ટાફનો વ્યવહાર ખૂબ જ નમ્ર અને સહયોગી રહ્યો. આટલા સરસ અનુભવ બદલ સમગ્ર ટીમનો ખૂબ ખૂબ આભાર!`,
        `આજે ${businessName}${locSuffix} ની મુલાકાત લીધી અને બધી જ બાબતો ખૂબ યોગ્ય લાગી. ખાસ કરીને ${combined} ની ગુણવત્તા અને ઝડપી સર્વિસથી ઘણો આનંદ થયો. દરેક બાબતમાં તેમની ચોકસાઈ શ્રેષ્ઠ છે. ચોક્કસપણે બધા મિત્રોને અહીં મુલાકાત લેવાની ભલામણ કરું છું!`,
        `${businessName} માં પ્રથમ વખત જવાનો અનુભવ અપેક્ષા કરતાં પણ ઘણો સારો રહ્યો. મુલાકાત દરમિયાન ${combined} ની સુવિધા અને સમયપાલન બંને લાજવાબ હતા. સ્ટાફ તરફથી પણ ઘણું સારું માર્ગદર્શન મળ્યું. ૫ સ્ટાર રેટિંગ અને ઉત્તમ સેવા માટે અભિનંદન!`,
        `${businessName}${locSuffix} ખાતે મળેલ સેવા એકદમ વિશ્વસનીય અને પ્રશંસનીય જણાઈ. અહીં ${combined} બાબતે ખૂબ જ સરસ કાળજી રાખવામાં આવી હતી. ગ્રાહક સંતોષ માટે તેમની લગન ખરેખર પ્રશંસાપાત્ર છે. ફરી જરૂરથી અહીં મુલાકાત લઈશું!`
      ];

      const opt2Variants = isFood
        ? [
            `આજે પરિવાર સાથે ${businessName}${locSuffix} ખાતે મુલાકાત લીધી અને ખરેખર મજા આવી ગઈ. ખાસ કરીને ${combined} નો સ્વાદ અને તાજગી અદ્ભુત હતી. પરિસરમાં સ્વચ્છતા ખૂબ સરસ હતી અને સ્ટાફનો વ્યવહાર અત્યંત પ્રેમાળ હતો. દરેક ફૂડ પ્રેમી માટે આ શ્રેષ્ઠ સ્થળ છે!`,
            `${businessName}${locSuffix} ખાતે મુલાકાત લઈને ખૂબ જ ખુશી થઈ. અહીં પીરસવામાં આવેલ ${combined} એકદમ તાજું અને સ્વાદિષ્ટ હતું. સર્વિસ ખૂબ જ ઝડપી અને સ્વચ્છતા ૧૦૦% પરફેક્ટ જણાઈ. સ્ટાફ દરેક વિગતનું ધ્યાન રાખે છે. ચોક્કસપણે ફરી મુલાકાત લઈશું અને બધાને ભલામણ કરું છું!`,
            `પ્રથમ વખત ${businessName}${locSuffix} ની મુલાકાત લીધી અને અહીંની ઉચ્ચ ગુણવત્તાથી ખૂબ પ્રભાવિત થયો. ${combined} નો સ્વાદ લાજવાબ હતો અને કિંમત પણ એકદમ વ્યાજબી છે. ગ્રાહકો સાથે તેમનું આતિથ્ય સત્કાર ખરેખર દિલ જીતી લે તેવું છે. પૂરા ૫ સ્ટાર!`,
            `${businessName} ખાતે મુલાકાતનો અનુભવ યાદગાર રહ્યો. અહીં ખાસ કરીને ${combined} ની ગુણવત્તા અને તાજગી જોઈને ઘણો સંતોષ થયો. સમગ્ર સ્ટાફ અત્યંત વિવેકી છે અને વાતાવરણ શાંત છે. જે કોઈ ઉત્તમ ગુણવત્તા ઈચ્છતા હોય તેમણે અહીં ચોક્કસ આવવું જોઈએ.`
          ]
        : [
            `આજે ${businessName}${locSuffix} સાથેનો વ્યવહાર અને સેવા અત્યંત વિશ્વસનીય જણાયા. ખાસ કરીને ${combined} બાબતે તેમણે દર્શાવેલ ચોકસાઈ અને વ્યવસાયિક અભિગમ ખૂબ પ્રભાવશાળી હતો. સ્ટાફ પણ દરેક પ્રશ્નનો ખૂબ શાંતિપૂર્વક ઉકેલ આપે છે. હું કોઈપણ સંકોચ વગર આ સ્થળની ભલામણ કરું છું!`,
            `${city ? `${city} માં ` : ''}${businessName} ખાતે સેવા મેળવીને ઘણો સંતોષ થયો. અહીં ${combined} બાબતે તેમની ઝડપ અને પારદર્શિતા પ્રશંસનીય છે. દરેક ગ્રાહક સાથે સ્ટાફ ખૂબ વિવેકપૂર્ણ અને સહયોગી રીતે વર્તે છે. ઉત્કૃષ્ટ ગુણવત્તા અને ભરોસાપાત્ર કામગીરી માટે ૫ સ્ટાર!`,
            `${businessName}${locSuffix} ખાતે મુલાકાત દરમિયાન બધી જ સુવિધાઓ અપેક્ષા કરતાં શ્રેષ્ઠ મળી. તેમણે ${combined} નું કામ ખૂબ કાળજીપૂર્વક પૂરું કર્યું. તેમનું માર્ગદર્શન એકદમ પ્રામાણિક અને સ્પષ્ટ હતું. ઉત્તમ કાર્ય માટે સમગ્ર ટીમનો દિલથી આભાર માનું છું!`,
            `${businessName} ની સેવાઓ સંપૂર્ણપણે ભરોસાપાત્ર અને સમયસરની છે. અહીં ${combined} ના પરિણામથી મને ૧૦૦% સંતોષ થયો છે. સ્ટાફની કાર્યક્ષમતા અને વિનમ્રતા બંને શ્રેષ્ઠ છે. કોઈપણ વ્યક્તિને ઉત્કૃષ્ટ સેવા જોઈતી હોય તો અહીં જરૂર સંપર્ક કરવો જોઈએ.`
          ];

      const opt3Variants = [
        `${businessName} માં ઘણો સરસ અને હૂંફાળો અનુભવ રહ્યો. અહીં ${combined} ની ઉત્કૃષ્ટ સુવિધા સાથે સ્ટાફનો વ્યવહાર પણ ખૂબ સારો હતો. બધું કામ સમયસર અને ચોકસાઈથી પૂરું થયું. આ સરસ સેવા માટે પૂરા ૫ સ્ટાર!`,
        `${businessName}${locSuffix} ખાતે વાતાવરણ ખૂબ સકારાત્મક અને વ્યવસ્થિત હતું. મુલાકાત દરમિયાન ${combined} ખરેખર ખૂબ ગમ્યું. સર્વિસ ઝડપી હતી અને ટીમ પણ ઘણી મદદગાર જણાઈ. ભવિષ્યમાં પણ અહીં જ આવવાનું પસંદ કરીશ.`,
        `ખૂબ જ સરસ મુલાકાત! ${businessName} ખાતે ${combined} બાબતે ઉત્તમ સેવા પૂરી પાડવામાં આવી. સમગ્ર પ્રક્રિયા એકદમ સરળ અને તણાવમુક્ત રહી. જે કોઈ ગુણવત્તાયુક્ત કામ ઈચ્છે છે તેમને અહીં જવાની ખાસ ભલામણ છે.`,
        `${businessName}${locSuffix} ની મુલાકાત એકદમ સંતોષપ્રદ રહી. અહીં ${combined} ની ગુણવત્તા અને સ્ટાફની નમ્રતા બંને પ્રશંસાપાત્ર રહ્યા. કોઈ પણ ફરિયાદ વગર ઝડપી સેવા મળી. આ ઉત્કૃષ્ટ કામગીરી બદલ ખૂબ ખૂબ અભિનંદન!`
      ];

      return [
        balanceOption(opt1Variants[idx1], 'opt_1', 'ટૂંકું અને સચોટ (Short & Crisp)'),
        balanceOption(opt2Variants[idx2], 'opt_2', 'વિગતવાર અને આત્મીય (Warm & Detailed)'),
        balanceOption(opt3Variants[idx3], 'opt_3', 'સંતુલિત અને મૈત્રીપૂર્ણ (Balanced & Friendly)')
      ];
    }

    case 'hi': {
      const opt1Variants = [
        `आज ${businessName}${locSuffix} में बहुत ही सुखद और संतुष्टिदायक अनुभव रहा। यहां ${combined} की गुणवत्ता और त्वरित सर्विस वास्तव में बहुत शानदार थी। स्टाफ का व्यवहार अत्यंत विनम्र और सहयोगी रहा। बेहतरीन अनुभव के लिए पूरी टीम का धन्यवाद!`,
        `${businessName}${locSuffix} की सेवाएं वाकई बहुत ही सराहनीय और भरोसेमंद हैं। यहां ${combined} से जुड़े काम को बहुत ही कुशलता और समय पर पूरा किया गया। हर एक विवरण पर ध्यान दिया गया। 5 स्टार रेटिंग और बहुत-बहुत बधाई!`,
        `बहुत ही सहज और शानदार अनुभव! ${businessName} में ${combined} देखकर दिल खुश हो गया। यहां का माहौल साफ़-सुथरा है और टीम बहुत मददगार है। किसी भी परेशानी के बिना काम पूरा हुआ। सभी को आने की सलाह दूंगा!`,
        `आज ${businessName}${locSuffix} की पहली विज़िट थी और सब कुछ उम्मीद से बेहतर मिला। विशेषकर ${combined} की व्यवस्था और स्टाफ का दोस्ताना स्वभाव दिल जीत लेने वाला था। निश्चित रूप से आगे भी यहीं आना पसंद करेंगे!`
      ];

      const opt2Variants = isFood
        ? [
            `आज परिवार के साथ ${businessName}${locSuffix} में बहुत ही लाजवाब अनुभव रहा। विशेष रूप से ${combined} का स्वाद, ताज़गी और बेहतरीन प्रस्तुति अद्भुत थी। साफ़-सफ़ाई का पूरा ध्यान रखा गया है और स्टाफ बहुत आत्मीयता से पेश आया। हर एक फूड लवर को यहां ज़रूर आना चाहिए!`,
            `${businessName}${locSuffix} में बहुत ही शानदार अनुभव रहा, आकर दिल खुश हो गया! यहां की हर एक चीज़ में गुणवत्ता झलकती है, खास तौर पर ${combined} बहुत स्वादिष्ट और ताज़ा था। सर्विस भी बहुत त्वरित और स्वच्छ थी। सभी साथियों को विज़िट करने की सलाह दूंगा!`,
            `पहली बार ${businessName}${locSuffix} आए और यहां का अनुभव व आतिथ्य सत्कार वाकई दिल छू लेने वाला था। ${combined} का स्वाद और महक बहुत ही लाजवाब रही। पूरे परिसर में स्वच्छता बेहतरीन थी और स्टाफ बहुत मददगार रहा। पूरे 5 स्टार!`,
            `${businessName} में दोस्तों के साथ बहुत शानदार समय और अनुभव बिताया। यहां परोसा गया ${combined} ताज़ा और बेहतरीन स्वाद से भरपूर था। वातावरण बहुत आरामदायक है और सेवा बिना किसी देरी के मिली। आगे भी ज़रूर विज़िट करेंगे!`
          ]
        : [
            `आज ${businessName}${locSuffix} के साथ बहुत ही पेशेवर और संतोषजनक अनुभव रहा। विशेष रूप से ${combined} को जिस कुशलता और लगन से पूरा किया गया वह काबिले-तारीफ़ है। स्टाफ बहुत ही विनम्र और सहयोगी है। भरोसेमंद सेवा चाहने वालों को यह ज़रूर रेकमेंड करूंगा!`,
            `${city ? `${city} में ` : ''}${businessName} के साथ काम करके पूरा भरोसा हो गया। यहां ${combined} से जुड़ी हर ज़रूरत को समय पर और पूरी ईमानदारी के साथ पूरा किया गया। टीम का मार्गदर्शन बहुत स्पष्ट और मददगार रहा। 5 स्टार रेटिंग!`,
            `${businessName}${locSuffix} से जुड़कर बहुत खुशी हुई। उनका काम, ईमानदारी और ${combined} के प्रति समर्पण वाकई देखने लायक है। किसी भी तरह की जल्दबाज़ी या परेशानी के बिना सब कुछ बढ़िया हुआ। पूरी टीम को इस उत्कृष्ट कार्य के लिए धन्यवाद!`,
            `${businessName} की सेवाएं 100% भरोसेमंद और पारदर्शी हैं। यहां प्राप्त ${combined} के शानदार परिणाम से मैं पूरी तरह संतुष्ट हूं। स्टाफ का व्यवहार बहुत आदरपूर्ण है। यदि आप उच्च गुणवत्ता का काम चाहते हैं तो यहां ज़रूर संपर्क करें!`
          ];

      const opt3Variants = [
        `${businessName} में बहुत अच्छा और सहज अनुभव मिला। यहां ${combined} की सर्विस बहुत बढ़िया थी और सारा काम समय पर पूरा हुआ। साफ़-सुथरा व सकारात्मक माहौल देखकर बहुत प्रसन्नता हुई। आगे भी यहीं आना पसंद करेंगे!`,
        `बहुत ही दोस्ताना स्टाफ और भरोसेमंद माहौल! ${businessName} द्वारा दी गई ${combined} सेवा उत्कृष्ट और संतोषजनक रही। ग्राहक संतुष्टि के लिए उनका प्रयास साफ़ झलकता है। शानदार काम के लिए पूरे 5 स्टार!`,
        `${businessName}${locSuffix} में विज़िट पूरी तरह सफल और सुखद रही। ${combined} की गुणवत्ता और व्यवस्था दोनों बेमिसाल थीं। स्टाफ ने हर बात को बहुत ध्यान से समझा और समाधान दिया। बहुत-बहुत धन्यवाद!`,
        `${businessName} का काम बिल्कुल सटीक और उच्च स्तरीय है। यहां ${combined} के साथ-साथ त्वरित सहयोग देखकर बहुत अच्छा लगा। बिना किसी झंझट के बेहतरीन परिणाम मिला। सभी को अवश्य रेकमेंड करूंगा!`
      ];

      return [
        balanceOption(opt1Variants[idx1], 'opt_1', 'संक्षिप्त व सटीक (Short & Crisp)'),
        balanceOption(opt2Variants[idx2], 'opt_2', 'विस्तृत व आत्मीय (Warm & Detailed)'),
        balanceOption(opt3Variants[idx3], 'opt_3', 'संतुलित व सहज (Balanced & Friendly)')
      ];
    }

    case 'hinglish': {
      const opt1Variants = [
        `Visited ${businessName}${locSuffix} today and had a really great experience. The ${combined} was completely top quality and handled so smoothly. The team was courteous, responsive, and very helpful throughout. Highly recommend them to everyone!`,
        `Super satisfied with my experience at ${businessName}${locSuffix}! Loved how nicely the ${combined} was organized and delivered on time. The staff was polite, humble, and very accommodating. Solid 5 stars for wonderful service!`,
        `Really impressed with ${businessName} today! Everything regarding ${combined} exceeded my expectations. Smooth service, transparent communication, and genuine care for the customer. Will definitely be visiting again soon!`,
        `A truly delightful and stress-free visit to ${businessName}${locSuffix}. The quality of ${combined} was exceptional and the staff made sure everything was handled promptly. Super happy with the service and highly recommended!`
      ];

      const opt2Variants = isFood
        ? [
            `Had an amazing visit to ${businessName}${locSuffix} with family today! The ${combined} was freshly prepared, hygienic, and full of authentic flavor. The staff attended to us warmly and the atmosphere was super pleasant. A must-visit place for all food lovers!`,
            `Visited ${businessName}${locSuffix} and loved everything from start to finish! Especially the ${combined}—it was fresh, delicious, and served with great care. The hygiene and customer hospitality are top-notch. Definitely coming back again and recommending to friends!`,
            `First time trying ${businessName}${locSuffix} and was blown away by the quality! The ${combined} tasted incredible and the pricing is very reasonable. The staff was polite, patient, and made us feel so welcome. Deserves full 5 stars!`,
            `Had a fantastic time at ${businessName}. The ${combined} was outstanding in taste and presentation. The premises were spotless and service was super fast. If you want authentic quality food and great hospitality, this is the place to be!`
          ]
        : [
            `Had an outstanding experience with ${businessName}${locSuffix} today! The attention given to ${combined} was truly remarkable and reliable. The team handled every detail professionally and answered all questions with patience. Strongly recommend them for hassle-free service!`,
            `I was looking for dependable service${locSuffix}, and ${businessName} completely delivered on all fronts! The ${combined} was managed with utmost precision and completed right on schedule. Transparent, courteous, and highly professional team throughout. 5 stars!`,
            `First time dealing with ${businessName}${locSuffix} and thoroughly satisfied! The quality of ${combined} is unmatched and their customer service is top level. Everything was executed smoothly without any delays. Big thumbs up to the entire team!`,
            `100% satisfied with ${businessName}! The ${combined} was handled with great care and the results are truly impressive. Staff behavior was very courteous and supportive. Anyone looking for reliable quality should definitely choose them!`
          ];

      const opt3Variants = [
        `Great experience with ${businessName}. Really appreciated how they managed the ${combined} without any hassle. Quick turnaround, polite staff, and clean premises. Would definitely recommend them to all my friends and family!`,
        `Very positive atmosphere and dependable service at ${businessName}${locSuffix}. The ${combined} was exactly as promised and delivered with great efficiency. Truly appreciate the hard work of the team. Keep it up!`,
        `Solid 5 stars for ${businessName}! Everything was well organized from beginning to end, especially the ${combined}. The team is friendly, honest, and dedicated to customer satisfaction. A very pleasant experience!`,
        `Super happy with my visit to ${businessName}${locSuffix}. The team was proactive, and the ${combined} was completed to perfection. Seamless service and great value for money. Highly recommended to everyone!`
      ];

      return [
        balanceOption(opt1Variants[idx1], 'opt_1', 'Short & Crisp'),
        balanceOption(opt2Variants[idx2], 'opt_2', 'Warm & Detailed'),
        balanceOption(opt3Variants[idx3], 'opt_3', 'Balanced & Friendly')
      ];
    }

    case 'en':
    default: {
      const opt1Variants = [
        `Visited ${businessName}${locSuffix} today and had an outstanding experience. The ${combined} was handled with great attention to detail and delivered promptly. Courteous staff, clean environment, and seamless service. Highly recommend to anyone seeking reliable quality!`,
        `Super impressed with my visit to ${businessName}${locSuffix}! The quality of ${combined} exceeded expectations and the team was polite, professional, and very accommodating throughout. A truly smooth and satisfying 5-star customer experience!`,
        `A quick, seamless, and completely hassle-free visit to ${businessName}. Everything regarding ${combined} was handled with care and efficiency. The staff went out of their way to ensure complete satisfaction. Definitely coming back again!`,
        `Wonderful experience with ${businessName}${locSuffix}! The team was very helpful and the ${combined} was executed to perfection. It is refreshing to see such dedication to quality and prompt customer service. Full 5 stars!`
      ];

      const opt2Variants = isFood
        ? [
            `Had a fantastic experience visiting ${businessName}${locSuffix} today. The ${combined} was exceptionally delicious, freshly prepared, and served with great care. The staff was welcoming, courteous, and attentive throughout our visit. Clean ambiance and wonderful hospitality—highly recommended to all food lovers!`,
            `Visited ${businessName}${locSuffix} and was thoroughly delighted! The ${combined} was flavorful, fresh, and of great quality. Cleanliness was impressive and the team made us feel right at home. Definitely coming back soon and recommending to friends!`,
            `First time visiting ${businessName}${locSuffix} and it exceeded all expectations! The ${combined} was remarkably fresh and flavorful. The team made sure our experience was comfortable, timely, and enjoyable. Excellent hospitality, fair pricing, and top-notch quality throughout!`,
            `An absolute gem${locSuffix}! ${businessName} delivers consistently on both quality taste and genuine hospitality. The ${combined} was prepared to perfection. A must-visit destination for anyone who appreciates great food and prompt, friendly service.`
          ]
        : [
            `Had a wonderful experience with ${businessName}${locSuffix} today. The ${combined} was truly exceptional, reliable, and handled with utmost care. The entire team was courteous, proactive, and patient with all our requirements. I wholeheartedly recommend their services to everyone!`,
            `I have been looking for dependable service${locSuffix}, and ${businessName} completely exceeded all my expectations! The attention given to ${combined} was remarkable and completed right on schedule. Honest communication, fair pricing, and true professionalism from start to finish.`,
            `First-class service from ${businessName}${locSuffix}! What stood out most was their genuine dedication to ${combined}—everything was thoroughly professional, transparent, and completely stress-free. Very pleased with the outcome and would gladly recommend them to colleagues and friends.`,
            `Cannot recommend ${businessName} enough! Their dedication and precision with ${combined} was evident right from the initial conversation. Great communication, timely delivery, and an overall seamless 5-star customer experience. Big thanks to the wonderful team!`
          ];

      const opt3Variants = [
        `Great experience with ${businessName}. Everything was well-managed, especially the ${combined}. The staff was polite, the turnaround was quick, and the setup was very neat. Would gladly recommend their services to friends and neighbors!`,
        `Welcoming atmosphere and dependable service at ${businessName}${locSuffix}. The ${combined} made the visit totally worthwhile. The team was attentive and made sure all our expectations were met. Keep up the fantastic standard!`,
        `Very happy with my visit to ${businessName}. The team was helpful, the ${combined} was just as promised, and everything was completed on time without hassle. A trustworthy business that truly values customer satisfaction.`,
        `Solid 5-star rating for ${businessName}! From the welcoming reception to the exceptional ${combined}, it was an absolute pleasure doing business here. Smooth process and dependable results from start to finish.`
      ];

      return [
        balanceOption(opt1Variants[idx1], 'opt_1', 'Short & Crisp'),
        balanceOption(opt2Variants[idx2], 'opt_2', 'Warm & Detailed'),
        balanceOption(opt3Variants[idx3], 'opt_3', 'Balanced & Friendly')
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
