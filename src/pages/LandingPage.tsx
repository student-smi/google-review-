import React, { useState, useRef, useEffect, Fragment } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Menu,
  MessageSquareText,
  Minus,
  MoveRight,
  PenLine,
  Plus,
  QrCode,
  Smartphone,
  X,
  Star,
  Zap,
  BarChart3,
  Sparkles,
  Laptop,
  Link as LinkIcon,
  Coffee,
  Stethoscope,
  Scissors,
  ShoppingBag,
  Car
} from 'lucide-react';
import './LandingPage.css';

// Brand Assets
const headerLogo = '/loctimize-logo-header.png';
const footerLogo = '/loctimize-logo-footer.png';

// Visual Assets
const heroImage = '/landing/hero-standee-phone.jpg';
const standeeCloseup = '/landing/standee-closeup.jpg';
const step1Img = '/landing/step-1-unboxing.jpg';
const step2Img = '/landing/step-2-counter.jpg';
const step3Img = '/landing/step-3-mobile-review.jpg';
const lifestyleImg = '/landing/real-life-counter-usage.jpg';
const ownerImg = '/landing/restaurant-owner.jpg';

interface Product {
  name: string;
  price: string;
  intro: string;
  access: string;
  custom: string;
  index: string;
  view: string;
  viewLabel: string;
  image: string;
  recommended?: boolean;
}

const products: Product[] = [
  {
    name: 'QR Review Standee',
    price: '₹499',
    intro: 'A simple scan-and-go way to share your review link.',
    access: 'High-density QR scan',
    custom: 'Standard Loctimize branding',
    index: '01',
    view: 'qr-detail',
    viewLabel: 'QR Access',
    image: '/landing/pricing-qr-standee.jpg'
  },
  {
    name: 'NFC + QR Smart Review Standee',
    price: '₹999',
    intro: 'Dual tap & scan for the fastest review conversion.',
    access: 'QR scan + Contactless NFC tap',
    custom: 'Custom business branding included',
    index: '02',
    view: 'scan-and-tap',
    viewLabel: 'NFC Tap + QR Scan',
    image: '/landing/pricing-nfc-qr-smart.jpg',
    recommended: true
  },
  {
    name: 'Premium Branded NFC Review Standee',
    price: '₹1,499',
    intro: 'Heavyweight acrylic finish with laser-cut custom branding.',
    access: 'QR scan + Contactless NFC tap',
    custom: 'Custom 3D logo & full color palette',
    index: '03',
    view: 'standee-detail',
    viewLabel: 'Executive Finish',
    image: '/landing/pricing-premium-branded.jpg'
  }
];

interface SoftwarePlan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

const softwarePlans: SoftwarePlan[] = [
  {
    name: 'Basic Direct',
    price: '₹0',
    cadence: 'Forever Free',
    description: 'Direct link routing directly to your Google review page.',
    features: [
      'Unlimited customer scans & taps',
      'Direct link to your Google Maps listing',
      'No subscription or renewal fees',
      'Standard email support'
    ]
  },
  {
    name: 'Growth Suite',
    price: '₹799',
    cadence: '/ month',
    description: 'AI review assistant and multi-location reputation copilot.',
    features: [
      'Everything in Basic Direct',
      'AI review writer for your customers',
      '1-click AI reply copilot for owners',
      'Review analytics & rating trends',
      'Priority WhatsApp support'
    ],
    recommended: true
  },
  {
    name: 'Enterprise Multi-Store',
    price: '₹2,499',
    cadence: '/ month',
    description: 'Unified command center for chains, franchises & clinics.',
    features: [
      'Up to 10 location dashboards',
      'Centralized Google reviews inbox',
      'Bulk standee QR manager',
      'Custom webhook & API integrations',
      'Dedicated account manager'
    ]
  }
];

interface Industry {
  name: string;
  icon: React.ReactNode;
  tagline: string;
  headline: string;
  description: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  statBadge: string;
  image: string;
}

