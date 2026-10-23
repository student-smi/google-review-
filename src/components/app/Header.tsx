import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Plus,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
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
  '/dashboard/qr-studio': 'QR Studio & Posters',
  '/dashboard/reviews': 'Reviews & AI Replies',
  '/dashboard/analytics': 'Conversion Analytics',
  '/dashboard/seo': 'Local SEO Checklist',
  '/dashboard/settings': 'Settings & Google Link'
};

export function Header({
  onOpenCommand,
  activeBusiness,
  businesses,
  onSelectBusiness
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentSection = pageTitles[location.pathname] || 'Workspace';

  return (
    <header className="flex h-15 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] px-4 sm:px-6 z-20">
      {/* Left: Breadcrumbs & Business Switcher */}
      <div className="flex items-center gap-3">
        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-tr from-[#7B68EE] to-[#EC4899] text-white text-[10px] font-black uppercase">
              {activeBusiness?.name ? activeBusiness.name.charAt(0) : '★'}
            </div>
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {activeBusiness?.name || 'My Location'}
            </span>
            {activeBusiness?.city && (
              <span className="hidden sm:inline-flex rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] px-1.5 py-0.5">
                {activeBusiness.city}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-2 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100">
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
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate">{biz.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {biz.city || 'India'}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/onboarding');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
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
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{currentSection}</span>
        </div>
      </div>

      {/* Right: Actions, Search, Quick QR, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Search or jump to...</span>
          <kbd className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Standee Button */}
        <Button
          size="sm"
          onClick={() => navigate('/dashboard/qr-studio')}
          className="hidden sm:inline-flex bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5"
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
            <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span>Google Link</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </button>
          </a>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-700" />}
        </button>

        {/* Google Authentication */}
        <GoogleAuthButton compact />
      </div>
    </header>
  );
}
