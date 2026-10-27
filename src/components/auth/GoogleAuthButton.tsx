import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, CheckCircle2 } from 'lucide-react';
import { logoutApi, setAuthSession } from '@/lib/auth';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified?: boolean;
}

interface GoogleAuthButtonProps {
  onSuccess?: (user: GoogleUserProfile) => void | Promise<void>;
  className?: string;
  compact?: boolean;
}

export const GOOGLE_CLIENT_ID = '91010309450-5ohei09bcft5tgnhp9e3e0q641djftnf.apps.googleusercontent.com';

export function GoogleAuthButton({ onSuccess, className = '', compact = false }: GoogleAuthButtonProps) {
  const navigate = useNavigate();
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

      const data = (await res.json()) as any;
      if (res.ok && data.user) {
        const token = data.sessionToken || `gauth_${data.user.id}_${Date.now()}`;
        setAuthSession(token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email
        });
        setUser(data.user);
        if (onSuccess) {
          await onSuccess(data.user);
        }
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

  const handleSignOut = async () => {
    try {
      await logoutApi();
    } catch {}
    setUser(null);
    setDropdownOpen(false);
    navigate('/', { replace: true });
  };

  if (user) {
    const initials = (user.name || user.email || 'U').substring(0, 2).toUpperCase();

    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 pr-2.5 text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="h-7 w-7 rounded-lg object-cover border border-primary/20"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7B68EE] text-white font-bold text-[11px]">
              {initials}
            </div>
          )}
          <span className="truncate max-w-[120px] text-slate-800 font-medium">
            {user.name || user.email.split('@')[0]}
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-slate-100">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-xl border border-slate-200" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#7B68EE] text-white font-bold text-xs shrink-0">
                    {initials}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'Store Owner'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="px-2 py-1 mb-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Verified Merchant Account</span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out / Switch Account</span>
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
