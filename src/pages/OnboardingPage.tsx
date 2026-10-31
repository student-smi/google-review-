import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
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
  X
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { apiFetch, getStoredBusinesses, saveStoredBusinesses, saveActiveBusinessId } from '@/lib/api';

interface OnboardingPageProps {
  onComplete?: (business: any) => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form state - ZERO dummy data pre-filled
  const [name, setName] = useState('');
  const [category, setCategory] = useState('services');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Google Link & Place Details
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [urlTested, setUrlTested] = useState(false);

  // Standee Highlights Chips (User customizable or managed later in Keywords)
  const [chips, setChips] = useState<string[]>([]);
  const [newChipInput, setNewChipInput] = useState('');

  // Step 3: Brand style
  const [brandColor, setBrandColor] = useState('#4338CA');
  const [brandColorSecondary, setBrandColorSecondary] = useState('#D97706');
  const [label, setLabel] = useState('Main Billing Counter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const isValidGoogleUrl = googleReviewUrl.includes('google.com') ||
    googleReviewUrl.includes('g.page') ||
    googleReviewUrl.includes('maps.app.goo.gl') ||
    googleReviewUrl.includes('search.google.com');

  const categories = [
    { id: 'services', label: 'Agency & Services', icon: Briefcase },
    { id: 'restaurant', label: 'Restaurant & Cafe', icon: UtensilsCrossed },
    { id: 'sweets', label: 'Sweets & Bakery', icon: Cake },
    { id: 'healthcare', label: 'Clinic & Healthcare', icon: Stethoscope },
    { id: 'salon', label: 'Salon & Spa', icon: Scissors },
    { id: 'retail', label: 'Retail & Jewellery', icon: Store }
  ];

  const handleFinish = async () => {
    setIsSubmitting(true);
    const trimmedName = name.trim() || 'My Business';
    const payload = {
      name: trimmedName,
      category,
      city: city.trim() || 'India',
      address: verifiedPlace?.address || undefined,
      phone: phone.trim() || undefined,
      googlePlaceId: googlePlaceId || undefined,
      googleReviewUrl: googleReviewUrl.trim() || 'https://maps.google.com',
      chipsJson: chips.length > 0 ? JSON.stringify(chips) : null,
      brandColor,
      brandColorSecondary
    };

    let business: any = null;

    try {
      const data = await apiFetch('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(payload)
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
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || 'my-business',
        category: payload.category,
        city: payload.city,
        googleReviewUrl: payload.googleReviewUrl,
        chipsJson: payload.chipsJson,
        brandColor,
        brandColorSecondary
      };
    } else {
      business.chipsJson = payload.chipsJson;
    }

    // Create default standee QR code
    try {
      await apiFetch(`/api/qr/business/${business.id}`, {
        method: 'POST',
        body: JSON.stringify({
          label,
          code: `${business.slug || 'counter'}-${Math.random().toString(36).slice(2, 6)}`,
          styleJson: {
            dots: 'rounded',
            cornersSquare: 'extra-rounded',
            cornersDot: 'dot',
            color: brandColor
          }
        })
      });
    } catch (err) {
      console.warn('Standee create warning:', err);
    }

    // Persist business to client storage
    const existing = getStoredBusinesses();
    const updated = [business, ...existing.filter((b) => b.id !== business.id)];
    saveStoredBusinesses(updated);
    saveActiveBusinessId(business.id);

    onComplete?.(business);
    navigate('/dashboard');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-xl space-y-6">
        {/* Header & Steps */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-gradient-to-tr from-[#7B68EE] to-[#EC4899]" />
            <span>Guided Setup • Step {step} of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {step === 1 && 'Tell us about your business'}
            {step === 2 && 'Connect your Google Review link'}
            {step === 3 && 'Customize your QR & brand style'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {step === 1 && 'Enter your shop, cafe, or clinic details to personalize customer review posters.'}
            {step === 2 && 'Every customer will be seamlessly directed to this official Google Maps rating page.'}
            {step === 3 && 'Pick your colors and live-preview your dynamic QR standee.'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-[#7B68EE] to-[#4F46E5]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-[#4F46E5] to-[#EC4899]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-gradient-to-r from-[#EC4899] to-[#7B68EE]' : 'bg-slate-200 dark:bg-slate-800'}`} />
        </div>

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-4">
              {/* Optional Google Sign-In Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Sign in with Google (Optional)</p>
                  <p className="text-[11px] text-slate-400">Sync your business profile & standees</p>
                </div>
                <GoogleAuthButton
                  compact
                  onSuccess={(u) => {
                    if (!name) {
                      setName(`${u.name}'s Business`);
                    }
                  }}
                />
              </div>

              {/* Google Maps Search & Autocomplete */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Search on Google Maps (India)
                  </Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Auto-fills Review Link
                  </span>
                </div>
                <GooglePlacesAutocomplete
                  initialValue={name}
                  onSelect={async (place) => {
                    setName(place.name);
                    setGooglePlaceId(place.placeId);
                    setGoogleReviewUrl(place.googleReviewUrl);
                    setVerifiedPlace(place);
                    setUrlTested(true);

                    // 1. Dynamic Google Category Assignment
                    const dynamicCat = place.category || 'Agency & Services';
                    setCategory(dynamicCat);

                    // 2. City extraction from verified address
                    let extractedCity = city || 'India';
                    if (place.address) {
                      const parts = place.address.split(',').map((p) => p.trim());
                      if (parts.length >= 3) {
                        extractedCity = parts[parts.length - 3] || parts[0];
                        setCity(extractedCity);
                      }
                    }
                  }}
                  placeholder="Search your business on Google Maps..."
                />

                {/* Google Verified Place Profile Card */}
                {verifiedPlace && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/40 border border-blue-200/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 dark:border-blue-800/60 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-950 dark:text-blue-100">
                          Google Verified Business Profile
                        </span>
                      </div>
                      {verifiedPlace.rating && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] border border-amber-200/80">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{verifiedPlace.rating} ({verifiedPlace.userRatingCount || 0} reviews)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      📍 {verifiedPlace.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Business Display Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shree Krishna Sweets, Navrangpura"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Business Category
                  </Label>
                  {category && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                      Dynamic Google Category
                    </span>
                  )}
                </div>
                <Input
                  list="onboarding-category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Electronics store, Dental clinic, Cafe"
                  className="rounded-xl text-xs"
                />
                <datalist id="onboarding-category-suggestions">
                  <option value="Electronics store" />
                  <option value="Restaurant / Cafe" />
                  <option value="Sweets & Bakery" />
                  <option value="Dental Clinic" />
                  <option value="Salon & Spa" />
                  <option value="Retail & Supermarket" />
                  <option value="Jewelry store" />
                  <option value="Gym & Fitness center" />
                  <option value="Auto repair shop" />
                  <option value="Digital Marketing Agency" />
                  <option value="Coaching & Classes" />
                  <option value="Chartered Accountant" />
                  <option value="Hotel & Lodging" />
                  <option value="Hospital & Healthcare" />
                </datalist>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {categories.map((c) => {
                    const isSelected = category.toLowerCase() === c.label.toLowerCase() || category.toLowerCase() === c.id.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.label)}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'
                        }`}
                      >
                        <c.icon className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                        <span className="truncate text-[11px]">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    City / Town
                  </Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad, Mumbai, Surat"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contact Phone (Optional)
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-2"
              >
                <span>Continue to Google Link</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: Google Review Link */}
        {step === 2 && (
          <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-5">
              {verifiedPlace && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Google Maps Listing Connected
                    </span>
                    {verifiedPlace.rating && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-lg">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {verifiedPlace.rating} ({verifiedPlace.userRatingCount || 0} reviews)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{verifiedPlace.name}</p>
                  <p className="text-[11px] text-slate-400">{verifiedPlace.address}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Review Destination URL
                </Label>
                <Input
                  value={googleReviewUrl}
                  onChange={(e) => {
                    setGoogleReviewUrl(e.target.value);
                    setUrlTested(false);
                  }}
                  placeholder="Paste review link: https://g.page/r/... or https://maps.app.goo.gl/..."
                  className="rounded-xl text-xs font-mono"
                />
                {isValidGoogleUrl ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid Google Review format recognized
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">
                    Tip: Open Google Maps, search your business, click "Ask for reviews", and copy the link.
                  </p>
                )}
              </div>

              {/* Live Link Verification Button */}
              {googleReviewUrl && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">Verify Your Google Destination</p>
                    <p className="text-slate-400 text-[11px]">Test in a new tab before generating posters</p>
                  </div>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUrlTested(true)}
                  >
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs font-bold">
                      <span>Test Link</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between p-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!isValidGoogleUrl}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-2"
              >
                <span>Continue to Brand Style</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: Brand & First QR */}
        {step === 3 && (
          <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xl animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Brand Accent Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-12 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-800 p-1"
                  />
                  <div className="flex gap-2">
                    {['#4338CA', '#065F46', '#09090B', '#D97706', '#E11D48'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBrandColor(c)}
                        className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  First QR Placement Name
                </Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Main Billing Counter or Table #1"
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {name || 'Your Business Name'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {city || 'India'} • {label}
                  </div>
                  <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 mt-1">
                    /r/{(name || 'counter').toLowerCase().replace(/[^a-z0-9]/g, '-')}-standee
                  </div>
                </div>
              </div>

              {/* Standee Highlights Chips on Standee Preview */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Standee Review Highlight Chips
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Customers will tap these to generate 5★ reviews
                  </span>
                </div>

                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800"
                      >
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() => setChips(chips.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 cursor-pointer ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No chips yet. Add custom highlight tags below.</div>
                )}

                <div className="flex gap-2 pt-1">
                  <Input
                    value={newChipInput}
                    onChange={(e) => setNewChipInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newChipInput.trim() && !chips.includes(newChipInput.trim())) {
                          setChips([...chips, newChipInput.trim()]);
                          setNewChipInput('');
                        }
                      }
                    }}
                    placeholder="Add custom keyword (e.g. Quick Response)..."
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newChipInput.trim() && !chips.includes(newChipInput.trim())) {
                        setChips([...chips, newChipInput.trim()]);
                        setNewChipInput('');
                      }
                    }}
                    className="h-8 text-xs rounded-xl font-bold cursor-pointer shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between p-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                onClick={handleFinish}
                isLoading={isSubmitting}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-2 px-5"
              >
                <span>Launch My Dashboard & QR</span>
                <Sparkles className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
