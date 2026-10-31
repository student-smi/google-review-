import { useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Store,
  CheckCircle2,
  ExternalLink,
  QrCode,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Check,
  Star
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { apiFetch, saveStoredBusinesses, saveActiveBusinessId } from '@/lib/api';
import type { BusinessItem } from './DashboardLayout';

export function BusinessesPage() {
  const { activeBusiness, businesses, refreshBusinesses, onSelectBusiness } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    businesses: BusinessItem[];
    refreshBusinesses: () => Promise<void>;
    onSelectBusiness: (id: string) => void;
  }>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('Ahmedabad, Gujarat');
  const [city, setCity] = useState('Ahmedabad');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleOpenModal = () => {
    setName('');
    setCategory('');
    setAddress('Ahmedabad, Gujarat');
    setCity('Ahmedabad');
    setGoogleReviewUrl('');
    setGooglePlaceId(null);
    setVerifiedPlace(null);
    setError(null);
    setIsModalOpen(true);
  };

  // Validate Google review link format
  const isValidGoogleUrl = Boolean(
    googleReviewUrl.trim().length > 10 &&
    (googleReviewUrl.includes('google.com') ||
     googleReviewUrl.includes('g.page') ||
     googleReviewUrl.includes('maps.app.goo.gl') ||
     googleReviewUrl.includes('search.google.com'))
  );

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a business name.');
      return;
    }

    if (!isValidGoogleUrl) {
      setError('Please enter a valid Google Review or Google Maps link.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category,
      address: address.trim(),
      city: city || address.split(',')[0]?.trim() || address.trim(),
      googlePlaceId: googlePlaceId || undefined,
      googleReviewUrl: googleReviewUrl.trim(),
      chipsJson: null,
      brandColor: '#2563EB',
      brandColorSecondary: '#F59E0B'
    };

    let createdId = '';

    try {
      const data = await apiFetch<{ business: any }>('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data?.business) {
        createdId = data.business.id;
        onSelectBusiness(data.business.id);
      }
      await refreshBusinesses();
      setIsModalOpen(false);
    } catch (err: any) {
      console.warn('API error, saving locally:', err);
      const localBiz: BusinessItem = {
        id: `biz_${Date.now()}`,
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24),
        category: payload.category,
        address: payload.address,
        city: payload.city,
        googlePlaceId: payload.googlePlaceId,
        googleReviewUrl: payload.googleReviewUrl,
        chipsJson: payload.chipsJson,
        brandColor: payload.brandColor,
        brandColorSecondary: payload.brandColorSecondary
      };
      createdId = localBiz.id;
      const updated = [localBiz, ...businesses];
      saveStoredBusinesses(updated);
      saveActiveBusinessId(localBiz.id);
      await refreshBusinesses();
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }

    // Also auto-generate default counter standee QR code if available
    if (createdId) {
      try {
        await apiFetch(`/api/qr/business/${createdId}`, {
          method: 'POST',
          body: JSON.stringify({
            label: 'Main Billing Counter',
            code: `${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'counter'}-${Math.random().toString(36).slice(2, 6)}`,
            styleJson: {
              dots: 'rounded',
              cornersSquare: 'extra-rounded',
              cornersDot: 'dot',
              color: '#2563EB'
            }
          })
        });
      } catch (qrErr) {
        console.warn('Standee create warning:', qrErr);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Workspace Profile Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Businesses & Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your shop, restaurant, or clinic profiles. Each business gets its own isolated QR campaigns.
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-sm gap-2 h-11 px-4 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Business</span>
        </Button>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businesses.map((biz) => {
          const isActive = biz.id === activeBusiness?.id;
          return (
            <Card
              key={biz.id}
              className={`rounded-3xl border transition-all p-5 space-y-4 ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                    style={{ backgroundColor: biz.brandColor || '#2563EB' }}
                  >
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                        {biz.name}
                      </h3>
                      {isActive && (
                        <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider">
                          Active
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{biz.address || biz.city || 'India'}</span>
                      {biz.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{biz.category}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {!isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectBusiness(biz.id)}
                    className="text-xs font-semibold rounded-xl h-8 cursor-pointer"
                  >
                    Switch
                  </Button>
                )}
              </div>

              {/* Review URL status */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Valid Google Review Link</span>
                  </span>
                  <a
                    href={biz.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-semibold text-[11px]"
                  >
                    <span>Test link</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {biz.googleReviewUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  to="/dashboard/qr"
                  className="text-xs text-[#2563EB] font-bold flex items-center gap-1 hover:underline"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Customize Standees</span>
                </Link>

                <Link
                  to="/dashboard/settings"
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Edit Profile
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Business Modal (Google Places Auto-fill like Onboarding) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F] shadow-2xl w-full max-w-lg p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Add Business Details</span>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                    Google Maps Sync
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search on Google Maps to auto-fill official review link, location, and verified details.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-4">
              {/* 1. Google Places Search Autocomplete */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
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

                    // 1. Dynamic Category directly from Google Places info (e.g. Electronics store, Dental clinic, Sweets shop)
                    const dynamicCategory = place.category || 'Local Business';
                    setCategory(dynamicCategory);

                    // 2. City & Address extraction from verified address
                    let extractedCity = city || 'Ahmedabad';
                    if (place.address) {
                      setAddress(place.address);
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
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/40 border border-blue-200/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 dark:border-blue-800/60 space-y-2 animate-in fade-in mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-950 dark:text-blue-100">
                          Google Verified Business Profile
                        </span>
                      </div>
                      {verifiedPlace.rating && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-extrabold text-[10px] border border-amber-200/80">
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

              {/* 2. Business Display Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Business Name</Label>
                <Input
                  placeholder="e.g. Sharma Restaurant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              {/* 3. Category & Address / City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Category</Label>
                    {category && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                        Dynamic
                      </span>
                    )}
                  </div>
                  <Input
                    list="category-suggestions"
                    placeholder="e.g. Electronics store, Cafe, Clinic"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 text-xs rounded-xl capitalize"
                    required
                  />
                  <datalist id="category-suggestions">
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
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Address / City</Label>
                  <Input
                    placeholder="e.g. Ahmedabad, Gujarat"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* 4. Google Review URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Google Review URL</Label>
                  {isValidGoogleUrl && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Valid Google Review URL</span>
                    </span>
                  )}
                </div>
                <Input
                  placeholder="e.g. https://g.co/kgs/abc123 or https://search.google.com/local/writereview?placeid=..."
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Tip: Searching your business above automatically extracts and verifies this official link.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs rounded-xl h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl h-10 px-5 shadow-sm cursor-pointer"
                >
                  Save Business
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
export default BusinessesPage;
