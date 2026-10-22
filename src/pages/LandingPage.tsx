import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import {
  Sparkles,
  QrCode,
  ShieldCheck,
  TrendingUp,
  MessageSquareQuote,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Store,
  Layers,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Smartphone
} from 'lucide-react';

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Phone Mock interactive state
  const [mockStep, setMockStep] = useState<1 | 2>(1);

  const faqs = [
    {
      q: 'Does ReviewQR violate Google Review policies?',
      a: 'Absolutely not. ReviewQR strictly follows all Google Contributed Content policies. We do not gate negative reviews, we never offer incentives or rewards for reviews, and every single customer is given an immediate, direct link to post on Google.'
    },
    {
      q: 'Can the AI invent details about my business?',
      a: 'No. ReviewQR has strict anti-fabrication guardrails. The AI only formats facts the customer explicitly selects or types (e.g., crispy dosa, quick service). It is strictly forbidden from hallucinating staff names, prices, dates, or amenities.'
    },
    {
      q: 'Is it really 100% free forever?',
      a: 'Yes. ReviewQR is engineered specifically to run entirely within Cloudflare’s generous Free Tier (Cloudflare Workers, D1 database, KV cache, R2 storage, and Workers AI). We have zero infrastructure costs to pass on to small businesses.'
    },
    {
      q: 'Do customers need to download an app or log in?',
      a: 'Never. Customers simply scan the QR code with their default camera app or Google Lens. It loads instantly in their mobile browser without any signup or passwords.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border/80 sticky top-0 bg-background/85 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-sm glow-indigo">
              RQ
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Review<span className="text-accent">QR</span>
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono">
              India Local SaaS
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#trust" className="hover:text-foreground transition-colors">Trust & Integrity</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Free Tier</a>
            <NavLink to="/design" className="hover:text-primary transition-colors flex items-center gap-1">
              <span>Style Guide</span>
              <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded font-mono">/design</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <NavLink to="/dashboard">
              <Button size="sm" variant="primary" className="gap-2 font-semibold">
                <span>Open Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Google Policy Compliant • Zero Review Gating</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Help real customers write genuine Google reviews{' '}
                <span className="text-primary underline decoration-accent/60 decoration-wavy decoration-2">
                  in seconds.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Empower your genuine patrons to express their actual experience with guided chips and voice input in English, Hindi, and Gujarati. No fake reviews, no ratings manipulation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <NavLink to="/onboarding">
                  <Button size="lg" variant="saffron" className="w-full sm:w-auto h-12 px-6 gap-2 text-base font-semibold shadow-md glow-saffron">
                    <Sparkles className="h-5 w-5" />
                    <span>Start Free (No Credit Card)</span>
                  </Button>
                </NavLink>

                <NavLink to="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 gap-2 text-base">
                    <span>Explore Live Demo</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </NavLink>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground border-t border-border/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Cloudflare Free Tier</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Multilingual (EN, हिंदी, ગુજરાતી)</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Client-Side Poster Export</span>
                </span>
              </div>
            </div>

            {/* Right: Interactive Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[320px] rounded-[44px] border-[8px] border-slate-900 bg-slate-900 shadow-2xl p-2.5 relative">
                {/* Speaker pill notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-700 mr-2" />
                  <div className="w-8 h-1.5 rounded-full bg-slate-700" />
                </div>

                {/* Inner Phone Screen */}
                <div className="w-full h-[580px] rounded-[34px] bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col justify-between pt-8 pb-4 px-4 text-left font-sans shadow-inner">
                  {/* Business header inside phone */}
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        RS
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Royal Sweets</div>
                        <div className="text-[10px] text-slate-500">Google Review Assistant</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                      Step {mockStep}/2
                    </Badge>
                  </div>

                  {/* Dynamic interactive body inside phone */}
                  <div className="flex-1 py-3 space-y-3 overflow-hidden">
                    {mockStep === 1 ? (
                      <div className="space-y-3">
                        <div className="text-xs font-bold">How was your visit today?</div>
                        <div className="flex flex-wrap gap-1.5">
                          {['Delicious & fresh', 'Friendly staff', 'Clean ambiance'].map((chip, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 text-white shadow-xs"
                            >
                              ✓ {chip}
                            </span>
                          ))}
                          <span className="px-2 py-1 rounded-lg text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600">
                            + Fast service
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                          "Kaju katli was soft & fresh. Staff was very helpful."
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ready for Google
                        </div>
                        <div className="text-[11px] leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                          "Visited Royal Sweets today. The kaju katli was freshly made and very soft, and the packaging was top-notch. Courteous staff."
                        </div>
                        <div className="text-[9px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                          ℹ️ Verified from your notes only.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Phone Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {mockStep === 1 ? (
                      <Button
                        size="sm"
                        variant="saffron"
                        onClick={() => setMockStep(2)}
                        className="w-full text-xs font-semibold h-10 gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Tap to generate draft</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setMockStep(1)}
                        className="w-full text-xs font-semibold h-10 gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Copy & Open Google ↗</span>
                      </Button>
                    )}
                    <div className="text-center">
                      <span className="text-[10px] text-slate-500 underline">
                        Skip, go straight to Google
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HONEST TRUST & INTEGRITY SECTION */}
      <section id="trust" className="py-16 bg-secondary/30 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="text-xs">Product Integrity (Non-Negotiable)</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Real reviews only. No gating. No fake reviews.
            </h2>
            <p className="text-sm text-muted-foreground">
              ReviewQR strictly opposes review manipulation, star pushing, or gating negative feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="font-semibold text-base">Zero Review Gating</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every customer who scans the QR code is immediately provided a direct link to your official Google review page. We never route unhappy customers away or filter responses.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="font-semibold text-base">No Hallucinated Details</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI is strictly a wording helper. It only structures details the customer selects or types. It is programmed never to invent dishes, staff names, prices, or dates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent/15 text-accent-foreground flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="font-semibold text-base">No Fake Promises</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No "guaranteed 500 five-star reviews" or ranking gimmicks. Genuine quality and prompt customer service are the only true drivers of local business growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">How ReviewQR Works</h2>
            <p className="text-sm text-muted-foreground">3 simple steps to genuine customer reviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm glow-indigo">
                <QrCode className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">1. Customer Scans QR</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Print dynamic table-tents or counter posters using our browser export tool. Customers scan with any camera.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-sm glow-saffron">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">2. Taps Real Experience</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Customer taps chips or speaks in Hindi/Gujarati/English. Our AI formats their exact words into a polished draft.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <ExternalLink className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">3. Posts on Google</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                One-tap copy redirects to the official Google review box. The customer edits and submits it themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & CLOUDFLARE FREE TIER SECTION */}
      <section id="pricing" className="py-16 bg-secondary/30 border-y border-border/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2">
            <Badge variant="saffron" className="text-xs">Cloudflare Free Tier Architecture</Badge>
            <h2 className="text-3xl font-bold tracking-tight">100% Free Forever</h2>
            <p className="text-sm text-muted-foreground">
              Built on Cloudflare serverless edge technology without bloated server bills.
            </p>
          </div>

          <Card className="border-2 border-primary/30 max-w-lg mx-auto shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">Independent Business Plan</div>
                <div className="text-4xl font-extrabold tracking-tight text-foreground">₹0 / month</div>
                <div className="text-xs text-muted-foreground">Forever free for Indian local shops & clinics</div>
              </div>

              <div className="space-y-2.5 text-left text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Unlimited QR scans (Edge KV cached)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>25 AI review drafts per day per business</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>English, Hindi & Gujarati language support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Client-side high-res poster downloads (PNG/PDF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>AI Reply Copilot with 3 calibrated tones</span>
                </div>
              </div>

              <NavLink to="/onboarding" className="block w-full">
                <Button size="lg" variant="primary" className="w-full font-semibold">
                  Get Started Free
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-4 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-sm text-foreground"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/80 py-8 bg-card text-muted-foreground text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">ReviewQR</span>
            <span>• Built for Indian Local Businesses</span>
          </div>
          <div>
            100% Cloudflare Free Tier • DPDP Act & Privacy Compliant
          </div>
        </div>
      </footer>
    </div>
  );
}