const industries: Industry[] = [
  {
    name: 'Cafes & Dining',
    icon: <Coffee size={16} />,
    tagline: 'Hospitality & Food',
    headline: 'Turn Happy Diners into 5-Star Reviews at the Table',
    description: 'Place ReviewQR on dining tables or at billing. Satisfied customers scan while waiting for the bill, boosting your Google Maps restaurant ranking.',
    bullet1: 'Increases review volume by 4x during peak weekend hours',
    bullet2: 'Highlights signature dishes and friendly service',
    bullet3: 'Boosts local "Best Cafe Near Me" Google ranking',
    statBadge: '+185 Reviews / mo',
    image: '/landing/real-life-counter-usage.jpg'
  },
  {
    name: 'Clinics & Care',
    icon: <Stethoscope size={16} />,
    tagline: 'Healthcare & Wellness',
    headline: 'Build Patient Trust with Verified Doctor Reviews',
    description: 'Position ReviewQR at the reception desk. Patients appreciate an easy, respectful way to recommend compassionate doctors and clean clinics.',
    bullet1: 'Drives verified patient testimonials on Google Maps',
    bullet2: 'Complies with ethical medical guidance (zero incentives)',
    bullet3: 'Helps new patients choose your practice with confidence',
    statBadge: '4.9 ★ Average Rating',
    image: '/landing/step-2-counter.jpg'
  },
  {
    name: 'Salons & Spas',
    icon: <Scissors size={16} />,
    tagline: 'Beauty & Personal Care',
    headline: 'Capture Instant Praise Right After Great Hair & Styling',
    description: 'Customers love their fresh look right after styling. A 1-tap NFC standee at mirror stations converts compliments into permanent reviews.',
    bullet1: 'Captures peak excitement right after service completion',
    bullet2: 'Builds individual stylist reputations with named shoutouts',
    bullet3: 'Attracts high-value bridal and regular grooming clients',
    statBadge: '+240% Scan Rate',
    image: '/landing/standee-closeup.jpg'
  },
  {
    name: 'Retail Stores',
    icon: <ShoppingBag size={16} />,
    tagline: 'Boutiques & Supermarkets',
    headline: 'Equip Your Checkout Counters with 1-Tap Reviews',
    description: 'Place ReviewQR right beside the UPI payment soundbox. Customers tap their phone while billing is completed in 3 seconds.',
    bullet1: 'Zero friction next to POS billing terminals',
    bullet2: 'Builds local footfall against online ecommerce rivals',
    bullet3: 'Identifies checkout bottlenecks and praised store staff',
    statBadge: 'Top 3 Local SEO',
    image: '/landing/hero-standee-phone.jpg'
  },
  {
    name: 'Auto & Repair',
    icon: <Car size={16} />,
    tagline: 'Automotive & Detailing',
    headline: 'Turn Smooth Vehicle Deliveries into Glowing Testimonials',
    description: 'When vehicle keys are handed back after servicing, hand over the bill with the ReviewQR standee for instant appreciative reviews.',
    bullet1: 'Proves honesty, transparent estimates, and timely delivery',
    bullet2: 'Helps emergency breakdown seekers choose your garage',
    bullet3: 'Builds long-term repeat servicing relationships',
    statBadge: '+310% Repeat Inquiries',
    image: '/landing/step-1-unboxing.jpg'
  }
];

const experiencePresets = [
  { icon: '☕', label: 'Cafe & Dining', prompt: 'Great espresso, fast Wi-Fi, and very polite barista. Loved the cozy ambience!' },
  { icon: '👨‍⚕️', label: 'Doctor Clinic', prompt: 'Dr. Sharma explained everything calmly with zero waiting time. Very clean clinic.' },
  { icon: '💇', label: 'Hair Salon', prompt: 'Fantastic haircut and beard styling by Amit. Super hygienic and professional.' },
  { icon: '🛍️', label: 'Fashion Store', prompt: 'Huge collection of festive wear, reasonable prices, and attentive sales staff.' },
  { icon: '🚗', label: 'Car Service', prompt: 'Quick oil change and thorough wash. Transparent billing without extra charges.' }
];

const replyScenarios = [
  {
    label: 'Praise for Cold Brew & Ambience',
    customerReview: '5/5 stars! The cold brew here is top tier, and the staff is genuinely friendly. Found my new remote work spot in Ahmedabad.',
    customerName: 'Aarav Patel',
    customerTime: 'Today',
    warmReply: 'Thank you so much Aarav! We brew our cold blend fresh for 18 hours, and the team is thrilled you enjoyed the work vibe. See you tomorrow!',
    proReply: 'Dear Aarav, thank you for your kind rating. We take great pride in our cold brew process and productive ambience. We look forward to welcoming you back.'
  },
  {
    label: 'Appreciating Doctor & Gentle Care',
    customerReview: 'Dr. Mehta was extremely gentle with my root canal. No pain at all, and the clinic sanitation is top notch. Highly recommend!',
    customerName: 'Priya Joshi',
    customerTime: 'Yesterday',
    warmReply: 'Thank you Priya for your trust! Root canals can feel daunting, so hearing you were completely comfortable makes our day. Take care!',
    proReply: 'Dear Priya, thank you for sharing your experience. Patient comfort and sterile clinical protocols are our foremost priorities. Wishing you optimal dental health.'
  },
  {
    label: 'Weekend Rush & Prompt Service',
    customerReview: 'Even though the salon was packed on Sunday, Neha managed my hair coloring without any rush. Turned out amazing!',
    customerName: 'Sneha Shah',
    customerTime: '2 days ago',
    warmReply: 'So happy you loved your new color Sneha! Neha is a color magician and we make sure peak rush never compromises care. See you soon!',
    proReply: 'Dear Sneha, thank you for visiting us during our busy weekend. We strive to maintain personalized attention for every guest. Thank you for your recommendation.'
  }
];

