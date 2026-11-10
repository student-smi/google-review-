import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  Search,
  Plus,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Menu,
  RefreshCw,
  QrCode,
  Layers,
  LogOut,
  CheckCircle2,
  Network,
  Building2,
  Store,
  StoreIcon,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { HeaderQrModal } from './HeaderQrModal';
import { HeaderStandeeModal } from './HeaderStandeeModal';
import { UpgradeMultiBranchModal } from './UpgradeMultiBranchModal';
import {
  fetchGmbStatus,
  connectGmb,
  disconnectGmb,
  syncGmbAll,
  requestFreshGoogleToken,
  type GmbStatus
} from '@/lib/gmb';
import { cn } from '@/lib/utils';
import { useHierarchy } from '@/context/HierarchyContext';

interface HeaderProps {
  onOpenCommand: () => void;
  onToggleMobileMenu?: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Live Overview',
  '/dashboard/businesses': 'Business Profiles',
  '/dashboard/branches': 'Branch Locations',
  '/dashboard/qr': 'QR Studio & Standees',
  '/dashboard/replies': 'Reviews & Replies',
  '/dashboard/ai-replies': 'AI Reply Center',
  '/dashboard/team': 'Team & Permissions',
  '/dashboard/billing': 'Package & Billing',
  '/dashboard/keywords': 'Keyword Management',
  '/dashboard/analytics': 'Conversion Analytics',
  '/dashboard/local-seo': 'Local SEO Checklist',
  '/dashboard/settings': 'Profile Settings'
};

