import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Save,
  Sparkles,
  Plus,
  X,
  Tag,
  Smartphone,
  Check,
  Loader2,
  Network,
  Store,
  Crown,
  MapPin,
  ChevronRight,
  Globe
} from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/google/GooglePlacesAutocomplete';
import { useHierarchy } from '@/context/HierarchyContext';
import { cn } from '@/lib/utils';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch, getStoredBusinesses, saveStoredBusinesses } from '@/lib/api';

export function SettingsPage() {
  const { activeBusiness, refreshBusinesses } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    refreshBusinesses?: () => Promise<void>;
  }>();

  const {
    activeBrand,
    activeBranch,
    branches,
    refreshHierarchy,
    isSingleMode
  } = useHierarchy();

  // Active Tab: 'brand' | 'business' | 'branch'
  const [activeTab, setActiveTab] = useState<'brand' | 'business' | 'branch'>(
    isSingleMode ? 'business' : 'brand'
  );

  // ==========================================
  // 1. BRAND PROFILE STATE
  // ==========================================
  const [brandName, setBrandName] = useState(activeBrand?.name || '');
  const [brandDescription, setBrandDescription] = useState(activeBrand?.description || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(activeBrand?.logoUrl || '');
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBrand) {
      setBrandName(activeBrand.name || '');
      setBrandDescription(activeBrand.description || '');
      setBrandLogoUrl(activeBrand.logoUrl || '');
    }
  }, [activeBrand?.id, activeBrand?.name]);

  const handleSaveBrand = async () => {
    if (!activeBrand?.id || !brandName.trim()) return;
    setIsSavingBrand(true);
    setBrandError(null);
    try {
      await apiFetch(`/api/hierarchy/brands/${activeBrand.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: brandName.trim(),
          description: brandDescription.trim() || null,
          logoUrl: brandLogoUrl.trim() || null
        })
      });
      await refreshHierarchy();
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    } catch (err: any) {
      console.error('Brand update error:', err);
      setBrandError(err?.message || 'Failed to update brand profile.');
    } finally {
      setIsSavingBrand(false);
    }
  };

  // ==========================================
  // 2. BUSINESS PROFILE STATE
  // ==========================================
  const [name, setName] = useState(activeBusiness?.name || '');
  const [category, setCategory] = useState(activeBusiness?.category || 'services');
  const [googleUrl, setGoogleUrl] = useState(activeBusiness?.googleReviewUrl || '');
  const [phone, setPhone] = useState(activeBusiness?.phone || '');
  const [city, setCity] = useState(activeBusiness?.city || '');
  const [resolutionContact, setResolutionContact] = useState('');
  const [voice, setVoice] = useState(activeBusiness?.brandVoice || 'warm_grateful');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeBizId = activeBusiness?.id;
  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setCategory(activeBusiness.category || 'services');
      setGoogleUrl(activeBusiness.googleReviewUrl || '');
      setPhone(activeBusiness.phone || '');
      setCity(activeBusiness.city || '');
      setVoice(activeBusiness.brandVoice || 'warm_grateful');
    }
  }, [activeBizId]);

  const handleSaveBusiness = async () => {
    if (!activeBusiness?.id) return;
    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      googleReviewUrl: googleUrl.trim(),
      city: city.trim(),
      phone: phone.trim(),
      brandVoice: voice,
      contactResolutionLine: resolutionContact.trim() || undefined
    };

    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Update local storage
      const existing = getStoredBusinesses();
      const updated = existing.map((b) => (b.id === activeBusiness.id ? { ...b, ...payload } : b));
      saveStoredBusinesses(updated);

      if (activeBusiness) {
        Object.assign(activeBusiness, payload);
      }

      await refreshBusinesses?.();
      await refreshHierarchy();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Settings save error:', err);
      setErrorMessage(err?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // 3. BRANCH OUTLETS STATE
  // ==========================================
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    activeBranch?.id || (branches[0]?.id || '')
  );
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchPlaceId, setBranchPlaceId] = useState('');
  const [branchReviewUrl, setBranchReviewUrl] = useState('');
  const [branchManager, setBranchManager] = useState('');
  const [branchKeywords, setBranchKeywords] = useState('');
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [branchSaved, setBranchSaved] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const currentSelectedBranch = branches.find((b) => b.id === selectedBranchId) || activeBranch || branches[0];

  useEffect(() => {
    if (currentSelectedBranch) {
      setSelectedBranchId(currentSelectedBranch.id);
      setBranchName(currentSelectedBranch.name || '');
      setBranchCity(currentSelectedBranch.city || '');
      setBranchAddress(currentSelectedBranch.address || '');
      setBranchPhone(currentSelectedBranch.phone || '');
      setBranchPlaceId(currentSelectedBranch.googlePlaceId || '');
      setBranchReviewUrl(currentSelectedBranch.googleReviewUrl || '');
      setBranchManager(currentSelectedBranch.assignedManager || '');
      try {
        const kw = currentSelectedBranch.chipsJson ? JSON.parse(currentSelectedBranch.chipsJson) : [];
        setBranchKeywords(Array.isArray(kw) ? kw.join(', ') : (currentSelectedBranch.chipsJson || ''));
      } catch {
        setBranchKeywords(currentSelectedBranch.chipsJson || '');
      }
    }
  }, [selectedBranchId, currentSelectedBranch?.id]);

  const handleSaveBranch = async () => {
    if (!activeBusiness?.id || !selectedBranchId || !branchName.trim()) return;
    setIsSavingBranch(true);
    setBranchError(null);
    try {
      const kwList = branchKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await apiFetch(`/api/businesses/${activeBusiness.id}/locations/${selectedBranchId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: branchName.trim(),
          city: branchCity.trim() || undefined,
          address: branchAddress.trim() || undefined,
          phone: branchPhone.trim() || undefined,
          googlePlaceId: branchPlaceId.trim() || undefined,
          googleReviewUrl: branchReviewUrl.trim() || undefined,
          assignedManager: branchManager.trim() || undefined,
          chipsJson: kwList.length > 0 ? JSON.stringify(kwList) : null
        })
      });

      await refreshBusinesses?.();
      await refreshHierarchy();
      setBranchSaved(true);
      setTimeout(() => setBranchSaved(false), 3000);
    } catch (err: any) {
      console.error('Branch update error:', err);
      setBranchError(err?.message || 'Failed to update branch outlet.');
    } finally {
      setIsSavingBranch(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Hierarchy & Profile Settings
          </h1>
          <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
            Tri-Level Profile Manager
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage profiles, Google Maps connections, and parameters for your Brand, Business, and Branch outlets.
        </p>

        {/* 3-Tab Segmented Controller */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/90 shadow-2xs w-full sm:w-auto self-start mt-4">
          {!isSingleMode && (
            <button
              type="button"
              onClick={() => setActiveTab('brand')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
                activeTab === 'brand'
                  ? 'bg-white text-indigo-600 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Brand Profile</span>
              {activeBrand?.name && (
                <span className="hidden sm:inline font-normal text-slate-400">({activeBrand.name})</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              activeTab === 'business'
                ? 'bg-white text-indigo-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Business Profile</span>
            {activeBusiness?.name && (
              <span className="hidden sm:inline font-normal text-slate-400">({activeBusiness.name})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branch')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer',
              activeTab === 'branch'
                ? 'bg-white text-indigo-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Branch Outlets ({branches.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: BRAND PROFILE SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'brand' && (
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-600" />
              <span>Parent Brand / Organization Profile</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              The overarching parent brand that groups your businesses, billing plan, and multiple outlets.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {brandError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                ⚠️ {brandError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Brand / Organization Name *
                </Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Upmark Group / Navdeep Group"
                  className="text-xs rounded-xl"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Renaming this will update the top-level Brand name in the header and billing invoices.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Brand Logo Image URL (Optional)
                </Label>
                <Input
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Brand Description / Tagline
              </Label>
              <Input
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                placeholder="e.g. Leading hospitality chain across Western India"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Current Plan Tier: </span>
                <span className="uppercase font-mono font-bold text-indigo-600">{activeBrand?.plan || 'Growth'}</span>
              </div>
              <Link to="/dashboard/billing" className="text-indigo-600 hover:text-indigo-800 font-bold underline">
                Manage Plan & Billing →
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-100 p-5 bg-slate-50/50 rounded-b-2xl">
            {brandSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Brand profile updated successfully!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">Changes reflect in top navigation and reports</span>
            )}

            <Button
              onClick={handleSaveBrand}
              isLoading={isSavingBrand}
              disabled={!brandName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-6 py-2.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Brand Profile</span>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 2: BUSINESS PROFILE SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Keywords Shortcut Card */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/70 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Customer Review Highlights & Keywords</span>
                  <span className="rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5">
                    Branch Dedicated
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage branch-specific highlight chips that customers tap when scanning your QR standee.
                </p>
              </div>
            </div>

            <Link to="/dashboard/keywords" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto"
              >
                <span>Open Keyword Management →</span>
              </Button>
            </Link>
          </div>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Store Profile & Google Maps Link</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Public business parameters printed on standees and mapped to QR redirect routes
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center justify-between">
                  <span>⚠️ {errorMessage}</span>
                  <button onClick={() => setErrorMessage(null)} className="text-red-500 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Google Places Auto-Complete */}
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <Label className="text-xs font-bold text-slate-700">
                  Lookup on Google Maps (India Filtered)
                </Label>
                <GooglePlacesAutocomplete
                  initialValue={name}
                  placeholder="Search your business on Google Maps..."
                  onSelect={(place) => {
                    setName(place.name);
                    if (place.category) {
                      setCategory(place.category);
                    }
                    setGoogleUrl(place.googleReviewUrl);
                    if (place.address) {
                      const parts = place.address.split(',').map((p) => p.trim());
                      if (parts.length >= 3) {
                        setCity(parts[parts.length - 3] || parts[0]);
                      }
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Business / Store Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Upmark / My Clinic"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">
                      Industry / Business Type
                    </Label>
                    {category && (
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Dynamic
                      </span>
                    )}
                  </div>
                  <Input
                    list="settings-category-suggestions"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Electronics store, Dental clinic, Cafe"
                    className="h-9 px-3 text-xs rounded-xl capitalize"
                  />
                  <datalist id="settings-category-suggestions">
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
                    <option value="Coaching & Education" />
                    <option value="Chartered Accountant / Tax" />
                    <option value="Hotel & Lodging" />
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    City / Neighborhood
                  </Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad, Surat, Mumbai"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Official Google Review URL (Direct Review Window)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://g.page/r/... or https://maps.app.goo.gl/..."
                    className="text-xs font-mono rounded-xl"
                  />
                  {googleUrl && (
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="outline"
                        className="gap-1.5 shrink-0 rounded-xl border-slate-200 text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        <span>Test Link</span>
                      </Button>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold pt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Directs customer directly into Google's 5-star rating window</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    AI Default Reply Persona
                  </Label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    <option value="warm_grateful">Warm & Grateful (Hospitality & Dining)</option>
                    <option value="professional">Professional & Formal (Retail & Clinic)</option>
                    <option value="concise">Concise & Direct (Quick Service)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Offline Escalation Contact (Optional)
                  </Label>
                  <Input
                    value={resolutionContact}
                    onChange={(e) => setResolutionContact(e.target.value)}
                    placeholder="Manager WhatsApp or Phone for private resolutions"
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 p-5 bg-slate-50/50 rounded-b-2xl">
              {saved ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Settings saved successfully!</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">All changes update live QR redirects instantly</span>
              )}

              <Button
                onClick={handleSaveBusiness}
                isLoading={isSaving}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-6 py-2.5 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Store Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: BRANCH OUTLETS SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'branch' && (
        <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-600" />
                  <span>Branch Outlets Profile & Google Place ID</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Select and edit specific physical branch locations, place IDs, and custom keywords.
                </CardDescription>
              </div>

              <Link to="/dashboard/branches">
                <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl gap-1.5">
                  <span>Manage All Outlets →</span>
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {branchError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                ⚠️ {branchError}
              </div>
            )}

            {/* Outlet Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Select Outlet to Edit</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranchId(b.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1',
                      selectedBranchId === b.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 truncate">{b.name}</span>
                      {b.isPrimary && (
                        <Badge className="bg-amber-100 text-amber-900 text-[9px] font-bold shrink-0">
                          HQ
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{b.city || b.address || 'Location'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Google Places Lookup for this Branch */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-700">
                Search & Auto-Detect on Google Maps for this Branch
              </Label>
              <GooglePlacesAutocomplete
                placeholder="Search branch on Google Maps (e.g. Upmark Vadodara)..."
                onSelect={(place) => {
                  setBranchName(place.name);
                  setBranchPlaceId(place.placeId);
                  setBranchReviewUrl(place.googleReviewUrl);
                  if (place.address) {
                    setBranchAddress(place.address);
                    const parts = place.address.split(',').map((p) => p.trim());
                    if (parts.length >= 2) {
                      setBranchCity(parts[parts.length - 2]);
                    }
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Branch Name *</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Upmark - Alkapuri Branch"
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">City / Region</Label>
                <Input
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  placeholder="e.g. Vadodara, Ahmedabad"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Full Address</Label>
                <Input
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Shop / Area details"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Branch Phone / Contact</Label>
                <Input
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Google Place ID (Unique to this Outlet)</Label>
                <Input
                  value={branchPlaceId}
                  onChange={(e) => setBranchPlaceId(e.target.value)}
                  placeholder="ChIJ..."
                  className="text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Google Review URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={branchReviewUrl}
                    onChange={(e) => setBranchReviewUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="text-xs font-mono rounded-xl"
                  />
                  {branchReviewUrl && (
                    <a href={branchReviewUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-9 px-2.5 text-xs font-bold shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Assigned Branch Manager</Label>
                <Input
                  value={branchManager}
                  onChange={(e) => setBranchManager(e.target.value)}
                  placeholder="Branch Manager Name"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Branch-Specific Keywords (Comma separated)
                </Label>
                <Input
                  value={branchKeywords}
                  onChange={(e) => setBranchKeywords(e.target.value)}
                  placeholder="e.g. Cold Coffee, Rooftop Dining, Quick Service"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {currentSelectedBranch?.slug && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-700">Dedicated Branch Funnel Link:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">
                    /r/{currentSelectedBranch.slug}
                  </code>
                </div>
                <a
                  href={`/r/${currentSelectedBranch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <span>Test Funnel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-100 p-5 bg-slate-50/50 rounded-b-2xl">
            {branchSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Branch details updated successfully!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">Updates apply to this branch's Standee and QR flow</span>
            )}

            <Button
              onClick={handleSaveBranch}
              isLoading={isSavingBranch}
              disabled={!branchName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-6 py-2.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Branch Profile</span>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