const languages = ['English', 'Hindi (हिंदी)', 'Gujarati (ગુજરાતી)', 'Hinglish'];

const primaryFaqs = [
  {
    q: 'Does a customer need to install an app to scan the ReviewQR standee?',
    a: 'No app is needed! On modern iPhones and Android phones, customers simply open their built-in camera or tap their phone near the standee (via contactless NFC). It immediately opens your Google Maps review dialog in their native browser or Google Maps app.'
  },
  {
    q: 'How does contactless NFC tap work on the standee?',
    a: 'Each Loctimize NFC standee has an embedded high-frequency NTAG chip pre-programmed with your business review destination. When an NFC-enabled smartphone comes within 3-4 cm of the standee, a notification instantly pops up on the phone screen asking to leave a review.'
  },
  {
    q: 'Is this compliant with Google’s official review policies?',
    a: '100% compliant. Loctimize provides a frictionless direct gateway for customers to leave honest feedback. We never gate negative reviews, offer prohibited incentives, or post fake bot reviews. Customers submit reviews under their own authenticated Google accounts.'
  },
  {
    q: 'Can I customize the standee with my business logo and brand colors?',
    a: 'Yes! Both our Smart NFC (₹999) and Premium Branded (₹1,499) standees include custom high-resolution printing of your business logo, brand colors, and QR code on durable, scratch-resistant acrylic.'
  },
  {
    q: 'How long does Pan-India delivery take?',
    a: 'Standard orders are custom programmed, printed, quality-tested, and dispatched within 24-48 hours from Ahmedabad. Express courier delivery takes 2 to 4 business days across metro and tier-2 Indian cities.'
  }
];

const socialFeed = [
  { name: 'Urban Brew Coffee Co.', action: 'Generated 28 new Google reviews this week', time: 'Just now' },
  { name: 'Dr. Mehta Dental Clinic', action: 'Achieved 4.9★ rating with 140+ reviews', time: '3m ago' },
  { name: 'The Style Studio Salon', action: 'Ordered 3x Smart NFC Review Standees', time: '8m ago' },
  { name: 'AutoCare Express Garage', action: 'Ranked #1 for "Car repair near me"', time: '14m ago' },
  { name: 'Royal Tandoor Restaurant', action: 'Captured 42 verified table reviews', time: '22m ago' }
];

