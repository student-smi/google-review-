import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Trash2,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { copyToClipboard, copyImageToClipboard, copyTextAndImageToClipboard, downloadImageFile, compressImageFile } from '@/lib/utils';
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

export interface CustomerCapturedPhoto {
  id: string;
  url: string;
  name: string;
  size?: number;
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
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<{ text: string; icon: 'check' | 'photo' } | null>(null);

  // Photo Booster: Real customer camera/gallery captured photos (0% dummy data)
  const [customerPhotos, setCustomerPhotos] = useState<CustomerCapturedPhoto[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Official Shopkeeper Media Photos (if uploaded by owner)
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

            // Real business photos only if uploaded by owner; otherwise empty (NO dummy data)
            if (Array.isArray(payload.data.media) && payload.data.media.length > 0) {
              setMediaPhotos(payload.data.media);
            } else {
              setMediaPhotos([]);
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

  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Trigger Native Mobile Camera or Gallery Pickers
  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  // Handle Customer Photo Files (Camera Snap or Gallery Selection) with fast client-side compression
  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingPhoto(true);

    try {
      const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileList.length === 0) {
        setIsProcessingPhoto(false);
        return;
      }

      for (const file of fileList) {
        try {
          const compressedDataUrl = await compressImageFile(file);
          const newPhoto: CustomerCapturedPhoto = {
            id: `cust_ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: compressedDataUrl,
            name: file.name || `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo_${Date.now()}.jpg`,
            size: file.size
          };
          setCustomerPhotos((prev) => [newPhoto, ...prev.slice(0, 3)]); // Keep up to 4 real photos
        } catch (err) {
          console.warn('Image processing error:', err);
        }
      }

      setCopiedToast({
        text: draftLanguage === 'gu'
          ? 'ફોટો સફળતાપૂર્વક જોડાયો! 📸'
          : draftLanguage === 'hi'
          ? 'फोटो सफलतापूर्वक जुड़ गया! 📸'
          : 'Photo attached successfully! 📸',
        icon: 'photo'
      });
      setTimeout(() => setCopiedToast(null), 3000);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const removeCustomerPhoto = (id: string) => {
    setCustomerPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCopyReviewOnly = async (text: string, id: string) => {
    setActiveReviewText(text);
    setCopiedReviewId(id);

    const targetPhotoUrl =
      customerPhotos[0]?.url ||
      mediaPhotos.find((m) => selectedPhotoIds.includes(m.id))?.url;

    if (targetPhotoUrl) {
      // 1. Copy both review text and photo together into OS clipboard
      await copyTextAndImageToClipboard(text, targetPhotoUrl);

      // 2. Also ensure photo is downloaded/saved to phone gallery for Google Maps "+ Add photos"
      downloadImageFile(
        targetPhotoUrl,
        `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo.jpg`
      );

      setCopiedToast({
        text: draftLanguage === 'gu'
          ? 'રિવ્યૂ અને ફોટો બંને સાથે કૉપી થઈ ગયા! ✓'
          : draftLanguage === 'hi'
          ? 'रिव्यू और फोटो दोनों साथ में कॉपी हो गए! ✓'
          : 'Review & Photo both copied together! ✓',
        icon: 'check'
      });
    } else {
      await copyToClipboard(text);
      setCopiedToast({
        text: draftLanguage === 'gu'
          ? 'રિવ્યૂ કૉપી થઈ ગયો! (Review Copied ✓)'
          : draftLanguage === 'hi'
          ? 'रिव्यू कॉपी हो गया! (Review Copied ✓)'
          : 'Review text copied to clipboard! ✓',
        icon: 'check'
      });
    }

    setTimeout(() => setCopiedReviewId(null), 3500);
    setTimeout(() => setCopiedToast(null), 4000);
  };

  // Direct clipboard copy of image data (for Gboard / keyboard clipboard / desktop)
  const handleCopyPhotoToClipboard = async (photoUrl: string) => {
    const success = await copyImageToClipboard(photoUrl);
    if (success) {
      setCopiedToast({
        text: draftLanguage === 'gu'
          ? 'ફોટો ક્લિપબોર્ડમાં કૉપી થઈ ગયો! 📋'
          : draftLanguage === 'hi'
          ? 'फोटो क्लिपबोर्ड में कॉपी हो गया! 📋'
          : 'Photo copied to clipboard! 📋',
        icon: 'photo'
      });
    } else {
      // If OS restricts direct image copy, save to phone gallery/downloads
      downloadImageFile(
        photoUrl,
        `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo.jpg`
      );
      setCopiedToast({
        text: draftLanguage === 'gu'
          ? 'ફોટો તમારા ફોનમાં સેવ થઈ ગયો! 📸'
          : draftLanguage === 'hi'
          ? 'फोटो आपके फोन में सेव हो गया! 📸'
          : 'Photo saved to phone! 📸',
        icon: 'photo'
      });
    }
    setTimeout(() => setCopiedToast(null), 3500);
  };

  // Direct save/download of photo to phone gallery/downloads
  const handleSavePhotoToPhone = (photoUrl: string) => {
    downloadImageFile(
      photoUrl,
      `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo.jpg`
    );
    setCopiedToast({
      text: draftLanguage === 'gu'
        ? 'ફોટો ફોનમાં ડાઉનલોડ થઈ ગયો! (Saved to Phone ✓)'
        : draftLanguage === 'hi'
        ? 'फोटो फोन में डाउनलोड हो गया! (Saved to Phone ✓)'
        : 'Photo saved to phone downloads! ✓',
      icon: 'photo'
    });
    setTimeout(() => setCopiedToast(null), 3500);
  };

  // Dual action: Save to phone + attempt clipboard copy
  const handleCopyPhotoOnly = async (photoUrl: string) => {
    // 1. Download to phone (so it's available for Google Maps "+ Add photos")
    downloadImageFile(
      photoUrl,
      `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo.jpg`
    );

    // 2. Also try OS clipboard copy for devices that support it
    await copyImageToClipboard(photoUrl);

    setCopiedToast({
      text: draftLanguage === 'gu'
        ? 'ફોટો સેવ થઈ ગયો! ગૂગલમાં "+ Add photos" દબાવી પસંદ કરો 📸'
        : draftLanguage === 'hi'
        ? 'फोटो फोन में सेव हो गया! गूगल में "+ Add photos" दबाकर सेलेक्ट करें 📸'
        : 'Photo saved! On Google Maps, tap "+ Add photos" 📸',
      icon: 'photo'
    });
    setTimeout(() => setCopiedToast(null), 4000);
  };

  // Copy specific review & photo together in 1 clipboard item & open Google Maps without popup blocker
  const handleCopyReviewAndOpenGoogle = async (textToCopy?: string) => {
    const text = textToCopy || activeReviewText || reviewOptions[selectedOptionIndex]?.text;
    if (!text) return;

    const targetUrl = formatReviewUrl(bizData.googleReviewUrl);
    const targetPhotoUrl =
      customerPhotos[0]?.url ||
      mediaPhotos.find((m) => selectedPhotoIds.includes(m.id))?.url;

    // 1. Copy review text AND photo simultaneously into OS clipboard
    if (targetPhotoUrl) {
      await copyTextAndImageToClipboard(text, targetPhotoUrl);
    } else {
      await copyToClipboard(text);
    }

    // 2. Track click & save customer review for owner dashboard
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

    // 3. Download Customer Captured Photos into Phone Storage/Downloads
    if (customerPhotos.length > 0) {
      customerPhotos.forEach((photo, idx) => {
        downloadImageFile(
          photo.url,
          `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Photo_${idx + 1}.jpg`
        );
      });
    }

    // 4. Download Selected Shopkeeper Media Photos (if any selected)
    if (selectedPhotoIds.length > 0 && mediaPhotos.length > 0) {
      const selectedPhotos = mediaPhotos.filter((p) => selectedPhotoIds.includes(p.id));
      selectedPhotos.forEach((photo, idx) => {
        downloadImageFile(
          photo.url,
          `${(bizData.businessName || 'Review').replace(/[^a-z0-9]/gi, '_')}_Store_Photo_${idx + 1}.jpg`
        );
      });
    }

    setActiveReviewText(text);
    setCopiedSuccess(true);
    setStep(3);

    // Give visual feedback and open Google Maps
    setCopiedToast({
      text: targetPhotoUrl
        ? (draftLanguage === 'gu'
            ? 'રિવ્યૂ અને ફોટો બંને સાથે કૉપી થઈ ગયા! ગૂગલ મેપ્સ પેજ ખુલી રહ્યું છે...'
            : draftLanguage === 'hi'
            ? 'रिव्यू और फोटो दोनों साथ में कॉपी हो गए! गूगल मैप्स पेज खुल रहा है...'
            : 'Review & Photo copied together! Opening Google Maps...')
        : (draftLanguage === 'gu'
            ? 'રિવ્યૂ કૉપી થઈ ગયો! ગૂગલ મેપ્સ પેજ ખુલી રહ્યું છે...'
            : draftLanguage === 'hi'
            ? 'रिव्यू कॉपी हो गया! गूगल मैप्स पेज खुल रहा है...'
            : 'Review copied! Opening Google Maps...'),
      icon: 'check'
    });

    // Short 500ms delay so clipboard operation finishes before redirection
    setTimeout(() => {
      try {
        const win = window.open(targetUrl, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          window.location.href = targetUrl;
        }
      } catch {
        window.location.href = targetUrl;
      }
    }, 500);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl font-sans"
      style={{
        ['--brand-primary' as any]: bizData.brandColor,
        ['--brand-accent' as any]: bizData.brandColorSecondary
      }}
    >
      {/* Floating Copy Feedback Banner */}
      {copiedToast && (
        <div className="fixed top-3 left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-top-3 duration-300 pointer-events-none">
          <div className="bg-slate-900/95 dark:bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold backdrop-blur-md border border-white/20">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="flex-1 leading-snug">{copiedToast.text}</span>
          </div>
        </div>
      )}

      {/* Permanently Mounted Native File Inputs for Camera & Gallery (Works across all Steps & Devices) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          opacity: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          zIndex: -1
        }}
        onChange={(e) => {
          handlePhotoFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          opacity: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          zIndex: -1
        }}
        onChange={(e) => {
          handlePhotoFiles(e.target.files);
          e.target.value = '';
        }}
      />

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
      <div className="flex-1 p-4 sm:p-5 space-y-5 pb-52">
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

            {/* 📸 Feature 6: Photo Review Prompter (Google Maps Photos Booster) */}
            <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>
                        {draftLanguage === 'gu'
                          ? '📸 ફોટો ઉમેરો (Google 3x Booster)'
                          : draftLanguage === 'hi'
                          ? '📸 फोटो जोड़ें (Google 3x Booster)'
                          : '📸 Add Photo (Google 3x Booster)'}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                        <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>3x Higher Ranking</span>
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {draftLanguage === 'gu'
                        ? 'ગૂગલ ફોટાવાળા રિવ્યૂને સર્ચ અને મેપ્સમાં ૩ ગણું વધારે ટોચ પર મૂકે છે!'
                        : draftLanguage === 'hi'
                        ? 'गूगल असली फोटो वाले रिव्यू को सर्च व मैप्स में ३ गुना ज्यादा टॉप पर दिखाता है!'
                        : 'Google rewards reviews with real photos by ranking them 3x higher on Maps!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Camera Snap & Gallery Pick */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={openCamera}
                  className="min-h-[46px] rounded-xl border-2 border-indigo-600/30 hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-indigo-600 p-2.5 flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-bold"
                >
                  <Camera className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>
                    {draftLanguage === 'gu'
                      ? 'કેમેરાથી પાડો'
                      : draftLanguage === 'hi'
                      ? 'कैमरे से खींचें'
                      : 'Take Photo'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openGallery}
                  className="min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2.5 flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-medium"
                >
                  <Upload className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>
                    {draftLanguage === 'gu'
                      ? 'ગેલેરીમાંથી'
                      : draftLanguage === 'hi'
                      ? 'गैलरी से चुनें'
                      : 'From Gallery'}
                  </span>
                </button>
              </div>

              {/* Live Preview of Customer Captured Photos */}
              {customerPhotos.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {draftLanguage === 'gu'
                          ? `${customerPhotos.length} ફોટો જોડાયેલ છે (ગૂગલમાં જોડાશે)`
                          : draftLanguage === 'hi'
                          ? `${customerPhotos.length} फोटो जुड़ा हुआ है (गूगल में जुड़ेगा)`
                          : `${customerPhotos.length} Photo${customerPhotos.length > 1 ? 's' : ''} ready for Google Maps`}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {draftLanguage === 'gu' ? 'દૂર કરવા 🗑️ ક્લિક કરો' : 'Tap 🗑️ to remove'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {customerPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-xl overflow-hidden aspect-square border-2 border-emerald-500 shadow-xs group"
                      >
                        <img src={photo.url} alt="Attached" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleCopyPhotoOnly(photo.url)}
                          className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs hover:bg-indigo-700 cursor-pointer"
                          title="Save/Copy Photo"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomerPhoto(photo.id)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{draftLanguage === 'gu' ? 'ફોટો તૈયાર છે' : draftLanguage === 'hi' ? 'फोटो तैयार है' : 'Photo ready'}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSavePhotoToPhone(customerPhotos[0].url)}
                        className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                      >
                        <Download className="h-3 w-3" />
                        <span>{draftLanguage === 'gu' ? 'સેવ કરો' : draftLanguage === 'hi' ? 'सेव करें' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPhotoToClipboard(customerPhotos[0].url)}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 shadow-2xs"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{draftLanguage === 'gu' ? 'કૉપી ફોટો' : draftLanguage === 'hi' ? 'कॉपी फोटो' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

                    {/* Direct Quick Copy Buttons on Each Card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                      <Button
                        id={`copy-btn-${idx}`}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyReviewOnly(opt.text, opt.id || `${idx}`);
                        }}
                        className={`h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-bold transition-all ${
                          copiedReviewId === (opt.id || `${idx}`)
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {copiedReviewId === (opt.id || `${idx}`) ? (
                          <>
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>{draftLanguage === 'gu' ? 'કૉપી થયું ✓' : draftLanguage === 'hi' ? 'कॉपी हुआ ✓' : 'Copied! ✓'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{draftLanguage === 'gu' ? 'કૉપી કરો' : draftLanguage === 'hi' ? 'कॉपी करें' : 'Copy'}</span>
                          </>
                        )}
                      </Button>

                      <Button
                        id={`copy-and-go-btn-${idx}`}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'saffron' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyReviewAndOpenGoogle(opt.text);
                        }}
                        className="h-8 px-3 text-xs gap-1.5 font-bold cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
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

            {/* 📸 Feature 6: Step 2 Photo Booster & Preview Section */}
            <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 p-3.5 space-y-3 mt-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {draftLanguage === 'gu'
                      ? 'સાથે ફોટો જોડો (3x રેન્કિંગ બૂસ્ટ) 📸'
                      : draftLanguage === 'hi'
                      ? 'साथ में फोटो जोड़ें (3x रैंकिंग बूस्ट) 📸'
                      : 'Attach a Photo (3x Google Maps Boost) 📸'}
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                  <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>3x Visibility</span>
                </span>
              </div>

              {customerPhotos.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {customerPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative rounded-xl overflow-hidden aspect-square border-2 border-emerald-500 shadow-xs group"
                      >
                        <img src={photo.url} alt="Attached" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleCopyPhotoOnly(photo.url)}
                          className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs hover:bg-indigo-700 cursor-pointer"
                          title="Save/Copy Photo"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomerPhoto(photo.id)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs hover:bg-rose-700 cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={openCamera}
                      className="rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 aspect-square text-[10px] font-semibold cursor-pointer transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{draftLanguage === 'gu' ? 'બીજો ફોટો' : 'Add More'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{draftLanguage === 'gu' ? 'ફોટો તૈયાર છે (ગૂગલમાં જોડાશે)' : draftLanguage === 'hi' ? 'फोटो तैयार है (गूगल में जुड़ेगा)' : 'Photo ready for Google'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReviewOnly(activeReviewText || reviewOptions[selectedOptionIndex]?.text, 'photo-together')}
                      className="text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-3 py-1.5 rounded-lg border border-transparent shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 text-indigo-100" />
                      <span>{draftLanguage === 'gu' ? 'બંને સાથે કૉપી કરો' : draftLanguage === 'hi' ? 'दोनों साथ में कॉपी करें' : 'Copy Both Together'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <strong className="font-semibold block mb-0.5">
                        {draftLanguage === 'gu' ? 'ગૂગલ મેપ્સમાં ફોટો અને લખાણ:' : draftLanguage === 'hi' ? 'गूगल मैप्स में फोटो और मैसेज:' : 'Google Maps Review Guide:'}
                      </strong>
                      {draftLanguage === 'gu'
                        ? 'લખાણ પેસ્ટ કરવા Review બોક્સમાં ટૅપ કરી Paste કરો. ફોટો ઉમેરવા નીચે "+ Add photos" દબાવો (ફોન ગેલેરીમાં ફોટો સૌથી ઉપર તૈયાર છે).'
                        : draftLanguage === 'hi'
                        ? 'मैसेज के लिए Review बॉक्स में Paste करें। फोटो के लिए नीचे "+ Add photos" दबाएं (फोन गैलरी में फोटो सबसे ऊपर तैयार है)।'
                        : 'Tap Paste in the review box for text. Tap "+ Add photos" to attach the photo from your gallery.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {draftLanguage === 'gu'
                      ? 'તમારા ભોજન કે અનુભવનો ૧ ફોટો ઉમેરવાથી તમારા રિવ્યૂને ગૂગલમાં ૩ ગણું વધારે મહત્વ મળે છે!'
                      : draftLanguage === 'hi'
                      ? 'खाने या अनुभव का १ फोटो जोड़ने से आपके रिव्यू को गूगल पर ३ गुना ज्यादा व्यूज मिलते हैं!'
                      : 'Adding 1 photo of your food or experience gives your review 3x more visibility on Google!'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={openCamera}
                      className="min-h-[42px] rounded-xl border border-indigo-600/30 hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:text-indigo-600 p-2 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-bold"
                    >
                      <Camera className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>
                        {draftLanguage === 'gu'
                          ? 'કેમેરાથી પાડો'
                          : draftLanguage === 'hi'
                          ? 'कैमरे से खींचें'
                          : 'Take Photo'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={openGallery}
                      className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 text-xs font-medium"
                    >
                      <Upload className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>
                        {draftLanguage === 'gu'
                          ? 'ગેલેરીમાંથી'
                          : draftLanguage === 'hi'
                          ? 'गैलरी से चुनें'
                          : 'From Gallery'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Official Store Photos (if owner uploaded in dashboard) */}
              {mediaPhotos.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {draftLanguage === 'gu'
                      ? 'દુકાનના ફોટામાંથી પસંદ કરો:'
                      : draftLanguage === 'hi'
                      ? 'स्टोर के फोटो में से चुनें:'
                      : 'Or pick official store photos:'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
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
            </div>

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

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
                  {draftLanguage === 'gu' ? 'કૉપી થયેલ રિવ્યૂ:' : draftLanguage === 'hi' ? 'कॉपी किया गया रिव्यू:' : 'Copied Review:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReviewOnly(activeReviewText, 'step3')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    copiedReviewId === 'step3'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {copiedReviewId === 'step3' ? (
                    <>
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>{draftLanguage === 'gu' ? 'કૉપી થયું ✓' : draftLanguage === 'hi' ? 'कॉपी हुआ ✓' : 'Copied! ✓'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{draftLanguage === 'gu' ? 'ફરી કૉપી કરો' : draftLanguage === 'hi' ? 'फिर कॉपी करें' : 'Copy Again'}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed">
                "{activeReviewText}"
              </p>
            </div>

            {/* 📸 Feature 6: Step 3 Photo Saved Confirmation & Google Maps Visual Instructions */}
            {(customerPhotos.length > 0 || selectedPhotoIds.length > 0) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800 text-left space-y-3 animate-in fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    <Camera className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span>
                      {draftLanguage === 'gu'
                        ? 'ફોટો તમારા ફોનમાં ડાઉનલોડ થઈ ગયો છે! 📸'
                        : draftLanguage === 'hi'
                        ? 'फोटो आपके फोन में डाउनलोड हो गया है! 📸'
                        : 'Photo downloaded to your phone! 📸'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                    <Sparkles className="h-3 w-3 text-amber-600 shrink-0" />
                    <span>3x Boost</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-1.5 font-medium">
                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                    <span>
                      {draftLanguage === 'gu'
                        ? 'ગૂગલ રિવ્યૂ બોક્સમાં લખાણ Paste કરો'
                        : draftLanguage === 'hi'
                        ? 'गूगल रिव्यू बॉक्स में टेक्स्ट Paste करें'
                        : 'Paste your review text in the Google review box'}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 font-medium">
                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                    <span>
                      {draftLanguage === 'gu'
                        ? 'નીચે "+ Add photos" પર ક્લિક કરીને આ સેવ થયેલો ફોટો પસંદ કરો'
                        : draftLanguage === 'hi'
                        ? 'नीचे "+ Add photos" पर टैप करके अभी सेव हुआ फोटो सेलेक्ट करें'
                        : 'Tap "+ Add photos" and select the photo you just took'}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 font-medium">
                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                    <span>
                      {draftLanguage === 'gu'
                        ? '૫-સ્ટાર રેટિંગ આપી Post પર ક્લિક કરો!'
                        : draftLanguage === 'hi'
                        ? '५-स्टार रेटिंग देकर Post पर क्लिक करें!'
                        : 'Select 5 stars and tap Post!'}
                    </span>
                  </div>
                </div>

                {/* Thumbnails of customer & store photos */}
                <div className="flex gap-2 pt-1 overflow-x-auto">
                  {customerPhotos.map((photo) => (
                    <div key={photo.id} className="h-16 w-16 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-xs relative">
                      <img src={photo.url} alt="Customer Photo" className="h-full w-full object-cover" />
                      <div className="absolute top-0 right-0 bg-emerald-600 text-white rounded-bl-lg p-0.5">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    </div>
                  ))}
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

                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[10px] text-slate-500">
                    {draftLanguage === 'gu' ? 'તમારા ફોનમાં સેવ થયેલ છે' : draftLanguage === 'hi' ? 'फोन में सेव हो गया है' : 'Saved to your phone'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = customerPhotos[0]?.url || mediaPhotos.find((m) => selectedPhotoIds.includes(m.id))?.url;
                        if (targetUrl) handleSavePhotoToPhone(targetUrl);
                      }}
                      className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs"
                    >
                      <Download className="h-3 w-3" />
                      <span>{draftLanguage === 'gu' ? 'સેવ ફોટો' : draftLanguage === 'hi' ? 'सेव फोटो' : 'Save Photo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyReviewOnly(activeReviewText, 'step3-both')}
                      className="text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-2.5 py-1 rounded-lg border border-transparent shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3 w-3 text-indigo-100" />
                      <span>{draftLanguage === 'gu' ? 'ફરી બંને કૉપી કરો' : draftLanguage === 'hi' ? 'फिर दोनों कॉपी करें' : 'Copy Both Again'}</span>
                    </button>
                  </div>
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
                {customerPhotos.length > 0 || selectedPhotoIds.length > 0
                  ? (draftLanguage === 'gu'
                      ? 'રિવ્યૂ અને ફોટો સાથે કૉપી કરી ગૂગલ ખોલો ↗'
                      : draftLanguage === 'hi'
                      ? 'रिव्यू और फोटो साथ में कॉपी करके गूगल खोलें ↗'
                      : 'Copy Review & Photo Together & Open Google ↗')
                  : (draftLanguage === 'gu'
                      ? 'પસંદ કરેલ રિવ્યૂ કૉપી કરી ગૂગલ ખોલો ↗'
                      : draftLanguage === 'hi'
                      ? 'रिव्यू कॉपी करके गूगल खोलें ↗'
                      : 'Copy Selected Review & Open Google ↗')}
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
