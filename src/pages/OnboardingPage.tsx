import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Store,
  UtensilsCrossed,
  Scissors,
  Stethoscope,
  Briefcase,
  Star,
  Cake,
  Plus,
  X,
  Building2,
  Network,
  Download,
  Smartphone,
  Check,
  ShieldCheck,
  Globe2,
  Layers,
  MapPin
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { apiFetch, getStoredBusinesses, saveStoredBusinesses, saveActiveBusinessId } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OnboardingPageProps {
  onComplete?: (business: any) => void;
}

export interface SubBranchEntry {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Entity Structure & Brand
  const [entityType, setEntityType] = useState<'single' | 'multi'>('single');
  const [brandName, setBrandName] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Restaurant & Cafe');

  // Step 2: Google Maps & Main Branch Details
  const [branchName, setBranchName] = useState('Main Branch');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [urlTested, setUrlTested] = useState(false);

  // Step 3: AI Languages & Brand Voice
  const [brandVoice, setBrandVoice] = useState('warm_grateful');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'hi', 'gu', 'hinglish']);
  const [chips, setChips] = useState<string[]>([
    'Fast Service',
    'Clean Ambiance',
    'Friendly Staff',
    'Great Quality'
  ]);
  const [newChipInput, setNewChipInput] = useState('');

  // Step 4: Standee & Brand Styling
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [label, setLabel] = useState('Main Cash Counter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingStandee, setIsDownloadingStandee] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);
  const standeeRef = useRef<HTMLDivElement>(null);

  const slug = name
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24).replace(/^-|-$/g, '')
    : 'my-business';

  const previewCustomerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${slug || 'demo'}`
    : `https://reviewqr.panchalsmit.workers.dev/r/${slug || 'demo'}`;

  // Render QR Code in Step 4
  useEffect(() => {
    if (step === 4 && qrRef.current) {
      qrRef.current.innerHTML = '';
      const qr = new QRCodeStyling({
        width: 170,
        height: 170,
        type: 'svg',
        data: previewCustomerUrl,
        dotsOptions: {
          color: brandColor,
          type: 'rounded'
        },
        cornersSquareOptions: {
          color: brandColor,
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          color: brandColor,
          type: 'dot'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      });
      qr.append(qrRef.current);
    }
  }, [step, brandColor, previewCustomerUrl]);

  const categories = [
    { id: 'restaurant', label: 'Restaurant & Cafe', icon: UtensilsCrossed },
    { id: 'retail', label: 'Retail & Jewellery', icon: Store },
    { id: 'sweets', label: 'Sweets & Bakery', icon: Cake },
    { id: 'healthcare', label: 'Clinic & Healthcare', icon: Stethoscope },
    { id: 'salon', label: 'Salon & Spa', icon: Scissors },
    { id: 'services', label: 'Agency & Services', icon: Briefcase }
  ];

  const colorPalettes = [
    { label: 'Royal Blue', hex: '#2563EB' },
    { label: 'Deep Indigo', hex: '#4338CA' },
    { label: 'Emerald Teal', hex: '#0D9488' },
    { label: 'Royal Purple', hex: '#7C3AED' },
    { label: 'Amber Gold', hex: '#D97706' },
    { label: 'Slate Charcoal', hex: '#1E293B' }
  ];

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleAddChip = (e?: any) => {
    if (e && e.key && e.key !== 'Enter') return;
    const trimmed = newChipInput.trim();
    if (!trimmed || chips.includes(trimmed)) return;
    setChips((prev) => [...prev, trimmed]);
    setNewChipInput('');
  };

  const handleRemoveChip = (chipToRemove: string) => {
    setChips((prev) => prev.filter((c) => c !== chipToRemove));
  };

  const handleDownloadStandee = async () => {
    if (!standeeRef.current) return;
    setIsDownloadingStandee(true);
    try {
      const dataUrl = await toPng(standeeRef.current, {
        quality: 0.95,
        pixelRatio: 3
      });
      const link = document.createElement('a');
      link.download = `${slug}-acrylic-countertop-standee.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Standee download failed:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setIsDownloadingStandee(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    const finalBusinessName = name.trim() || brandName.trim() || 'My Business';

    let createdBrandId: string | null = null;
    // 1. If Multi-Branch Organization selected, create Brand first
    if (entityType === 'multi' && brandName.trim()) {
      try {
        const brandRes = await apiFetch<{ success: boolean; brand: any }>('/api/hierarchy/brands', {
          method: 'POST',
          body: JSON.stringify({
            name: brandName.trim(),
            plan: 'growth'
          })
        });
        if (brandRes?.brand?.id) {
          createdBrandId = brandRes.brand.id;
        }
      } catch (brandErr) {
        console.warn('Could not create brand in onboarding:', brandErr);
      }
    }

    // 2. Create Primary Business
    const bizPayload = {
      name: finalBusinessName,
      brandId: createdBrandId || undefined,
      businessType: entityType === 'multi' ? 'company_owned' : 'company_owned',
      category,
      city: city.trim() || 'India',
      address: verifiedPlace?.address || undefined,
      phone: phone.trim() || undefined,
      googlePlaceId: googlePlaceId || undefined,
      googleReviewUrl: googleReviewUrl.trim() || 'https://maps.google.com',
      brandVoice,
      brandColor,
      chipsJson: chips.length > 0 ? JSON.stringify(chips) : null
    };

    let business: any = null;
    try {
      const data = await apiFetch('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(bizPayload)
      });
      if (data?.business) {
        business = data.business;
      }
    } catch (err) {
      console.warn('API business create error:', err);
    }

    if (!business) {
      business = {
        id: `biz_${Date.now()}`,
        name: bizPayload.name,
        slug: slug,
        category: bizPayload.category,
        city: bizPayload.city,
        googleReviewUrl: bizPayload.googleReviewUrl,
        chipsJson: bizPayload.chipsJson,
        brandColor
      };
    }

    // 3. Register First Branch Outlet (Main Branch)
    const mainBranchLabel =
      branchName.trim() || (entityType === 'multi' ? `${finalBusinessName} (Main Branch)` : `${finalBusinessName}`);

    try {
      await apiFetch(`/api/businesses/${business.id}/locations`, {
        method: 'POST',
        body: JSON.stringify({
          name: mainBranchLabel,
          address: verifiedPlace?.address || bizPayload.address || 'Main Location',
          city: bizPayload.city,
          phone: bizPayload.phone,
          googlePlaceId: googlePlaceId || undefined,
          googleReviewUrl: bizPayload.googleReviewUrl,
          isPrimary: true
        })
      });
    } catch (locErr) {
      console.warn('Initial branch creation note:', locErr);
    }

    // 4. Create Standee QR Code for Main Store
    try {
      await apiFetch(`/api/qr/business/${business.id}`, {
        method: 'POST',
        body: JSON.stringify({
          label: label.trim() || 'Main Cash Counter',
          code: `${slug}-counter`,
          styleJson: {
            dots: 'rounded',
            cornersSquare: 'extra-rounded',
            cornersDot: 'dot',
            color: brandColor
          }
        })
      });
    } catch (qrErr) {
      console.warn('Standee QR code creation note:', qrErr);
    }

    // 5. Persist mode to localStorage
    if (typeof window !== 'undefined') {
      if (entityType === 'single') {
        localStorage.setItem('reviewqr_entity_mode', 'single');
        localStorage.setItem('reviewqr_hierarchy_level', 'branch');
      } else {
        localStorage.setItem('reviewqr_entity_mode', 'multi');
        localStorage.setItem('reviewqr_hierarchy_level', 'brand');
      }
    }

    // 7. Persist client session
    const existing = getStoredBusinesses();
    const updated = [business, ...existing.filter((b) => b.id !== business.id)];
    saveStoredBusinesses(updated);
    saveActiveBusinessId(business.id);

    onComplete?.(business);
    navigate('/dashboard');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-3 sm:p-6 antialiased font-sans">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Title & Steps */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Interactive Setup • Step {step} of 4</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {step === 1 && 'Main Branch & Category Setup'}
            {step === 2 && 'Google Review Link & Verification'}
            {step === 3 && 'AI Review Copilot & Multilingual Keywords'}
            {step === 4 && 'Live Acrylic Standee Preview'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {step === 1 &&
              'Search your main business or flagship branch on Google Maps to auto-fetch details and set your category.'}
            {step === 2 &&
              'Verify and test your official Google review link for your primary branch outlet.'}
            {step === 3 &&
              'Configure AI brand tone and customer review keywords (English, Hindi, Gujarati, Hinglish).'}
            {step === 4 &&
              'Preview your physical countertop acrylic standee and test scan with your phone.'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn('h-1.5 rounded-full transition-all', step >= 1 ? 'bg-blue-600' : 'bg-slate-200')} />
          <div className={cn('h-1.5 rounded-full transition-all', step >= 2 ? 'bg-blue-600' : 'bg-slate-200')} />
          <div className={cn('h-1.5 rounded-full transition-all', step >= 3 ? 'bg-blue-600' : 'bg-slate-200')} />
          <div className={cn('h-1.5 rounded-full transition-all', step >= 4 ? 'bg-blue-600' : 'bg-slate-200')} />
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 1: Entity Structure, Google Maps Search & Category */}
        {/* ────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xl animate-in fade-in duration-150">
            <CardContent className="p-6 space-y-5">
              {/* Optional Google Sign-In Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Sign in with Google (Optional)</p>
                  <p className="text-[11px] text-slate-400">Save workspace & live sync Google Profile</p>
                </div>
                <GoogleAuthButton
                  compact
                  onSuccess={(u) => {
                    if (!name) setName(`${u.name}'s Business`);
                  }}
                />
              </div>

              {/* Mode Selector: Single Store vs Multi-Location Brand */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Organization Structure</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEntityType('single');
                      if (branchName === 'Main Branch / Head Office') setBranchName('Main Store');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1',
                      entityType === 'single'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Store className={cn('h-5 w-5', entityType === 'single' ? 'text-blue-600' : 'text-slate-400')} />
                      {entityType === 'single' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-xs font-black text-slate-900 mt-1">Single Store</p>
                    <p className="text-[10px] text-slate-500">1 Standalone shop, clinic or restaurant (Simple clean view)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEntityType('multi');
                      if (branchName === 'Main Store' || branchName === 'Main Branch') setBranchName('Main Branch / Head Office');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1',
                      entityType === 'multi'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Network className={cn('h-5 w-5', entityType === 'multi' ? 'text-blue-600' : 'text-slate-400')} />
                      {entityType === 'multi' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <p className="text-xs font-black text-slate-900 mt-1">Multi-Branch Brand</p>
                    <p className="text-[10px] text-slate-500">Main Flagship Branch (Add secondary branches from dashboard)</p>
                  </button>
                </div>
              </div>

              {/* Brand Name (If Multi-Branch) */}
              {entityType === 'multi' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <Label className="text-xs font-bold text-slate-700">Brand / Organization Name *</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Ramesh Sweets Group / Upmark Hospitality"
                    className="rounded-xl border-slate-200 text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400">
                    This brand groups all your branches and franchise locations under one consolidated dashboard.
                  </p>
                </div>
              )}

              {/* Google Places Autocomplete Search */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">
                    {entityType === 'multi'
                      ? 'Search Main Branch on Google Maps (Auto-Detect Place ID & Category)'
                      : 'Search Store on Google Maps (Auto-Detect Place ID & Category)'}
                  </Label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Place ID Link
                  </span>
                </div>

                <GooglePlacesAutocomplete
                  initialValue={name}
                  placeholder={
                    entityType === 'multi'
                      ? 'Search your flagship store or headquarter on Google Maps...'
                      : 'Search store name or locality on Google Maps...'
                  }
                  onSelect={(place) => {
                    setName(place.name);
                    setGooglePlaceId(place.placeId);
                    setGoogleReviewUrl(place.googleReviewUrl);
                    setVerifiedPlace(place);
                    setUrlTested(true);

                    if (place.address) {
                      const parts = place.address.split(',').map((p) => p.trim());
                      if (parts.length >= 2) {
                        setCity(parts[parts.length - 2] || 'Ahmedabad');
                      }
                    }

                    if (place.category) {
                      setCategory(place.category);
                    }
                  }}
                />
              </div>

              {/* Verified Place Profile Card */}
              {verifiedPlace && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-black text-blue-950">
                        {entityType === 'multi' ? 'Verified Main Branch Profile' : 'Verified Google Business Profile'}
                      </span>
                    </div>
                    {verifiedPlace.rating && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] border border-amber-200">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{verifiedPlace.rating} ({verifiedPlace.userRatingCount || 0} reviews)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{verifiedPlace.address}</p>
                  {verifiedPlace.placeId && (
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      Place ID: {verifiedPlace.placeId}
                    </div>
                  )}
                </div>
              )}

              {/* Business Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  {entityType === 'multi' ? 'Primary Business / Operating Entity Name *' : 'Store / Business Name *'}
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={entityType === 'multi' ? 'e.g. Upmark Ahmedabad' : 'e.g. Ramesh Sweet Mart'}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Business Category: Editable Input + Suggestion Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Business Category *</Label>
                  <span className="text-[10px] text-slate-400">Auto-detected from Google or type custom</span>
                </div>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type business category (e.g. Restaurant & Cafe, Dental Clinic, Legal Firm...)"
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Restaurant & Cafe',
                    'Retail & Jewellery',
                    'Sweets & Bakery',
                    'Clinic & Healthcare',
                    'Salon & Spa',
                    'Agency & Services',
                    'Law Firm & Legal',
                    'Coaching & Education'
                  ].map((catName) => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setCategory(catName)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer',
                        category.toLowerCase() === catName.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name.trim() && (entityType === 'single' || !brandName.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 gap-2 cursor-pointer"
              >
                <span>Continue to Review Link & Verification</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 2: Google Maps Link Confirmation & Test */}
        {/* ────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xl animate-in fade-in duration-150">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  {entityType === 'multi' ? 'Main Branch / Outlet Title *' : 'Outlet Label'}
                </Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder={entityType === 'multi' ? 'e.g. Navrangpura Head Office' : 'e.g. Main Store'}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                />
              </div>

              {/* Official Google Review URL & Test */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Official Google Review Link *</Label>
                <div className="flex gap-2">
                  <Input
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review or Google Maps URL"
                    className="rounded-xl border-slate-200 text-xs font-mono"
                  />
                  {googleReviewUrl && (
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Test Link</span>
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  When customers tap "Submit on Google", this exact link opens in their Google Maps app.
                </p>
              </div>

              {/* City and Phone */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">City / Region</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad, Surat"
                    className="rounded-xl border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Phone (Optional)</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="rounded-xl border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!googleReviewUrl.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 gap-2 cursor-pointer"
                >
                  <span>Continue to AI Review Copilot</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 3: AI Review Copilot & Multilingual Keywords (For All) */}
        {/* ────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xl animate-in fade-in duration-150">
            <CardContent className="p-6 space-y-5">
              {/* Allowed Customer Languages */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">
                  Customer Review Languages (Multilingual AI Generation)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'en', label: 'English', desc: 'Standard business English' },
                    { id: 'hi', label: 'Hindi (हिंदी)', desc: 'प्राकृतिक हिंदी समीक्षा' },
                    { id: 'gu', label: 'Gujarati (ગુજરાતી)', desc: 'અસલી ગુજરાતી રિવ્યુ' },
                    { id: 'hinglish', label: 'Hinglish', desc: 'Natural urban conversational' }
                  ].map((lang) => {
                    const isChecked = selectedLanguages.includes(lang.id);
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => toggleLanguage(lang.id)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col',
                          isChecked
                            ? 'border-blue-600 bg-blue-50/60 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{lang.label}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">{lang.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Tone Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">AI Response Tone</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'warm_grateful', label: 'Warm & Grateful', desc: 'Polite & humble' },
                    { id: 'professional', label: 'Professional', desc: 'Formal & structured' },
                    { id: 'enthusiastic', label: 'Friendly', desc: 'Energetic & inviting' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBrandVoice(t.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer',
                        brandVoice === t.id
                          ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      )}
                    >
                      <p className="font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Highlight Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Quick Service Highlights (Chips)</Label>
                  <span className="text-[10px] text-slate-400">Click to remove</span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[50px]">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      onClick={() => handleRemoveChip(chip)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                    >
                      <span>{chip}</span>
                      <X className="h-3 w-3" />
                    </span>
                  ))}
                </div>

                {/* Add Custom Chip */}
                <div className="flex gap-2">
                  <Input
                    value={newChipInput}
                    onChange={(e) => setNewChipInput(e.target.value)}
                    onKeyDown={handleAddChip}
                    placeholder="Add custom highlight (e.g. Hygienic, 24x7 Support)..."
                    className="rounded-xl border-slate-200 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChip}
                    className="rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 gap-2 cursor-pointer"
                >
                  <span>Preview Live Standee</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* STEP 4: Live 3D Acrylic Countertop Standee Preview */}
        {/* ────────────────────────────────────────────────────────── */}
        {step === 4 && (
          <Card className="rounded-3xl border-slate-200/90 bg-white shadow-xl animate-in fade-in duration-150">
            <CardContent className="p-6 space-y-5">
              {/* Multi-Branch Badge */}
              {entityType === 'multi' && (
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900 font-bold">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Multi-Branch Brand: Main Branch configured. Add more branch outlets from Dashboard.</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 text-[10px]">
                    HQ Ready
                  </span>
                </div>
              )}

              {/* Placement & Color Palette Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Standee Counter Placement</Label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Cash Counter 1 / Front Desk"
                    className="rounded-xl border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Accent Theme Color</Label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {colorPalettes.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setBrandColor(c.hex)}
                        title={c.label}
                        className={cn(
                          'h-6 w-6 rounded-full transition-transform cursor-pointer border-2',
                          brandColor === c.hex ? 'scale-115 border-slate-900 shadow-xs' : 'border-white'
                        )}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Acrylic Countertop Card Mockup */}
              <div className="flex flex-col items-center justify-center p-4 bg-radial from-slate-50 to-slate-100 rounded-2xl">
                <div
                  ref={standeeRef}
                  className="relative w-[230px] sm:w-[250px] rounded-2xl bg-white border border-slate-200 shadow-xl p-4 text-center flex flex-col items-center overflow-hidden"
                >
                  {/* Gloss reflection highlight */}
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-white/70 via-white/10 to-transparent pointer-events-none rounded-tr-2xl" />

                  {/* Google Brand Tag */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-extrabold uppercase tracking-wide shadow-2xs mb-1.5">
                    <svg className="h-3 w-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Review on Google</span>
                  </div>

                  {/* Business Name & City */}
                  <h4 className="text-sm font-black text-slate-900 leading-tight truncate max-w-[200px] mt-1">
                    {branchName || name || 'Your Business'}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{city || 'India'}</p>

                  {/* 5 Gold Stars */}
                  <div className="flex items-center gap-0.5 my-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Dynamic QR Frame */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-2xs my-1">
                    <div ref={qrRef} className="flex items-center justify-center w-[170px] h-[170px]" />
                  </div>

                  <p className="mt-1.5 text-[9px] font-bold text-slate-600">
                    Point camera to review in 5 seconds
                  </p>

                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[8px] font-extrabold border border-emerald-200">
                    <Smartphone className="h-2.5 w-2.5" />
                    <span>NFC Tap & Scan Ready</span>
                  </div>
                </div>

                {/* Countertop weighted stand base */}
                <div className="mt-1 h-2.5 w-48 rounded-md bg-gradient-to-b from-slate-700 to-slate-900 shadow-md border-t border-slate-600" />
                <div className="h-1 w-40 bg-slate-300/60 rounded-full blur-xs -mt-0.5" />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadStandee}
                  disabled={isDownloadingStandee}
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isDownloadingStandee ? 'Exporting...' : 'Download Standee'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 gap-2 cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Launching...'
                      : entityType === 'single'
                      ? 'Launch Store Dashboard 🚀'
                      : 'Launch Brand Dashboard 🚀'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
