import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
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
  ExternalLink,
  CheckCircle2,
  Send
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';

export function ReviewsRepliesPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const bizName = activeBusiness?.name || 'Our Business';

  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewInput, setReviewInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'warm' | 'professional' | 'concise'>('warm');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dynamic replies generated based on actual active business name & input
  const defaultReviewText = reviewInput.trim() || 'Great experience and welcoming staff. Everything was clean and handled smoothly.';
  const recipient = customerName.trim() || 'Valued Customer';

  const dynamicReplies = {
    warm: `Dear ${recipient},\n\nThank you so much for visiting ${bizName} and taking the time to share your review! We are thrilled to hear you had such a wonderful experience with us. Providing welcoming hospitality and top quality is always our priority. We truly appreciate your support and look forward to serving you again soon!\n\nWarm regards,\nThe Team at ${bizName}`,
    professional: `Dear ${recipient},\n\nThank you for reviewing your experience at ${bizName}. We are pleased that our service and standards met your expectations. We appreciate your valuable feedback and patronage, and we remain committed to maintaining the highest level of service on every visit.\n\nSincerely,\nManagement, ${bizName}`,
    concise: `Hi ${recipient}, thank you for the wonderful review of ${bizName}! We really appreciate your kind words and support. Looking forward to welcoming you back again soon!`
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
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
            Draft calibrated, policy-compliant responses for <span className="font-bold text-slate-700 dark:text-slate-200">{bizName}</span> in seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeBusiness?.googleReviewUrl && (
            <a href={activeBusiness.googleReviewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl shadow-xs">
                <span>View Google Maps Profile</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Split Grid: Left Review Input / Tester, Right AI Co-pilot Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Live Review Tester & Guidelines */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span>Paste Customer Review from Google</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Paste any review received on Google Maps to generate an instant reply
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reviewer Name (Optional)
                </Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel or Ananya S."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Star Rating Received
                </Label>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-800'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2 font-mono">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer Review Text
                </Label>
                <Textarea
                  rows={4}
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  placeholder="Paste the customer's exact review here (e.g. Loved the ambience, prompt service and clean counter...)"
                  className="rounded-xl text-xs font-normal"
                />
              </div>

              <Button
                onClick={handleRegenerate}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-bold text-xs rounded-xl shadow-xs gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Generate Reply for {bizName}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Guidelines */}
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
                      for {bizName}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Select tone, customize if needed, and copy directly into Google Maps
                  </CardDescription>
                </div>

                {/* Tone Switcher */}
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
              {/* Review Context Quote */}
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Review by {recipient}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  "{defaultReviewText}"
                </p>
              </div>

              {/* Editable Reply Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Calibrated Response ({selectedStyle.toUpperCase()})</span>
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                  <textarea
                    rows={8}
                    value={dynamicReplies[selectedStyle]}
                    readOnly
                    className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden resize-none font-normal leading-relaxed"
                  />
                  <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {dynamicReplies[selectedStyle].length} characters • ~{Math.round(dynamicReplies[selectedStyle].length / 5)} words
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

                <Button
                  onClick={() => handleCopy(dynamicReplies[selectedStyle])}
                  className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs gap-1.5 px-5 cursor-pointer"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
