import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Tag,
  Calendar,
  Share2,
  Trash2,
  Clock,
  MessageSquare,
  Building2,
  Phone,
  Store,
  Layers,
  ChevronRight,
  Plus,
  Flame,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { BusinessItem } from './DashboardLayout';

interface GooglePostDraft {
  id: string;
  topicType: 'STANDARD' | 'EVENT' | 'OFFER';
  headline: string;
  summary: string;
  callToAction: {
    type: 'CALL' | 'BOOK' | 'ORDER' | 'LEARN_MORE' | 'SIGN_UP';
    url: string;
    label: string;
  };
  couponCode?: string | null;
  suggestedPhoto: string;
  hashtags: string[];
}

interface SavedPostItem {
  id: string;
  businessId: string;
  branchId?: string | null;
  topicType: string;
  headline?: string | null;
  summary: string;
  couponCode?: string | null;
  callToActionType?: string | null;
  callToActionUrl?: string | null;
  googlePostId?: string | null;
  searchUrl?: string | null;
  status: string;
  errorMessage?: string | null;
  publishedAt?: number | null;
  createdAt: number;
}

interface GmbStatus {
  connected: boolean;
  meta?: {
    connectedEmail?: string;
    businessTitle?: string;
    locationName?: string;
  };
  requiresReauth?: boolean;
}

