import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Mic,
  MicOff,
  RefreshCw,
  ShieldCheck,
  Store,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  ThumbsUp,
  Heart,
  MessageCircle,
  Camera,
  Plus,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '@/lib/utils';
import { getFallbackTemplates } from '@server/ai/guardrails';

export interface ReviewOption {
  id: string;
  title: string;
  text: string;
  wordCount: number;
}

export interface CustomerMediaPhoto {
  id: string;
  title: string;
  url: string;
  category?: string;
}

export function CustomerFlowPage() {
  const { code } = useParams<{ code: string }>();
  const { t, i18n } = useTranslation();

  // Wizard Step: 1: Express visit / Chips, 2: 3 Review Options Selection, 3: Success Handoff
  const [step, setStep] = useState(1);

  // Business metadata fetched via /api/public/r/:code
  const [bizData, setBizData] = useState<{
    businessId?: string;
    businessName: string;
    googleReviewUrl: string;
    brandColor: string;
    brandColorSecondary: string;
    label?: string;
    category?: string | null;
    address?: string | null;
    city?: string | null;
    googlePlaceId?: string | null;
  }>({
    businessName: '',
    googleReviewUrl: '',
    brandColor: '#4338CA',
    brandColorSecondary: '#D97706',
    label: ''
  });

  // Selected chips & free text
  const [selectedChips, setSelectedChips] = useState<string[]>(['Prompt service', 'Clean & hygienic']);
  const [freeText, setFreeText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Language & generation state
  const [draftLanguage, setDraftLanguage] = useState<'en' | 'hi' | 'gu' | 'hinglish'>('en');
  const [draftTone, setDraftTone] = useState<'warm' | 'concise' | 'formal'>('warm');
  const [isGenerating, setIsGenerating] = useState(false);

  // 3 Review Options State
  const [reviewOptions, setReviewOptions] = useState<ReviewOption[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [activeReviewText, setActiveReviewText] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Photo Attachment State
  const [mediaPhotos, setMediaPhotos] = useState<CustomerMediaPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    if (code) {
      fetch(`/api/public/r/${code}`)
        .then((res) => (res.ok ? (res.json() as Promise<any>) : null))
        .then((payload) => {
          if (payload?.data) {
            setBizData({
              businessId: payload.data.businessId,
              businessName: payload.data.businessName || 'Business Review',
              googleReviewUrl: payload.data.googleReviewUrl,
              brandColor: payload.data.brandColor || '#4338CA',
              brandColorSecondary: payload.data.brandColorSecondary || '#D97706',
              label: payload.data.label,
              category: payload.data.category,
              address: payload.data.address,
              city: payload.data.city,
              googlePlaceId: payload.data.googlePlaceId
            });

            if (Array.isArray(payload.data.chips) && payload.data.chips.length > 0) {
              setCustomChips(payload.data.chips);
              setSelectedChips([payload.data.chips[0], payload.data.chips[1] || payload.data.chips[0]]);
            }

            if (Array.isArray(payload.data.media) && payload.data.media.length > 0) {
              setMediaPhotos(payload.data.media);
            } else {
              // Try local cached media
              try {
                const cachedMedia = localStorage.getItem(`reviewqr_media_${payload.data.businessId}`);
                if (cachedMedia) {
                  const parsed = JSON.parse(cachedMedia);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setMediaPhotos(parsed);
                    return;
                  }
                }
              } catch {}

              // Default realistic store photos so feature is immediately usable
              setMediaPhotos([
                {
                  id: 'ph_1',
                  title: 'Store Front',
                  url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
                },
                {
                  id: 'ph_2',
                  title: 'Reception & Setup',
                  url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
                },
                {
                  id: 'ph_3',
                  title: 'Clean Environment',
                  url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80'
                }
              ]);
            }
          } else {
            // Check local stored businesses
            try {
              const raw = localStorage.getItem('reviewqr_businesses');
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list) && list.length > 0) {
                  const b = list[0];
                  setBizData({
                    businessName: b.name,
                    googleReviewUrl: b.googleReviewUrl,
                    brandColor: b.brandColor || '#4338CA',
                    brandColorSecondary: b.brandColorSecondary || '#D97706',
                    label: 'Main Billing Counter'
                  });
                  if (b.chipsJson) {
                    try {
                      const parsed = JSON.parse(b.chipsJson);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        setCustomChips(parsed);
                        setSelectedChips([parsed[0], parsed[1] || parsed[0]]);
                      }
                    } catch {}
                  }
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [code]);

  // Sync language with i18n
  useEffect(() => {
    if (['en', 'hi', 'gu'].includes(draftLanguage)) {
      i18n.changeLanguage(draftLanguage);
    }
  }, [draftLanguage, i18n]);

  // Dynamic chips catalog: Shopkeeper custom chips or intelligent defaults
  const [customChips, setCustomChips] = useState<string[]>([]);
  const defaultChips = [
    'Delicious & fresh',
    'Fast service',
    'Clean & hygienic',
    'Friendly staff',
    'Great value',
    'Neat packaging',
    'Attentive service'
  ];
  const chipsCatalog = customChips.length > 0 ? customChips : defaultChips;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  // Web Speech API Voice Input
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your feedback.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = draftLanguage === 'hi' ? 'hi-IN' : draftLanguage === 'gu' ? 'gu-IN' : 'en-IN';
    recognition.interimResults = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFreeText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Generate 3 Review Options
  const handleGenerateDrafts = async () => {
    setIsGenerating(true);

    // Call funnel analytics event
    if (code) {
      fetch(`/api/public/r/${code}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'help_me_write' })
      }).catch(() => {});
    }

    try {
      const res = await fetch('/api/ai/review-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizData.businessId,
          businessName: bizData.businessName,
          category: bizData.category,
          address: bizData.address,
          city: bizData.city,
          googlePlaceId: bizData.googlePlaceId,
          chips: selectedChips,
          freeText: freeText.trim(),
          language: draftLanguage,
          tone: draftTone
        })
      });

      const data = (await res.json()) as any;
      if (Array.isArray(data?.drafts) && data.drafts.length >= 2) {
        setReviewOptions(data.drafts);
        setSelectedOptionIndex(0);
        setActiveReviewText(data.drafts[0].text);
        setStep(2);
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn('API draft call failed, using client fallback:', err);
    }

    // Client-side fallback: 3 distinct options
    const fallbacks = getFallbackTemplates(
      bizData.businessName,
      selectedChips,
      freeText.trim(),
      draftLanguage,
      bizData.category,
      bizData.city
    );

    setReviewOptions(fallbacks);
    setSelectedOptionIndex(0);
    setActiveReviewText(fallbacks[0].text);
    setIsGenerating(false);
    setStep(2);
  };

  function formatReviewUrl(url?: string): string {
    if (url && url.trim()) {
      let clean = url.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      return clean;
    }
    if (bizData.businessName && bizData.businessName !== 'Business Review') {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizData.businessName)}`;
    }
    return 'https://maps.google.com';
  }

  // Copy specific review & open Google Maps without popup blocker
  const handleCopyReviewAndOpenGoogle = async (textToCopy?: string) => {
    const text = textToCopy || activeReviewText || reviewOptions[selectedOptionIndex]?.text;
    if (!text) return;

    const targetUrl = formatReviewUrl(bizData.googleReviewUrl);

    // Track click & save customer review for owner dashboard
    if (code) {
      fetch(`/api/public/r/${code}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'google_click',
          reviewText: text,
          chips: selectedChips,
          language: draftLanguage,
          rating: 5
        })
      }).catch(() => {});
    }

    try {
      await copyToClipboard(text);
    } catch {}

    // Download/Save selected photo(s) to phone gallery/downloads
    if (selectedPhotoIds.length > 0) {
      const selectedPhotos = mediaPhotos.filter((p) => selectedPhotoIds.includes(p.id));
      selectedPhotos.forEach((photo, idx) => {
        try {
          const a = document.createElement('a');
          a.href = photo.url;
          a.download = `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_photo_${idx + 1}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          console.warn('Photo save error:', err);
        }
      });
    }

    setActiveReviewText(text);
    setCopiedSuccess(true);
    setStep(3);

    // Immediate unblocked redirection
    // Directly assigning window.location.href triggers native Google Maps app or browser review page
    try {
      window.location.href = targetUrl;
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans"
      style={{
        ['--brand-primary' as any]: bizData.brandColor,
        ['--brand-accent' as any]: bizData.brandColorSecondary
      }}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: bizData.brandColor }}
            >
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight leading-none text-slate-900 dark:text-slate-100">
                {bizData.businessName}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Google Review Assistant
              </span>
            </div>
          </div>

          {/* Language Selector (Gujarati, Hindi, English) */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            {(['gu', 'hi', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setDraftLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  draftLanguage === lang
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Non-Gating Notice */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Real customer reviews only</span>
          </span>
          <a
            href={formatReviewUrl(bizData.googleReviewUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Skip to Google</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 sm:p-5 space-y-5 overflow-y-auto pb-28">
        {/* STEP 1: Experience Chips & Guided Prompts */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {draftLanguage === 'gu'
                  ? 'આજનો તમારો અનુભવ કેવો રહ્યો?'
                  : draftLanguage === 'hi'
                  ? 'आज का अनुभव कैसा रहा?'
                  : 'How was your visit today?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {draftLanguage === 'gu'
                  ? 'તમને જે ગમ્યું તે સિલેક્ટ કરો. અમે તમારા શબ્દોમાંથી ૩ રિવ્યૂ વિકલ્પો બનાવીશું.'
                  : draftLanguage === 'hi'
                  ? 'जो अच्छा लगा उस पर टैप करें। हम आपके लिए ३ सुंदर रिव्यू विकल्प तैयार करेंगे।'
                  : 'Tap what stood out or describe below. We will craft 3 authentic review options for you.'}
              </p>
            </div>

            {/* Chips Grid */}
            <div className="flex flex-wrap gap-2">
              {chipsCatalog.map((chip) => {
                const isSelected = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium transition-all select-none flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{chip}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Free-Text Input & Voice */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-600 dark:text-slate-400">
                  {draftLanguage === 'gu'
                    ? 'કોઈ ખાસ વિગત (વૈકલ્પિક)'
                    : draftLanguage === 'hi'
                    ? 'कोई विशेष बात (वैकल्पिक)'
                    : 'Add any specific detail (Optional)'}
                </Label>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse shadow-rose-500/30'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03]'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-3.5 w-3.5 animate-bounce" />
                  ) : (
                    <Mic className="h-3.5 w-3.5 text-white" />
                  )}
                  <span>
                    {isListening
                      ? (draftLanguage === 'gu' ? 'સાંભળી રહ્યા છીએ... (ટેપ કરી રોકો)' : draftLanguage === 'hi' ? 'सुन रहे हैं... (रोकने के लिए टैપ करें)' : 'Listening... (Tap to stop)')
                      : (draftLanguage === 'gu' ? '🎙️ બોલીને લખો (Voice)' : draftLanguage === 'hi' ? '🎙️ बोलकर लिखें (Voice)' : '🎙️ Speak to Type (Voice)')}
                  </span>
                </button>
              </div>

              <Textarea
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={
                  draftLanguage === 'gu'
                    ? 'જેમ કે: સ્વાદ ખૂબ સ્વાદિષ્ટ હતો, કાજુ કતરી તાજી હતી, સ્ટાફ વિવેકી હતો...'
                    : 'e.g. Loved the fresh kaju katli, quick billing, clean seating...'
                }
                className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: 3 REVIEW OPTIONS SELECTION (Requested Feature) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {draftLanguage === 'gu'
                    ? 'તમારા માટે ૩ રિવ્યૂ વિકલ્પો'
                    : draftLanguage === 'hi'
                    ? 'आपके लिए ३ रिव्यू विकल्प'
                    : '3 Review Options for You'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {draftLanguage === 'gu'
                    ? 'કોઈપણ ૧ વિકલ્પ પસંદ કરીને Copy કરો અને ગૂગલમાં Paste કરો'
                    : 'Pick any 1 review, copy it, and paste on Google'}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-0.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>ફરીથી</span>
              </button>
            </div>

            {/* 3 Review Options Cards List */}
            <div className="space-y-3">
              {reviewOptions.map((opt, idx) => {
                const isSelected = selectedOptionIndex === idx;
                return (
                  <div
                    key={opt.id || idx}
                    onClick={() => {
                      setSelectedOptionIndex(idx);
                      setActiveReviewText(opt.text);
                    }}
                    className={`rounded-2xl border-2 p-4 transition-all cursor-pointer relative shadow-xs ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Card Badge & Radio */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {idx === 0 && 'Option 1: Short & Crisp'}
                          {idx === 1 && 'Option 2: Warm & Detailed'}
                          {idx === 2 && 'Option 3: Balanced & Friendly'}
                        </span>
                      </div>

                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {opt.wordCount || opt.text.split(/\s+/).length} words
                      </Badge>
                    </div>

                    {/* Review text */}
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                      "{opt.text}"
                    </p>

                    {/* Direct Quick Copy Button on Each Card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isSelected ? '✓ પસંદ કરેલ (Selected)' : 'ક્લિક કરીને પસંદ કરો'}
                      </span>
                      <Button
                        size="sm"
                        variant={isSelected ? 'saffron' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyReviewAndOpenGoogle(opt.text);
                        }}
                        className="h-8 px-3 text-xs gap-1.5"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy & Go to Google ↗</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editable Box for Selected Review */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>પસંદ કરેલ રિવ્યૂમાં ફેરફાર કરવો હોય તો અહીં લખો (Editable):</span>
              </div>
              <Textarea
                rows={3}
                value={activeReviewText}
                onChange={(e) => setActiveReviewText(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs sm:text-sm leading-relaxed resize-none focus-visible:ring-0 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Photo Attachment Selector (Photos boost Google ranking by 5x) */}
            {mediaPhotos.length > 0 && (
              <div className="rounded-2xl border border-purple-200/70 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/40 dark:from-purple-950/20 dark:via-slate-900 dark:to-indigo-950/20 p-3.5 space-y-2.5 mt-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {draftLanguage === 'gu'
                        ? 'સાથે ફોટો ઉમેરો (૫ ગણી વધારે અસર) 📸'
                        : draftLanguage === 'hi'
                        ? 'साथ में फोटो जोड़ें (५ गुना ज्यादा असर) 📸'
                        : 'Attach a photo (5x higher impact on Google) 📸'}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                    {selectedPhotoIds.length > 0 ? `${selectedPhotoIds.length} selected` : 'Recommended'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  {draftLanguage === 'gu'
                    ? 'પસંદ કરેલ ફોટો તમારા ફોનમાં સેવ થશે. ગૂગલ પેજ પર "+ Add photos" દબાવી આ ફોટો સિલેક્ટ કરી દો.'
                    : draftLanguage === 'hi'
                    ? 'चुना हुआ फोटो आपके फोन में सेव होगा। गूगल पेज पर "+ Add photos" दबाकर इसे सेलेक्ट कर लें।'
                    : 'Selected photo downloads to your phone so you can quickly tap "+ Add photos" on Google Maps.'}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {mediaPhotos.slice(0, 6).map((photo) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhotoIds((prev) =>
                            prev.includes(photo.id)
                              ? prev.filter((id) => id !== photo.id)
                              : prev.length >= 2
                              ? [prev[1], photo.id]
                              : [...prev, photo.id]
                          );
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group text-left ${
                          isSelected
                            ? 'border-purple-600 ring-2 ring-purple-500/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div
                          className={`absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-black/50 text-white'
                          }`}
                        >
                          {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3 w-3" />}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                          <span className="text-[10px] font-semibold text-white truncate block">
                            {photo.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Authenticity verification guarantee */}
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                આ રિવ્યૂ ફક્ત તમારા આપેલા અનુભવ પરથી જ બનેલ છે. કોઈ ફેક વિગત ઉમેરેલ નથી.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: Success Handoff to Google */}
        {step === 3 && (
          <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                રિવ્યૂ કૉપી થઈ ગયો!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                ગૂગલ રિવ્યૂ પેજ ખુલી રહ્યું છે. ત્યાં <strong>Paste</strong> કરો અને તમારા મનપસંદ <strong>Star Rating (૧ થી ૫ સ્ટાર)</strong> આપો.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
              <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">Copied Review:</span>
              <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                "{activeReviewText}"
              </p>
            </div>

            {/* Photo Download Reminder if customer selected photos */}
            {selectedPhotoIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                  <Camera className="h-4 w-4 shrink-0" />
                  <span>
                    {draftLanguage === 'gu'
                      ? 'ફોટો તમારા ફોનમાં સેવ થઈ ગયો છે! 📸'
                      : draftLanguage === 'hi'
                      ? 'फोटो आपके फोन में सेव हो गया है! 📸'
                      : 'Photo is saved to your phone! 📸'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/80 dark:text-purple-200 leading-relaxed">
                  {draftLanguage === 'gu'
                    ? 'ગૂગલ રિવ્યૂ બોક્સમાં નીચે "+ Add photos" પર ક્લિક કરીને તાજો સેવ થયેલો ફોટો પસંદ કરો.'
                    : draftLanguage === 'hi'
                    ? 'गूगल रिव्यू बॉक्स में नीचे "+ Add photos" पर क्लिक करके अभी सेव हुआ फोटो सेलेक्ट करें।'
                    : 'In Google review box, tap "+ Add photos" and pick this saved photo from your recent gallery.'}
                </p>
                <div className="flex gap-2 pt-1">
                  {mediaPhotos
                    .filter((p) => selectedPhotoIds.includes(p.id))
                    .map((photo) => (
                      <div key={photo.id} className="h-16 w-16 rounded-xl overflow-hidden border border-purple-300 dark:border-purple-700 shrink-0 shadow-xs relative">
                        <img src={photo.url} alt={photo.title} className="h-full w-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate font-medium">
                          {photo.title}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <a
                href={formatReviewUrl(bizData.googleReviewUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Open Google Review Box Now ↗</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <p className="text-[11px] text-slate-400">
              સાચા સ્થાનિક બિઝનેસને સપોર્ટ કરવા બદલ આભાર!
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (Thumb-Zone Ergonomics, min 48px touch targets) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 space-y-2 z-30">
        {step === 1 && (
          <>
            <Button
              size="lg"
              onClick={handleGenerateDrafts}
              isLoading={isGenerating}
              className="w-full h-13 text-base font-bold gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer border-0"
            >
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse shrink-0" />
              <span className="tracking-wide">
                {draftLanguage === 'gu'
                  ? '૩ રિવ્યૂ વિકલ્પો બનાવો ✨'
                  : draftLanguage === 'hi'
                  ? '३ रिव्यू विकल्प बनाएं ✨'
                  : 'Generate 3 Review Options ✨'}
              </span>
            </Button>

            <a
              href={formatReviewUrl(bizData.googleReviewUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full h-11 text-xs text-slate-600 dark:text-slate-300 gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>{t('customer.skipToGoogle', 'Skip, go straight to Google Review')}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}

        {step === 2 && (
          <>
            <Button
              size="lg"
              onClick={() => handleCopyReviewAndOpenGoogle()}
              className="w-full h-13 text-base font-bold gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer border-0"
            >
              <Copy className="h-5 w-5 text-indigo-200 shrink-0" />
              <span className="tracking-wide">
                {draftLanguage === 'gu'
                  ? 'પસંદ કરેલ રિવ્યૂ કૉપી કરી ગૂગલ ખોલો ↗'
                  : 'Copy Selected Review & Open Google ↗'}
              </span>
            </Button>

            <a
              href={formatReviewUrl(bizData.googleReviewUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full h-10 text-xs text-slate-600 dark:text-slate-300 gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>સીધા ગૂગલ પર જાઓ (Direct to Google)</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}
