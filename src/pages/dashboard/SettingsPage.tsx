import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import {
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Save,
  Cloud
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

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setGoogleUrl(activeBusiness.googleReviewUrl || '');
      setPhone(activeBusiness.phone || '');
      setCity(activeBusiness.city || '');
      setVoice(activeBusiness.brandVoice || 'warm_grateful');
    }
  }, [activeBusiness]);

  const handleSave = async () => {
    if (!activeBusiness?.id) return;
    setIsSaving(true);

    const payload = {
      name: name.trim(),
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
      {/* ClickUp 4.0 Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Business & Destination Settings
          </h1>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-bold">
            Places New API
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Configure official Google review links, brand reply persona, and store parameters for <span className="font-bold text-slate-700 dark:text-slate-200">{activeBusiness?.name || 'My Business'}</span>.
        </p>
      </div>

      {/* Main Settings Card */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            <span>Store Profile & Google Maps Link</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Public business parameters printed on standees and mapped to QR redirect routes
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Google Places Auto-Complete */}
          <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                    className="gap-1.5 shrink-0 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span>Test Link</span>
                  </Button>
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Directs customer directly into Google's 5-star rating window</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                AI Default Reply Persona
              </Label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
              >
                <option value="warm_grateful">Warm & Grateful (Hospitality & Dining)</option>
                <option value="professional">Professional & Formal (Retail & Clinic)</option>
                <option value="concise">Concise & Direct (Quick Service)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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

        <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl">
          {saved ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Settings saved successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400">All changes update live QR redirects instantly</span>
          )}

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5 px-5 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Cloudflare Quota & Tier Card */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="h-4 w-4 text-sky-500" />
              <span>Cloudflare Free-Tier Allocation</span>
            </CardTitle>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
              100% Free Forever
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Zero Maintenance Infrastructure</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              D1 SQLite edge database, KV edge caching, Workers AI (Llama 3.1 8B), and client-side vector rendering operate fully within Cloudflare’s free tier limits with zero surprise invoices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
