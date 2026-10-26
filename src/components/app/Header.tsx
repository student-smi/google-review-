import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Search,
  Plus,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

interface HeaderProps {
  onOpenCommand: () => void;
  activeBusiness: {
    id: string;
    name: string;
    city?: string | null;
    googleReviewUrl: string;
  } | null;
  businesses: Array<{
    id: string;
    name: string;
    city?: string | null;
    googleReviewUrl: string;
  }>;
  onSelectBusiness: (businessId: string) => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Live Overview',
  '/dashboard/businesses': 'Business Profiles',
  '/dashboard/qr': 'QR Studio & Campaigns',
  '/dashboard/replies': 'Reviews & AI Replies',
  '/dashboard/analytics': 'Conversion Analytics',
  '/dashboard/local-seo': 'Local SEO Checklist',
  '/dashboard/settings': 'Settings & Google Link'
};

export function Header({
  onOpenCommand,
  activeBusiness,
  businesses,
  onSelectBusiness
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentSection = pageTitles[location.pathname] || 'Workspace';

  return (
    <header className="flex h-15 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 z-20">
      {/* Left: Breadcrumbs & Business Switcher */}
      <div className="flex items-center gap-3">
        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-blue-300 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7B68EE] text-white text-[10px] font-black uppercase">
              {activeBusiness?.name ? activeBusiness.name.charAt(0) : '★'}
            </div>
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {activeBusiness?.name || 'My Location'}
            </span>
            {activeBusiness?.city && (
              <span className="hidden sm:inline-flex rounded-md bg-blue-50 text-blue-600 font-semibold text-[10px] px-1.5 py-0.5">
                {activeBusiness.city}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Locations & Stores
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {businesses.map((biz) => {
                    const isSelected = biz.id === activeBusiness?.id;
                    return (
                      <button
                        key={biz.id}
                        onClick={() => {
                          onSelectBusiness(biz.id);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate">{biz.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {biz.city || 'India'}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/onboarding');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Location / Store</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Breadcrumb path */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-bold text-slate-800">{currentSection}</span>
        </div>
      </div>

      {/* Right: Actions, Search, Quick QR, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Search or jump to...</span>
          <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Standee Button */}
        <Button
          size="sm"
          onClick={() => navigate('/dashboard/qr-studio')}
          className="hidden sm:inline-flex bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Standee</span>
        </Button>

        {/* Test Google Link */}
        {activeBusiness?.googleReviewUrl && (
          <a
            href={activeBusiness.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official Google review destination"
            className="hidden xl:inline-flex"
          >
            <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <span>Google Link</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          </a>
        )}

        {/* User Authentication / Profile */}
        <GoogleAuthButton compact />
      </div>
    </header>
  );
}
