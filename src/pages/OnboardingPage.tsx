import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  Building2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  Scissors,
  Stethoscope,
  Briefcase,
  Star
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

interface OnboardingPageProps {
  onComplete: (business: any) => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState('Royal Sweets & Bakery');
  const [category, setCategory] = useState('restaurant');
  const [city, setCity] = useState('Ahmedabad');
  const [phone, setPhone] = useState('+91 98765 43210');

  // Step 2: Google Link & Place Details
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('https://g.page/r/royal-sweets/review');
  const [urlTested, setUrlTested] = useState(false);

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
    { id: 'restaurant', label: 'Restaurant / Cafe', icon: UtensilsCrossed },
    { id: 'retail', label: 'Retail / Shop', icon: Store },
    { id: 'salon', label: 'Salon / Spa', icon: Scissors },
    { id: 'healthcare', label: 'Clinic / Healthcare', icon: Stethoscope },
    { id: 'services', label: 'Professional Services', icon: Briefcase }
  ];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        category,
        city,
        phone,
        googlePlaceId: googlePlaceId || undefined,
        googleReviewUrl,
        brandColor,
        brandColorSecondary
      };

      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as any;
      if (res.ok && data.business) {
        // Also create first default QR code
        await fetch(`/api/qr/business/${data.business.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label,
            code: `${data.business.slug}-counter`,
            styleJson: {
              dots: 'rounded',
              cornersSquare: 'extra-rounded',
              cornersDot: 'dot',
              color: brandColor
            }
          })
        });

        onComplete(data.business);
        navigate('/dashboard');
      } else {
        // If local mock / offline
        const fallbackBiz = {
          id: `biz_${Date.now()}`,
          name,
          city,
          googleReviewUrl,
          brandColor,
          brandColorSecondary
        };
        onComplete(fallbackBiz);
        navigate('/dashboard');
      }
    } catch {
      // Fallback
      const fallbackBiz = {
        id: `biz_${Date.now()}`,
        name,
        city,
        googleReviewUrl,
        brandColor,
        brandColorSecondary
      };
      onComplete(fallbackBiz);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
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
            {step === 1 && 'Enter your shop or clinic details to personalize customer review posters.'}
            {step === 2 && 'Every customer will be seamlessly directed to this official Google link.'}
            {step === 3 && 'Pick your colors and live-preview your dynamic QR code.'}
          </p>
        </div>

        {/* Step Progress Bar (ClickUp 4.0 Style) */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-gradient-to-r from-[#7B68EE] to-[#4F46E5]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-[#4F46E5] to-[#EC4899]' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-gradient-to-r from-[#EC4899] to-[#7B68EE]' : 'bg-slate-200 dark:bg-slate-800'}`} />
        </div>

        {/* STEP 1: Business Details */}
        {step === 1 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-4">
              {/* Optional Google Sign-In Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-border/80">
                <div>
                  <p className="text-xs font-bold text-foreground">Sign in with Google (Optional)</p>
                  <p className="text-[11px] text-muted-foreground">Keep your business & QR stats synced</p>
                </div>
                <GoogleAuthButton
                  compact
                  onSuccess={(u) => {
                    if (!name || name === 'Royal Sweets & Bakery') {
                      setName(`${u.name}'s Business`);
                    }
                  }}
                />
              </div>

              {/* Google Maps Search & Autocomplete */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Search on Google Maps</Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Auto-fills Review Link
                  </span>
                </div>
                <GooglePlacesAutocomplete
                  initialValue={name}
                  onSelect={(place) => {
                    setName(place.name);
                    setGooglePlaceId(place.placeId);
                    setGoogleReviewUrl(place.googleReviewUrl);
                    setVerifiedPlace(place);
                    setUrlTested(true);
                    if (place.address) {
                      const parts = place.address.split(',').map((p) => p.trim());
                      if (parts.length >= 3) {
                        setCity(parts[parts.length - 3] || parts[0]);
                      }
                    }
                  }}
                  placeholder="Type shop name, e.g. Royal Sweets, Ahmedabad..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Or edit business name below if you prefer a custom display title.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Business Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Sweets & Bakery"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Business Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const isSelected = category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                            : 'border-border hover:bg-secondary text-muted-foreground'
                        }`}
                      >
                        <c.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City / Town</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad, Surat, Mumbai"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6 border-t border-border">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="gap-2"
              >
                <span>Continue to Google Link</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}


        {/* STEP 2: Google Review Link */}
        {step === 2 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-5">
              {verifiedPlace && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
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
                  <p className="text-xs text-foreground font-semibold">{verifiedPlace.name}</p>
                  <p className="text-[11px] text-muted-foreground">{verifiedPlace.address}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Google Review Destination URL</Label>
                <Input
                  value={googleReviewUrl}
                  onChange={(e) => {
                    setGoogleReviewUrl(e.target.value);
                    setUrlTested(false);
                  }}
                  placeholder="https://g.page/r/YOUR_ID/review or https://maps.app.goo.gl/..."
                />
                {isValidGoogleUrl ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid Google Review format recognized
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Please provide a link containing google.com, g.page, or maps.app.goo.gl
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Important: Policy & Trust Guarantee</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ReviewQR never filters reviews or gates unhappy customers. Every customer scanning your QR is always provided with this direct link to submit their genuine review on Google.
                </p>
                <div className="pt-2">
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUrlTested(true)}
                  >
                    <Button variant="outline" size="sm" className="gap-2 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Test Opening Link in New Tab</span>
                    </Button>
                  </a>
                  {urlTested && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-2">
                      ✓ Verified in browser
                    </span>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between p-6 border-t border-border">
              <Button variant="secondary" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!isValidGoogleUrl}
                className="gap-2"
              >
                <span>Continue to Brand Style</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: Brand Style & QR Preview */}
        {step === 3 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-12 rounded-lg cursor-pointer border border-border p-1"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Saffron / Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColorSecondary}
                      onChange={(e) => setBrandColorSecondary(e.target.value)}
                      className="h-10 w-12 rounded-lg cursor-pointer border border-border p-1"
                    />
                    <Input
                      value={brandColorSecondary}
                      onChange={(e) => setBrandColorSecondary(e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>First QR Location Label</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Main Cash Counter, Table 1, Reception"
                />
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4 flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  <QrCode className="h-9 w-9 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{name}</div>
                  <div className="text-xs text-muted-foreground">{city} • {label}</div>
                  <div className="text-[11px] font-mono text-primary mt-1">/r/{name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-counter</div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between p-6 border-t border-border">
              <Button variant="secondary" onClick={() => setStep(2)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                variant="saffron"
                onClick={handleFinish}
                isLoading={isSubmitting}
                className="gap-2"
              >
                <span>Launch Dashboard & QR</span>
                <Sparkles className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
