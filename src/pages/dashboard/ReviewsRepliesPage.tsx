import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Copy,
  Check,
  Star,
  MessageSquare,
  ShieldCheck,
  Building2,
  RefreshCw,
  Clock,
  ThumbsUp,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface MockReview {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  source: 'Google Maps' | 'ReviewQR Standee';
  status: 'needs_reply' | 'replied';
  text: string;
  replies: {
    warm: string;
    professional: string;
    concise: string;
  };
}

const sampleReviews: MockReview[] = [
  {
    id: 'rev-1',
    name: 'Ankit Mehta',
    initials: 'AM',
    rating: 4,
    date: '2 hours ago',
    source: 'ReviewQR Standee',
    status: 'needs_reply',
    text: 'Food was great, especially the kaju katli and samosas! But we had to wait 20 minutes for our order on Sunday evening. Staff seemed rushed.',
    replies: {
      warm: 'Dear Ankit,\n\nThank you so much for visiting Royal Sweets & Bakery and sharing your kind words! We are delighted you enjoyed our fresh kaju katli and hot samosas. We sincerely apologize for the Sunday evening queue—weekends get very busy, and we are adding two dedicated counter team members during peak hours to ensure faster service. We look forward to treating you again soon!\n\nWarm regards,\nRajesh & Team Royal Sweets',
      professional: 'Dear Mr. Mehta,\n\nThank you for sharing your feedback regarding your recent visit. We are pleased to know our delicacies met your standards. We have noted your observation regarding the wait time during Sunday peak hours and have adjusted our staffing schedule to reduce turnaround time. Thank you for helping us maintain high service standards.\n\nSincerely,\nCustomer Relations Team',
      concise: 'Hi Ankit, thanks for loving our kaju katli and samosas! Apologies for the Sunday evening delay—we are adding extra staff at billing to serve you much faster next time. See you soon!'
    }
  },
  {
    id: 'rev-2',
    name: 'Priya Sharma',
    initials: 'PS',
    rating: 5,
    date: 'Yesterday',
    source: 'Google Maps',
    status: 'needs_reply',
    text: 'Best bakery in Navrangpura! Fresh malai peda and warm hospitality. Clean store and quick billing. Highly recommended.',
    replies: {
      warm: 'Dear Priya,\n\nThank you for such a heartfelt review! Knowing that you loved our fresh malai peda and experienced warm hospitality truly makes our team’s day. It is always a pleasure serving you, and we cannot wait to see you again for your next festive celebration!\n\nWarmly,\nRoyal Sweets Family',
      professional: 'Dear Priya Sharma,\n\nThank you for taking the time to review Royal Sweets & Bakery. We are delighted that you appreciated the freshness of our sweets and our hygiene standards. We look forward to serving you on your next visit.\n\nBest regards,\nManagement Team',
      concise: 'Thanks a lot Priya! Delighted that you loved our malai peda and quick billing. Looking forward to welcoming you back soon!'
    }
  },
  {
    id: 'rev-3',
    name: 'Vikram Joshi',
    initials: 'VJ',
    rating: 5,
    date: '3 days ago',
    source: 'ReviewQR Standee',
    status: 'replied',
    text: 'Scanned the QR standee right on the table tent. Very neat and quick process to share our feedback. Motichoor ladoo is unmatched.',
    replies: {
      warm: 'Dear Vikram,\n\nThank you so much! We are thrilled our new QR standee made your review experience seamless, and even happier that our pure ghee motichoor ladoos hit the mark. See you again soon!\n\nWarmly,\nTeam Royal Sweets',
      professional: 'Dear Vikram,\n\nThank you for your valuable feedback. We are pleased you found our digital feedback process smooth and enjoyed our signature sweets. We appreciate your patronage.\n\nSincerely,\nRoyal Sweets Management',
      concise: 'Thank you Vikram! Glad you enjoyed the seamless QR scan and our motichoor ladoo. Appreciate your support!'
    }
  }
];

export function ReviewsRepliesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'needs_reply' | 'replied'>('needs_reply');
  const [selectedReview, setSelectedReview] = useState<MockReview>(sampleReviews[0]);
  const [selectedStyle, setSelectedStyle] = useState<'warm' | 'professional' | 'concise'>('warm');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredReviews = sampleReviews.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ClickUp 4.0 Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Reviews & AI Reply Co-pilot
            </h1>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              ⚡ Llama 3.1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor incoming customer reviews, maintain 100% reply velocity, and draft calibrated responses in seconds.
          </p>
        </div>

        {/* Status Tab Pills (ClickUp 4.0 Style) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('needs_reply')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'needs_reply'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>Needs Reply (2)</span>
          </button>
          <button
            onClick={() => setActiveTab('replied')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'replied'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Replied (1)</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All (3)
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Review Task List, Right AI Response Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Review Task Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Incoming Reviews ({filteredReviews.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Click to load Co-pilot</span>
          </div>

          <div className="space-y-2.5">
            {filteredReviews.map((review) => {
              const isSelected = selectedReview.id === review.id;
              return (
                <div
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`rounded-2xl p-4 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900/90 border-purple-500 ring-2 ring-purple-500/10 shadow-md'
                      : 'bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7B68EE] to-[#EC4899] text-white text-xs font-extrabold shadow-2xs">
                        {review.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {review.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>{review.date}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-500 dark:text-slate-400">{review.source}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {review.status === 'needs_reply' ? (
                        <span className="rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-[10px] font-bold">
                          ⏳ Needs Reply
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-800'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">
                      {review.rating}.0
                    </span>
                  </div>

                  {/* Review snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    "{review.text}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Notice Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Google Merchant Response Guidelines</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Google algorithms reward businesses that respond within 24–48 hours. Responses should be personalized, polite, and never argue with the customer.
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): AI Co-pilot Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                      AI Reply Co-pilot
                    </CardTitle>
                    <span className="rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-1.5 py-0.5">
                      for {selectedReview.name}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Select tailored tone, customize if desired, and copy directly to Google Maps
                  </CardDescription>
                </div>

                {/* Tone Switcher Pills */}
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-900/70">
                  {(['warm', 'professional', 'concise'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedStyle(tone)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
                        selectedStyle === tone
                          ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tone === 'warm' ? '❤️ Warm' : tone === 'professional' ? '👔 Professional' : '⚡ Concise'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Selected Review Summary Banner */}
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Review by {selectedReview.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= selectedReview.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  "{selectedReview.text}"
                </p>
              </div>

              {/* Editable Reply Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Generated Calibrated Response</span>
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate with Workers AI</span>
                  </button>
                </div>

                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                  <textarea
                    rows={8}
                    value={selectedReview.replies[selectedStyle]}
                    readOnly
                    className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden resize-none font-normal leading-relaxed"
                  />
                  <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {selectedReview.replies[selectedStyle].length} characters • ~{Math.round(selectedReview.replies[selectedStyle].length / 5)} words
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 100% Policy Safe
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400">
                  Tip: Copy and paste directly into Google Maps Manager app or web portal.
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleCopy(selectedReview.replies[selectedStyle])}
                    className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5 px-5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Response</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
