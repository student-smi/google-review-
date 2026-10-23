import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, CheckCircle2 } from 'lucide-react';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified?: boolean;
}

interface GoogleAuthButtonProps {
  onSuccess?: (user: GoogleUserProfile) => void;
  className?: string;
  compact?: boolean;
}

export const GOOGLE_CLIENT_ID = '331659571653-prle3s93ht54hdhp11gk3e5p69un2565.apps.googleusercontent.com';

export function GoogleAuthButton({ onSuccess, className = '', compact = false }: GoogleAuthButtonProps) {
  const [user, setUser] = useState<GoogleUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('reviewqr_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = async (response: any) => {
    try {
      const res = await fetch('/api/public/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json() as any;
      if (res.ok && data.user) {
        localStorage.setItem('reviewqr_user', JSON.stringify(data.user));
        if (data.sessionToken) {
          localStorage.setItem('reviewqr_session', data.sessionToken);
        }
        setUser(data.user);
        onSuccess?.(data.user);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  useEffect(() => {
    const initGsi = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false
        });

        if (buttonRef.current && !user) {
          (window as any).google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: compact ? 'medium' : 'large',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left'
          });
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setTimeout(initGsi, 500);
      return () => clearTimeout(timer);
    }
  }, [user, compact]);

  const handleSignOut = () => {
    localStorage.removeItem('reviewqr_user');
    localStorage.removeItem('reviewqr_session');
    setUser(null);
    setDropdownOpen(false);
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/50 p-1 pr-2.5 text-xs font-semibold hover:bg-secondary transition-all"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="h-7 w-7 rounded-lg object-cover border border-primary/20"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <User className="h-4 w-4" />
            </div>
          )}
          <span className="truncate max-w-[120px] text-foreground">{user.name}</span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-border">
                {user.picture && (
                  <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-xl border border-border" />
                )}
                <div className="truncate">
                  <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="px-2 py-1 mb-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Google Verified Owner</span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <div ref={buttonRef} />
    </div>
  );
}
