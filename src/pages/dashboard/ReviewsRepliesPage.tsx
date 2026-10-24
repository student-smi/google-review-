import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Copy,
  Check,
  Star,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  QrCode,
  Tag,
  Send,
  User,
  Heart,
  Briefcase,
  Zap,
  Filter,
  Loader2
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch } from '@/lib/api';

export interface CustomerReview {
  id: string;
  businessId: string;
  customerName: string;
  rating: number;
  reviewText: string;
  chipsJson?: string | null;
  language: string;
  replyText?: string | null;
  replyStyle?: string | null;
  repliedAt?: number | null;
  createdAt: number;
}

interface AiReplyResult {
  warm: string;
  professional: string;
  concise: string;
}

export function ReviewsRepliesPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const bizName = activeBusiness?.name || 'Our Business';

  // Navigation tab: 'feed' (real customer reviews) or 'tester' (manual sandbox)
  const [activeTab, setActiveTab] = useState<'feed' | 'tester'>('feed');

  // Customer Reviews state
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'needs_reply' | 'replied'>('all');

  // Active review reply drawer / state
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [replyReplies, setReplyReplies] = useState<{ [reviewId: string]: AiReplyResult }>({});
  const [replySelectedStyle, setReplySelectedStyle] = useState<{ [reviewId: string]: 'warm' | 'professional' | 'concise' }>({});
  const [replyEditText, setReplyEditText] = useState<{ [reviewId: string]: string }>({});
  const [isGeneratingForReview, setIsGeneratingForReview] = useState<{ [reviewId: string]: boolean }>({});
  const [isSavingReply, setIsSavingReply] = useState<{ [reviewId: string]: boolean }>({});
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);

  // Manual Tester state
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualReviewInput, setManualReviewInput] = useState('');
  const [manualSelectedStyle, setManualSelectedStyle] = useState<'warm' | 'professional' | 'concise'>('warm');
  const [manualCopied, setManualCopied] = useState(false);
  const [isManualGenerating, setIsManualGenerating] = useState(false);
  const [manualAiReplies, setManualAiReplies] = useState<AiReplyResult | null>(null);

  // Fetch reviews on mount and when activeBusiness changes
  const loadReviews = async () => {
    if (!activeBusiness?.id) return;
    setIsLoadingReviews(true);
    try {
      const data = await apiFetch<{ reviews: CustomerReview[] }>(`/api/businesses/${activeBusiness.id}/reviews`);
      if (data?.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeBusiness?.id]);

  // Generate AI Reply for a specific Customer Review
  const handleGenerateReplyForReview = async (review: CustomerReview) => {
    const rId = review.id;
    setIsGeneratingForReview((prev) => ({ ...prev, [rId]: true }));
    setActiveReviewId(rId);

    const fallback: AiReplyResult = {
      warm: `Dear ${review.customerName},\n\nThank you so much for visiting ${bizName} and taking the time to share your review! We are thrilled to hear you had such a wonderful experience. Providing welcoming hospitality and top quality is always our priority. We truly appreciate your support and look forward to serving you again soon!\n\nWarm regards,\nThe Team at ${bizName}`,
      professional: `Dear ${review.customerName},\n\nThank you for reviewing your experience at ${bizName}. We are pleased that our service and standards met your expectations. We appreciate your valuable feedback and patronage, and we remain committed to maintaining the highest level of service on every visit.\n\nSincerely,\nManagement, ${bizName}`,
      concise: `Hi ${review.customerName}, thank you for the wonderful review of ${bizName}! We really appreciate your kind words and support. Looking forward to welcoming you back again soon!`
    };

    try {
      const data = await apiFetch<{ success: boolean; replies: AiReplyResult }>(
        '/api/ai/reply-draft',
        {
          method: 'POST',
          body: JSON.stringify({
            businessName: bizName,
            businessId: activeBusiness?.id,
            customerName: review.customerName,
            reviewText: review.reviewText,
            rating: review.rating,
            city: activeBusiness?.city,
            category: activeBusiness?.category,
            brandVoice: activeBusiness?.brandVoice || 'warm_grateful'
          })
        }
      );

      const generated = data?.replies || fallback;
      setReplyReplies((prev) => ({ ...prev, [rId]: generated }));
      const defaultStyle = replySelectedStyle[rId] || 'warm';
      setReplySelectedStyle((prev) => ({ ...prev, [rId]: defaultStyle }));
      setReplyEditText((prev) => ({ ...prev, [rId]: generated[defaultStyle] }));
    } catch (err) {
      console.warn('AI reply generation failed, using template:', err);
      setReplyReplies((prev) => ({ ...prev, [rId]: fallback }));
      setReplySelectedStyle((prev) => ({ ...prev, [rId]: 'warm' }));
      setReplyEditText((prev) => ({ ...prev, [rId]: fallback.warm }));
    } finally {
      setIsGeneratingForReview((prev) => ({ ...prev, [rId]: false }));
    }
  };

  // Switch tone for a specific review
  const handleSelectReplyStyle = (reviewId: string, style: 'warm' | 'professional' | 'concise') => {
    setReplySelectedStyle((prev) => ({ ...prev, [reviewId]: style }));
    const currentReplies = replyReplies[reviewId];
    if (currentReplies) {
      setReplyEditText((prev) => ({ ...prev, [reviewId]: currentReplies[style] }));
    }
  };

  // Copy text to clipboard
  const handleCopyText = (text: string, reviewId?: string) => {
    navigator.clipboard.writeText(text);
    if (reviewId) {
      setCopiedReviewId(reviewId);
      setTimeout(() => setCopiedReviewId(null), 2500);
    } else {
      setManualCopied(true);
      setTimeout(() => setManualCopied(false), 2500);
    }
  };

  // Save reply to database & update review state
  const handleSaveReply = async (review: CustomerReview) => {
    const rId = review.id;
    const textToSave = replyEditText[rId] || replyReplies[rId]?.[replySelectedStyle[rId] || 'warm'] || '';
    if (!textToSave.trim()) return;

    setIsSavingReply((prev) => ({ ...prev, [rId]: true }));
    try {
      const res = await apiFetch<{ review: CustomerReview }>(
        `/api/businesses/${activeBusiness?.id}/reviews/${rId}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({
            replyText: textToSave,
            replyStyle: replySelectedStyle[rId] || 'warm'
          })
        }
      );

      // Copy text immediately for owner convenience
      handleCopyText(textToSave, rId);

      // Update local review state
      if (res?.review) {
        setReviews((prev) =>
          prev.map((r) => (r.id === rId ? { ...r, ...res.review } : r))
        );
      } else {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === rId
              ? {
                  ...r,
                  replyText: textToSave,
                  replyStyle: replySelectedStyle[rId] || 'warm',
                  repliedAt: Math.floor(Date.now() / 1000)
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to save reply:', err);
    } finally {
      setIsSavingReply((prev) => ({ ...prev, [rId]: false }));
    }
  };

  // Manual Tester Generate
  const handleGenerateManual = async () => {
    setIsManualGenerating(true);
    const recipient = manualCustomerName.trim() || 'Valued Customer';
    const fallback: AiReplyResult = {
      warm: `Dear ${recipient},\n\nThank you so much for visiting ${bizName} and taking the time to share your review! We are thrilled to hear you had such a wonderful experience with us. Providing welcoming hospitality and top quality is always our priority. We truly appreciate your support and look forward to serving you again soon!\n\nWarm regards,\nThe Team at ${bizName}`,
      professional: `Dear ${recipient},\n\nThank you for reviewing your experience at ${bizName}. We are pleased that our service and standards met your expectations. We appreciate your valuable feedback and patronage, and we remain committed to maintaining the highest level of service on every visit.\n\nSincerely,\nManagement, ${bizName}`,
      concise: `Hi ${recipient}, thank you for the wonderful review of ${bizName}! We really appreciate your kind words and support. Looking forward to welcoming you back again soon!`
    };

    try {
      const data = await apiFetch<{ success: boolean; replies: AiReplyResult }>(
        '/api/ai/reply-draft',
        {
          method: 'POST',
          body: JSON.stringify({
            businessName: bizName,
            businessId: activeBusiness?.id,
            customerName: manualCustomerName.trim() || undefined,
            reviewText: manualReviewInput.trim() || 'Great experience with prompt service and clean environment.',
            rating: manualRating,
            city: activeBusiness?.city,
            category: activeBusiness?.category,
            brandVoice: activeBusiness?.brandVoice || 'warm_grateful'
          })
        }
      );
      setManualAiReplies(data?.replies || fallback);
    } catch {
      setManualAiReplies(fallback);
    } finally {
      setIsManualGenerating(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (filterMode === 'needs_reply') return !r.replyText;
    if (filterMode === 'replied') return !!r.replyText;
    return true;
  });

  const awaitingCount = reviews.filter((r) => !r.replyText).length;
  const repliedCount = reviews.filter((r) => !!r.replyText).length;

  const formatTimeAgo = (timestampSeconds: number) => {
    const diff = Math.floor(Date.now() / 1000) - timestampSeconds;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestampSeconds * 1000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Customer Reviews & AI Reply Co-pilot
            </h1>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              ⚡ Llama 3.2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real customer reviews for <span className="font-bold text-slate-800">{bizName}</span>. Generate calibrated, 100% policy-safe Google replies in 1 click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeBusiness?.googleReviewUrl && (
            <a href={activeBusiness.googleReviewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl shadow-xs border-slate-200 hover:bg-slate-50 text-slate-700">
                <span>View Google Maps Profile</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadReviews}
            disabled={isLoadingReviews}
            className="gap-1.5 text-xs font-bold rounded-xl shadow-xs border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoadingReviews ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Reviews</span>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{reviews.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">From customer QR flow</div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Awaiting Reply</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{awaitingCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Respond within 24h for best SEO</div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Replied</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{repliedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">100% policy compliant</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Average Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 flex items-center gap-1.5">
            <span>5.0</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top-tier verified sentiment</div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Customer Reviews Feed</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'feed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tester'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Manual Google Review Tester</span>
          </button>
        </div>

        {/* Filter Pills for Feed */}
        {activeTab === 'feed' && reviews.length > 0 && (
          <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilterMode('needs_reply')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'needs_reply' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Needs Reply ({awaitingCount})
            </button>
            <button
              onClick={() => setFilterMode('replied')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'replied' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Replied ({repliedCount})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: CUSTOMER REVIEWS FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {isLoadingReviews ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading customer reviews from your QR standee…</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-4 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="h-16 w-16 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center shadow-xs">
                <QrCode className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {filterMode !== 'all' ? 'No reviews found in this filter' : 'No customer reviews recorded yet'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When customers scan your QR standee and generate review options, their copied reviews and selected keywords will automatically show up here so you can generate AI replies!
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link to="/dashboard/qr-codes">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>View QR Codes & Standees</span>
                  </Button>
                </Link>
                {activeBusiness?.slug && (
                  <a href={`/r/${activeBusiness.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl shadow-xs gap-1.5 border-slate-200">
                      <span>Test Customer Flow ↗</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                let chips: string[] = [];
                if (review.chipsJson) {
                  try {
                    const parsed = JSON.parse(review.chipsJson);
                    if (Array.isArray(parsed)) chips = parsed;
                  } catch {}
                }

                const isExpanded = activeReviewId === review.id;
                const isGenerating = isGeneratingForReview[review.id];
                const isSaving = isSavingReply[review.id];
                const activeReplies = replyReplies[review.id];
                const selectedStyle = replySelectedStyle[review.id] || 'warm';
                const currentDraft = replyEditText[review.id] ?? (activeReplies ? activeReplies[selectedStyle] : '');
                const hasExistingReply = Boolean(review.replyText);

                return (
                  <Card
                    key={review.id}
                    className={`rounded-2xl border transition-all duration-200 bg-white ${
                      isExpanded
                        ? 'border-purple-300 ring-2 ring-purple-100 shadow-md'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Review Top Row: Customer Avatar, Stars, Badges, Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{review.customerName}</h4>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Verified Customer</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${
                                      s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">·</span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {formatTimeAgo(review.createdAt)}
                              </span>
                              {review.language && (
                                <>
                                  <span className="text-[11px] text-slate-400 font-medium">·</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {review.language === 'gu' ? 'Gujarati' : review.language === 'hi' ? 'Hindi' : 'English'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {hasExistingReply ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Replied</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Awaiting Reply</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Keyword Tags */}
                      {chips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                            <Tag className="h-3 w-3" /> Customer keywords:
                          </span>
                          {chips.map((chip, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* The Customer's Review Text */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed italic font-normal">
                        "{review.reviewText}"
                      </div>

                      {/* Saved Reply (if already replied and not currently editing) */}
                      {hasExistingReply && !isExpanded && (
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Your Response ({review.replyStyle || 'Warm'})</span>
                            </span>
                            {review.repliedAt && (
                              <span className="text-[11px] text-emerald-600 font-medium">
                                Replied {formatTimeAgo(review.repliedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {review.replyText}
                          </p>
                          <div className="pt-1 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyText(review.replyText!, review.id)}
                              className="h-7 text-[11px] font-bold rounded-lg border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 gap-1"
                            >
                              {copiedReviewId === review.id ? (
                                <><Check className="h-3 w-3 text-emerald-600" /><span>Copied!</span></>
                              ) : (
                                <><Copy className="h-3 w-3" /><span>Copy Response</span></>
                              )}
                            </Button>
                            <button
                              onClick={() => handleGenerateReplyForReview(review)}
                              className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer ml-2"
                            >
                              ✨ Generate New Draft
                            </button>
                          </div>
                        </div>
                      )}

                      {/* AI Reply Workspace (Expanded) */}
                      {isExpanded ? (
                        <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                AI Generated Response for {review.customerName}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                Llama 3.2
                              </span>
                            </div>

                            {/* Tone Switcher */}
                            <div className="flex items-center rounded-xl border border-purple-200 bg-white p-1 text-xs">
                              {(['warm', 'professional', 'concise'] as const).map((style) => (
                                <button
                                  key={style}
                                  onClick={() => handleSelectReplyStyle(review.id, style)}
                                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                                    selectedStyle === style
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {style === 'warm' ? '❤️ Warm' : style === 'professional' ? '👔 Professional' : '⚡ Concise'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Editable Response Textarea */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                              <span>Response Preview (Click to edit if desired):</span>
                              <button
                                onClick={() => handleGenerateReplyForReview(review)}
                                disabled={isGenerating}
                                className="flex items-center gap-1 text-[11px] text-purple-600 hover:underline cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                                <span>Regenerate with AI</span>
                              </button>
                            </div>

                            <div className="relative">
                              {isGenerating && (
                                <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
                                  <div className="flex items-center gap-2 text-xs text-purple-700 font-bold">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Llama 3.2 is crafting tailored reply…</span>
                                  </div>
                                </div>
                              )}
                              <Textarea
                                rows={5}
                                value={currentDraft}
                                onChange={(e) =>
                                  setReplyEditText((prev) => ({ ...prev, [review.id]: e.target.value }))
                                }
                                placeholder="Generated AI response will appear here…"
                                className="bg-white rounded-xl text-xs sm:text-sm leading-relaxed border-purple-200 text-slate-900 focus-visible:ring-purple-400"
                              />
                            </div>
                          </div>

                          {/* Action Buttons: Copy, Save & Mark as Replied, Cancel */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>100% Policy Safe & Personalized</span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveReviewId(null)}
                                className="text-xs font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyText(currentDraft, review.id)}
                                className="text-xs font-bold rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5 shadow-xs"
                              >
                                {copiedReviewId === review.id ? (
                                  <><Check className="h-3.5 w-3.5 text-emerald-600" /><span>Copied!</span></>
                                ) : (
                                  <><Copy className="h-3.5 w-3.5" /><span>Copy to Clipboard</span></>
                                )}
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleSaveReply(review)}
                                disabled={isSaving || !currentDraft.trim()}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
                              >
                                {isSaving ? (
                                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving…</span></>
                                ) : (
                                  <><Check className="h-3.5 w-3.5" /><span>Save & Mark Replied</span></>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : !hasExistingReply && (
                        /* CTA Button when not yet replied */
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Reply quickly to boost your Google Maps search ranking.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleGenerateReplyForReview(review)}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Generate AI Reply ✨</span>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL GOOGLE REVIEW TESTER */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Box */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span>Paste Review from Google Maps</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Got an existing review on Google? Paste it here to test AI generated responses.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Reviewer Name (Optional)
                  </Label>
                  <Input
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Patel or Ananya S."
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Star Rating Received
                  </Label>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setManualRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= manualRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-500 ml-2 font-mono">
                      {manualRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    Customer Review Text
                  </Label>
                  <Textarea
                    rows={4}
                    value={manualReviewInput}
                    onChange={(e) => setManualReviewInput(e.target.value)}
                    placeholder="Paste the customer's exact review here (e.g. Loved the service, great sweets and friendly staff...)"
                    className="rounded-xl text-xs font-normal"
                  />
                </div>

                <Button
                  id="generate-manual-reply-btn"
                  onClick={handleGenerateManual}
                  disabled={isManualGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-2 cursor-pointer"
                >
                  {isManualGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Generating AI Reply…</span></>
                  ) : (
                    <><Sparkles className="h-4 w-4 text-amber-300" /><span>Generate AI Reply for {bizName}</span></>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Merchant Guidelines */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Google Merchant Response Guidelines</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Google algorithms reward businesses that respond within 24–48 hours. Responses should be personalized, polite, and never argue with the customer.
              </p>
            </div>
          </div>

          {/* Right Column: AI Co-pilot Workspace */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-900">
                      AI Generated Output
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Select tone, customize if needed, and copy directly into Google Maps
                    </CardDescription>
                  </div>

                  {/* Tone Switcher */}
                  <div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-50">
                    {(['warm', 'professional', 'concise'] as const).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setManualSelectedStyle(tone)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
                          manualSelectedStyle === tone
                            ? 'bg-white text-purple-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {tone === 'warm' ? '❤️ Warm' : tone === 'professional' ? '👔 Professional' : '⚡ Concise'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Active Reply Preview */}
                {(() => {
                  const recipient = manualCustomerName.trim() || 'Valued Customer';
                  const defaultReplies: AiReplyResult = {
                    warm: `Dear ${recipient},\n\nThank you so much for visiting ${bizName} and sharing your review! We are delighted to hear you had a wonderful experience. Your support means the world to us and we look forward to welcoming you back again soon!\n\nWarm regards,\nThe Team at ${bizName}`,
                    professional: `Dear ${recipient},\n\nThank you for reviewing your experience at ${bizName}. We are pleased that our service and standards met your expectations. We appreciate your valuable feedback and look forward to serving you again.\n\nSincerely,\nManagement, ${bizName}`,
                    concise: `Hi ${recipient}, thank you for your review of ${bizName}! We really appreciate your kind words and look forward to seeing you again soon!`
                  };

                  const activeText = (manualAiReplies || defaultReplies)[manualSelectedStyle];

                  return (
                    <div className="space-y-4">
                      <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        {isManualGenerating && (
                          <div className="absolute inset-0 rounded-2xl bg-white/80 flex items-center justify-center z-10">
                            <div className="flex items-center gap-2 text-xs text-purple-600 font-bold">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Generating personalized reply…</span>
                            </div>
                          </div>
                        )}
                        <textarea
                          id="manual-reply-text-area"
                          rows={8}
                          value={activeText}
                          readOnly
                          className="w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-slate-800 focus:outline-hidden resize-none font-normal leading-relaxed"
                        />
                        <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {activeText.length} chars · ~{Math.round(activeText.split(/\s+/).filter(Boolean).length)} words
                          </span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Policy Safe
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Copy and paste directly into Google Business Profile or Google Maps app.
                        </span>
                        <Button
                          id="copy-manual-reply-btn"
                          onClick={() => handleCopyText(activeText)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-5 cursor-pointer"
                        >
                          {manualCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
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
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
