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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Check
} from 'lucide-react';
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
  const [category, setCategory] = useState('Restaurant');
  const [address, setAddress] = useState('Ahmedabad, Gujarat');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

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
      city: address.split(',')[0]?.trim() || address.trim(),
      googleReviewUrl: googleReviewUrl.trim(),
      brandColor: '#2563EB',
      brandColorSecondary: '#F59E0B'
    };

    try {
      const data = await apiFetch('/api/businesses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data?.business) {
        onSelectBusiness(data.business.id);
      }
      await refreshBusinesses();
      setIsModalOpen(false);
      setName('');
      setGoogleReviewUrl('');
    } catch (err: any) {
      console.warn('API error, saving locally:', err);
      const localBiz: BusinessItem = {
        id: `biz_${Date.now()}`,
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24),
        category: payload.category,
        address: payload.address,
        city: payload.city,
        googleReviewUrl: payload.googleReviewUrl,
        brandColor: payload.brandColor,
        brandColorSecondary: payload.brandColorSecondary
      };
      const updated = [localBiz, ...businesses];
      saveStoredBusinesses(updated);
      saveActiveBusinessId(localBiz.id);
      await refreshBusinesses();
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
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
          onClick={() => setIsModalOpen(true)}
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

      {/* Add Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E131F] shadow-2xl w-full max-w-lg p-6 sm:p-7 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Add Business Details
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your official Google Review link to generate smart QR posters.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold h-10"
                  >
                    <option value="Restaurant">Restaurant / Cafe</option>
                    <option value="Retail">Retail & Supermarket</option>
                    <option value="Healthcare">Clinic / Doctor</option>
                    <option value="Salon">Salon & Spa</option>
                    <option value="Services">Professional Services</option>
                    <option value="Automotive">Auto / Garage</option>
                  </select>
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
                  Tip: Open Google Maps, search your shop, click "Ask for reviews", and copy the link.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
