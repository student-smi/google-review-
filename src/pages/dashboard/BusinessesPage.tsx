import { useState, useMemo } from 'react';
import { useOutletContext, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Star,
  Search,
  Archive,
  ArchiveRestore,
  Edit2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  HelpCircle,
  X,
  Layers,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Crown
} from 'lucide-react';
import { GooglePlacesAutocomplete, type GooglePlaceDetails } from '@/components/google/GooglePlacesAutocomplete';
import { apiFetch, saveStoredBusinesses, saveActiveBusinessId } from '@/lib/api';
import { useHierarchy } from '@/context/HierarchyContext';
import type { BusinessItem, LocationItem } from './DashboardLayout';

const CATEGORY_OPTIONS = [
  { value: 'restaurants', label: 'Restaurants & Cafes' },
  { value: 'retail', label: 'Retail & Sweets' },
  { value: 'clinics', label: 'Clinics & Healthcare' },
  { value: 'salons', label: 'Salons & Spas' },
  { value: 'services', label: 'Professional Services' },
  { value: 'automotive', label: 'Auto & Repair' },
  { value: 'other', label: 'Other Business' }
];

export function BusinessesPage() {
  const { activeBusiness, businesses, refreshBusinesses, onSelectBusiness } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    businesses: BusinessItem[];
    refreshBusinesses: () => Promise<void>;
    onSelectBusiness: (id: string) => void;
  }>();

  const { refreshHierarchy, roles, activeBranch } = useHierarchy();

  // Guard: Executive cannot manage entities / other branches
  if (roles.isExecutive) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          You are signed in as an Executive for <strong className="text-slate-800">{activeBranch?.name || 'your assigned branch'}</strong>. Multi-outlet and entity setup is restricted to organization owners.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">
          Return to Branch Dashboard
        </Button>
      </div>
    );
  }
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'main_branch' | 'sub_branch' | 'active' | 'connection_error' | 'archived'>('all');

  // Business Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('restaurants');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [assignedManager, setAssignedManager] = useState('');
  const [contactResolutionLine, setContactResolutionLine] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'connection_error'>('active');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [verifiedPlace, setVerifiedPlace] = useState<GooglePlaceDetails | null>(null);
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-location Drawer / Modal State
  const [locationModalBiz, setLocationModalBiz] = useState<BusinessItem | null>(null);
  const [bizLocations, setBizLocations] = useState<LocationItem[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocPlaceId, setNewLocPlaceId] = useState('');
  const [newLocReviewUrl, setNewLocReviewUrl] = useState('');
  const [newLocManager, setNewLocManager] = useState('');
  const [newLocKeywords, setNewLocKeywords] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isBranchesView = location.pathname.includes('/branches');

  // Open Create Business Modal
  const handleOpenCreateModal = () => {
    setEditingBizId(null);
    setName('');
    setCategory('restaurants');
    setAddress('');
    setCity('');
    setPhone('');
    setContactEmail('');
    setAssignedManager('');
    setContactResolutionLine('');
    setStatus('active');
    setGoogleReviewUrl('');
    setGooglePlaceId(null);
    setVerifiedPlace(null);
    setBrandColor('#2563EB');
    setError(null);
    setIsModalOpen(true);
  };

  // Open Add Branch Modal directly
  const handleOpenAddBranch = () => {
    const target = activeBusiness || businesses[0];
    if (target) {
      handleOpenLocationsModal(target);
    } else {
      handleOpenCreateModal();
    }
  };

  // Open Edit Business Modal
  const handleOpenEditModal = (biz: BusinessItem) => {
    setEditingBizId(biz.id);
    setName(biz.name || '');
    setCategory(biz.category || 'restaurants');
    setAddress(biz.address || '');
    setCity(biz.city || '');
    setPhone(biz.phone || '');
    setContactEmail(biz.contactEmail || '');
    setAssignedManager(biz.assignedManager || '');
    setContactResolutionLine((biz as any).contactResolutionLine || '');
    setStatus(biz.status || 'active');
    setGoogleReviewUrl(biz.googleReviewUrl || '');
    setGooglePlaceId(biz.googlePlaceId || null);
    setVerifiedPlace(null);
    setBrandColor(biz.brandColor || '#2563EB');
    setError(null);
    setIsModalOpen(true);
  };

  // Validate Google review link format
  const isValidGoogleUrl = Boolean(
    googleReviewUrl.trim().length > 8 &&
    (googleReviewUrl.includes('google.com') ||
      googleReviewUrl.includes('g.page') ||
      googleReviewUrl.includes('maps.app.goo.gl') ||
      googleReviewUrl.includes('search.google.com'))
  );

  // Submit Business (Create or Edit)
  const handleSaveBusiness = async (e: React.FormEvent) => {
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
      phone: phone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      assignedManager: assignedManager.trim() || undefined,
      contactResolutionLine: contactResolutionLine.trim() || undefined,
      status,
      googlePlaceId: googlePlaceId || undefined,
      googleReviewUrl: googleReviewUrl.trim(),
      brandColor,
      brandColorSecondary: '#F59E0B'
    };

    try {
      if (editingBizId) {
        // Edit existing business
        await apiFetch(`/api/businesses/${editingBizId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        // Create new business
        const data = await apiFetch<{ business: any }>('/api/businesses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (data?.business) {
          onSelectBusiness(data.business.id);
        }
      }
      await refreshBusinesses();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save business');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archive / Unarchive Business
  const handleToggleArchive = async (biz: BusinessItem) => {
    const isCurrentlyArchived = Boolean(biz.isArchived);
    const actionLabel = isCurrentlyArchived ? 'unarchive and activate' : 'archive';
    if (!confirm(`Are you sure you want to ${actionLabel} "${biz.name}"?`)) return;

    try {
      const endpoint = isCurrentlyArchived ? `/api/businesses/${biz.id}/unarchive` : `/api/businesses/${biz.id}/archive`;
      await apiFetch(endpoint, { method: 'POST' });
      await refreshBusinesses();
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Server error'}`);
    }
  };

  // Set Business as Main Branch (Head Office / Flagship)
  const handleSetPrimaryBusiness = async (biz: BusinessItem) => {
    if (!confirm(`Set "${biz.name}" as your Main Branch (Head Office)? Other locations will report as sub-branches.`)) return;
    try {
      await apiFetch(`/api/businesses/${biz.id}/set-primary`, { method: 'POST' });
      await refreshBusinesses();
    } catch (err: any) {
      alert('Failed to set Main Branch: ' + (err.message || 'Server error'));
    }
  };

  // Set Location as Primary within a business
  const handleSetPrimaryLocation = async (locId: string) => {
    if (!locationModalBiz) return;
    try {
      await apiFetch(`/api/businesses/${locationModalBiz.id}/locations/${locId}/set-primary`, { method: 'POST' });
      const res = await apiFetch<{ success: boolean; locations: LocationItem[] }>(`/api/businesses/${locationModalBiz.id}/locations`);
      if (res?.locations) setBizLocations(res.locations);
      await refreshBusinesses();
    } catch (err: any) {
      alert('Failed to set primary branch location: ' + (err.message || 'Server error'));
    }
  };

  // Manage Locations for a Business
  const handleOpenLocationsModal = async (biz: BusinessItem) => {
    setLocationModalBiz(biz);
    setEditingLocationId(null);
    setIsLoadingLocations(true);
    setNewLocName('');
    setNewLocAddress('');
    setNewLocCity('');
    setNewLocPhone('');
    setNewLocPlaceId('');
    setNewLocReviewUrl('');
    setNewLocManager('');
    setNewLocKeywords('');
    try {
      const res = await apiFetch<{ success: boolean; locations: LocationItem[] }>(`/api/businesses/${biz.id}/locations`);
      if (res?.locations) {
        setBizLocations(res.locations);
      }
    } catch (err) {
      console.warn('Failed to load locations:', err);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Start editing an existing location
  const handleStartEditLocation = (loc: LocationItem) => {
    setEditingLocationId(loc.id);
    setNewLocName(loc.name);
    setNewLocAddress(loc.address || '');
    setNewLocCity(loc.city || '');
    setNewLocPhone(loc.phone || '');
    setNewLocPlaceId(loc.googlePlaceId || '');
    setNewLocReviewUrl(loc.googleReviewUrl || '');
    setNewLocManager(loc.assignedManager || '');
    try {
      const kw = loc.chipsJson ? JSON.parse(loc.chipsJson) : [];
      setNewLocKeywords(Array.isArray(kw) ? kw.join(', ') : (loc.chipsJson || ''));
    } catch {
      setNewLocKeywords(loc.chipsJson || '');
    }
  };

  // Add or update location to business
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationModalBiz || !newLocName.trim()) return;

    setIsAddingLocation(true);
    try {
      const keywordList = newLocKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      if (editingLocationId) {
        // UPDATE EXISTING LOCATION
        const res = await apiFetch<{ success: boolean; location: LocationItem }>(
          `/api/businesses/${locationModalBiz.id}/locations/${editingLocationId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              name: newLocName.trim(),
              address: newLocAddress.trim() || undefined,
              city: newLocCity.trim() || undefined,
              phone: newLocPhone.trim() || undefined,
              googlePlaceId: newLocPlaceId.trim() || undefined,
              googleReviewUrl: newLocReviewUrl.trim() || locationModalBiz.googleReviewUrl,
              assignedManager: newLocManager.trim() || undefined,
              chipsJson: keywordList.length > 0 ? JSON.stringify(keywordList) : null,
              status: 'active'
            })
          }
        );
        if (res?.location) {
          setBizLocations((prev) => prev.map((l) => (l.id === editingLocationId ? res.location : l)));
        }
      } else {
        // CREATE NEW LOCATION
        const res = await apiFetch<{ success: boolean; location: LocationItem }>(
          `/api/businesses/${locationModalBiz.id}/locations`,
          {
            method: 'POST',
            body: JSON.stringify({
              name: newLocName.trim(),
              address: newLocAddress.trim() || undefined,
              city: newLocCity.trim() || undefined,
              phone: newLocPhone.trim() || undefined,
              googlePlaceId: newLocPlaceId.trim() || undefined,
              googleReviewUrl: newLocReviewUrl.trim() || locationModalBiz.googleReviewUrl,
              assignedManager: newLocManager.trim() || undefined,
              chipsJson: keywordList.length > 0 ? JSON.stringify(keywordList) : null,
              status: 'active'
            })
          }
        );
        if (res?.location) {
          setBizLocations((prev) => [res.location, ...prev]);
        }
      }

      // Reset form fields
      setNewLocName('');
      setNewLocAddress('');
      setNewLocCity('');
      setNewLocPhone('');
      setNewLocPlaceId('');
      setNewLocReviewUrl('');
      setNewLocManager('');
      setNewLocKeywords('');
      setEditingLocationId(null);

      // AUTO-CLOSE MODAL WINDOW (Problem 3 resolved!)
      setLocationModalBiz(null);

      await refreshBusinesses();
      if (refreshHierarchy) {
        await refreshHierarchy();
      }
    } catch (err: any) {
      alert('Failed to save location: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAddingLocation(false);
    }
  };

  // Delete a location
  const handleDeleteLocation = async (locId: string) => {
    if (!locationModalBiz || !confirm('Delete this Google location outlet?')) return;
    try {
      await apiFetch(`/api/businesses/${locationModalBiz.id}/locations/${locId}`, { method: 'DELETE' });
      setBizLocations((prev) => prev.filter((l) => l.id !== locId));
      await refreshBusinesses();
    } catch (err: any) {
      alert('Failed to delete location: ' + err.message);
    }
  };

  // Identify Primary Main Branch
  const primaryBiz = useMemo(() => {
    return businesses.find((b) => b.isPrimary) || (businesses.length > 0 ? businesses[businesses.length - 1] : null);
  }, [businesses]);

  const mainCount = useMemo(() => {
    return businesses.filter((b) => b.isPrimary || (primaryBiz && b.id === primaryBiz.id)).length;
  }, [businesses, primaryBiz]);

  const subCount = Math.max(0, businesses.length - mainCount);

  // Filter & Search Logic
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        biz.name.toLowerCase().includes(q) ||
        biz.city?.toLowerCase().includes(q) ||
        biz.address?.toLowerCase().includes(q) ||
        biz.category?.toLowerCase().includes(q) ||
        biz.assignedManager?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isMain = Boolean(biz.isPrimary || (primaryBiz && biz.id === primaryBiz.id));
      if (statusFilter === 'main_branch') return isMain;
      if (statusFilter === 'sub_branch') return !isMain;
      if (statusFilter === 'active') return !biz.isArchived && biz.status !== 'connection_error';
      if (statusFilter === 'connection_error') return biz.status === 'connection_error';
      if (statusFilter === 'archived') return biz.isArchived;
      return true;
    });
  }, [businesses, searchQuery, statusFilter, primaryBiz]);

  // Aggregate KPI metrics
  const activeCount = businesses.filter((b) => !b.isArchived && b.status !== 'connection_error').length;
  const errorCount = businesses.filter((b) => b.status === 'connection_error').length;
  const archivedCount = businesses.filter((b) => b.isArchived).length;
  const totalLocationsCount = businesses.reduce((acc, b) => acc + (b.locations?.length || 1), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
            {isBranchesView ? (
              <>
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Branch & Outlet Network</span>
              </>
            ) : (
              <>
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Business & Location Manager</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isBranchesView ? 'All Branches & Outlets' : 'Businesses & Google Locations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isBranchesView
              ? 'Manage all branch outlets, head office, Place IDs, dedicated standee QR codes & local keywords.'
              : 'Store business profiles, contact info, assigned manager, multiple Google locations & sync health status.'}
          </p>
        </div>

        <Button
          onClick={isBranchesView ? handleOpenAddBranch : handleOpenCreateModal}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-sm gap-2 h-11 px-4 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isBranchesView ? 'Add New Branch' : 'Add New Business'}</span>
        </Button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Businesses
              </span>
              <p className="text-2xl font-black text-slate-900">{businesses.length}</p>
              <span className="text-[11px] text-slate-400">Stores & client brands</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Google Locations
              </span>
              <p className="text-2xl font-black text-indigo-600">{totalLocationsCount}</p>
              <span className="text-[11px] text-slate-400">Branches & outlets</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active & Healthy
              </span>
              <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
              <span className="text-[11px] text-emerald-600 font-medium">🟢 Connected & live</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Attention Needed
              </span>
              <p className="text-2xl font-black text-rose-600">{errorCount}</p>
              <span className="text-[11px] text-rose-500 font-medium">
                {errorCount === 0 ? '✓ All links healthy' : 'Connection error'}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search Bar & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business by name, city, category, or manager..."
            className="pl-9 h-10 text-xs sm:text-sm border-slate-200 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {(
            [
              { id: 'all', label: `All (${businesses.length})` },
              { id: 'main_branch', label: `👑 Main Branch (${mainCount})` },
              { id: 'sub_branch', label: `🏪 Sub-Branches (${subCount})` },
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'connection_error', label: `Connection Alert (${errorCount})` },
              { id: 'archived', label: `Archived (${archivedCount})` }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBusinesses.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No businesses found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No business matches your current search or filter criteria. Try adjusting your query or add a new business profile.
            </p>
          </div>
        ) : (
          filteredBusinesses.map((biz) => {
            const isMainBranch = Boolean(biz.isPrimary || (primaryBiz && biz.id === primaryBiz.id));
            const isActiveWorkspace = biz.id === activeBusiness?.id;
            const isConnectionError = biz.status === 'connection_error';
            const isArchived = Boolean(biz.isArchived);
            const locCount = biz.locations?.length || 1;

            return (
              <Card
                key={biz.id}
                className={`rounded-3xl border transition-all p-5 space-y-4 ${
                  isMainBranch
                    ? 'border-amber-300 ring-2 ring-amber-400/25 bg-linear-to-br from-amber-50/20 via-white to-white shadow-xs'
                    : isActiveWorkspace
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
                    : isArchived
                    ? 'border-slate-200 bg-slate-50/60 opacity-75'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header: Brand Icon, Name, Category & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 ${
                        isMainBranch
                          ? 'bg-linear-to-br from-amber-500 to-amber-600 text-white ring-2 ring-amber-400/40'
                          : 'text-white'
                      }`}
                      style={{ backgroundColor: !isMainBranch ? biz.brandColor || '#2563EB' : undefined }}
                    >
                      {isMainBranch ? <Crown className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 tracking-tight">
                          {biz.name}
                        </h3>

                        {/* Distinct Main Branch vs Sub-Branch Badges */}
                        {isMainBranch ? (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] flex items-center gap-1 shadow-2xs">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                            <span>👑 Main Branch (HQ)</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border border-slate-300/80 font-bold text-[10px] flex items-center gap-1">
                            <Store className="w-3 h-3 text-slate-500" />
                            <span>🏪 Sub-Branch Outlet</span>
                          </Badge>
                        )}

                        {isActiveWorkspace && (
                          <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider">
                            Active Workspace
                          </Badge>
                        )}
                        {isArchived ? (
                          <Badge className="bg-slate-200 text-slate-700 text-[10px] font-bold">
                            Archived
                          </Badge>
                        ) : isConnectionError ? (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Connection Alert
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
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

                      {!isMainBranch && primaryBiz && (
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-1">
                          <span className="text-slate-400">↳ Linked Outlet of:</span>
                          <span className="text-amber-800 font-bold">{primaryBiz.name} (Main HQ)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isActiveWorkspace && !isArchived && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectBusiness(biz.id)}
                      className="text-xs font-semibold rounded-xl h-8 cursor-pointer shrink-0"
                    >
                      Switch
                    </Button>
                  )}
                </div>

                {/* Details Bar: Contact, Assigned Manager & Locations Count */}
                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Manager: <strong className="text-slate-800">{biz.assignedManager || 'Unassigned'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {biz.phone || biz.contactEmail || 'No contact set'}
                    </span>
                  </div>
                </div>

                {/* Google Locations & Review Link Box */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Layers className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{locCount} Google Location{locCount > 1 ? 's' : ''}</span>
                    </span>
                    <button
                      onClick={() => handleOpenLocationsModal(biz)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Manage Locations</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="truncate max-w-[240px]">
                      Place ID: <code className="font-mono text-indigo-700 bg-indigo-50/80 px-1 py-0.5 rounded">{biz.googlePlaceId || 'Not connected'}</code>
                    </span>
                    <a
                      href={biz.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-semibold shrink-0"
                    >
                      <span>Test Review Link</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(biz)}
                      className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 font-semibold gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-400" />
                      <span>Edit</span>
                    </Button>

                    {!isMainBranch && !isArchived && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimaryBusiness(biz)}
                        className="h-8 px-2.5 text-xs text-amber-800 border-amber-300/80 bg-amber-50 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                        title="Promote this store to Main Branch (Head Office)"
                      >
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Set as Main</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleArchive(biz)}
                      className="h-8 px-2.5 text-xs text-slate-600 hover:text-amber-700 font-semibold gap-1 cursor-pointer"
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="w-3 h-3 text-emerald-600" />
                          <span>Unarchive</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3 h-3 text-amber-500" />
                          <span>Archive</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <Link
                    to="/dashboard/replies"
                    onClick={() => onSelectBusiness(biz.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Reviews</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. Add / Edit Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingBizId ? 'Edit Business Profile' : 'Add New Business & Location'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure business identity, category, contact & Google Places</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveBusiness} className="space-y-4">
                {/* 1. Google Places Autocomplete */}
                {!editingBizId && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                    <Label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      <span>Search on Google Maps (Auto-fill details):</span>
                    </Label>
                    <GooglePlacesAutocomplete
                      onSelect={(place) => {
                        setVerifiedPlace(place);
                        setName(place.name);
                        setAddress(place.address);
                        if (place.placeId) setGooglePlaceId(place.placeId);
                        if (place.googleReviewUrl) setGoogleReviewUrl(place.googleReviewUrl);
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Business Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Royal Sweets & Bakery"
                      required
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Industry Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Google Review URL */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Official Google Review Link *</Label>
                    <span className="text-[10px] text-slate-400">Maps or g.page link</span>
                  </div>
                  <Input
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/.../review or search.google.com/local/writereview..."
                    required
                    className="text-xs h-9 font-mono"
                  />
                </div>

                {/* Address & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Address</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Area, Landmark"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Ahmedabad, Surat"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Contact Phone & Contact Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Contact Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Contact Email</Label>
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@business.com"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Assigned Manager & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Assigned Manager / Executive</Label>
                    <Input
                      value={assignedManager}
                      onChange={(e) => setAssignedManager(e.target.value)}
                      placeholder="e.g. Rajesh Shah / Store Head"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Connection Status</Label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">🟢 Active (Verified & Connected)</option>
                      <option value="inactive">🟡 Inactive (Paused)</option>
                      <option value="connection_error">🔴 Connection Error (Attention Needed)</option>
                    </select>
                  </div>
                </div>

                {/* Brand Color */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Brand Color Accent</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-200"
                    />
                    <span className="text-xs font-mono text-slate-600">{brandColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    {isSubmitting ? 'Saving...' : editingBizId ? 'Save Changes' : 'Create Business'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Multi-Location Manager Drawer / Modal */}
      {locationModalBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Google Locations for {locationModalBiz.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Manage all verified branch outlets, Place IDs, and assigned local managers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLocationModalBiz(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form to Add New Branch Location */}
              <form onSubmit={handleAddLocation} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                  <div className="flex items-center gap-1.5">
                    {editingLocationId ? <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{editingLocationId ? 'Edit Branch / Outlet Location' : 'Add Branch / Outlet Location'}</span>
                  </div>
                  {editingLocationId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLocationId(null);
                        setNewLocName('');
                        setNewLocAddress('');
                        setNewLocCity('');
                        setNewLocPhone('');
                        setNewLocPlaceId('');
                        setNewLocReviewUrl('');
                        setNewLocManager('');
                        setNewLocKeywords('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-normal cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Google Places Autocomplete */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Search Branch on Google Maps (Auto-Detect Place ID)</Label>
                  <GooglePlacesAutocomplete
                    placeholder="Search branch outlet on Google Maps (e.g. Upmark Vadodara)..."
                    onSelect={(place) => {
                      if (!newLocName) setNewLocName(place.name);
                      setNewLocPlaceId(place.placeId);
                      setNewLocReviewUrl(place.googleReviewUrl);
                      if (place.address) {
                        setNewLocAddress(place.address);
                        const parts = place.address.split(',').map((p) => p.trim());
                        if (parts.length >= 2) {
                          setNewLocCity(parts[parts.length - 2]);
                        }
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="Location Name (e.g. Navrangpura Branch) *"
                    required
                    className="text-xs h-8 bg-white"
                  />
                  <Input
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    placeholder="Address / Area"
                    className="text-xs h-8 bg-white"
                  />
                  <Input
                    value={newLocCity}
                    onChange={(e) => setNewLocCity(e.target.value)}
                    placeholder="City (e.g. Vadodara, Ahmedabad)"
                    className="text-xs h-8 bg-white"
                  />
                  <Input
                    value={newLocPhone}
                    onChange={(e) => setNewLocPhone(e.target.value)}
                    placeholder="Branch Phone"
                    className="text-xs h-8 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    value={newLocPlaceId}
                    onChange={(e) => setNewLocPlaceId(e.target.value)}
                    placeholder="Google Place ID (auto-filled or paste)"
                    className="text-xs h-8 bg-white font-mono"
                  />
                  <Input
                    value={newLocReviewUrl}
                    onChange={(e) => setNewLocReviewUrl(e.target.value)}
                    placeholder="Specific Review Link (defaults to main)"
                    className="text-xs h-8 bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    value={newLocManager}
                    onChange={(e) => setNewLocManager(e.target.value)}
                    placeholder="Assigned Branch Manager"
                    className="text-xs h-8 bg-white"
                  />
                  <Input
                    value={newLocKeywords}
                    onChange={(e) => setNewLocKeywords(e.target.value)}
                    placeholder="Branch Keywords (e.g. Vadodara cafe, great vibe)"
                    className="text-xs h-8 bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isAddingLocation || !newLocName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 cursor-pointer"
                  >
                    {isAddingLocation
                      ? (editingLocationId ? 'Updating Branch...' : 'Adding Location...')
                      : (editingLocationId ? 'Update & Close' : 'Save Branch Location')}
                  </Button>
                </div>
              </form>

              {/* Locations List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Registered Locations ({bizLocations.length})</span>
                </div>

                {isLoadingLocations ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading location outlets...</span>
                  </div>
                ) : bizLocations.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No separate branch locations added yet. All reviews route to the primary business Google Maps listing.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                    {bizLocations.map((loc) => (
                      <div key={loc.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{loc.name}</span>
                            {loc.isPrimary ? (
                              <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold flex items-center gap-1 shadow-2xs">
                                <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                <span>Main Branch (HQ)</span>
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-slate-100 text-slate-700 text-[9px] font-bold">
                                  Sub-Outlet
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryLocation(loc.id)}
                                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                                >
                                  Set as Main
                                </button>
                              </div>
                            )}
                            <Badge
                              className={`text-[9px] font-bold ${
                                loc.status === 'connection_error'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {loc.status || 'active'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 flex-wrap">
                            {loc.address && <span>{loc.address}</span>}
                            {loc.city && <span className="font-semibold text-slate-700">({loc.city})</span>}
                            {loc.googlePlaceId && (
                              <span className="font-mono text-[10px] text-slate-400">ID: {loc.googlePlaceId.slice(0, 14)}...</span>
                            )}
                            {loc.assignedManager && (
                              <span>• Manager: <strong>{loc.assignedManager}</strong></span>
                            )}
                            <a
                              href={`/r/${loc.slug || loc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                            >
                              <span>Branch QR Funnel</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditLocation(loc)}
                            className="h-7 px-2 text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="Edit this branch location"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-500" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          {!loc.isPrimary && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLocation(loc.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setLocationModalBiz(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
