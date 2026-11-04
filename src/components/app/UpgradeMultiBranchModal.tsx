import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import {
  Building2,
  Store,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { useHierarchy } from '@/context/HierarchyContext';

interface UpgradeMultiBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeMultiBranchModal({ isOpen, onClose }: UpgradeMultiBranchModalProps) {
  const { activeBusiness, upgradeToMultiBranch } = useHierarchy();

  const [brandName, setBrandName] = useState(() => activeBusiness?.name || '');
  const [branchName, setBranchName] = useState('Branch 2');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlaceSelect = (place: GooglePlaceDetails) => {
    setVerifiedPlace(place);
    setGooglePlaceId(place.placeId);
    if (place.name && (!branchName || branchName === 'Branch 2')) setBranchName(place.name);
    if (place.googleReviewUrl) setGoogleReviewUrl(place.googleReviewUrl);
    if (place.address) {
      setAddress(place.address);
      const parts = place.address.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        setCity(parts[parts.length - 2]);
      }
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!branchName.trim()) {
      setError('Please provide a name for your second branch outlet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await upgradeToMultiBranch(brandName.trim() || activeBusiness?.name || 'My Brand', {
        name: branchName.trim(),
        address: address.trim() || verifiedPlace?.address,
        city: city.trim() || 'India',
        phone: phone.trim() || undefined,
        googlePlaceId: googlePlaceId || undefined,
        googleReviewUrl: googleReviewUrl.trim() || undefined
      });

      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1800);
      } else {
        setError('Failed to upgrade. Please check details and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Upgrade failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Store Expansion Wizard</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Expand to Multi-Branch Brand
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Opening your 2nd outlet? Upgrade into a multi-branch brand with consolidated ratings and branch-specific standee QR codes.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Upgraded to Multi-Branch! 🎉</h4>
            <p className="text-xs text-slate-500">
              Your 3-tier hierarchy and new branch standee are now active in the dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpgrade} className="space-y-4">
            {/* Brand / Parent Organization Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Parent Brand / Organization Name
              </Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Ramesh Sweets Group"
                className="rounded-xl border-slate-200 text-xs font-semibold"
                required
              />
              <p className="text-[10px] text-slate-400">
                Your current store will become your Main Branch, and the new outlet will be Branch 2.
              </p>
            </div>

            {/* Second Branch Google Maps Autocomplete */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Search 2nd Branch on Google Maps (Auto-Detect Place ID)
              </Label>
              <GooglePlacesAutocomplete
                onSelect={handlePlaceSelect}
                placeholder="Search second outlet by name or area..."
              />
            </div>

            {/* Second Branch Name & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">2nd Branch Outlet Name *</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Vastrapur Outlet"
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">City / Region</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ahmedabad"
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Direct Google Review URL (Optional) */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">
                Google Review URL (Auto-filled or paste maps link)
              </Label>
              <Input
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/.../review"
                className="rounded-xl border-slate-200 text-xs font-mono text-slate-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Upgrading...</span>
                  </>
                ) : (
                  <>
                    <span>Upgrade & Add Branch 🚀</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
