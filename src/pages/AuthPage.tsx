import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { apiFetch, getStoredBusinesses, saveStoredBusinesses, saveActiveBusinessId } from '@/lib/api';
import { signupApi, loginApi, isAuthenticated } from '@/lib/auth';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialMode = location.pathname === '/signup' || searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Sync existing user businesses from remote D1 database and redirect directly to dashboard
  const handlePostAuthSync = async () => {
    setIsLoading(true);
    try {
      const bizData = await apiFetch<{ businesses: any[] }>('/api/businesses');
      if (bizData?.businesses && Array.isArray(bizData.businesses) && bizData.businesses.length > 0) {
        saveStoredBusinesses(bizData.businesses);
        saveActiveBusinessId(bizData.businesses[0].id);
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch (err) {
      console.warn('Could not sync user businesses:', err);
    } finally {
      setIsLoading(false);
    }
    // Only route to onboarding if user genuinely has zero businesses saved
    navigate('/onboarding', { replace: true });
  };

  // If already authenticated, sync businesses and go directly to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      handlePostAuthSync();
    }
  }, [navigate]);

  // Sync mode when route changes between /login and /signup
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsLogin(false);
    } else if (location.pathname === '/login') {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name or business name.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await loginApi(email, password);
        // Automatically restore existing user data & go straight to dashboard
        await handlePostAuthSync();
      } else {
        // User Signup: Create brand new user
        await signupApi(name, email, password);
        navigate('/onboarding', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 antialiased font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 mx-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#7B68EE] text-white font-black text-base shadow-md shadow-blue-500/20">
              RB
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              ReviewBoost <span className="text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ml-0.5 border border-blue-200">AI</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500">
            AI-Powered Google Review QR for Local Businesses
          </p>
        </div>

        {/* Auth Card */}
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-xs text-slate-500">
              {isLogin
                ? 'Sign in to access your Google Review QR standees and analytics.'
                : 'Start collecting 5-star Google Reviews with AI in 2 minutes.'}
            </p>
          </div>

          {/* Google Sign-in */}
          <div className="space-y-3">
            <GoogleAuthButton
              onSuccess={async () => {
                await handlePostAuthSync();
              }}
            />
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Or with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Full Name / Shopkeeper Name
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl text-xs"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-sm gap-2 cursor-pointer"
            >
              <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                  }}
                  className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                  }}
                  className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </Card>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Workspace Data Isolation</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-blue-500" />
            <span>Encrypted Session</span>
          </span>
        </div>
      </div>
    </div>
  );
}
export default AuthPage;