export function LandingPage() {
  const [pricingTab, setPricingTab] = useState<'products' | 'software'>('products');
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [activeScenario, setActiveScenario] = useState(0);
  const [draftTone, setDraftTone] = useState<'Warm tone' | 'Professional'>('Warm tone');
  const [assistantInput, setAssistantInput] = useState(experiencePresets[0].prompt);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('25 units');
  const [formStatus, setFormStatus] = useState<'idle' | 'ready'>('idle');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [aiCopierStatus, setAiCopierStatus] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dailyCustomers, setDailyCustomers] = useState(120);
  const [feedIndex, setFeedIndex] = useState(0);
  const [feedVisible, setFeedVisible] = useState(true);

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const ticker = setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % socialFeed.length);
    }, 6000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(ticker);
    };
  }, []);

  function handleSelectProduct(productName: string) {
    setSelectedProduct(productName);
    setFormStatus('idle');
    document.getElementById('bulk-inquiry')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (e.currentTarget.reportValidity()) {
      setFormStatus('ready');
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  }

  async function handleUseReplyCopy() {
    const scenario = replyScenarios[activeScenario];
    const replyText = draftTone === 'Warm tone' ? scenario.warmReply : scenario.proReply;
    try {
      await navigator.clipboard.writeText(replyText);
      setAiCopierStatus(true);
      setTimeout(() => setAiCopierStatus(false), 2200);
    } catch {
      setAiCopierStatus(false);
    }
  }

  function closeMobileNav() {
    setIsMobileMenuOpen(false);
  }

  const estimatedMonthlyReviews = Math.round(dailyCustomers * 30 * 0.08);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between">
        <a className="flex items-center gap-2" href="#home" aria-label="Loctimize ReviewQR home" onClick={closeMobileNav}>
          <img src={headerLogo} className="h-8 w-auto object-contain" alt="Loctimize — Optimize Local. Grow Global." />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#products" className="hover:text-blue-600 transition">Review QR</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
          <a href="#features" className="hover:text-blue-600 transition">Features</a>
          <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
          <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="/login" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-blue-600 transition">
            Login <ArrowUpRight size={14} />
          </a>
          <a href="#pricing" className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-1.5">
            Get Your Review QR <ArrowRight size={15} />
          </a>
          <button
            type="button"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white border-b border-slate-200 p-5 shadow-xl z-40 flex flex-col gap-4 text-base font-semibold text-slate-800">
          <a href="#products" onClick={closeMobileNav} className="py-2 border-b border-slate-100">Review QR</a>
          <a href="#how-it-works" onClick={closeMobileNav} className="py-2 border-b border-slate-100">How It Works</a>
          <a href="#features" onClick={closeMobileNav} className="py-2 border-b border-slate-100">Features</a>
          <a href="#pricing" onClick={closeMobileNav} className="py-2 border-b border-slate-100">Pricing</a>
          <a href="#faq" onClick={closeMobileNav} className="py-2 border-b border-slate-100">FAQ</a>
          <div className="pt-2 flex flex-col gap-2">
            <a href="/login" onClick={closeMobileNav} className="text-center py-2 text-blue-600 font-bold border border-blue-200 rounded-xl">
              Login to Account
            </a>
            <a href="#pricing" onClick={closeMobileNav} className="text-center py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-xs">
              Get Your Review QR
            </a>
          </div>
        </div>
      )}

      {/* SCROLL PROGRESS BAR */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-transparent z-50 pointer-events-none">
        <div className="h-full bg-blue-600 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* 2. HERO SECTION */}
      <section id="home" className="scroll-mt-20 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-full px-3.5 py-1 text-xs font-semibold text-slate-600 shadow-2xs mb-5">
              <span className="text-amber-400 font-bold tracking-wider">★★★★★</span>
              <span>4.9 / 5 Rating</span>
              <span className="text-slate-300">·</span>
              <span>Trusted by 1,200+ Businesses in India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#04143c] tracking-tight leading-[1.12]">
              Turn Happy Customers Into <span className="text-blue-600">Google Reviews.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Make it effortless for customers to share their experiences with a simple QR scan or contactless NFC tap. Build unbeatable local Google Maps trust with Loctimize.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <a href="#pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm sm:text-base">
                Get Your Review QR <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-5 py-3.5 rounded-xl transition flex items-center gap-2 text-sm sm:text-base shadow-2xs">
                See How It Works <ArrowDown size={16} />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> QR scan & NFC tap</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> No app needed to scan</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 100% Google policy compliant</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white w-full max-w-md lg:max-w-none">
              <img src={heroImage} alt="Loctimize ReviewQR acrylic standee and customer phone" className="w-full h-auto max-h-[420px] object-cover" loading="eager" />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-full px-3.5 py-1 text-xs font-bold text-blue-700 flex items-center gap-1.5 shadow-sm">
                <Zap size={13} className="text-blue-600 fill-blue-600" /> 1-Tap NFC · No App Needed
              </div>
              <div className="absolute bottom-4 right-4 bg-emerald-600 text-white rounded-full px-3.5 py-1 text-xs font-bold shadow-md flex items-center gap-1">
                ↗ +300% Review Growth
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium">A small touchpoint. An easier way to share.</p>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT SHOWCASE */}
      <section id="products" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 w-full max-w-md lg:max-none mx-auto">
            <img src={standeeCloseup} alt="Loctimize ReviewQR acrylic standee close-up detail" className="w-full h-auto max-h-[440px] object-cover" loading="eager" />
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full px-3.5 py-1 text-xs font-bold text-slate-800 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> QR · NFC · DIRECT LINK
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">ON THE COUNTER · WITHIN REACH</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-3">
              A simple invitation to <span className="text-blue-600">share.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              At your checkout, reception, or dining table, a Review QR standee gives customers an immediate, friction-free path to leave a 5-star Google review.
            </p>
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop size={18} />
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">Easy to display</strong>
                  <span className="text-xs text-slate-500">Place naturally where customers pause at checkout, counters, tables, or waiting areas.</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <QrCode size={18} />
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">Simple for customers to scan</strong>
                  <span className="text-xs text-slate-500">Instantly opens via phone camera scan or fast contactless NFC tap in under 3 seconds.</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <strong className="text-sm font-bold text-blue-900 block">Direct access to your review destination</strong>
                  <span className="text-xs text-blue-700/85">Zero intermediate signups or apps. Ungated direct 5-star Google review landing modal.</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <a href="#pricing" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs transition inline-flex items-center gap-2 text-sm">
                Get Your Review QR <ArrowRight size={15} />
              </a>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Check size={14} className="text-emerald-600" /> No app needed to scan
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INDUSTRY SHOWCASE */}
      <section id="industries" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">BUILT FOR EVERY LOCAL BUSINESS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Tailored for <span className="text-blue-600">Your Industry.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
              See how Loctimize ReviewQR transforms satisfied customers into verified Google 5-star reviews across sectors.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            {industries.map((ind, idx) => (
              <button
                key={ind.name}
                type="button"
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeIndustry === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setActiveIndustry(idx)}
              >
                {ind.icon}
                <span>{ind.name}</span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3">
                {industries[activeIndustry].tagline}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-3">
                {industries[activeIndustry].headline}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {industries[activeIndustry].description}
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {[industries[activeIndustry].bullet1, industries[activeIndustry].bullet2, industries[activeIndustry].bullet3].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition inline-flex items-center gap-2 shadow-xs"
              >
                Get Review QR for {industries[activeIndustry].name} <ArrowRight size={15} />
              </a>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 h-64 sm:h-80">
              <img
                src={industries[activeIndustry].image}
                alt={industries[activeIndustry].headline}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 shadow-sm">
                <span className="text-blue-600 font-extrabold">{industries[activeIndustry].statBadge}</span>
                <span className="text-slate-500 block text-[10px]">Avg. Customer Growth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ROI CALCULATOR */}
      <section id="roi-calculator" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-5xl w-full bg-gradient-to-br from-blue-50/60 via-white to-slate-50/80 border border-blue-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">SEE YOUR POTENTIAL</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-3">
              Estimate Your <span className="text-blue-600">Google Review Growth.</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Slide to see how many verified 5-star Google reviews your business can generate each month with Loctimize ReviewQR.
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700">Daily Customer Footfall:</span>
                <span className="text-sm font-extrabold text-blue-600">{dailyCustomers} customers / day</span>
              </div>
              <input
                type="range"
                min={20}
                max={500}
                step={10}
                value={dailyCustomers}
                onChange={(e) => setDailyCustomers(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                aria-label="Daily Customer Footfall Slider"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2">
                <span>20/day</span>
                <span>150/day</span>
                <span>300/day</span>
                <span>500+/day</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ESTIMATED MONTHLY REVIEWS</span>
              <div className="text-3xl font-extrabold text-blue-600 mt-1">+{estimatedMonthlyReviews} Reviews</div>
              <span className="text-xs text-slate-500">Based on 8% standard NFC tap + QR scan conversion rate</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PROJECTED GOOGLE RATING</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">4.2 ★ ➔ 4.9 ★</div>
              <span className="text-xs text-slate-500">Drown out rare negative ratings with 95%+ happy reviews</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">GOOGLE MAPS SEO RANK</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">Top 3 "Near Me"</div>
              <span className="text-xs text-slate-500">Google local algorithm prioritizes recent high-frequency reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. THREE STEPS FLOW */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-100">
        <div className="max-w-6xl w-full mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Small step. Simple share.</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Three Steps. <span className="text-blue-600">One Simple Experience.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Make your review link easy to find, without deciding what customers say.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="rounded-2xl overflow-hidden h-40 mb-5 border border-slate-100">
                  <img src={step1Img} alt="Unboxing Loctimize Review QR Standee" className="w-full h-full object-cover" loading="eager" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-extrabold text-xs inline-flex items-center justify-center">1</span>
                  <span className="hidden md:inline-flex text-blue-600 text-xs font-bold items-center gap-1">Next Step <ArrowRight size={13} /></span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Get your Review QR</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Choose the standee model and review destination URL for your business.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="rounded-2xl overflow-hidden h-40 mb-5 border border-slate-100">
                  <img src={step2Img} alt="Placing Review QR on counter" className="w-full h-full object-cover" loading="eager" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-extrabold text-xs inline-flex items-center justify-center">2</span>
                  <span className="hidden md:inline-flex text-blue-600 text-xs font-bold items-center gap-1">Next Step <ArrowRight size={13} /></span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Place it at your counter</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Set your QR or NFC + QR standee at checkout, counter, tables, or reception.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="rounded-2xl overflow-hidden h-40 mb-5 border border-slate-100">
                  <img src={step3Img} alt="Customer scanning and sharing Google feedback" className="w-full h-full object-cover" loading="eager" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-extrabold text-xs inline-flex items-center justify-center">3</span>
                  <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1">★ 5-Star Direct</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">Customers scan & share</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Customers share honest feedback in their own words, on their own terms.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LIFESTYLE BANNER */}
      <section id="real-life" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">REAL-WORLD EXPERIENCE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              From the Counter to <span className="text-blue-600">Your Customer's Phone.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              A natural, effortless touchpoint at checkout that turns everyday customer satisfaction into verified 5-star Google reviews.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 max-h-[400px]">
            <img src={lifestyleImg} alt="Real life counter setting: barista and customer interacting with Loctimize standee" className="w-full h-full object-cover max-h-[400px]" loading="eager" />
          </div>
        </div>
      </section>

      {/* 8. AI REVIEW WRITING STUDIO */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">AI CUSTOMER ASSISTANT · YOUR EXPERIENCE, YOUR WORDS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Help Your Customers <span className="text-blue-600">Find the Perfect Words.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Turn quick customer impressions into verified, high-converting Google reviews in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="text-xs font-bold text-slate-500 mr-1">⚡ Try 1-Click Scenario:</span>
            {experiencePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  assistantInput === preset.prompt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setAssistantInput(preset.prompt)}
              >
                <span>{preset.icon}</span> {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-6 items-stretch">
            {/* Left Input */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><PenLine size={15} /></span>
                    Customer Experience Input
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1 text-xs text-slate-700">
                    <Globe size={13} className="text-slate-500" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent border-none text-xs font-medium outline-none cursor-pointer"
                      aria-label="Demo review language"
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  className="w-full h-32 p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:bg-white focus:border-blue-600 transition"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="e.g. Visited the cafe this morning. The cold brew was delicious, cozy interior, and staff was very polite."
                  maxLength={280}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[11px] text-slate-400 font-medium">{assistantInput.length} / 280 chars · Privacy protected</span>
                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <Sparkles size={14} /> AI Drafts Ready Below
                </span>
              </div>
            </div>

            {/* Right Draft Cards */}
            <div className="flex flex-col gap-3 justify-between">
              {[
                {
                  tone: 'Short & Punchy',
                  badge: '⚡ 1-Line Review',
                  sample: '5/5 stars! Super fast checkout and friendly staff. Highly recommend.'
                },
                {
                  tone: 'Friendly & Natural',
                  badge: '✨ Warm & Authentic',
                  sample: 'Visited today and really loved the welcoming vibe. Great quality and polite team.'
                },
                {
                  tone: 'Detailed & Helpful',
                  badge: '🌟 High-Authority',
                  sample: 'Exceptional experience from start to finish. Everything was clean, on time, and accurately priced. Will definitely be a regular.'
                }
              ].map((draft, idx) => (
                <div key={draft.tone} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{draft.tone}</span>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{draft.badge}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 italic">"{draft.sample}"</p>
                  <div className="flex items-center justify-between">
                    <div className="text-amber-400 text-xs font-bold">★★★★★</div>
                    <button
                      type="button"
                      className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      onClick={() => handleCopy(draft.sample, idx)}
                    >
                      {copiedIndex === idx ? <Fragment><Check size={12} className="text-emerald-600" /> Copied!</Fragment> : <Fragment><Copy size={12} /> Copy Draft</Fragment>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. AI OWNER REPLY COPILOT */}
      <section id="ai-replies" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">BUSINESS REPUTATION COPILOT</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Reply to Every Google Review in <span className="text-blue-600">1-Click.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Never stare at an empty reply box again. Generate polite, SEO-optimized owner responses in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Customer Review */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {replyScenarios[activeScenario].customerName.charAt(0)}
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{replyScenarios[activeScenario].customerName}</strong>
                      <span className="text-[11px] text-slate-400">{replyScenarios[activeScenario].customerTime}</span>
                    </div>
                  </div>
                  <div className="text-amber-400 text-xs font-bold">★★★★★</div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  "{replyScenarios[activeScenario].customerReview}"
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Tone:</span>
                <div className="flex bg-slate-200/80 rounded-xl p-1 gap-1 text-xs">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${draftTone === 'Warm tone' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                    onClick={() => setDraftTone('Warm tone')}
                  >
                    Warm Tone
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${draftTone === 'Professional' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                    onClick={() => setDraftTone('Professional')}
                  >
                    Professional
                  </button>
                </div>
              </div>
            </div>

            {/* Right Suggested AI Reply */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-3">
                  <Sparkles size={14} /> AI Owner Response ({draftTone})
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-6 bg-white/80 p-4 rounded-2xl border border-blue-100">
                  {draftTone === 'Warm tone' ? replyScenarios[activeScenario].warmReply : replyScenarios[activeScenario].proReply}
                </p>
              </div>
              <button
                type="button"
                className="self-start bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                onClick={handleUseReplyCopy}
              >
                {aiCopierStatus ? <Fragment><Check size={15} /> Copied to Clipboard!</Fragment> : <Fragment><Sparkles size={15} /> 1-Click Copy Reply</Fragment>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. EVERYDAY BUSINESS GROWTH */}
      <section id="businesses" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">A CONNECTED CUSTOMER FEEDBACK EXPERIENCE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Designed for Everyday <span className="text-blue-600">Business Growth.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Less friction for your customers. More thoughtful conversations and higher rankings for your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><Star size={20} /></div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Get More Reviews</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Put review access directly in front of happy customers right at checkout.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><MessageSquareText size={20} /></div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Manage Feedback Easily</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">One unified inbox for all Google reviews across single or multiple locations.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><Zap size={20} /></div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Save Time with AI Replies</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Generate polite, SEO-optimized owner responses in 1-click without typing fatigue.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><BarChart3 size={20} /></div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Understand Insights</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Identify rating trends, customer sentiment, and operational highlights easily.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6">
            {/* Testimonial */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex items-center gap-5">
              <div className="w-20 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                <img src={ownerImg} alt="Restaurant Owner" className="w-full h-full object-cover" loading="eager" />
              </div>
              <div>
                <div className="text-amber-400 text-xs mb-1.5">★★★★★</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-2">
                  "The Review QR made it so easy for our customers to leave Google reviews. We've seen more feedback than ever before."
                </p>
                <div className="text-xs font-bold text-slate-900">Rajesh Sharma <span className="text-slate-400 font-normal">· Restaurant Owner, Ahmedabad</span></div>
              </div>
            </div>
            {/* CTA Banner */}
            <div className="bg-[#04143c] text-white rounded-3xl p-6 shadow-md flex items-center justify-between gap-5">
              <div>
                <h3 className="text-lg font-bold mb-1">Make Every Customer Experience Easier to Share.</h3>
                <p className="text-xs text-slate-300">Bring QR and NFC review access to your business with Loctimize ReviewQR.</p>
              </div>
              <a href="#pricing" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shrink-0 transition inline-flex items-center gap-1.5 shadow-sm">
                Get Your Review QR <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 11. PRICING SECTION */}
      <section id="pricing" className="scroll-mt-24 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">PLANS THAT GROW WITH YOU</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
                Choose the Right Review QR <span className="text-blue-600">for Your Business.</span>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm">One-time transparent hardware purchase. Separate optional software plans.</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${pricingTab === 'products' ? 'bg-[#04143c] text-white shadow-xs' : 'text-slate-600'}`}
                onClick={() => setPricingTab('products')}
              >
                Physical Products
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${pricingTab === 'software' ? 'bg-[#04143c] text-white shadow-xs' : 'text-slate-600'}`}
                onClick={() => setPricingTab('software')}
              >
                Software Plans
              </button>
            </div>
          </div>

          {pricingTab === 'products' ? (
            <Fragment>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {products.map((prod) => (
                  <article
                    key={prod.name}
                    className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                      prod.recommended
                        ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/40 via-white to-white shadow-xl relative'
                        : 'bg-white border border-slate-200 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{prod.viewLabel}</span>
                        {prod.recommended && (
                          <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">★ BESTSELLER</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 object-contain" loading="eager" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{prod.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{prod.intro}</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-4 mb-4">
                        <div className="flex items-baseline gap-2">
                          <strong className="text-3xl font-extrabold text-[#04143c]">{prod.price}</strong>
                          <span className="text-xs text-slate-500 font-medium">One-time purchase · Lifetime use</span>
                        </div>
                      </div>
                      <ul className="flex flex-col gap-2.5 mb-6">
                        {[prod.access, 'Direct access to your Google Maps review URL', 'No customer app required to scan or tap', prod.custom].map((feat) => (
                          <li key={feat} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        prod.recommended
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                      onClick={() => handleSelectProduct(prod.name)}
                    >
                      {selectedProduct === prod.name ? '✓ Selected for enquiry' : 'Order / Enquire Now'} <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400 mt-6">
                * Transparent one-time hardware purchase. No forced subscriptions or ongoing renewal fees for direct scan routing.
              </p>
            </Fragment>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {softwarePlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                    plan.recommended
                      ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/40 via-white to-white shadow-xl'
                      : 'bg-white border border-slate-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-slate-900">{plan.name}</span>
                      {plan.recommended && (
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">RECOMMENDED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
                    <div className="text-2xl font-extrabold text-[#04143c] mb-4">
                      {plan.price}<small className="text-xs text-slate-500 font-normal"> {plan.cadence}</small>
                    </div>
                    <ul className="flex flex-col gap-2.5 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                          <Check size={14} className="text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                    onClick={() => handleSelectProduct(`${plan.name} software plan`)}
                  >
                    Choose {plan.name}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 12. BULK INQUIRY FORM */}
      <section id="bulk-inquiry" className="scroll-mt-24 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-14 items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">BULK & MULTI-LOCATION ORDERS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-3">
              Equip All Your Counters. <span className="text-blue-600">Scale Google Reviews.</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              From single cafes to 50+ clinic or retail chains — get custom volume pricing with verified setup.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-base">⚡</div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">Pre-Configured Setup</strong>
                  <span className="text-xs text-slate-500">Each standee is linked directly to your Google Maps review URL before dispatch.</span>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-base">📦</div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">Pan-India Express Delivery</strong>
                  <span className="text-xs text-slate-500">Doorstep courier tracking across all Indian pin codes within 2-4 business days.</span>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 text-base">🛡️</div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">Zero Advance Payment</strong>
                  <span className="text-xs text-slate-500">Review digital specifications and brand proofs before final confirmation.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <strong className="text-base font-bold text-slate-900">Explore Business Enquiry</strong>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Fast 2-hour response</span>
            </div>
            {selectedProduct && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-1.5 rounded-lg mb-4 flex items-center justify-between">
                <span>Selected product: <strong>{selectedProduct}</strong></span>
                <button type="button" className="text-blue-500 hover:text-blue-700 cursor-pointer" onClick={() => setSelectedProduct('')}>✕</button>
              </div>
            )}
            <form ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Company Name *
                  <input name="company" required placeholder="Business or brand name" className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Contact Person *
                  <input name="contact" required placeholder="Your name" className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Mobile Number *
                  <input name="mobile" required placeholder="+91 98765 43210" className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Business Email *
                  <input name="email" type="email" required placeholder="you@company.com" className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Number of Locations *
                  <input name="locations" type="number" required min={1} defaultValue={1} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Quantity to Explore *
                  <select name="quantity" required value={selectedQuantity} onChange={(e) => setSelectedQuantity(e.target.value)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition cursor-pointer">
                    {['1 unit (Trial sample)', '5-10 units', '10-25 units', '25-50 units', '50-100 units', '100+ units'].map((qty) => (
                      <option key={qty} value={qty}>{qty}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Product Choice *
                <select name="product" required value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition cursor-pointer">
                  <option value="" disabled>Select product or plan</option>
                  {products.map((prod) => (
                    <option key={prod.name} value={prod.name}>{prod.name}</option>
                  ))}
                  {softwarePlans.map((plan) => (
                    <option key={plan.name} value={`${plan.name} software plan`}>{plan.name} software plan</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Special Requirements (Optional)
                <input name="message" placeholder="Custom logo, multiple delivery addresses, or questions" className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-600 transition" />
              </label>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm mt-2 cursor-pointer"
              >
                {formStatus === 'ready' ? '✓ Enquiry Details Ready! We will contact you shortly' : 'Submit Business Enquiry'} <ArrowRight size={16} />
              </button>
              <span className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5 mt-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Zero spam guarantee · 100% confidential
              </span>
            </form>
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION */}
      <section id="faq" className="scroll-mt-24 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-14 items-start">
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">CLEAR ANSWERS · NO JARGON</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04143c] tracking-tight mt-1 mb-2">
              Everything you <span className="text-blue-600">need to know.</span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Common questions about ReviewQR acrylic standees, contactless NFC tap, and honest Google reviews.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="text-xs font-bold text-blue-600 block mb-1">💬 Have a specific question?</span>
              <p className="text-xs text-slate-500 mb-3">Our India-based product team is ready to help you choose the right standees.</p>
              <a href="#bulk-inquiry" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Ask about ReviewQR <ArrowRight size={13} />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {primaryFaqs.map((faq, idx) => (
              <details key={faq.q} className="group bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-blue-400 hover:shadow-xs">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none select-none">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-bold text-slate-900 text-left">{faq.q}</span>
                  </div>
                  <div className="text-blue-600 shrink-0">
                    <Plus size={16} className="group-open:hidden" />
                    <Minus size={16} className="hidden group-open:block" />
                  </div>
                </summary>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100 mb-0">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 14. FOOTER */}
      <footer className="w-full bg-[#04143c] text-white py-14 px-4 sm:px-8 lg:px-12 border-t border-slate-800">
        <div className="max-w-6xl w-full mx-auto flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            <div className="md:col-span-1">
              <a href="#home" aria-label="Loctimize home">
                <img src={footerLogo} className="h-8 w-auto mb-3" alt="Loctimize — Optimize Local. Grow Global." />
              </a>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                ReviewQR makes it easier for customers to find your review link — on their own terms.
              </p>
              <span className="text-[11px] text-slate-500 block">
                Loctimize is an independent product and is not affiliated with Google.
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Products</h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                {products.map((prod) => (
                  <li key={prod.name}>
                    <button type="button" className="hover:text-white transition text-left cursor-pointer" onClick={() => handleSelectProduct(prod.name)}>
                      {prod.name}
                    </button>
                  </li>
                ))}
                <li><a href="#pricing" className="hover:text-white transition">Proposed plans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Solutions</h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Review writing help</a></li>
                <li><a href="#ai-replies" className="hover:text-white transition">AI-assisted replies</a></li>
                <li><a href="#features" className="hover:text-white transition">Review QR features</a></li>
                <li><a href="#businesses" className="hover:text-white transition">Business benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Contact & Support</h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                <li><span>Ahmedabad, Gujarat, India</span></li>
                <li><a href="mailto:support@loctimize.in" className="hover:text-white transition">support@loctimize.in</a></li>
                <li><a href="#bulk-inquiry" className="hover:text-white transition">Corporate Enquiries</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} Loctimize Technologies. All rights reserved.</div>
            <div className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Google Guidelines Compliant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 15. FLOATING LIVE SOCIAL PROOF TOAST */}
      {feedVisible && (
        <div className="fixed bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl flex items-center gap-3 max-w-sm transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="text-xs">
            <strong className="text-slate-900 block font-semibold">{socialFeed[feedIndex].name}</strong>
            <span className="text-slate-500 text-[11px] block">{socialFeed[feedIndex].action} · {socialFeed[feedIndex].time}</span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 ml-auto cursor-pointer"
            onClick={() => setFeedVisible(false)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