export function Header({
  onOpenCommand,
  onToggleMobileMenu
}: HeaderProps) {
  const {
    currentLevel,
    setLevel,
    activeBrand,
    activeBusiness,
    activeBranch,
    brands,
    businesses,
    branches,
    selectBrand,
    selectBusiness,
    selectBranch,
    isSingleMode,
    roles
  } = useHierarchy();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gmbMenuOpen, setGmbMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);

  const [gmbStatus, setGmbStatus] = useState<GmbStatus>({ isConnected: false });
  const [isConnectingGmb, setIsConnectingGmb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const currentSection = pageTitles[location.pathname] || 'Workspace';

  // Load GMB connection status for active business
  const loadStatus = useCallback(async () => {
    if (!activeBusiness?.id) return;
    const st = await fetchGmbStatus(activeBusiness.id);
    setGmbStatus(st);
  }, [activeBusiness?.id]);

  useEffect(() => {
    loadStatus();
    const handleStatusChanged = () => loadStatus();
    window.addEventListener('gmb-status-changed', handleStatusChanged);
    return () => {
      window.removeEventListener('gmb-status-changed', handleStatusChanged);
    };
  }, [loadStatus]);

  // 1. Connect GMB
  const handleConnectGmb = async () => {
    if (!activeBusiness?.id) return;
    setIsConnectingGmb(true);
    try {
      const token = await requestFreshGoogleToken('consent');
      if (token) {
        await connectGmb(activeBusiness.id, token);
        await loadStatus();
        await syncGmbAll(activeBusiness.id, { directToken: token });
        setSyncFeedback('Connected & Synced!');
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err: any) {
      if (err?.message !== 'business.manage permission not granted') {
        alert('Google Business Connect notice: ' + (err?.message || 'Failed to connect'));
      }
    } finally {
      setIsConnectingGmb(false);
    }
  };

  // 2. Disconnect GMB
  const handleDisconnectGmb = async () => {
    if (!activeBusiness?.id) return;
    if (!confirm('Are you sure you want to disconnect Google Business Profile?')) return;
    try {
      await disconnectGmb(activeBusiness.id);
      setGmbStatus({ isConnected: false });
      setGmbMenuOpen(false);
    } catch (err) {
      console.error('Failed to disconnect GMB:', err);
    }
  };

  // 3. Sync Google Places & Reviews
  const handleSyncHeader = async () => {
    if (!activeBusiness?.id) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await syncGmbAll(activeBusiness.id, {
        isConnected: gmbStatus.isConnected,
        isExpired: gmbStatus.isExpired
      });
      setSyncFeedback('Synced!');
      setTimeout(() => setSyncFeedback(null), 2500);
    } catch (err: any) {
      console.error('Sync failed:', err);
      alert('Sync note: ' + (err?.message || 'Could not sync from Google'));
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Open Customer Review Funnel Preview
  const handleOpenPreview = () => {
    // If on Branch level or activeBranch has a dedicated slug, route to branch funnel!
    const targetSlug =
      currentLevel === 'branch' && activeBranch?.slug
        ? activeBranch.slug
        : activeBranch?.slug || activeBusiness?.slug || activeBusiness?.id;

    if (!targetSlug) return;
    const path = `/r/${targetSlug}`;
    window.open(path, '_blank');
  };

  // Current entity name and icon based on active level
  const activeEntityLabel =
    currentLevel === 'brand'
      ? activeBrand?.name || 'All Organizations'
      : currentLevel === 'business'
      ? activeBusiness?.name || 'Selected Business'
      : activeBranch?.name || activeBusiness?.name || 'Selected Branch';

  const activeEntityIcon =
    currentLevel === 'brand'
      ? Network
      : currentLevel === 'business'
      ? Building2
      : Store;

  return (
    <>
      <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200/80 bg-white px-2.5 sm:px-4 lg:px-6 z-20 shrink-0 gap-2">
        {/* Left: Hamburger, 3-Tier Switcher, Entity Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Mobile Hamburger Button */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 shadow-2xs cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          {/* Single Store vs Multi-Branch Header Navigation */}
          {isSingleMode ? (
            /* Single Store Header: Clean Store Name & 1-Click Expansion */
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs min-w-0">
                <Store className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-xs font-black text-slate-800 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-[220px]">
                  {activeBusiness?.name || 'My Store'}
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Single Store
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                title="Opening a second store? Upgrade to multi-branch."
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add 2nd Branch</span>
              </button>
            </div>
          ) : roles.isExecutive ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-200/80 shadow-2xs shrink-0">
              <Store className="h-4 w-4 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 font-mono">Assigned Branch Outlet</span>
                <span className="text-xs font-black text-slate-900 truncate max-w-[160px] sm:max-w-xs">
                  {activeBranch?.name || activeBusiness?.name || 'Branch Outlet'}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* 3-Level Segmented Switcher (Image 2, 3, 4) */}
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/90 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setLevel('brand')}
                  className={cn(
                    'px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                    currentLevel === 'brand'
                      ? 'bg-white text-blue-600 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Brand
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('business')}
                  className={cn(
                    'px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                    currentLevel === 'business'
                      ? 'bg-white text-blue-600 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Business
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('branch')}
                  className={cn(
                    'px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                    currentLevel === 'branch'
                      ? 'bg-white text-blue-600 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Branch
                </button>
              </div>

          {/* Context Entity Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-blue-300 hover:bg-slate-100 transition-all cursor-pointer shadow-xs max-w-[130px] xs:max-w-[170px] sm:max-w-[210px] md:max-w-xs"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase shrink-0">
                {activeEntityLabel.charAt(0)}
              </div>
              <span className="truncate">{activeEntityLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5 shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>
                      {currentLevel === 'brand'
                        ? 'Brands & Organizations'
                        : currentLevel === 'business'
                        ? 'Business Entities'
                        : 'Branch Outlets'}
                    </span>
                    <span className="text-blue-600 lowercase font-mono">
                      {currentLevel === 'brand'
                        ? `${brands.length} brands`
                        : currentLevel === 'business'
                        ? `${businesses.length} biz`
                        : `${branches.length} branches`}
                    </span>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {currentLevel === 'brand' &&
                      brands.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            selectBrand(b.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                            b.id === activeBrand?.id
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {b.id === activeBrand?.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                        </button>
                      ))}

                    {currentLevel === 'business' &&
                      businesses.map((bz) => {
                        const isMain = Boolean(bz.isPrimary || (businesses.length > 0 && bz.id === businesses[businesses.length - 1]?.id));
                        return (
                          <button
                            key={bz.id}
                            onClick={() => {
                              selectBusiness(bz.id);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                              bz.id === activeBusiness?.id
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{bz.name}</span>
                                {isMain ? (
                                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black shrink-0">
                                    👑 Main HQ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold shrink-0">
                                    🏪 Outlet
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate">
                                {bz.businessType === 'franchise' ? 'Franchise' : 'Company-Owned'} • {bz.city || 'India'}
                              </span>
                            </div>
                            {bz.id === activeBusiness?.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}

                    {currentLevel === 'branch' &&
                      branches.map((br) => {
                        return (
                          <button
                            key={br.id}
                            onClick={() => {
                              selectBranch(br.id);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                              br.id === activeBranch?.id
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{br.name}</span>
                                {br.isPrimary ? (
                                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black shrink-0">
                                    👑 Main HQ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold shrink-0">
                                    🏪 Outlet
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate">
                                {br.address || br.city || 'Location Outlet'}
                              </span>
                            </div>
                            {br.id === activeBranch?.id && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>

                  <div className="pt-2 mt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/dashboard/businesses');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Manage Entities & Branches</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* 1. Connect / Disconnect (Live) Control */}
          <div className="relative">
            {gmbStatus.isConnected ? (
              <button
                type="button"
                onClick={() => setGmbMenuOpen(!gmbMenuOpen)}
                title="Google Business Profile Connected & Live (Click for Options)"
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                  gmbStatus.isExpired
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80'
                )}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                      gmbStatus.isExpired ? 'bg-amber-400' : 'bg-emerald-400'
                    )}
                  />
                  <span
                    className={cn(
                      'relative inline-flex rounded-full h-2 w-2',
                      gmbStatus.isExpired ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  />
                </span>
                <span className="hidden sm:inline">
                  {gmbStatus.isExpired ? 'GMB Expired' : 'GMB Live'}
                </span>
                <span className="sm:hidden text-[11px]">Live</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5 hidden xs:inline" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmb}
                disabled={isConnectingGmb}
                title="Connect official Google Business Profile via OAuth"
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isConnectingGmb ? 'Connecting...' : 'Connect GMB'}
                </span>
                <span className="sm:hidden text-[11px]">
                  {isConnectingGmb ? '...' : 'Connect'}
                </span>
              </button>
            )}

            {/* GMB Connected Options Popover */}
            {gmbMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setGmbMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 leading-tight">Google Connected</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {gmbStatus.connectedEmail || 'Authorized Account'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setGmbMenuOpen(false);
                        handleSyncHeader();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sync Reviews Now</span>
                    </button>

                    <button
                      onClick={() => {
                        setGmbMenuOpen(false);
                        handleConnectGmb();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      <span>Refresh Token & Scopes</span>
                    </button>

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={handleDisconnectGmb}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-red-500" />
                        <span>Disconnect GMB</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. Sync Button */}
          <button
            type="button"
            onClick={handleSyncHeader}
            disabled={isSyncing}
            title="Sync Live Google Reviews & Rating"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5 text-slate-600 shrink-0', isSyncing && 'animate-spin text-blue-600')}
            />
            <span className="hidden sm:inline">
              {isSyncing ? 'Syncing...' : syncFeedback || 'Sync'}
            </span>
          </button>

          {/* 3. Preview Link Button */}
          <button
            type="button"
            onClick={handleOpenPreview}
            title="Open Live Customer Review Funnel in new tab"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="hidden md:inline">Preview Link</span>
            <span className="hidden xs:inline md:hidden">Preview</span>
          </button>

          {/* 4. QR Button */}
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            title="View & Download Live Review QR Code"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-700 shrink-0" />
            <span className="hidden sm:inline">QR</span>
          </button>

          {/* 5. Standee View Button */}
          <button
            type="button"
            onClick={() => setStandeeModalOpen(true)}
            title="View Acrylic Countertop Standee Display"
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-purple-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Layers className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span className="hidden lg:inline">Standee View</span>
            <span className="hidden sm:inline lg:hidden">Standee</span>
          </button>

          {/* Command Palette Trigger (Desktop) */}
          <button
            onClick={onOpenCommand}
            className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <kbd className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* User Profile / Auth */}
          <GoogleAuthButton compact />
        </div>
      </header>

      {/* Quick QR Code Modal */}
      <HeaderQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        business={
          currentLevel === 'branch' && activeBranch && activeBusiness
            ? {
                ...activeBusiness,
                name: `${activeBusiness.name} (${activeBranch.name})`,
                slug: activeBranch.slug || activeBusiness.slug,
                city: activeBranch.city || activeBusiness.city
              }
            : activeBusiness
        }
      />

      {/* Standee Preview Modal */}
      <HeaderStandeeModal
        isOpen={standeeModalOpen}
        onClose={() => setStandeeModalOpen(false)}
        business={
          currentLevel === 'branch' && activeBranch && activeBusiness
            ? {
                ...activeBusiness,
                name: `${activeBusiness.name} (${activeBranch.name})`,
                slug: activeBranch.slug || activeBusiness.slug,
                city: activeBranch.city || activeBusiness.city
              }
            : activeBusiness
        }
      />

      {/* Upgrade to Multi-Branch Expansion Modal */}
      <UpgradeMultiBranchModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