export function GooglePostsPage() {
  const { activeBusiness } = useOutletContext<{
    activeBusiness: BusinessItem | null;
  }>();

  // Generator Controls
  const [postType, setPostType] = useState<'offer' | 'update' | 'festive'>('offer');
  const [customTopic, setCustomTopic] = useState('');
  const [tone, setTone] = useState<'persuasive' | 'friendly' | 'professional'>('persuasive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<GooglePostDraft[]>([]);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Editable Draft Text map
  const [editedSummaries, setEditedSummaries] = useState<{ [id: string]: string }>({});

  // Publishing State
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History & Status
  const [savedPosts, setSavedPosts] = useState<SavedPostItem[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [gmbStatus, setGmbStatus] = useState<GmbStatus | null>(null);
  const [isConnectingGmb, setIsConnectingGmb] = useState(false);

  // Load GMB connection status & past posts
  useEffect(() => {
    if (!activeBusiness?.id) return;
    loadGmbStatus();
    loadPastPosts();
  }, [activeBusiness?.id]);

  const loadGmbStatus = async () => {
    if (!activeBusiness?.id) return;
    try {
      const res = await apiFetch<GmbStatus>(`/api/gmb/status?businessId=${activeBusiness.id}`);
      setGmbStatus(res || { connected: false });
    } catch {
      setGmbStatus({ connected: false });
    }
  };

  const loadPastPosts = async () => {
    if (!activeBusiness?.id) return;
    setIsLoadingPosts(true);
    try {
      const res = await apiFetch<{ success: boolean; posts: SavedPostItem[] }>(`/api/gmb/posts?businessId=${activeBusiness.id}`);
      if (res?.success && Array.isArray(res.posts)) {
        setSavedPosts(res.posts);
      }
    } catch (err) {
      console.warn('Failed to load past posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Generate AI Posts
  const handleGeneratePosts = async () => {
    if (!activeBusiness?.id) return;
    setIsGenerating(true);
    setNotice(null);

    try {
      const res = await apiFetch<{ success: boolean; drafts: GooglePostDraft[]; usedFallback: boolean }>(
        '/api/gmb/posts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            businessId: activeBusiness.id,
            postType,
            customTopic: customTopic.trim(),
            tone
          })
        }
      );

      if (res?.success && Array.isArray(res.drafts) && res.drafts.length > 0) {
        setDrafts(res.drafts);
        // Initialize editable summaries
        const initialMap: { [id: string]: string } = {};
        res.drafts.forEach((d) => {
          initialMap[d.id] = d.summary;
        });
        setEditedSummaries(initialMap);
        setNotice({
          message: '3 AI-optimized Google Maps posts generated successfully!',
          type: 'success'
        });
      } else {
        setNotice({ message: 'Could not generate posts. Please try again.', type: 'error' });
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Error generating posts with AI.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Direct Publish to Google Maps
  const handlePublishPost = async (draft: GooglePostDraft) => {
    if (!activeBusiness?.id) return;
    setPublishingId(draft.id);
    setNotice(null);

    const summaryToSend = editedSummaries[draft.id] || draft.summary;

    try {
      const res = await apiFetch<{
        success: boolean;
        post: SavedPostItem;
        googlePublished: boolean;
        message: string;
      }>('/api/gmb/posts/publish', {
        method: 'POST',
        body: JSON.stringify({
          businessId: activeBusiness.id,
          draft: {
            ...draft,
            summary: summaryToSend
          }
        })
      });

      if (res?.success) {
        if (res.googlePublished) {
          setNotice({
            message: '🎉 Awesome! Post is now LIVE directly on Google Maps and Google Search!',
            type: 'success'
          });
        } else {
          setNotice({
            message: `Post saved to dashboard! ${res.message || 'Connect Google account to enable 100% direct publishing.'}`,
            type: 'info'
          });
        }
        await loadPastPosts();
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Failed to publish post.', type: 'error' });
    } finally {
      setPublishingId(null);
    }
  };

  // 1-Click Copy & Open Google Profile fallback
  const handleCopyAndOpenGoogle = (draft: GooglePostDraft) => {
    const textToCopy = editedSummaries[draft.id] || draft.summary;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 3000);

    // Save to dashboard history in background
    if (activeBusiness?.id) {
      apiFetch('/api/gmb/posts/publish', {
        method: 'POST',
        body: JSON.stringify({
          businessId: activeBusiness.id,
          draft: { ...draft, summary: textToCopy }
        })
      }).then(() => loadPastPosts()).catch(() => {});
    }

    // Open Google Business Profile manager in new tab
    const placeId = activeBusiness?.googlePlaceId || '';
    const googlePostUrl = placeId
      ? `https://search.google.com/local/posts?placeid=${placeId}`
      : 'https://business.google.com';
    window.open(googlePostUrl, '_blank', 'noopener,noreferrer');
  };

  // Connect Google Profile OAuth trigger
  const handleConnectGoogle = async () => {
    if (!activeBusiness?.id) return;
    setIsConnectingGmb(true);
    try {
      const res = await apiFetch<{ authUrl: string }>(`/api/gmb/connect?businessId=${activeBusiness.id}`, {
        method: 'POST'
      });
      if (res?.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      setNotice({ message: err?.message || 'Failed to initiate Google authorization.', type: 'error' });
    } finally {
      setIsConnectingGmb(false);
    }
  };

  // Delete past post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post from your dashboard history?')) return;
    try {
      await apiFetch(`/api/gmb/posts/${postId}`, { method: 'DELETE' });
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      setNotice({ message: 'Post record removed from dashboard.', type: 'info' });
    } catch (err: any) {
      setNotice({ message: err?.message || 'Could not delete post.', type: 'error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner Notice */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notice.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : notice.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Google Posts & Updates Studio</span>
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5">
                AI Powered
              </Badge>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish weekly offers, news & festive updates to rank #{activeBusiness?.name || 'Your Business'} higher on Google Maps.
          </p>
        </div>

        {/* Google Connection Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {gmbStatus?.connected ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-2xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Profile Connected</span>
            </div>
          ) : (
            <Button
              onClick={handleConnectGoogle}
              disabled={isConnectingGmb}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-4 h-10 cursor-pointer"
            >
              {isConnectingGmb ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting…</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5" />
                  <span>Connect Google Account</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main AI Generation Studio Card */}
      <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-slate-50/60 to-purple-50/20">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Post Studio</span>
          </div>
          <CardTitle className="text-lg font-bold text-slate-900 mt-1">
            Create an Eye-Catching Google Maps Update in Seconds
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Select the type of post you want. Our AI will craft local SEO-rich copy, call-to-action buttons, and tags.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Post Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Post Goal / Type:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPostType('offer')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  postType === 'offer'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black mb-1">
                  <span>🏷️</span>
                  <span>Special Offer / Deal</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Promote discounts, package deals, or limited-time seasonal coupons with "Call Now".
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPostType('update')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  postType === 'update'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black mb-1">
                  <span>📢</span>
                  <span>What's New / Announcement</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Highlight new services, upgraded infrastructure, or signature products with "Book Online".
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPostType('festive')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  postType === 'festive'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black mb-1">
                  <span>🎉</span>
                  <span>Festive & Community</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Diwali, New Year, Sunday specials, customer appreciation, and warm walk-in welcomes.
                </p>
              </button>
            </div>
          </div>

          {/* Custom Topic Input & Tone Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Optional Custom Note or Offer Details:
              </label>
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Flat 20% off on dental implants, weekend special family combo (or leave blank for AI Autopilot)..."
                className="h-11 rounded-xl text-xs sm:text-sm border-slate-200 focus-visible:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 block">
                💡 Leave blank to let AI automatically generate the best high-ranking local post for your business category!
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Writing Tone:</label>
              <select
                value={tone}
                onChange={(e: any) => setTone(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="persuasive">Persuasive & High Click-Through</option>
                <option value="friendly">Warm & Welcoming</option>
                <option value="professional">Formal & Professional</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              onClick={handleGeneratePosts}
              disabled={isGenerating}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md gap-2 px-8 h-12 cursor-pointer transition-transform active:scale-98"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Writing 3 Custom Google Posts…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 3 AI Google Posts Now</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Google Maps Live Preview Section */}
      {drafts.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Google Maps Live Previews</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>3 Unique AI Angles Ready</span>
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Review, edit if desired, and hit Publish to send directly to Google Maps!
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePosts}
              disabled={isGenerating}
              className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Crafting New Variations...' : 'Generate New Variations (Re-Roll)'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drafts.map((draft, idx) => {
              const currentSummary = editedSummaries[draft.id] || draft.summary;
              const isPublishingThis = publishingId === draft.id;
              const isCopiedThis = copiedId === draft.id;

              return (
                <div
                  key={draft.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  {/* Google Post Mock Header */}
                  <div>
                    {/* Visual Card Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {activeBusiness?.name?.substring(0, 1) || 'G'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {activeBusiness?.name || 'Local Store'}
                          </p>
                          <p className="text-[10px] text-slate-400">Google Business Profile • Just now</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                          draft.topicType === 'OFFER'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {draft.topicType === 'OFFER' ? 'Special Offer' : 'What\'s New'}
                      </Badge>
                    </div>

                    {/* Headline & Editable Body */}
                    <div className="p-4 space-y-3">
                      <div className="font-bold text-sm text-slate-900 leading-snug">
                        {draft.headline}
                      </div>

                      {/* Editable Text Area */}
                      <div>
                        <textarea
                          rows={6}
                          value={currentSummary}
                          onChange={(e) =>
                            setEditedSummaries((prev) => ({
                              ...prev,
                              [draft.id]: e.target.value
                            }))
                          }
                          className="w-full text-xs text-slate-700 leading-relaxed p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50 resize-none font-sans"
                          placeholder="Post summary text..."
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>~{currentSummary.split(/\s+/).filter(Boolean).length} words</span>
                          <span className="text-purple-600 font-semibold">✏️ Editable</span>
                        </div>
                      </div>

                      {/* Coupon Code Pill if Offer */}
                      {draft.couponCode && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900">
                          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Code:</span>
                          <span className="font-mono font-black tracking-wider text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                            {draft.couponCode}
                          </span>
                        </div>
                      )}

                      {/* CTA Button Mock */}
                      <div className="p-2.5 rounded-xl bg-slate-100 text-center font-bold text-xs text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>Action: {draft.callToAction.label}</span>
                      </div>

                      {/* Suggested Photo Tip */}
                      <div className="text-[10px] text-slate-500 bg-purple-50/40 p-2 rounded-lg border border-purple-100 flex items-start gap-1.5">
                        <span className="text-purple-600 font-bold shrink-0">📸 Photo:</span>
                        <span className="line-clamp-2">{draft.suggestedPhoto}</span>
                      </div>
                    </div>
                  </div>

                  {/* Publishing Actions Footer */}
                  <div className="p-4 pt-0 space-y-2 border-t border-slate-100 bg-slate-50/30">
                    <Button
                      onClick={() => handlePublishPost(draft)}
                      disabled={isPublishingThis}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs gap-1.5 h-10 cursor-pointer"
                    >
                      {isPublishingThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing to Google Maps…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish to Google Maps</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleCopyAndOpenGoogle(draft)}
                      className="w-full text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 rounded-xl gap-1.5 h-9 cursor-pointer"
                    >
                      {isCopiedThis ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied! Opening Google…</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy & Open Google</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Published Posts History Table / Feed */}
      <Card className="rounded-3xl border-slate-200/90 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Recent Posts History</span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  ({savedPosts.length} total)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Log of published Google Maps updates and saved drafts for this outlet.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPastPosts}
              disabled={isLoadingPosts}
              className="text-xs font-semibold rounded-xl gap-1 text-slate-600 hover:text-slate-900 cursor-pointer h-8 px-2.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPosts ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingPosts ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-semibold">Loading your post history…</p>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Share2 className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
              <p className="text-xs font-semibold text-slate-600">No posts published yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Use the AI Studio above to create your first Google Maps update! Regular posts increase search rankings by up to 3x.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedPosts.map((post) => {
                const dateStr = new Date(post.createdAt * 1000).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={post.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-black ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {post.status === 'published' ? '🟢 Live on Google' : '📝 Saved in App'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                        {post.couponCode && (
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Code: {post.couponCode}
                          </span>
                        )}
                      </div>

                      {post.headline && (
                        <p className="text-xs font-bold text-slate-900">{post.headline}</p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {post.searchUrl && (
                        <a
                          href={post.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1 transition-colors"
                          title="View live post on Google Maps"
                        >
                          <span>View on Google</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(post.summary);
                          alert('Post text copied to clipboard!');
                        }}
                        className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 font-bold cursor-pointer"
                        title="Copy post text"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePost(post.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete post record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

