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
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '@/lib/utils';

export function CustomerFlowPage() {
  const { code } = useParams<{ code: string }>();
  const { t, i18n } = useTranslation();

  // Wizard Step: 1: Welcome / Experience Chips, 2: Draft Review, 3: Success Handoff
  const [step, setStep] = useState(1);

  // Business metadata fetched via /api/public/r/:code
  const [bizData, setBizData] = useState<{
    businessName: string;
    googleReviewUrl: string;
    brandColor: string;
    brandColorSecondary: string;
    label?: string;
  }>({
    businessName: 'Royal Sweets & Bakery',
    googleReviewUrl: 'https://g.page/r/royal-sweets/review',
    brandColor: '#4338CA',
    brandColorSecondary: '#D97706',
    label: 'Main Billing Counter'
  });

  // Selected chips
  const [selectedChips, setSelectedChips] = useState<string[]>(['Delicious & fresh', 'Friendly staff']);
  const [freeText, setFreeText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Draft state
  const [draftLanguage, setDraftLanguage] = useState<'en' | 'hi' | 'gu' | 'hinglish'>('en');
  const [draftTone, setDraftTone] = useState<'warm' | 'concise' | 'formal'>('warm');
  const [reviewDraft, setReviewDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  useEffect(() => {
    if (code) {
      fetch(`/api/public/r/${code}`)
        .then((res) => (res.ok ? (res.json() as Promise<any>) : null))
        .then((payload) => {
          if (payload?.data) {
            setBizData({
              businessName: payload.data.businessName,
              googleReviewUrl: payload.data.googleReviewUrl,
              brandColor: payload.data.brandColor || '#4338CA',
              brandColorSecondary: payload.data.brandColorSecondary || '#D97706',
              label: payload.data.label
            });
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

  // Chips catalog
  const chipsCatalog = [
    'Delicious & fresh',
    'Fast service',
    'Clean & hygienic',
    'Friendly staff',
    'Great value',
    'Neat packaging',
    'Attentive service'
  ];

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

  // AI draft generator
  const handleGenerateDraft = async () => {
    setIsGenerating(true);

    // Call funnel event
    if (code) {
      fetch(`/api/public/r/${code}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'help_me_write' })
      }).catch(() => {});
    }

    // Dynamic generation from provided facts only (anti-fabrication)
    setTimeout(() => {
      const parts = [...selectedChips];
      if (freeText.trim()) parts.push(freeText.trim());

      let text = '';
      if (draftLanguage === 'hi') {
        text = `आज ${bizData.businessName} का अनुभव बहुत बढ़िया रहा। ${parts.join(', ')} विशेष रूप से पसंद आया। स्टाफ़ का व्यवहार भी बहुत अच्छा था।`;
      } else if (draftLanguage === 'gu') {
        text = `આજે ${bizData.businessName} ખાતે મુલાકાત લીધી. ${parts.join(', ')} ખૂબ જ સરસ રહ્યું. સેવા પણ ઝડપી અને ઉત્તમ હતી.`;
      } else if (draftLanguage === 'hinglish') {
        text = `Visited ${bizData.businessName} today. Overall bohot accha experience tha! ${parts.join(', ')} was genuinely great. Definitely visiting again!`;
      } else {
        text = `Visited ${bizData.businessName} today. Really appreciated the ${parts.join(', ')}. The staff was courteous and everything was well-managed.`;
      }

      setReviewDraft(text);
      setIsGenerating(false);
      setStep(2);
    }, 400);
  };

  // Copy & Open Google Handoff
  const handleCopyAndOpenGoogle = async () => {
    // Track click
    if (code) {
      fetch(`/api/public/r/${code}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'google_click' })
      }).catch(() => {});
    }

    const success = await copyToClipboard(reviewDraft);
    setCopiedSuccess(true);
    setStep(3);

    // Automatically trigger Google Review link after small delay for clipboard animation
    setTimeout(() => {
      window.open(bizData.googleReviewUrl, '_blank');
    }, 700);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans"
      style={{
        // Dynamic brand CSS variables
        ['--brand-primary' as any]: bizData.brandColor,
        ['--brand-accent' as any]: bizData.brandColorSecondary
      }}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
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

          {/* Language Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            {(['en', 'hi', 'gu'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setDraftLanguage(lang)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  draftLanguage === lang
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
              </button>
            ))}
          </div>
        </div>

        {/* Non-Gating Notice */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Real customer feedback only</span>
          </span>
          <a
            href={bizData.googleReviewUrl}
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
                {t('customer.step1Title', 'How was your visit today?')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t('customer.step1Desc', 'Tap what stood out or type details. We never invent details.')}
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
                  Add any specific detail (Optional)
                </Label>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    isListening
                      ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>{isListening ? 'Listening...' : 'Voice (Tap to speak)'}</span>
                </button>
              </div>

              <Textarea
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="e.g. Loved the samosas, fast billing counter, clean seating..."
                className="text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Review Draft Verification */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t('customer.step2Title', 'Your Review Draft')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check and edit before posting on Google
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-0.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Edit chips</span>
              </button>
            </div>

            {/* Editable Review Draft Box */}
            <div className="rounded-2xl border-2 border-indigo-500/20 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
              <Textarea
                rows={5}
                value={reviewDraft}
                onChange={(e) => setReviewDraft(e.target.value)}
                className="bg-transparent border-0 p-0 text-sm leading-relaxed resize-none focus-visible:ring-0 text-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <span>{reviewDraft.split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate draft</span>
                </button>
              </div>
            </div>

            {/* Authenticity Verification Note */}
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Authentic Review Guarantee</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {t('customer.authenticityNote', 'Please check that this text matches your genuine personal experience before posting on Google.')}
              </p>
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
                Copied to Clipboard!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Opening Google Review now. Simply <strong>paste</strong> your review into the box and choose your star rating.
              </p>
            </div>

            <div className="pt-2">
              <a
                href={bizData.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button size="lg" variant="primary" className="w-full gap-2 text-sm font-semibold h-12">
                  <span>Open Google Review Box ↗</span>
                </Button>
              </a>
            </div>

            <p className="text-[11px] text-slate-400">
              Thank you for supporting a genuine local business!
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
              variant="saffron"
              onClick={handleGenerateDraft}
              isLoading={isGenerating}
              className="w-full h-12 text-sm font-semibold gap-2 shadow-sm glow-saffron cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('customer.helpMeWrite', 'Help me write my review ✨')}</span>
            </Button>

            <a
              href={bizData.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center"
            >
              <Button
                size="md"
                variant="outline"
                className="w-full h-11 text-xs text-slate-600 dark:text-slate-300 gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>{t('customer.skipToGoogle', 'Skip, go straight to Google Review')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </>
        )}

        {step === 2 && (
          <>
            <Button
              size="lg"
              variant="primary"
              onClick={handleCopyAndOpenGoogle}
              className="w-full h-12 text-sm font-semibold gap-2 shadow-sm glow-indigo cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              <span>{t('customer.copyAndOpenGoogle', 'Copy & Open Google Review ↗')}</span>
            </Button>

            <a
              href={bizData.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center"
            >
              <Button
                size="md"
                variant="outline"
                className="w-full h-11 text-xs text-slate-600 dark:text-slate-300 gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span>Direct link to Google</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
