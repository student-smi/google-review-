import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  Camera,
  Eye,
  Check,
  Plus,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Star
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { BusinessItem } from './DashboardLayout';

export interface MediaAsset {
  id: string;
  businessId: string;
  title: string;
  url: string;
  category: string;
  mimeType: string;
  isRecommended: number;
  createdAt: number;
}

const PRESET_PHOTOS = [
  {
    title: 'Storefront & Entrance',
    category: 'exterior',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Clean Counter & Reception',
    category: 'interior',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Top Product Display / Ambience',
    category: 'products',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'
  }
];

export function MediaLibraryPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('interior');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media for active business
  const fetchMedia = async () => {
    if (!activeBusiness?.id) return;
    setIsLoading(true);
    try {
      const res = await apiFetch<{ media: MediaAsset[] }>(`/api/media/business/${activeBusiness.id}`);
      if (res?.media) {
        setMediaList(res.media);
        // Persist locally for instant customer offline fallback
        localStorage.setItem(`reviewqr_media_${activeBusiness.id}`, JSON.stringify(res.media));
      }
    } catch {
      // Fallback from localStorage
      try {
        const cached = localStorage.getItem(`reviewqr_media_${activeBusiness.id}`);
        if (cached) setMediaList(JSON.parse(cached));
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [activeBusiness?.id]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  // Upload or Add image
  const handleUpload = async () => {
    if (!previewUrl || !uploadTitle.trim() || !activeBusiness?.id) return;
    setIsUploading(true);

    const payload = {
      title: uploadTitle.trim(),
      url: previewUrl,
      category: uploadCategory,
      mimeType: selectedFile?.type || 'image/jpeg',
      isRecommended: 1
    };

    try {
      await apiFetch(`/api/media/business/${activeBusiness.id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSavedMessage('Photo added successfully!');
      setTimeout(() => setSavedMessage(null), 3000);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMedia();
    } catch (err) {
      console.warn('Upload error, saving to local store:', err);
      // Client offline storage
      const localItem: MediaAsset = {
        id: `media_${Date.now()}`,
        businessId: activeBusiness.id,
        title: uploadTitle.trim(),
        url: previewUrl,
        category: uploadCategory,
        mimeType: 'image/jpeg',
        isRecommended: 1,
        createdAt: Math.floor(Date.now() / 1000)
      };
      const updated = [localItem, ...mediaList];
      setMediaList(updated);
      localStorage.setItem(`reviewqr_media_${activeBusiness.id}`, JSON.stringify(updated));
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadTitle('');
    } finally {
      setIsUploading(false);
    }
  };

  // Add starter presets
  const handleAddPresets = async () => {
    if (!activeBusiness?.id) return;
    setIsUploading(true);
    try {
      for (const preset of PRESET_PHOTOS) {
        await apiFetch(`/api/media/business/${activeBusiness.id}`, {
          method: 'POST',
          body: JSON.stringify({
            title: preset.title,
            url: preset.url,
            category: preset.category,
            mimeType: 'image/jpeg',
            isRecommended: 1
          })
        });
      }
      fetchMedia();
    } catch {
      // Local fallback
      const localPresets: MediaAsset[] = PRESET_PHOTOS.map((p, i) => ({
        id: `media_preset_${Date.now()}_${i}`,
        businessId: activeBusiness.id,
        title: p.title,
        url: p.url,
        category: p.category,
        mimeType: 'image/jpeg',
        isRecommended: 1,
        createdAt: Math.floor(Date.now() / 1000)
      }));
      setMediaList(localPresets);
      localStorage.setItem(`reviewqr_media_${activeBusiness.id}`, JSON.stringify(localPresets));
    } finally {
      setIsUploading(false);
    }
  };

  // Delete media
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    try {
      await apiFetch(`/api/media/${id}`, { method: 'DELETE' });
    } catch {}
    const updated = mediaList.filter((m) => m.id !== id);
    setMediaList(updated);
    if (activeBusiness?.id) {
      localStorage.setItem(`reviewqr_media_${activeBusiness.id}`, JSON.stringify(updated));
    }
  };

  // Toggle recommended
  const handleToggle = async (id: string, current: number) => {
    const nextVal = current === 1 ? 0 : 1;
    try {
      await apiFetch(`/api/media/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isRecommended: nextVal === 1 })
      });
    } catch {}
    const updated = mediaList.map((m) => (m.id === id ? { ...m, isRecommended: nextVal } : m));
    setMediaList(updated);
    if (activeBusiness?.id) {
      localStorage.setItem(`reviewqr_media_${activeBusiness.id}`, JSON.stringify(updated));
    }
  };

  const filteredMedia = activeCategoryFilter === 'all'
    ? mediaList
    : mediaList.filter((m) => m.category === activeCategoryFilter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span>Google Maps SEO Booster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Customer Photo Assets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Reviews with photos receive up to <strong>5x more views</strong> on Google Maps. Upload your store ambiance, popular items, and hygiene setup so scanning customers can attach them to their reviews in 1 tap!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm gap-2 cursor-pointer h-11 px-4"
            >
              <Upload className="h-4 w-4" />
              <span>Upload New Photo</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Upload Drawer / Card if File Selected */}
      {previewUrl && (
        <Card className="rounded-3xl border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/10 shadow-lg animate-in fade-in duration-200">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Camera className="h-4 w-4 text-purple-600" />
              <span>Review & Save Photo</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Give your photo a helpful label and category for customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0 shadow-xs relative">
                <img src={previewUrl} alt="Upload preview" className="h-full w-full object-cover" />
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Photo Label / Description</Label>
                  <Input
                    placeholder="e.g. Modern Clinic Reception or Delicious Special Thali"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Category</Label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold h-10"
                    >
                      <option value="interior">Interior & Seating</option>
                      <option value="exterior">Storefront / Entrance</option>
                      <option value="products">Products / Food Items</option>
                      <option value="hygiene">Cleanliness & Hygiene</option>
                      <option value="team">Staff & Team</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleUpload}
                      isLoading={isUploading}
                      className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span>Save Photo</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                      className="h-10 text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Notification */}
      {savedMessage && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'interior', label: 'Interior' },
            { id: 'exterior', label: 'Storefront' },
            { id: 'products', label: 'Products/Menu' },
            { id: 'hygiene', label: 'Hygiene' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeCategoryFilter === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {mediaList.length} photo{mediaList.length === 1 ? '' : 's'} active for <strong>{activeBusiness?.name}</strong>
        </span>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <ImageIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No photos added yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add photos of your shop, dishes, or clinic so your customers can select and upload them when giving Google reviews.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs gap-2 cursor-pointer h-10"
            >
              <Upload className="h-4 w-4" />
              <span>Upload My Photo</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleAddPresets}
              className="text-xs font-semibold rounded-xl h-10 gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Load 3 Sample Store Photos</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredMedia.map((asset) => (
            <Card
              key={asset.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0B101B] shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/60 backdrop-blur-md text-white border-0 text-[10px] uppercase font-bold tracking-wider">
                    {asset.category}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggle(asset.id, asset.isRecommended)}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer backdrop-blur-md transition-colors ${
                      asset.isRecommended === 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-black/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>{asset.isRecommended === 1 ? 'Customer Scan' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {asset.title}
                  </h4>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    title="Delete photo"
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>Included in QR scan</span>
                  </span>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    <span>View full</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
export default MediaLibraryPage;
