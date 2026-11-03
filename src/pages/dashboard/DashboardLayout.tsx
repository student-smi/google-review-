import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Sidebar } from '@/components/app/Sidebar';
import { Header } from '@/components/app/Header';
import { CommandPalette } from '@/components/app/CommandPalette';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Plus,
  Sparkles,
  ArrowRight,
  Store,
  LayoutDashboard,
  QrCode,
  MessageSquareQuote,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  apiFetch,
  getStoredBusinesses,
  saveStoredBusinesses,
  getActiveBusinessId,
  saveActiveBusinessId
} from '@/lib/api';

export interface LocationItem {
  id: string;
  businessId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  googlePlaceId?: string | null;
  googleReviewUrl?: string | null;
  status?: 'active' | 'inactive' | 'connection_error';
  isPrimary?: boolean;
  assignedManager?: string | null;
  createdAt?: number;
}

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  assignedManager?: string | null;
  status?: 'active' | 'inactive' | 'connection_error';
  isArchived?: boolean;
  archivedAt?: number | null;
  locations?: LocationItem[];
  brandVoice?: string;
  chipsJson?: string;
  googleReviewUrl: string;
  googlePlaceId?: string | null;
  brandColor?: string;
  logoUrl?: string;
  qrCode?: {
    id: string;
    code: string;
    svgUrl?: string;
  };
}

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Active business & locations state loaded from persistent storage - ZERO dummy fallback
  const [businesses, setBusinesses] = useState<BusinessItem[]>(() => getStoredBusinesses());
  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    const stored = getActiveBusinessId();
    if (stored) return stored;
    const initialList = getStoredBusinesses();
    return initialList[0]?.id || '';
  });

  const refreshBusinesses = useCallback(async () => {
    try {
      const data = await apiFetch<{ businesses: BusinessItem[] }>('/api/businesses');
      if (data?.businesses && Array.isArray(data.businesses)) {
        if (data.businesses.length > 0) {
          setBusinesses(data.businesses);
          saveStoredBusinesses(data.businesses);
          setActiveBusinessId((curr) => {
            const exists = data.businesses.some((b) => b.id === curr);
            const nextId = exists ? curr : data.businesses[0].id;
            saveActiveBusinessId(nextId);
            return nextId;
          });
        }
      }
    } catch (err) {
      console.warn('Could not sync businesses from API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  const handleSelectBusiness = (id: string) => {
    setActiveBusinessId(id);
    saveActiveBusinessId(id);
  };

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || businesses[0] || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 antialiased font-sans">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop Collapsible & Mobile Slide-in Drawer) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onOpenCommand={() => setCommandOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          activeBusiness={activeBusiness}
          businesses={businesses}
          onSelectBusiness={handleSelectBusiness}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-[#F8FAFC]">
          {isLoading && businesses.length === 0 ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                <p className="text-xs font-semibold text-slate-500">Restoring your workspace & standees...</p>
              </div>
            </div>
          ) : businesses.length === 0 ? (
            /* Empty State: Only shown if user has truly zero businesses */
            <div className="max-w-xl mx-auto my-12 text-center p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xl space-y-5">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <Store className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Welcome to ReviewQR
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  You haven't set up your business location yet. Add your Google Maps listing to generate your first live QR standee.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => navigate('/onboarding')}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-xs gap-2 px-6 py-2.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Set Up Your Business Location</span>
                </Button>
              </div>
            </div>
          ) : (
            <Outlet
              context={{
                activeBusiness,
                businesses,
                refreshBusinesses,
                onSelectBusiness: handleSelectBusiness
              }}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (< lg screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1.5 shadow-lg safe-bottom">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors',
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/dashboard/businesses"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors',
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            <Building2 className="h-4.5 w-4.5" />
            <span>Stores</span>
          </NavLink>

          <NavLink
            to="/dashboard/qr"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors',
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            <QrCode className="h-4.5 w-4.5" />
            <span>QR Studio</span>
          </NavLink>

          <NavLink
            to="/dashboard/replies"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors',
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )
            }
          >
            <MessageSquareQuote className="h-4.5 w-4.5" />
            <span>Reviews</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <Menu className="h-4.5 w-4.5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        activeBusiness={activeBusiness}
      />
    </div>
  );
}
