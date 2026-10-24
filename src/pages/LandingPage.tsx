import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { isAuthenticated } from '@/lib/auth';
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
  Search,
  Bell,
  Settings,
  Plus,
  Inbox,
  User,
  Calendar,
  Star,
  Users,
  Building2,
  MapPin,
  Flame,
  CheckSquare
} from 'lucide-react';

interface CategoryTemplate {
  id: string;
  label: string;
  businessName: string;
  location: string;
  doneCount: number;
  progressCount: number;
  recentCustomer: string;
  highlight: string;
  rating: string;
}

const CATEGORIES: CategoryTemplate[] = [
  {
    id: 'restaurants',
    label: 'Restaurants & Cafes',
    businessName: 'Royal Sweets & Restaurant',
    location: 'Kalupur, Ahmedabad',
    doneCount: 14,
    progressCount: 3,
    recentCustomer: 'Deep Patel',
    highlight: 'Crispy Dhokla & Soft Kaju Katli',
    rating: '5.0'
  },
  {
    id: 'retail',
    label: 'Retail & Sweets',
    businessName: 'Shivalik Jewellers & Gems',
    location: 'C.G. Road, Ahmedabad',
    doneCount: 18,
    progressCount: 2,
    recentCustomer: 'Priya Sharma',
    highlight: 'Hallmarked Gold & Polite Staff',
    rating: '4.9'
  },
  {
    id: 'clinics',
    label: 'Clinics & Doctors',
    businessName: 'Apex Dental & Smile Care',
    location: 'Navrangpura, Ahmedabad',
    doneCount: 22,
    progressCount: 4,
    recentCustomer: 'Rajesh Shah',
    highlight: 'Painless Root Canal & Clean Clinic',
    rating: '5.0'
  },
  {
    id: 'salons',
    label: 'Salons & Spas',
    businessName: 'Bliss Luxury Hair Studio',
    location: 'Bodakdev, Ahmedabad',
    doneCount: 11,
    progressCount: 2,
    recentCustomer: 'Ananya Mehta',
    highlight: 'Trendy Haircut & Relaxing Facial',
    rating: '4.9'
  },
  {
    id: 'services',
    label: 'Professional Services',
    businessName: 'Rapid Auto Diagnostics',
    location: 'S.G. Highway, Ahmedabad',
    doneCount: 9,
    progressCount: 3,
    recentCustomer: 'Ketan Trivedi',
    highlight: 'Prompt AC Repair & Genuine Spares',
    rating: '4.8'
  }
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('restaurants');

  const selectedTemplate =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-600">
      {/* 1. TOP ANNOUNCEMENT RIBBON */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-indigo-900 text-xs py-2 px-4 text-center font-semibold flex items-center justify-center gap-1.5 border-b border-indigo-100/80">
        <span>Meet ReviewQR 2.0: Polished, powerful, and Google Places connected.</span>
        <NavLink
          to="/signup"
          className="text-[#2563EB] font-bold underline underline-offset-2 hover:text-[#1D4ED8] transition-colors ml-1 inline-flex items-center"
        >
          <span>Try 2.0 now</span>
          <span className="ml-1 text-[10px]">›</span>
        </NavLink>
      </div>

      {/* 2. TOP NAVBAR */}
      <header className="border-b border-slate-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#7B68EE] text-white font-black text-sm shadow-md shadow-blue-500/20">
                RQ
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Review<span className="text-[#2563EB]">QR</span>
              </span>
            </NavLink>

            {/* Menu Links with Dropdowns */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
              <a
                href="#features"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>AI Reviews</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </a>
              <a
                href="#how-it-works"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Product</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </a>
              <a
                href="#trust"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Google Policy</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </a>
              <a
                href="#pricing"
                className="hover:text-slate-900 transition-colors"
              >
                Free Forever
              </a>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <NavLink to="/dashboard">
                <button className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-sm">
                  Go to Dashboard
                </button>
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 transition-colors hidden sm:block"
                >
                  Login
                </NavLink>

                <NavLink to="/signup">
                  <button className="h-9 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0F172A] text-xs font-bold transition-all shadow-sm">
                    Get Started Free
                  </button>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (ClickUp 4.0 Exact Two-Column Layout) */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-5 space-y-6 text-left">
              {/* ClickUp Capsule Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-300/60 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 shadow-xs">
                <span>Introducing ReviewQR 2.0</span>
                <span className="text-[10px]">›</span>
              </div>

              {/* ClickUp Signature Huge Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Maximize genuine customer reviews
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Replace manual asking. Every real customer, AI review draft, and Google review in one place.
              </p>

              {/* ClickUp CTA Button Row */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <NavLink to={isAuthenticated() ? '/dashboard' : '/signup'}>
                  <button className="h-12 px-7 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-base font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer">
                    {isAuthenticated() ? 'Open Dashboard' : "Get started. It's FREE!"}
                  </button>
                </NavLink>

                <div className="text-xs text-slate-500 leading-tight">
                  <div className="font-semibold text-slate-700">Free forever.</div>
                  <div>No credit card required.</div>
                </div>
              </div>

              {/* Category Pills Header & Pills */}
              <div className="pt-6 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                  GET 400% MORE REVIEWS • CUSTOMIZE YOUR WORKSPACE
                </div>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs'
                        }`}
                      >
                        {isActive && <Check className="h-3 w-3 text-blue-600 stroke-[3]" />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Hero Column: LIGHT MODERN APP WINDOW MOCKUP */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-indigo-100/70 overflow-hidden text-left transition-all duration-300">
                {/* Window Top Navigation & Controls */}
                <div className="h-10 bg-slate-50 border-b border-slate-200/80 px-4 flex items-center justify-between text-xs">
                  {/* Left Workspace Switcher */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 shadow-xs">
                      <span className="text-amber-500">⭐</span>
                      <span className="truncate max-w-[160px]">{selectedTemplate.businessName}</span>
                      <span className="text-[10px] text-slate-400">▾</span>
                    </div>
                  </div>

                  {/* Center Search Pill */}
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-0.5 text-[11px] text-slate-400 w-52 shadow-xs">
                    <Search className="h-3 w-3 text-slate-400" />
                    <span>Search reviews, staff...</span>
                  </div>

                  {/* Right Window Icons */}
                  <div className="flex items-center gap-2 text-slate-400">
                    <Bell className="h-3.5 w-3.5 hover:text-slate-600 cursor-pointer" />
                    <Settings className="h-3.5 w-3.5 hover:text-slate-600 cursor-pointer" />
                    <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold text-[9px] flex items-center justify-center">
                      RS
                    </div>
                  </div>
                </div>

                {/* Inner Window Split View */}
                <div className="grid grid-cols-12 min-h-[380px] sm:min-h-[420px]">
                  {/* Left Inner Sidebar */}
                  <div className="hidden md:block col-span-4 border-r border-slate-200 bg-slate-50/80 p-3 text-xs space-y-3 font-medium select-none">
                    <div className="flex items-center justify-between font-bold text-slate-800 px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <HomeIcon className="h-3.5 w-3.5 text-slate-500" /> Home
                      </span>
                      <span className="text-[10px] text-slate-400">+ ▾</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                        <span className="flex items-center gap-2">
                          <Inbox className="h-3.5 w-3.5" />
                          <span>Inbox</span>
                        </span>
                        <span className="h-4 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          3
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100">
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>My Reviews</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Scan Analytics</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Active Standees
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100">
                          <QrCode className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">Main Billing Counter</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100">
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            <span>AI Reply Agent</span>
                          </span>
                          <span className="h-3.5 px-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-bold">
                            Live
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Location
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-slate-600 font-semibold truncate">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{selectedTemplate.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Inner Content: Tasks / Reviews Table */}
                  <div className="col-span-12 md:col-span-8 p-3 sm:p-4 space-y-4 bg-white">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>Google Reviews</span>
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 ml-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold">
                            Tasks
                          </span>
                          <span className="px-1.5 py-0.5 text-slate-400">Feed</span>
                          <span className="px-1.5 py-0.5 text-slate-400 hidden sm:inline">Stats</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                        ★ {selectedTemplate.rating} Rating
                      </span>
                    </div>

                    {/* Table Column Labels */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
                      <span>CUSTOMER REVIEW TASK</span>
                      <span className="hidden sm:inline">ASSIGNEE / STATUS</span>
                    </div>

                    {/* SECTION 1: DONE (Green Group) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 px-2 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>DONE</span>
                          <span className="ml-1 opacity-80">{selectedTemplate.doneCount}</span>
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-slate-800">
                            <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                            <span>{selectedTemplate.recentCustomer} • 5-Star Review</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Posted on Google
                          </span>
                        </div>

                        <div className="pl-6 text-[11px] text-slate-500">
                          "{selectedTemplate.highlight}. Prompt service and friendly staff."
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                          <span>Counter Standee Scanned & Verified</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">100% Policy Compliant</span>
                      </div>
                    </div>

                    {/* SECTION 2: IN PROGRESS (Blue Group) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 px-2 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase flex items-center gap-1">
                          <span>IN PROGRESS</span>
                          <span className="ml-1 opacity-80">{selectedTemplate.progressCount}</span>
                        </span>
                      </div>

                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          <span>Customer scanning QR at Main Counter</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-100/70 px-2 py-0.5 rounded-md">
                          AI Drafts Generating
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          <span>Owner 1-Click AI Reply Drafted</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Ready to Post</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUSTED BY THE BEST */}
      <section className="py-12 border-b border-slate-200/80 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-6">
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono">
              TRUSTED BY THE BEST LOCAL BUSINESSES ACROSS INDIA
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="font-extrabold text-lg tracking-tighter text-slate-800">
                ROYAL SWEETS
              </span>
              <span className="font-bold text-lg tracking-wide text-slate-800">
                havmor<span className="text-pink-500 font-black">.</span>
              </span>
              <span className="font-black text-lg tracking-tight text-slate-800">
                CHAI POINT
              </span>
              <span className="font-extrabold text-lg tracking-wider text-slate-800">
                SANKALP
              </span>
              <span className="font-serif font-bold text-lg text-slate-800">
                KALYAN
              </span>
              <span className="font-sans font-bold text-lg text-slate-800">
                APOLLO
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HONEST TRUST & INTEGRITY SECTION */}
      <section id="trust" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Policy Integrity (Non-Negotiable)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Real reviews only. Zero review gating.
            </h2>
            <p className="text-sm text-slate-600">
              ReviewQR strictly opposes review manipulation, star pushing, or gating negative feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="font-bold text-base text-slate-900">Zero Review Gating</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every customer who scans the QR code is immediately provided a direct link to your official Google review page. We never route unhappy customers away or filter responses.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="font-bold text-base text-slate-900">No Hallucinated Details</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI is strictly a wording helper. It only structures details the customer selects or types. It is programmed never to invent dishes, staff names, prices, or dates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="font-bold text-base text-slate-900">Real Google Cloud Integration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated directly with Google Places API and Google Identity Services for instant place discovery and verified owner login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              How ReviewQR Works
            </h2>
            <p className="text-sm text-slate-600">
              3 simple steps to genuine customer reviews in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <QrCode className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">1. Customer Scans QR</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Print dynamic table-tents or counter posters using our browser export tool. Customers scan with any camera.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">2. Taps Real Experience</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Customer taps chips or speaks in Hindi/Gujarati/English. Our AI formats their exact words into 3 calibrated options.
              </p>
            </div>

            <div className="space-y-3 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ExternalLink className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">3. Posts on Google</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                1-tap clipboard copy automatically opens the official Google review box. The customer edits and submits with 1 click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING & CLOUDFLARE FREE TIER SECTION */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">
              ZERO INFRASTRUCTURE BILLS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              100% Free Forever
            </h2>
            <p className="text-sm text-slate-600">
              Built on Cloudflare Free Tier edge technology without bloated server bills.
            </p>
          </div>

          <div className="rounded-3xl border-2 border-blue-600 bg-white max-w-md mx-auto shadow-xl shadow-blue-500/10 p-8 space-y-6 text-left">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Independent Business Plan
              </div>
              <div className="text-4xl font-black tracking-tight text-slate-900">
                ₹0 <span className="text-sm font-normal text-slate-500">/ forever</span>
              </div>
              <div className="text-xs text-slate-500">For Indian local shops, restaurants, salons & clinics</div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Unlimited QR scans (Edge KV cached)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Google Places API & Autocomplete included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>English, Hindi & Gujarati 3-option review drafts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Client-side high-res poster downloads (PNG/PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Google Sign-In & Owner Dashboard</span>
              </div>
            </div>

            <NavLink to={isAuthenticated() ? '/dashboard' : '/signup'} className="block w-full">
              <button className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer">
                {isAuthenticated() ? 'Open Dashboard' : 'Get Started Free'}
              </button>
            </NavLink>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-200/80 py-8 bg-slate-50 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#7B68EE] text-white font-black text-[10px]">
              RQ
            </div>
            <span className="font-extrabold text-slate-900">ReviewQR</span>
            <span>• Built for Indian Local Businesses</span>
          </div>
          <div>100% Cloudflare Free Tier • DPDP Act & Google Policy Compliant</div>
        </div>
      </footer>
    </div>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
