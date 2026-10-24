import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  Cloud,
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
  const [googleUrl, setGoogleUrl] = useState(activeBusiness?.googleReviewUrl || '');
  const [phone, setPhone] = useState(activeBusiness?.phone || '');
  const [city, setCity] = useState(activeBusiness?.city || '');
  const [resolutionContact, setResolutionContact] = useState('');
  const [voice, setVoice] = useState(activeBusiness?.brandVoice || 'warm_grateful');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
          category: activeBusiness?.category,
          city: city || activeBusiness?.city,
          address: activeBusiness?.address
        })
      });
      if (data?.success && Array.isArray(data.keywords)) {
        setAiSuggestions(data.keywords);
        setAiStatusMsg(`AI analyzed "${name || 'your store'}" and recommended ${data.keywords.length} review highlights!`);
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

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
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
  }, [activeBusiness]);

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

  const handleSave = async () => {
    if (!activeBusiness?.id) return;
    setIsSaving(true);

    const payload = {
      name: name.trim(),
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

      refreshBusinesses?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Settings save error:', err);
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
      </div>

      {/* KEYWORD CHIPS MANAGER CARD */}
      <Card className="rounded-2xl border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Customer Review Highlights & Keywords</span>
            </CardTitle>
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold">
              {chips.length} Active Keywords
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Customize the highlight points customers tap when they scan your standee. The AI incorporates these exact points to construct realistic 5-star Google reviews.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Active Keywords List */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <span>Current Keywords (Tap ✕ to remove)</span>
            </Label>
            <div className="flex flex-wrap gap-2 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 min-h-[56px] items-center">
              {chips.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs hover:border-red-300 hover:bg-red-50/40 transition-all group cursor-default"
                >
                  <span>{chip}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(idx)}
                    className="text-slate-400 group-hover:text-red-500 hover:scale-110 transition-transform cursor-pointer"
                    title={`Remove "${chip}"`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {chips.length === 0 && (
                <p className="text-xs text-slate-400 italic">No keywords added yet. Add one below or click a category preset.</p>
              )}
            </div>
          </div>

          {/* Add New Keyword Input */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Add New Keyword or Specialty
            </Label>
            <div className="flex gap-2">
              <Input
                value={newChipInput}
                onChange={(e) => setNewChipInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChip();
                  }
                }}
                placeholder="e.g. Soft Kaju Katli, Painless Root Canal, Pure Ghee, Fast Delivery..."
                className="text-xs rounded-xl"
              />
              <Button
                type="button"
                onClick={() => handleAddChip()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-4 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tag</span>
              </Button>
            </div>
          </div>

          {/* AI Smart Keyword Generator (Zero dummy data, 100% tailored to this business) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                  <span>AI Keyword Suggestions for {name || 'Your Business'}</span>
                </Label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  AI analyzes your business name, category ({activeBusiness?.category || 'store'}), and city ({city || 'local area'}) to recommend authentic review highlights.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {aiSuggestions.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllAi}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add All AI Tags</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiKeywords}
                  className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-3.5 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>AI is Analyzing {name || 'Store'}...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5 text-amber-300" />
                      <span>{aiSuggestions.length > 0 ? 'Regenerate AI Keywords' : '✨ AI Suggest Keywords'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {aiStatusMsg && (
              <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>{aiStatusMsg}</span>
              </div>
            )}

            {/* AI Generated Keyword Chips */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Recommended Highlights (Tap + to add to customer screen):
                </span>
                <div className="flex flex-wrap gap-2 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  {aiSuggestions.map((tag) => {
                    const alreadyAdded = chips.some((c) => c.toLowerCase() === tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddChip(tag)}
                        disabled={alreadyAdded}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                          alreadyAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60 cursor-not-allowed shadow-2xs'
                            : 'bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 border border-indigo-200 hover:border-indigo-400 cursor-pointer shadow-xs hover:scale-[1.02]'
                        }`}
                      >
                        {alreadyAdded ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Plus className="h-3 w-3 text-indigo-600" />
                        )}
                        <span>{tag}</span>
                        {alreadyAdded && <span className="text-[9px] text-emerald-600 font-bold uppercase ml-0.5">Added</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live Customer Preview */}
          <div className="pt-3 border-t border-slate-100">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                  <span>Live Customer Mobile Preview (How customers see it on their phone)</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  Instant Preview
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm max-w-md mx-auto space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold text-slate-900">How was your visit today?</h4>
                  <p className="text-[11px] text-slate-500">Tap what stood out or describe below. We will craft 3 authentic review options for you.</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {chips.slice(0, 7).map((chip, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        i === 0
                          ? 'bg-[#2563EB] text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {i === 0 ? `✓ ${chip}` : chip}
                    </span>
                  ))}
                  {chips.length > 7 && (
                    <span className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200">
                      +{chips.length - 7} more
                    </span>
                  )}
                </div>

                {/* Voice button preview */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Add any detail (Optional):</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs">
                    🎙️ બોલીને લખો (Voice)
                  </span>
                </div>

                {/* Generate 3 options button preview */}
                <div className="pt-1">
                  <div className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>૩ રિવ્યૂ વિકલ્પો બનાવો ✨ (Generate 3 Options)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-slate-100 p-5 bg-slate-50/50 rounded-b-2xl">
          {saved ? (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Keywords & settings saved successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">Updates live QR customer view instantly</span>
          )}

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-6 py-2.5 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Keywords & Settings</span>
          </Button>
        </CardFooter>
      </Card>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Business / Store Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Clinic / My Restaurant"
                className="text-xs rounded-xl"
              />
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

      {/* Cloudflare Quota & Tier Card */}
      <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-sky-500" />
              <span>Cloudflare Free-Tier Allocation</span>
            </CardTitle>
            <span className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
              100% Free Forever
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Zero Maintenance Infrastructure</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              D1 SQLite edge database, KV edge caching, Workers AI (Llama 3.1 8B), and client-side vector rendering operate fully within Cloudflare’s free tier limits with zero surprise invoices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
