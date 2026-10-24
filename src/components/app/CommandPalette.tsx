import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  MessageSquareQuote,
  TrendingUp,
  MapPin,
  Settings,
  ExternalLink,
  PlusCircle,
  Search,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeBusiness: { name: string; googleReviewUrl: string } | null;
}

export function CommandPalette({ isOpen, onClose, activeBusiness }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { label: 'Go to Overview Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard') },
    { label: 'Open QR Studio & Posters', icon: QrCode, action: () => navigate('/dashboard/qr') },
    { label: 'AI Review & Reply Assistant', icon: MessageSquareQuote, action: () => navigate('/dashboard/replies') },
    { label: 'View Conversion Analytics', icon: TrendingUp, action: () => navigate('/dashboard/analytics') },
    { label: 'Local SEO Audit Checklist', icon: MapPin, action: () => navigate('/dashboard/local-seo') },
    { label: 'Business & Brand Settings', icon: Settings, action: () => navigate('/dashboard/settings') },
    { label: 'Add New Location', icon: PlusCircle, action: () => navigate('/onboarding') },
    ...(activeBusiness?.googleReviewUrl ? [
      {
        label: `Test Google Review Link (${activeBusiness.name})`,
        icon: ExternalLink,
        action: () => window.open(activeBusiness.googleReviewUrl, '_blank')
      }
    ] : [])
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border bg-card">
          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-t border-border text-[11px] text-muted-foreground">
          <span>Navigate with arrows</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
