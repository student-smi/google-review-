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
  Wand2,
  Bot
} from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/google/GooglePlacesAutocomplete';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch, getStoredBusinesses, saveStoredBusinesses } from '@/lib/api';

export function SettingsPage() {
  const { activeBusiness, refreshBusinesses } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    refreshBusinesses?: () => void;
  }>();

  const [name, setName] = useState(activeBusiness?.name || '');
  const [category, setCategory] = useState(activeBusiness?.category || 'services');
  const [googleUrl, setGoogleUrl] = useState(activeBusiness?.googleReviewUrl || '');
  const [phone, setPhone] = useState(activeBusiness?.phone || '');
  const [city, setCity] = useState(activeBusiness?.city || '');
  const [resolutionContact, setResolutionContact] = useState('');
  const [voice, setVoice] = useState(activeBusiness?.brandVoice || 'warm_grateful');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chipsSaved, setChipsSaved] = useState(false);
  const [isSavingChips, setIsSavingChips] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Keywords & Chips State
  const [chips, setChips] = useState<string[]>(() => {
    if (activeBusiness?.chipsJson) {
      try {
        const parsed = JSON.parse(activeBusiness.chipsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      'Delicious & fresh',
      'Fast service',
      'Clean & hygienic',
      'Friendly staff',
      'Great value',
      'Neat packaging',
      'Attentive service'
    ];
  });
  const [newChipInput, setNewChipInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');

  const handleGenerateAiKeywords = async () => {
    setIsGeneratingAi(true);
    setAiStatusMsg('');
    try {
      const data = await apiFetch<{ success: boolean; keywords: string[] }>('/api/ai/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness?.id,
          businessName: name || activeBusiness?.name,
          category: category || activeBusiness?.category || 'services',
          city: city || activeBusiness?.city,
          address: activeBusiness?.address
        })
      });
      if (data?.success && Array.isArray(data.keywords)) {
        setAiSuggestions(data.keywords);
        setAiStatusMsg(`AI analyzed "${name || 'your business'}" (${category || 'business'}) and recommended ${data.keywords.length} review highlights!`);
      } else {
        setAiStatusMsg('Could not fetch AI suggestions.');
      }
    } catch (err) {
      console.warn('AI suggestions error:', err);
      setAiStatusMsg('Failed to generate suggestions.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddAllAi = () => {
    const toAdd = aiSuggestions.filter(
      (k) => !chips.some((c) => c.toLowerCase() === k.toLowerCase())
    );
    setChips((prev) => [...prev, ...toAdd]);
  };

  const activeBizId = activeBusiness?.id;
  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setCategory(activeBusiness.category || 'services');
      setGoogleUrl(activeBusiness.googleReviewUrl || '');
      setPhone(activeBusiness.phone || '');
      setCity(activeBusiness.city || '');
      setVoice(activeBusiness.brandVoice || 'warm_grateful');
      if (activeBusiness.chipsJson) {
        try {
          const parsed = JSON.parse(activeBusiness.chipsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChips(parsed);
          }
        } catch {}
      }
    }
  }, [activeBizId]);

  const handleAddChip = (textToAdd?: string) => {
    const val = (textToAdd || newChipInput).trim();
    if (!val) return;
    if (!chips.some((c) => c.toLowerCase() === val.toLowerCase())) {
      setChips((prev) => [...prev, val]);
    }
    setNewChipInput('');
  };

  const handleRemoveChip = (indexToRemove: number) => {
    setChips((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Dedicated fast save for Keywords & Chips
  const handleSaveKeywordsOnly = async () => {
    if (!activeBusiness?.id) return;
    setIsSavingChips(true);
    setErrorMessage(null);

    const chipsJson = JSON.stringify(chips);

    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}/keywords`, {
        method: 'POST',
        body: JSON.stringify({ chips })
      });

      // Update local storage
      const existing = getStoredBusinesses();
      const updated = existing.map((b) =>
        b.id === activeBusiness.id ? { ...b, chipsJson } : b
      );
      saveStoredBusinesses(updated);

      if (activeBusiness) {
        activeBusiness.chipsJson = chipsJson;
      }

      refreshBusinesses?.();
      setChipsSaved(true);
      setTimeout(() => setChipsSaved(false), 3000);
    } catch (err: any) {
      console.error('Keyword save error:', err);
      setErrorMessage(err?.message || 'Failed to save keywords. Please try again.');
    } finally {
      setIsSavingChips(false);
    }
  };

  const handleSave = async () => {
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
      contactResolutionLine: resolutionContact.trim() || undefined,
      chipsJson: JSON.stringify(chips)
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

      refreshBusinesses?.();
      setSaved(true);
      setChipsSaved(true);
      setTimeout(() => {
        setSaved(false);
        setChipsSaved(false);
      }, 3000);
    } catch (err: any) {
      console.error('Settings save error:', err);
      setErrorMessage(err?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Business & Review Settings
          </h1>
          <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
            Places Live Sync
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure official Google review links, custom review keywords, and parameters for <span className="font-bold text-slate-800">{activeBusiness?.name || 'My Business'}</span>.
        </p>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center justify-between shadow-xs mt-3">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KEYWORDS SHORTCUT CARD */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/70 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Customer Review Highlights & Keywords</span>
              <span className="rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5">
                New Dedicated Tab
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the service & product keywords customers tap on their mobile when scanning your QR standee.
            </p>
          </div>
        </div>

        <Link to="/dashboard/keywords">
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Open Keyword Management →</span>
          </Button>
        </Link>
      </div>

      {/* Main Settings Card */}
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
              <Label className="text-xs font-bold text-slate-700">
                Industry / Business Type
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="services">🚀 Digital Marketing & Agency</option>
                <option value="restaurant">☕ Restaurant, Cafe & Food</option>
                <option value="sweets">🍰 Sweets, Bakery & Dairy</option>
                <option value="healthcare">🩺 Clinic & Dental</option>
                <option value="salon">💇 Salon, Spa & Beauty</option>
                <option value="retail">💎 Jewellery & Fashion</option>
                <option value="fitness">🏋️ Gym & Fitness</option>
                <option value="automobile">🚗 Auto Garage & Service</option>
                <option value="education">📚 Coaching & Education</option>
                <option value="legal">⚖️ CA, Tax & Legal</option>
              </select>
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
            onClick={handleSave}
            isLoading={isSaving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-6 py-2.5 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Store Settings</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
