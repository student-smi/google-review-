import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Plus,
  Check,
  User,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
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

export function Header({
  onOpenCommand,
  activeBusiness,
  businesses,
  onSelectBusiness
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 z-10">
      {/* Left: Business Switcher */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/50 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="truncate max-w-[160px] sm:max-w-[220px]">
            {activeBusiness?.name || 'Select Business'}
          </span>
          {activeBusiness?.city && (
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-normal">
              {activeBusiness.city}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-0.5" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-border bg-card p-1.5 shadow-lg z-40 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Locations & Businesses
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
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium text-foreground truncate">{biz.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {biz.city || 'India'}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1.5 border-t border-border">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/onboarding');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New Location / Business</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Quick actions, Search command, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden md:flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick find...</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        {/* Test Google Link Button */}
        {activeBusiness?.googleReviewUrl && (
          <a
            href={activeBusiness.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official Google review destination"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>Google Link</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Button>
          </a>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Google Authentication */}
        <GoogleAuthButton compact />
      </div>
    </header>
  );
}
