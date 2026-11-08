import React, { useState, useRef, Fragment } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
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
  Wifi,
  X,
  Star,
  Zap,
  BarChart3,
  Sparkles,
  Laptop,
  Link as LinkIcon
} from 'lucide-react';
import './LandingPage.css';

// Brand Assets
const headerLogo = '/loctimize-logo-header.png';
const footerLogo = '/loctimize-logo-footer.png';
const counterBase = '/loctimize-reviewqr-counter.jpg';

// Visual Blueprint Assets
const heroImage = '/landing/hero-standee-phone.jpg';
const standeeCloseup = '/landing/standee-closeup.jpg';
const step1Img = '/landing/step-1-unboxing.jpg';
const step2Img = '/landing/step-2-counter.jpg';
const step3Img = '/landing/step-3-mobile-review.jpg';
const lifestyleImg = '/landing/real-life-counter-usage.jpg';
const dashboardImg = '/landing/dashboard-laptop-overview.jpg';
const ownerImg = '/landing/restaurant-owner.jpg';
const finalCtaImg = '/landing/final-cta-laptop-standee.jpg';

interface Product {
  name: string;
  price: string;
  intro: string;
  access: string;
  custom: string;
  index: string;
  view: string;
  viewLabel: string;
  recommended?: boolean;
}

const products: Product[] = [
  {
    name: 'QR Review Standee',
    price: '₹499',
    intro: 'A simple scan-and-go way to share your review link.',
    access: 'QR scan',
    custom: 'Ask about custom branding',
    index: '01',
    view: 'qr-detail',
    viewLabel: 'QR access'
  },
  {
    name: 'NFC + QR Smart Review Standee',
    price: '₹999',
    intro: 'Two easy ways for customers to reach your review page.',
    access: 'QR scan + NFC tap',
    custom: 'Ask about custom branding',
    index: '02',
    view: 'scan-and-tap',
    viewLabel: 'Scan + tap access',
    recommended: true
  },
  {
    name: 'Premium Branded NFC Review Standee',
    price: '₹1,499',
    intro: 'A branded touchpoint with convenient QR and NFC access.',
    access: 'QR scan + NFC tap',
    custom: 'Branded finish available by inquiry',
    index: '03',
    view: 'standee-detail',
    viewLabel: 'Branding by enquiry'
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
    name: 'Starter',
    price: '₹199',
    cadence: '/ month',
    description: 'For one business location getting started.',
    features: ['1 location', 'QR engagement analytics', 'Entry-level AI assistance']
  },
  {
    name: 'Growth',
    price: '₹499',
    cadence: '/ month',
    description: 'For growing teams and up to three locations.',
    features: ['Up to 3 locations', 'Expanded analytics', 'AI-assisted owner replies'],
    recommended: true
  },
  {
    name: 'Business',
    price: '₹999',
    cadence: '/ month',
    description: 'For teams managing up to ten locations.',
    features: ['Up to 10 locations', 'Central location management', 'Team access']
  }
];

const allFaqs = [
  {
    q: 'What is Loctimize ReviewQR?',
    a: 'ReviewQR is a QR and NFC review-collection product concept paired with optional tools for writing assistance and review management. Product availability and software capabilities should be confirmed before purchase.'
  },
  {
    q: 'How does the QR review standee work?',
    a: 'A customer scans the QR code to open the review destination configured for the business. An NFC-enabled version also lets customers tap a compatible phone.'
  },
  {
    q: 'What is the difference between QR and NFC?',
    a: 'A QR code is opened by scanning with a phone camera. NFC allows a compatible phone to open the configured destination with a tap. A product may support one or both methods.'
  },
  {
    q: 'Do customers need to install an app?',
    a: 'No app download is needed for a QR scan or NFC tap that opens a web link. The destination and any account requirements depend on the service that opens.'
  },
  {
    q: 'Can customers write reviews in Hindi or Gujarati?',
    a: 'The live demo includes English, Hindi, Gujarati and Hinglish language choices. The available language options in a production service depend on its configured capabilities.'
  },
  {
    q: 'How does AI-assisted review writing work?',
    a: 'The assistant can help customers express only the details they provide. Customers can edit or ignore every suggestion and choose independently whether to share a review.'
  },
  {
    q: 'Can customers leave an honest negative review?',
    a: 'Yes. The experience should offer the same Google review path to everyone, regardless of rating or whether their experience was positive, mixed or negative.'
  },
  {
    q: 'Can I connect multiple business locations?',
    a: 'Multi-location management is part of the proposed software plans. Which locations and account capabilities are available should be confirmed before signup.'
  },
  {
    q: 'Does the software connect to Google Business Profile?',
    a: 'A live Google Business Profile connection has not been configured for this homepage. Account connection and supported management features must be verified before subscribing.'
  },
  {
    q: 'Are software subscriptions separate from hardware?',
    a: 'Yes. The displayed physical-product and monthly software prices are separate proposed prices; hardware is purchased separately from any software plan.'
  },
  {
    q: 'Can I change the connected review link?',
    a: 'A business would use its configured review destination. Link-changing controls in the production app have not been verified here.'
  },
  {
    q: 'How do corporate bulk orders work?',
    a: "Share the company, location count and quantity you're exploring using the inquiry form. The form is a preview and does not send a message until contact handling is connected."
  },
  {
    q: 'What happens if my subscription expires?',
    a: 'Subscription status, renewal and the treatment of data after a plan ends have not been confirmed. Please confirm the applicable terms before purchasing.'
  },
  {
    q: 'How are review suggestions and customer data handled?',
    a: 'This preview does not send demo input to an AI service. Privacy, retention and data-handling terms for any live service must be confirmed in the published product policies.'
  }
];

const primaryFaqs = [allFaqs[0], allFaqs[1], allFaqs[2], allFaqs[3], allFaqs[9], allFaqs[6]];
const extraFaqs = allFaqs.filter(faq => !primaryFaqs.some(p => p.q === faq.q));

