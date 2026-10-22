import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  en: {
    translation: {
      common: {
        welcome: 'Welcome',
        loading: 'Loading...',
        continue: 'Continue',
        cancel: 'Cancel',
        save: 'Save',
        copy: 'Copy',
        copied: 'Copied!',
        regenerate: 'Regenerate',
        skipToGoogle: 'Skip, go straight to Google Review',
        back: 'Back',
        next: 'Next',
        done: 'Done'
      },
      customer: {
        title: 'Share your real experience',
        subtitle: 'We appreciate your genuine feedback on Google',
        step1Title: 'How was your visit today?',
        step1Desc: 'Tap what stood out or describe in your own words. We never invent details.',
        chips: {
          freshFood: 'Delicious & fresh',
          quickService: 'Fast service',
          cleanAmbiance: 'Clean & hygienic',
          friendlyStaff: 'Friendly staff',
          valueForMoney: 'Great value',
          timelyDelivery: 'Prompt delivery',
          patientListening: 'Attentive service',
          nicePackaging: 'Neat packaging'
        },
        voicePrompt: 'Tap to speak (Hindi or English)',
        voiceListening: 'Listening... speak naturally',
        textPlaceholder: 'Optional: share anything specific (e.g. food taste, staff behavior, ambiance)...',
        helpMeWrite: 'Help me write my review ✨',
        directGoogleLink: 'Go directly to Google Review',
        step2Title: 'Your Review Draft',
        step2Subtitle: 'Review and edit before posting on Google',
        authenticityNote: 'Please verify this accurately reflects your personal experience before posting.',
        toneLabel: 'Tone',
        tones: {
          warm: 'Warm & Friendly',
          concise: 'Short & Crisp',
          formal: 'Professional'
        },
        languageLabel: 'Language',
        copyAndOpenGoogle: 'Copy & Open Google Review ↗',
        copiedSuccessTitle: 'Copied to clipboard!',
        copiedSuccessDesc: 'Opening Google Review now. Simply paste and choose your star rating.',
        fallbackHelp: 'If the Google page did not open automatically, tap the button below:',
        openGoogleDirectly: 'Open Google Review Box'
      }
    }
  },
  hi: {
    translation: {
      common: {
        welcome: 'नमस्ते',
        loading: 'लोड हो रहा है...',
        continue: 'आगे बढ़ें',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        copy: 'कॉपी करें',
        copied: 'कॉपी हो गया!',
        regenerate: 'फिर से लिखें',
        skipToGoogle: 'सीधे गूगल रिव्यू पर जाएं',
        back: 'पीछे',
        next: 'अगला',
        done: 'पूर्ण'
      },
      customer: {
        title: 'अपना सच्चा अनुभव साझा करें',
        subtitle: 'गूगल पर आपकी सच्ची राय हमारे लिए बहुत मूल्यवान है',
        step1Title: 'आज का अनुभव कैसा रहा?',
        step1Desc: 'जो अच्छा लगा उस पर टैप करें या अपने शब्दों में बताएं।',
        chips: {
          freshFood: 'स्वादिष्ट और ताज़ा',
          quickService: 'तेज़ सेवा',
          cleanAmbiance: 'साफ़-सुथरा माहौल',
          friendlyStaff: 'मिलनसार स्टाफ़',
          valueForMoney: 'किफायती दाम',
          timelyDelivery: 'समय पर डिलीवरी',
          patientListening: 'ध्यानपूर्वक सेवा',
          nicePackaging: 'शानदार पैकेजिंग'
        },
        voicePrompt: 'बोलकर बताएं (हिंदी या अंग्रेज़ी)',
        voiceListening: 'सुन रहे हैं... बोलिए',
        textPlaceholder: 'वैकल्पिक: कोई खास बात बताएं (जैसे स्वाद, व्यवहार, साफ़-सफ़ाई)...',
        helpMeWrite: 'रिव्यू लिखने में मदद करें ✨',
        directGoogleLink: 'सीधे गूगल रिव्यू पर जाएं',
        step2Title: 'आपका रिव्यू ड्राफ्ट',
        step2Subtitle: 'गूगल पर पोस्ट करने से पहले इसे जांचें या बदलें',
        authenticityNote: 'कृपया सुनिश्चित करें कि यह आपके वास्तविक अनुभव से मेल खाता है।',
        toneLabel: 'अंदाज़',
        tones: {
          warm: 'आत्मीय व विनम्र',
          concise: 'छोटा व सटीक',
          formal: 'औपचारिक'
        },
        languageLabel: 'भाषा',
        copyAndOpenGoogle: 'कॉपी करें और गूगल खोलें ↗',
        copiedSuccessTitle: 'रिव्यू कॉपी हो गया!',
        copiedSuccessDesc: 'गूगल रिव्यू बॉक्स खुल रहा है। वहां पेस्ट करें और स्टार चुनें।',
        fallbackHelp: 'यदि गूगल पेज अपने-आप नहीं खुला, तो नीचे दिए बटन पर टैप करें:',
        openGoogleDirectly: 'गूगल रिव्यू खोलें'
      }
    }
  },
  gu: {
    translation: {
      common: {
        welcome: 'નમસ્તે',
        loading: 'લોડ થઈ રહ્યું છે...',
        continue: 'આગળ વધો',
        cancel: 'રદ કરો',
        save: 'સાચવો',
        copy: 'કૉપી કરો',
        copied: 'કૉપી થઈ ગયું!',
        regenerate: 'ફરીથી લખો',
        skipToGoogle: 'સીધા ગૂગલ રિવ્યૂ પર જાઓ',
        back: 'પાછળ',
        next: 'આગળ',
        done: 'સંપૂર્ણ'
      },
      customer: {
        title: 'તમારો સાચો અનુભવ શેર કરો',
        subtitle: 'ગૂગલ પર તમારો વાસ્તવિક પ્રતિસાદ અમારા માટે ખૂબ મહત્વપૂર્ણ છે',
        step1Title: 'આજનો તમારો અનુભવ કેવો રહ્યો?',
        step1Desc: 'તમને જે ગમ્યું તે સિલેક્ટ કરો અથવા તમારા પોતાના શબ્દોમાં લખો.',
        chips: {
          freshFood: 'સ્વાદિષ્ટ અને તાજું',
          quickService: 'ઝડપી સેવા',
          cleanAmbiance: 'સ્વચ્છ વાતાવરણ',
          friendlyStaff: 'વિવેકી સ્ટાફ',
          valueForMoney: 'વાજબી ભાવ',
          timelyDelivery: 'સમયસર ડિલિવરી',
          patientListening: 'ધ્યાનપૂર્વક સેવા',
          nicePackaging: 'ઉત્તમ પેકિંગ'
        },
        voicePrompt: 'બોલીને જણાવો (ગુજરાતી કે હિન્દી/અંગ્રેજી)',
        voiceListening: 'સાંભળી રહ્યા છીએ... બોલો',
        textPlaceholder: 'વૈકલ્પિક: કોઈ ખાસ વિગત શેર કરો (જેમ કે સ્વાદ, સર્વિસ, સ્વચ્છતા)...',
        helpMeWrite: 'રિવ્યૂ લખવામાં મદદ કરો ✨',
        directGoogleLink: 'સીધા ગૂગલ રિવ્યૂ પર જાઓ',
        step2Title: 'તમારો રિવ્યૂ ડ્રાફ્ટ',
        step2Subtitle: 'ગૂગલ પર પોસ્ટ કરતા પહેલા ચકાસો અથવા સુધારો',
        authenticityNote: 'મહેરબાની કરીને ખાતરી કરો કે આ તમારા સાચા અનુભવ સાથે મેળ ખાય છે.',
        toneLabel: 'શૈલી',
        tones: {
          warm: 'આત્મીય અને મૈત્રીપૂર્ણ',
          concise: 'ટૂંકું અને સ્પષ્ટ',
          formal: 'ઔપચારિક'
        },
        languageLabel: 'ભાષા',
        copyAndOpenGoogle: 'કૉપી કરો અને ગૂગલ ખોલો ↗',
        copiedSuccessTitle: 'રિવ્યૂ કૉપી થઈ ગયો!',
        copiedSuccessDesc: 'ગૂગલ રિવ્યૂ બૉક્સ ખુલી રહ્યું છે. ત્યાં પેસ્ટ કરો અને રેટિંગ આપો.',
        fallbackHelp: 'જો ગૂગલ પેજ આપોઆપ ન ખૂલે, તો નીચે આપેલા બટન પર ટેપ કરો:',
        openGoogleDirectly: 'ગૂગલ રિવ્યૂ ખોલો'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