const languages = ['English', 'Hindi', 'Gujarati', 'Hinglish'];

function getSuggestions(text: string): string[] {
  const t = text.trim();
  return [
    `My experience: ${t}`,
    `In my own words, ${t}`,
    `Here’s what I’d like to share: ${t}`
  ];
}

function FaqItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  return (
    <details className="faq-item">
      <summary>
        <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
        <span>{faq.q}</span>
        <span className="faq-icon">
          <Plus className="faq-plus" size={17} />
          <Minus className="faq-minus" size={17} />
        </span>
      </summary>
      <p>{faq.a}</p>
    </details>
  );
}

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pricingTab, setPricingTab] = useState<'products' | 'software'>('products');
  const [demoStep, setDemoStep] = useState(0);
  const [demoRating, setDemoRating] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [demoFeedback, setDemoFeedback] = useState('');
  const [demoSuggestions, setDemoSuggestions] = useState<string[] | null>(null);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantSuggestions, setAssistantSuggestions] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('25');
  const [formStatus, setFormStatus] = useState<'idle' | 'ready'>('idle');
  const [aiCopierStatus, setAiCopierStatus] = useState(false);
  const [draftTone, setDraftTone] = useState<'Warm tone' | 'Professional'>('Warm tone');
  const formRef = useRef<HTMLFormElement | null>(null);

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

  function handleGenerateDemoPrompt() {
    if (demoFeedback.trim()) {
      setDemoSuggestions(getSuggestions(demoFeedback));
    }
  }

  function handleGenerateAssistantPrompt() {
    if (assistantInput.trim()) {
      setAssistantSuggestions(getSuggestions(assistantInput));
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  }

  async function handleUseReplyCopy() {
    const replyText = "Thank you, Ritu! We're glad you had a great experience. We look forward to serving you again!";
    try {
      await navigator.clipboard.writeText(replyText);
      setAiCopierStatus(true);
      window.setTimeout(() => setAiCopierStatus(false), 2200);
    } catch {
      setAiCopierStatus(false);
    }
  }

  function closeMobileNav() {
    setIsMobileMenuOpen(false);
  }

  return (
    <main className="rr-home" id="home">
      {/* HEADER */}
      <header className="site-header">
        <a className="brand-lockup" href="#home" aria-label="Loctimize ReviewQR home" onClick={closeMobileNav}>
          <img src={headerLogo} className="header-logo" alt="Loctimize — Optimize Local. Grow Global." />
        </a>

        <nav className={isMobileMenuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="#products" onClick={closeMobileNav}>Review QR</a>
          <a href="#how-it-works" onClick={closeMobileNav}>How It Works</a>
          <a href="#features" onClick={closeMobileNav}>Features</a>
          <a href="#pricing" onClick={closeMobileNav}>Pricing</a>

          <div className="mobile-nav-actions">
            <a className="mobile-login-link" href="/login" onClick={closeMobileNav}>
              Open ReviewQR <ArrowUpRight size={15} />
            </a>
            <a href="#pricing" onClick={closeMobileNav} className="rr-button">
              Get Your Review QR <ArrowRight size={16} />
            </a>
          </div>
        </nav>

        <div className="header-actions">
          <a href="/login" className="login-link">
            Login <ArrowUpRight size={14} />
          </a>
          <a href="#pricing" className="rr-button header-cta">
            Get Your Review QR <ArrowRight size={15} />
          </a>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION (MAIN PRODUCT + CUSTOMER PHONE) */}
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">LOCTIMIZE REVIEW QR</span>
          <h1>
            Turn Happy Customers Into <span>Google Reviews.</span>
          </h1>
          <p className="hero-description">
            Make it easy for customers to share their experiences with a simple QR scan. Build a stronger online reputation with Loctimize.
          </p>
          <div className="hero-ctas">
            <a href="#pricing" className="rr-button rr-button-large hero-purchase-button">
              Get Your Review QR <ArrowRight size={20} />
            </a>
            <a href="#how-it-works" className="rr-button rr-button-outline rr-button-large">
              See How It Works <ArrowDown size={20} />
            </a>
          </div>
          <div className="hero-note">
            <span><Check size={18} /> QR scan & NFC tap</span>
            <span><Check size={18} /> No app needed to scan</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-wrap">
            <img
              src={heroImage}
              className="hero-product-image"
              alt="QR and NFC review standee prominently displayed on a bright business counter beside a customer's phone"
              width={1024}
              height={1024}
              fetchPriority="high"
            />
          </div>
          <span className="hero-photo-caption">A small touchpoint. An easier way to share.</span>
        </div>
      </section>

      {/* 2. A SIMPLE WAY SECTION (PRODUCT CLOSE-UP + MODERN FEATURE PILLS) */}
      <section className="product-section section-wrap" id="products">
        <div className="section-heading product-section-heading">
          <div>
            <span className="eyebrow">THE PRODUCT</span>
            <h2>
              A Simple Way to Make Reviewing <span>Your Business Easier.</span>
            </h2>
          </div>
          <p>Easy to display. Simple to scan. Direct access to your review destination.</p>
        </div>

        <div className="product-layout">
          <div className="product-gallery">
            <div className="product-image-large product-detail-crop">
              <img
                src={standeeCloseup}
                alt="Loctimize ReviewQR acrylic standee close-up detail"
                loading="lazy"
                width={1024}
                height={1024}
              />
              <span className="image-note">
                <span className="tiny-green-dot" /> QR · NFC · YOUR REVIEW LINK
              </span>
            </div>
            <div className="product-gallery-footer">
              <div>
                <span>STANDEE DETAIL</span>
                <span>PLACE IT WHERE CUSTOMERS ARE</span>
              </div>
              <a href="#how-it-works" aria-label="Learn how ReviewQR works">
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <div className="product-introduction" id="industries">
            <span className="eyebrow">ON THE COUNTER. WITHIN REACH.</span>
            <h3>A simple invitation to share.</h3>
            <p>At your checkout, reception or table, a Review QR standee gives customers a direct path to your review destination.</p>
            
            {/* 3 Modern Feature Pills matching the Blueprint */}
            <div className="feature-pills-list">
              <div className="feature-pill-card">
                <span className="feature-pill-icon"><Laptop size={22} /></span>
                <div className="feature-pill-content">
                  <strong>Easy to display</strong>
                  <span>Place it naturally where customers pause at checkout or tables.</span>
                </div>
              </div>
              <div className="feature-pill-card">
                <span className="feature-pill-icon"><QrCode size={22} /></span>
                <div className="feature-pill-content">
                  <strong>Simple for customers to scan</strong>
                  <span>Instantly opens via phone camera scan or fast NFC tap.</span>
                </div>
              </div>
              <div className="feature-pill-card">
                <span className="feature-pill-icon"><LinkIcon size={22} /></span>
                <div className="feature-pill-content">
                  <strong>Direct access to your review destination</strong>
                  <span>Zero middle apps. Ungated direct Google review landing page.</span>
                </div>
              </div>
            </div>

            <a href="#pricing" className="rr-button">
              Get Your Review QR <ArrowRight size={18} />
            </a>
            <p className="proposed-note">Product photography is illustrative. Final specifications and availability will be confirmed before purchase.</p>
          </div>
        </div>

        <div className="value-strip">
          <span>DESIGNED FOR EVERYDAY BUSINESS</span>
          <div>
            <span><Check size={14} /> Choose QR or NFC + QR</span>
            <i />
            <span><Check size={14} /> Honest, ungated reviews</span>
            <i />
            <span><Check size={14} /> No app needed to scan</span>
          </div>
          <a href="#pricing">See proposed pricing <ArrowRight size={15} /></a>
        </div>
      </section>

      {/* 3. THREE STEPS SECTION (VISUAL 3-PHOTO PROCESS FLOW) */}
      <section className="how-section section-wrap" id="how-it-works">
        <div className="section-heading centered-heading">
          <span className="eyebrow">Small step. Simple share.</span>
          <h2>Three Steps. <span>One Simple Experience.</span></h2>
          <p>Make your review link easy to find, without deciding what customers say.</p>
        </div>

        <div className="process-flow-wrap">
          {/* Step 1 */}
          <article className="process-flow-card">
            <div className="process-flow-img-wrap">
              <img src={step1Img} alt="Unboxing Loctimize Review QR Standee" loading="lazy" />
            </div>
            <div className="process-flow-body">
              <span className="process-step-badge">1</span>
              <h3>Get your Review QR</h3>
              <p>Choose the standee and review destination for your business.</p>
            </div>
          </article>

          <span className="process-flow-arrow"><MoveRight size={28} /></span>

          {/* Step 2 */}
          <article className="process-flow-card">
            <div className="process-flow-img-wrap">
              <img src={step2Img} alt="Placing Review QR on counter" loading="lazy" />
            </div>
            <div className="process-flow-body">
              <span className="process-step-badge">2</span>
              <h3>Place it at your counter</h3>
              <p>Set your QR or NFC + QR standee at checkout, counter, or reception.</p>
            </div>
          </article>

          <span className="process-flow-arrow"><MoveRight size={28} /></span>

          {/* Step 3 */}
          <article className="process-flow-card">
            <div className="process-flow-img-wrap">
              <img src={step3Img} alt="Customer scanning and sharing Google feedback" loading="lazy" />
            </div>
            <div className="process-flow-body">
              <span className="process-step-badge">3</span>
              <h3>Customers scan and share feedback</h3>
              <p>Customers share honest feedback in their own words, on their own terms.</p>
            </div>
          </article>
        </div>
      </section>

      {/* 4. REAL-LIFE USAGE SETTING SECTION (NEW LIFESTYLE BANNER) */}
      <section className="lifestyle-section section-wrap">
        <div className="section-heading centered-heading">
          <span className="eyebrow">REAL-WORLD EXPERIENCE</span>
          <h2>From the Counter to <span>Your Customer's Phone.</span></h2>
          <p>A natural, effortless touchpoint at checkout that turns everyday customer satisfaction into verified 5-star Google reviews.</p>
        </div>

        <div className="lifestyle-card">
          <img
            src={lifestyleImg}
            alt="Real life counter setting: barista and customer interacting with Loctimize standee on counter"
            loading="lazy"
          />
          <div className="lifestyle-overlay-badge">
            <div className="lifestyle-badge-title">
              <span className="tiny-green-dot" /> LIVE AT CHECKOUT
            </div>
            <div className="lifestyle-badge-text">
              Fits effortlessly into cafes, restaurants, clinics, salons, and retail counters.
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAAS ECOSYSTEM & DASHBOARD SHOWCASE */}
      <section className="assistant-section section-wrap" id="features">
        <span id="ai-assistant" className="anchor-point" />
        <div className="assistant-heading">
          <div>
            <span className="eyebrow">AI & SOFTWARE ECOSYSTEM · BEYOND HARDWARE</span>
            <h2>Your Review QR Is <span>Just the Beginning.</span></h2>
          </div>
          <p>Pair your physical standees with Loctimize’s central review management, growth analytics, and AI response assistant.</p>
        </div>

        {/* Retina Vector Laptop Showcase (Infinitely Crisp - Zero Blur) */}
        <div className="mac-laptop-mockup">
          <div className="mac-laptop-camera" />
          <div className="mac-laptop-screen">
            <div className="mac-laptop-topbar">
              <div className="mac-window-controls">
                <span className="mac-win-dot red" />
                <span className="mac-win-dot yellow" />
                <span className="mac-win-dot green" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#04143c' }}>
                <img src={headerLogo} alt="Loctimize" style={{ height: '18px' }} />
                <span>· Reviews Console</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                <span className="tiny-green-dot" /> Live Sync
              </div>
            </div>

            <div className="mac-dash-body">
              <aside className="mac-dash-sidebar">
                <div className="mac-sidebar-item active">
                  <BarChart3 size={16} /> Overview
                </div>
                <div className="mac-sidebar-item">
                  <Star size={16} /> Reviews
                </div>
                <div className="mac-sidebar-item">
                  <Sparkles size={16} /> AI Replies
                </div>
                <div className="mac-sidebar-item">
                  <QrCode size={16} /> QR Studio
                </div>
              </aside>

              <main className="mac-dash-main">
                <div className="mac-dash-header">
                  <div>
                    <h4>Reviews Overview</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Connected to Google Business Profile</p>
                  </div>
                  <span style={{ fontSize: '12px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', color: '#334155', fontWeight: 500 }}>
                    Last 30 Days ▼
                  </span>
                </div>

                <div className="mac-dash-kpi-grid">
                  <div className="mac-kpi-card">
                    <span>Total Reviews</span>
                    <strong>248</strong>
                    <small>▲ +18% vs last month</small>
                  </div>
                  <div className="mac-kpi-card">
                    <span>Average Rating</span>
                    <strong>4.6 ★</strong>
                    <small style={{ color: '#f59e0b' }}>★★★★★ (92% positive)</small>
                  </div>
                  <div className="mac-kpi-card">
                    <span>New Reviews</span>
                    <strong>+32</strong>
                    <small style={{ color: '#2563eb' }}>⚡ 100% replied with AI</small>
                  </div>
                </div>

                <div className="mac-dash-charts">
                  <div className="mac-chart-box">
                    <h5>Monthly Reviews Growth</h5>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', paddingTop: '10px' }}>
                      {[
                        { m: 'Jun', h: 42, v: '18' },
                        { m: 'Jul', h: 56, v: '24' },
                        { m: 'Aug', h: 68, v: '29' },
                        { m: 'Sep', h: 74, v: '31' },
                        { m: 'Oct', h: 86, v: '36' },
                        { m: 'Nov', h: 100, v: '48' }
                      ].map(bar => (
                        <div key={bar.m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{bar.v}</span>
                          <div style={{ width: '28px', height: `${bar.h}px`, background: 'linear-gradient(180deg, #003cb7 0%, #00a4f4 100%)', borderRadius: '4px 4px 0 0' }} />
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#334155' }}>{bar.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mac-chart-box">
                    <h5>Rating Sentiment</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {[
                        { s: '5 Stars', pct: 82, c: '#16a34a' },
                        { s: '4 Stars', pct: 12, c: '#22c55e' },
                        { s: '3 Stars', pct: 4, c: '#f59e0b' },
                        { s: '1-2 Stars', pct: 2, c: '#ef4444' }
                      ].map(row => (
                        <div key={row.s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                          <span style={{ width: '48px', color: '#475569' }}>{row.s}</span>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${row.pct}%`, height: '100%', background: row.c, borderRadius: '4px' }} />
                          </div>
                          <span style={{ width: '28px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>{row.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
          <div className="mac-laptop-base">
            <div className="mac-laptop-notch" />
          </div>
        </div>

        <div className="dashboard-metrics-row">
          <div className="dashboard-metric-pill">
            <span className="dashboard-metric-icon"><Star size={20} /></span>
            <div className="dashboard-metric-data">
              <strong>248</strong>
              <span>Total Reviews Tracked</span>
            </div>
          </div>
          <div className="dashboard-metric-pill">
            <span className="dashboard-metric-icon"><CheckCircle2 size={20} /></span>
            <div className="dashboard-metric-data">
              <strong>4.6 ★</strong>
              <span>Average Google Rating</span>
            </div>
          </div>
          <div className="dashboard-metric-pill">
            <span className="dashboard-metric-icon"><BarChart3 size={20} /></span>
            <div className="dashboard-metric-data">
              <strong>+32</strong>
              <span>New Reviews This Month</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE WORKSPACE (PHONE SIMULATOR & ASSISTANT) */}
        <div className="demo-intro">
          <div>
            <span className="eyebrow">TRY THE INTERACTIVE EXPERIENCE</span>
            <h2>See What Your Customers <span>Experience.</span></h2>
          </div>
          <p>Try the customer journey below. This preview runs entirely in your browser; no real review is submitted.</p>
          <div className="language-control">
            <label htmlFor="demo-language">Select customer demo language</label>
            <select
              id="demo-language"
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="demo-workspace" id="live-demo">
          <div className="demo-steps" role="tablist" aria-label="Customer review demo steps">
            {['Scan or tap', 'Share your experience', 'Choose what’s next'].map((label, idx) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={demoStep === idx}
                className={demoStep === idx ? 'demo-step active' : 'demo-step'}
                onClick={() => setDemoStep(idx)}
              >
                <span>{String(idx + 1).padStart(2, '0')}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="phone-preview-wrap">
            <div className="phone-device">
              <div className="phone-camera" />
              <div className="phone-screen">
                <div className="phone-status">
                  <span>9:41</span>
                  <span>•••　◖</span>
                </div>
                <div className="phone-brand">
                  Loctimize<span>ReviewQR</span>
                </div>

                {demoStep === 0 && (
                  <div className="phone-stage phone-stage-scan">
                    <span className="phone-eyebrow">WELCOME TO YOUR DEMO</span>
                    <h3>Make feedback feel easy.</h3>
                    <p>A quick scan, a clear choice and an experience that's yours to share.</p>
                    <div className="phone-review-stamp">
                      <QrCode size={43} />
                      <span>SCAN OR TAP</span>
                    </div>
                    <div className="phone-language-pill">
                      <Globe size={13} /> {selectedLanguage}
                    </div>
                    <button type="button" className="rr-button phone-button" onClick={() => setDemoStep(1)}>
                      Start the demo <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {demoStep === 1 && (
                  <div className="phone-stage">
                    <span className="phone-eyebrow">YOUR EXPERIENCE, YOUR WORDS</span>
                    <h3>How was your experience?</h3>
                    <p>All feedback is welcome. Your rating will never change your next step.</p>
                    <div className="rating-picker" aria-label="Choose an optional rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={demoRating >= star ? 'rating-star selected' : 'rating-star'}
                          onClick={() => setDemoRating(star)}
                          aria-label={`Rate ${star} out of 5`}
                          aria-pressed={demoRating === star}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <label className="phone-input-label" htmlFor="customer-experience">
                      What would you like to share?
                    </label>
                    <textarea
                      id="customer-experience"
                      value={demoFeedback}
                      onChange={e => setDemoFeedback(e.target.value)}
                      placeholder="Share your real experience..."
                      maxLength={280}
                    />
                    <span className="character-count">{demoFeedback.length} / 280</span>
                    {demoSuggestions && (
                      <div className="demo-output">
                        <span>YOUR DRAFT · {selectedLanguage.toUpperCase()}</span>
                        <p>{demoSuggestions[0]}</p>
                      </div>
                    )}
                    <button type="button" className="demo-help-link" onClick={handleGenerateDemoPrompt}>
                      <PenLine size={14} /> {demoSuggestions ? 'Refresh wording suggestion' : 'Help me find the words'}
                    </button>
                    <button type="button" className="rr-button phone-button" onClick={() => setDemoStep(2)}>
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="phone-stage phone-stage-done">
                    <span className="phone-success-icon"><Check size={25} /></span>
                    <span className="phone-eyebrow">DEMO · YOUR CHOICE</span>
                    <h3>Your feedback. Your next step.</h3>
                    <p>Reviews can be honest, mixed or positive. You decide what to share.</p>
                    <div className="review-direct-note">
                      <Globe size={18} />
                      <span>Google is available to everyone, regardless of rating.</span>
                    </div>
                    <a href="https://www.google.com/" target="_blank" rel="noreferrer" className="rr-button google-demo-link">
                      Continue to Google <ArrowUpRight size={14} />
                    </a>
                    <button
                      type="button"
                      className="start-over-link"
                      onClick={() => {
                        setDemoStep(0);
                        setDemoRating(0);
                        setDemoFeedback('');
                        setDemoSuggestions(null);
                      }}
                    >
                      Start over <ChevronLeft size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="demo-workspace-foot">
              <span><span className="tiny-green-dot" /> SIMULATED CUSTOMER EXPERIENCE</span>
              <span>No review is created, stored or submitted.</span>
            </div>
          </div>
        </div>

        {/* AI WRITING ASSISTANT FOR CUSTOMERS */}
        <div className="assistant-workspace" style={{ marginTop: '48px' }}>
          <div className="assistant-form">
            <div className="assistant-card-heading">
              <span className="assistant-orb"><PenLine size={20} /></span>
              <span>
                <strong>Review writing assistant</strong>
                <small>Suggestions based on your own experience</small>
              </span>
              <span className="assistant-demo-tag">PREVIEW</span>
            </div>
            <label className="field-label" htmlFor="writing-experience">
              What was your experience?
            </label>
            <textarea
              className="assistant-textarea"
              id="writing-experience"
              value={assistantInput}
              onChange={e => setAssistantInput(e.target.value)}
              placeholder="For example: I visited the café on Saturday. The tea was comforting, and it took a little longer than I expected to get the bill."
              maxLength={280}
            />
            <div className="assistant-field-foot">
              <span>Only use details you’re comfortable sharing.</span>
              <span>{assistantInput.length} / 280</span>
            </div>
            <label className="assistant-language-label" htmlFor="assistant-language">
              Language
            </label>
            <select
              className="assistant-language-select"
              id="assistant-language"
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button className="rr-button assistant-generate" onClick={handleGenerateAssistantPrompt}>
              <PenLine size={16} /> Create wording options <ArrowRight size={16} />
            </button>
            <p className="assistant-privacy">
              <CheckCircle2 size={14} /> This preview runs locally and doesn’t send your text.
            </p>
          </div>

          <div className="suggestion-panel">
            <div className="suggestion-panel-top">
              <div>
                <span className="eyebrow">YOUR EXPERIENCE. YOUR WORDS.</span>
                <h3>Choose what sounds like you.</h3>
              </div>
              <span className="suggestion-language">{selectedLanguage}</span>
            </div>

            {(assistantSuggestions || [
              'Add your own experience to see a short wording option.',
              'Your details stay yours to edit.',
              'Nothing is sent to Google from this preview.'
            ]).map((suggestion, idx) => (
              <article key={idx} className="suggestion-row">
                <div className="suggestion-title">
                  <span>{['Short & simple', 'Friendly & natural', 'Detailed & balanced'][idx]}</span>
                  <button
                    type="button"
                    className="copy-suggestion"
                    aria-label={`Copy ${['short and simple', 'friendly and natural', 'detailed and balanced'][idx]} suggestion`}
                    onClick={() => handleCopy(suggestion, idx)}
                  >
                    <Copy size={14} />
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  aria-label={`${['Short and simple', 'Friendly and natural', 'Detailed and balanced'][idx]} editable suggestion`}
                  value={suggestion}
                  onChange={e => {
                    const newVal = e.target.value;
                    setAssistantSuggestions(prev => {
                      const base = prev || [
                        'Add your own experience to see a short wording option.',
                        'Your details stay yours to edit.',
                        'Nothing is sent to Google from this preview.'
                      ];
                      const next = [...base];
                      next[idx] = newVal;
                      return next;
                    });
                  }}
                />
              </article>
            ))}

            <div className="suggestion-foot">
              <span>Customer control</span>
              <span>Accept, edit or ignore every suggestion. You decide whether to publish.</span>
            </div>
          </div>
        </div>

        {/* 6. AI REPLY COPILOT (INTERACTIVE REVIEW -> AI REPLY CARD) */}
        <div className="reply-section" id="ai-replies">
          <div className="section-heading centered-heading" style={{ marginBottom: '24px' }}>
            <span className="eyebrow">A draft, never an autopilot</span>
            <h2>Respond Thoughtfully. <span>Save time.</span></h2>
            <p>Explore an interactive owner-reply example. Review every draft; nothing posts automatically.</p>
          </div>

          {/* Interactive Comparison Card from Blueprint Panel 6 */}
          <div className="ai-reply-card-comparison">
            {/* Left: Customer Review Card */}
            <div className="review-incoming-card">
              <div className="review-incoming-header">
                <span className="review-avatar-badge">R</span>
                <div className="review-incoming-info">
                  <strong>Ritu Sharma</strong>
                  <small>2 days ago</small>
                  <div className="review-stars-gold">★★★★★</div>
                </div>
              </div>
              <p className="review-incoming-text">
                “Great service and friendly staff!”
              </p>
            </div>

            {/* Middle: Flow Arrow */}
            <div className="ai-comparison-arrow">
              <MoveRight size={32} />
            </div>

            {/* Right: AI Reply Card with 1-click Use Reply Button */}
            <div className="ai-reply-suggested-card">
              <div className="ai-reply-header-badge">
                <Sparkles size={14} /> AI Reply (Suggested)
              </div>
              <p className="ai-reply-body-text">
                Thank you, Ritu! We're glad you had a great experience. We look forward to serving you again!
              </p>
              <button
                type="button"
                className={`ai-use-reply-btn ${aiCopierStatus ? 'copied' : ''}`}
                onClick={handleUseReplyCopy}
              >
                {aiCopierStatus ? (
                  <Fragment><Check size={16} /> Copied to Clipboard!</Fragment>
                ) : (
                  <Fragment><Sparkles size={16} /> Use Reply</Fragment>
                )}
              </button>
            </div>
          </div>

          <div className="reply-layout">
            <div>
              <div className="reply-points">
                <span><Check size={14} /> Tone is yours to choose</span>
                <span><Check size={14} /> Every reply stays editable</span>
                <span><Check size={14} /> Nothing posts automatically</span>
              </div>
              <a href="#pricing" className="text-link">
                Explore proposed software plans <ArrowRight size={15} />
              </a>
            </div>

            <div className="reply-preview">
              <div className="reply-preview-head">
                <span className="review-avatar">A</span>
                <span>
                  <strong>Customer review</strong>
                  <small>ILLUSTRATIVE · BALANCED FEEDBACK</small>
                </span>
                <span className="review-stars-preview">
                  ★★★<span>★★</span>
                </span>
              </div>
              <blockquote>
                “The food was lovely, and the team was welcoming. Our order took a little longer than expected.”
              </blockquote>
              <div className="reply-preview-separator" />
              <div className="draft-head">
                <span className="reply-ai-icon"><PenLine size={15} /></span>
                <span>
                  <strong>Suggested reply</strong>
                  <small>Draft for your review — not posted</small>
                </span>
                <button
                  type="button"
                  className="draft-tone-button"
                  onClick={() => setDraftTone(prev => prev === 'Warm tone' ? 'Professional' : 'Warm tone')}
                >
                  {draftTone} <ChevronRight size={13} />
                </button>
              </div>
              <textarea
                aria-label="Editable example business reply"
                value={
                  draftTone === 'Warm tone'
                    ? "Thank you for sharing your experience with us! We're glad you enjoyed the food and welcoming service, and appreciate you letting us know about the wait. Your feedback helps us reflect on the experience we provide."
                    : "Dear Customer, thank you for your valuable feedback. We appreciate your commendation of our culinary quality and service staff. Your note regarding delivery timing has been recorded for operational enhancement."
                }
                readOnly
              />
              <span className="draft-approval-note">
                <CheckCircle2 size={14} /> Please review and edit before posting.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DESIGNED FOR EVERYDAY BUSINESS GROWTH (4 ACTION CARDS + TESTIMONIAL + FINAL CTA) */}
      <section className="benefits-section section-wrap" id="businesses">
        <div className="section-heading benefits-heading">
          <span className="eyebrow">A CONNECTED CUSTOMER FEEDBACK EXPERIENCE</span>
          <h2>Designed for Everyday <span>Business Growth.</span></h2>
          <p>Less friction for your customers. More thoughtful conversations and higher rankings for your business.</p>
        </div>

        {/* 4 Feature Action Cards matching Blueprint */}
        <div className="growth-action-grid">
          <div className="growth-action-card">
            <span className="growth-action-icon"><Star size={24} /></span>
            <h3>Get More Reviews</h3>
            <p>Put review access directly in front of happy customers right at checkout.</p>
          </div>
          <div className="growth-action-card">
            <span className="growth-action-icon"><MessageSquareText size={24} /></span>
            <h3>Manage Feedback Easily</h3>
            <p>One unified inbox for all Google reviews across single or multiple locations.</p>
          </div>
          <div className="growth-action-card">
            <span className="growth-action-icon"><Zap size={24} /></span>
            <h3>Save Time with AI Replies</h3>
            <p>Generate polite, SEO-optimized owner responses in 1-click without typing fatigue.</p>
          </div>
          <div className="growth-action-card">
            <span className="growth-action-icon"><BarChart3 size={24} /></span>
            <h3>Understand Customer Insights</h3>
            <p>Identify rating trends, customer sentiment, and operational highlights easily.</p>
          </div>
        </div>

        {/* Testimonial & Final CTA Side-by-Side Row */}
        <div className="proof-cta-row">
          {/* Real Merchant Testimonial Card */}
          <div className="owner-testimonial-card">
            <div className="owner-testimonial-img-wrap">
              <img src={ownerImg} alt="Smiling Restaurant Owner in front of cafe" loading="lazy" />
            </div>
            <div className="owner-testimonial-content">
              <span className="owner-quote-mark">“</span>
              <p className="owner-quote-text">
                The Review QR made it so easy for our customers to leave Google reviews. We've seen more feedback than ever before.
              </p>
              <span className="owner-author-name">Restaurant Owner</span>
            </div>
          </div>

          {/* High-Converting Final CTA Card */}
          <div className="growth-final-cta-card">
            <div>
              <div className="growth-final-cta-visual">
                <img src={finalCtaImg} alt="Loctimize Standee and Dashboard on Laptop" loading="lazy" />
              </div>
              <h2>Make Every Customer Experience Easier to Share.</h2>
              <p>Bring QR and NFC review access to your business with Loctimize ReviewQR.</p>
            </div>
            <div>
              <a href="#pricing" className="rr-button rr-button-invert" style={{ display: 'inline-flex' }}>
                Get Your Review QR <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="pricing-section section-wrap" id="pricing">
        <div className="pricing-top">
          <div>
            <span className="eyebrow">Plans that can grow with you</span>
            <h2>Choose the Right Review QR <span>for Your Business.</span></h2>
            <p>One-time hardware purchases. Separate optional software plans. All displayed prices remain proposed.</p>
          </div>
          <div className="pricing-toggle" role="tablist" aria-label="View proposed pricing">
            <button
              type="button"
              role="tab"
              aria-selected={pricingTab === 'products'}
              className={pricingTab === 'products' ? 'price-tab is-active' : 'price-tab'}
              onClick={() => setPricingTab('products')}
            >
              Physical products
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pricingTab === 'software'}
              className={pricingTab === 'software' ? 'price-tab is-active' : 'price-tab'}
              onClick={() => setPricingTab('software')}
            >
              Software plans
            </button>
          </div>
        </div>

        {pricingTab === 'products' ? (
          <Fragment>
            <div className="price-product-list">
              {products.map(prod => (
                <article
                  key={prod.name}
                  className={
                    (prod.recommended ? 'price-product-row is-recommended' : 'price-product-row') +
                    (selectedProduct === prod.name ? ' is-selected' : '')
                  }
                >
                  <div className={`price-product-photo ${prod.view}`}>
                    <img
                      src={counterBase}
                      alt={`Illustrative ${prod.viewLabel.toLowerCase()} detail; not a confirmed variant photograph`}
                      loading="lazy"
                      width={1024}
                      height={1024}
                    />
                    <span>{prod.viewLabel}</span>
                  </div>

                  <div className="price-card-content">
                    {prod.recommended && <span className="price-recommendation">RECOMMENDED</span>}
                    <h3 className="price-product-name">{prod.name}</h3>
                    <p className="price-product-intro">{prod.intro}</p>
                    <div className="hardware-price">
                      <strong>{prod.price}<small> *</small></strong>
                      <span>One-time hardware purchase</span>
                    </div>
                    <ul className="hardware-features">
                      {[prod.access, 'Direct access to your review link', 'No app needed to scan', prod.custom].map(feat => (
                        <li key={feat}><Check size={18} />{feat}</li>
                      ))}
                    </ul>
                    <p className="hardware-service-note">
                      Hardware only. Optional monthly software is separate; setup and branding details require confirmation.
                    </p>
                    <button
                      type="button"
                      className="rr-button price-select-button"
                      onClick={() => handleSelectProduct(prod.name)}
                      aria-label={`Select ${prod.name} for enquiry`}
                      aria-pressed={selectedProduct === prod.name}
                    >
                      {selectedProduct === prod.name ? 'Selected for enquiry' : 'Enquire about this product'}{' '}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <p className="pricing-disclaimer">
              * Proposed launch prices. Images show different details of one illustrative standee, not confirmed variant photos. Final specifications, branding and availability must be confirmed before purchase.
            </p>
          </Fragment>
        ) : (
          <Fragment>
            <div className="software-plan-grid">
              {softwarePlans.map(plan => (
                <article
                  key={plan.name}
                  className={plan.recommended ? 'software-card is-recommended' : 'software-card'}
                >
                  {plan.recommended && <span className="software-recommended">RECOMMENDED PLAN</span>}
                  <span className="software-plan-name">{plan.name}</span>
                  <p>{plan.description}</p>
                  <div className="software-price">
                    {plan.price}<small> {plan.cadence}</small>
                  </div>
                  <span className="proposed-plan-badge">PROPOSED · SUBJECT TO CONFIRMATION</span>
                  <ul>
                    {plan.features.map(feat => (
                      <li key={feat}><Check size={18} />{feat}</li>
                    ))}
                    <li><Check size={18} />Usage limits to be confirmed</li>
                  </ul>
                  <button
                    className="rr-button software-plan-cta"
                    type="button"
                    onClick={() => handleSelectProduct(`${plan.name} software plan`)}
                  >
                    Select this plan <ArrowRight size={18} />
                  </button>
                </article>
              ))}
            </div>
            <p className="pricing-disclaimer">
              Subscriptions and features remain proposed. Monthly software is separate from hardware; no billing is connected here.
            </p>
          </Fragment>
        )}

        <div className="purchase-information">
          <div>
            <h3>Setup</h3>
            <p>Choose your business review destination. Final configuration and setup assistance will be confirmed before purchase.</p>
          </div>
          <div>
            <h3>Delivery & support</h3>
            <p>Delivery areas, shipping charges, timelines and support arrangements are not yet confirmed.</p>
          </div>
          <div>
            <h3>Before you pay</h3>
            <p>Select a product to prepare an enquiry. Checkout and enquiry delivery are not connected; no payment or order is created.</p>
          </div>
        </div>
      </section>

      {/* 9. BULK / CORPORATE INQUIRY FORM */}
      <section className="inquiry-section section-wrap" id="bulk-inquiry">
        <div className="inquiry-copy">
          <span className="eyebrow">Bulk, multi-location & product enquiries</span>
          <h2>Let's talk about <span>your business.</span></h2>
          <p>Tell us what you’re exploring. This preview doesn’t send or store your details: live inquiry delivery isn’t configured yet.</p>
          <div className="inquiry-response-card">
            <span className="inquiry-note-icon"><MessageSquareText size={18} /></span>
            <span>
              <strong>Product and bulk enquiries</strong>
              <small>Share an item, location count or quantity to explore.</small>
            </span>
          </div>
        </div>

        <form className="inquiry-form" ref={formRef} onSubmit={handleFormSubmit}>
          <div className="form-heading">
            <strong>Explore a business enquiry</strong>
            <span>Fields marked * are required</span>
          </div>

          {selectedProduct && (
            <p className="selected-product-note" role="status">
              Your selected product or plan<strong>{selectedProduct}</strong>
            </p>
          )}

          <div className="form-two-column">
            <label>
              Company name *
              <input name="company" autoComplete="organization" required minLength={2} placeholder="Your company" />
            </label>
            <label>
              Contact person *
              <input name="contact" autoComplete="name" required minLength={2} placeholder="Your name" />
            </label>
            <label>
              Mobile number *
              <input
                name="mobile"
                autoComplete="tel"
                required
                minLength={8}
                inputMode="tel"
                pattern="[+0-9 ()-]{8,}"
                title="Enter a valid phone number with at least 8 digits."
                placeholder="+91"
              />
            </label>
            <label>
              Business email *
              <input name="email" type="email" autoComplete="email" required placeholder="you@business.com" />
            </label>
            <label>
              Number of locations *
              <input name="locations" type="number" required min={1} step={1} defaultValue={1} />
            </label>
            <label>
              Quantity to explore *
              <select name="quantity" required value={selectedQuantity} onChange={e => setSelectedQuantity(e.target.value)}>
                {['10', '25', '50', '100', '500+'].map(qty => (
                  <option key={qty} value={qty}>{qty} units</option>
                ))}
              </select>
            </label>
            <label className="form-full">
              Product or plan *
              <select name="product" required value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                <option value="" disabled>Select a product or plan</option>
                {products.map(prod => (
                  <option key={prod.name} value={prod.name}>{prod.name}</option>
                ))}
                {softwarePlans.map(plan => (
                  <option key={plan.name} value={`${plan.name} software plan`}>{plan.name} software plan</option>
                ))}
              </select>
            </label>
            <label className="form-full">
              A little more about your needs
              <textarea name="message" rows={3} maxLength={500} placeholder="Locations, product choices or anything else to discuss" />
            </label>
          </div>

          <button type="submit" className="rr-button inquiry-submit">
            {formStatus === 'ready' ? 'Inquiry details ready' : 'Prepare my enquiry'}
            <ArrowRight size={16} />
          </button>

          {formStatus === 'ready' && (
            <p className="form-notice" role="status">
              <CheckCircle2 size={15} /> Your required details are complete. This preview can’t send your enquiry or store your personal details yet.
            </p>
          )}

          <span className="form-safe-note">
            <span className="tiny-green-dot" /> Nothing is sent or saved by this form.
          </span>
        </form>
      </section>

      {/* 10. FAQS SECTION */}
      <section className="faq-section section-wrap" id="faq">
        <div className="faq-heading">
          <span className="eyebrow">Good questions deserve clear answers</span>
          <h2>Everything you need to <span>know.</span></h2>
          <p>See anything that depends on product launch or setup? We’ll keep it clearly marked for confirmation.</p>
          <a href="#bulk-inquiry" className="text-link">
            Ask about ReviewQR <ArrowRight size={15} />
          </a>
        </div>

        <div className="faq-list">
          {primaryFaqs.map((faq, idx) => (
            <FaqItem key={faq.q} faq={faq} index={idx} />
          ))}
          <details className="faq-more">
            <summary>
              More questions <Plus size={18} />
            </summary>
            <div>
              {extraFaqs.map((faq, idx) => (
                <FaqItem key={faq.q} faq={faq} index={idx + primaryFaqs.length} />
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#home" aria-label="Loctimize home">
              <img src={footerLogo} className="footer-logo" alt="Loctimize — Optimize Local. Grow Global." />
            </a>
            <p>ReviewQR makes it easier for customers to find your review link — on their own terms.</p>
            <span className="footer-disclosure">
              Loctimize is an independent product and is not affiliated with, endorsed by or sponsored by Google.
            </span>
          </div>

          <div className="footer-column">
            <h3>Products</h3>
            {products.map(prod => (
              <button key={prod.name} type="button" className="footer-product-link" onClick={() => handleSelectProduct(prod.name)}>
                {prod.name}
              </button>
            ))}
            <a href="#pricing">Proposed plans</a>
          </div>

          <div className="footer-column">
            <h3>Solutions</h3>
            <a href="#ai-assistant">Review writing help</a>
            <a href="#ai-replies">AI-assisted replies</a>
            <a href="#features">Review QR features</a>
            <a href="#businesses">Business benefits</a>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="#how-it-works">How it works</a>
            <a href="#live-demo">Try the demo</a>
            <a href="#bulk-inquiry">Business enquiries</a>
            <a href="#faq">FAQs</a>
          </div>

          <div className="footer-column footer-company">
            <h3>Loctimize</h3>
            <a href="#home">About Loctimize</a>
            <a href="#bulk-inquiry">Contact & bulk orders</a>
            <span>Product information available here is illustrative and subject to confirmation.</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Loctimize ReviewQR. All rights reserved.</span>
          <span>Optimize Local. Grow Global.</span>
          <a href="#home">Back to the top <ArrowUpRight size={13} /></a>
        </div>
      </footer>

      {/* STICKY MOBILE PURCHASE BAR */}
      <div className={selectedProduct ? 'mobile-purchase-bar has-selection' : 'mobile-purchase-bar'}>
        <span>
          <small>REVIEWQR</small>
          <strong>{selectedProduct || 'Choose a standee'}</strong>
        </span>
        <a href={selectedProduct ? '#bulk-inquiry' : '#pricing'} className="rr-button">
          {selectedProduct ? 'Your enquiry' : 'Get Review QR'} <ArrowRight size={15} />
        </a>
      </div>

      <span className="section-target" id="products-target" aria-hidden="true" />
    </main>
  );
}

export default LandingPage;
