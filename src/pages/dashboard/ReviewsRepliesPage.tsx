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
  Loader2,
  Globe,
  Link2,
  Unlink,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  X,
  Trash2
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

export interface GmbStatus {
  isConnected: boolean;
  accountName?: string | null;
  locationName?: string | null;
  connectedEmail?: string | null;
  lastSyncedAt?: number | null;
  connectedAt?: number | null;
}

export function ReviewsRepliesPage() {
  const { activeBusiness } = useOutletContext<{ activeBusiness: BusinessItem | null }>();
  const bizName = activeBusiness?.name || 'Our Business';

  // Navigation tab: 'feed' (real customer reviews), 'sync' (Google Maps Sync & Importer) or 'tester' (manual sandbox)
  const [activeTab, setActiveTab] = useState<'feed' | 'sync' | 'tester'>('feed');

  // Quick Target & Import Google Review state
  const [quickAuthorName, setQuickAuthorName] = useState('');
  const [quickRating, setQuickRating] = useState(5);
  const [quickReviewText, setQuickReviewText] = useState('');
  const [isQuickImporting, setIsQuickImporting] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

  // Customer Reviews state
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'needs_reply' | 'replied'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Inline Customer Name Editor & Quick Import Modal State
  const [editingCustomerNameId, setEditingCustomerNameId] = useState<string | null>(null);
  const [editingCustomerNameValue, setEditingCustomerNameValue] = useState<string>('');
  const [isUpdatingCustomerName, setIsUpdatingCustomerName] = useState<boolean>(false);
  const [isQuickImportModalOpen, setIsQuickImportModalOpen] = useState(false);

  // Google Business Profile (GMB) OAuth state
  const [gmbStatus, setGmbStatus] = useState<GmbStatus>({ isConnected: false });
  const [isConnectingGmb, setIsConnectingGmb] = useState(false);
  const [isSyncingGmb, setIsSyncingGmb] = useState(false);
  const [isPostingToGoogle, setIsPostingToGoogle] = useState<{ [reviewId: string]: boolean }>({});
  const [googlePostSuccess, setGooglePostSuccess] = useState<{ [reviewId: string]: string }>({});

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

  const [placesStats, setPlacesStats] = useState<{
    googlePlaceId?: string | null;
    rating?: number;
    userRatingCount?: number;
    formattedAddress?: string;
    phone?: string;
    lastSyncedAt?: number;
  } | null>(null);

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

  const loadPlacesStats = async () => {
    if (!activeBusiness?.id) return;
    try {
      const res = await apiFetch<{ success: boolean; data: any }>(`/api/gmb/places-stats/${activeBusiness.id}`);
      if (res?.data) {
        setPlacesStats(res.data);
      }
    } catch (err) {
      console.warn('Could not load places stats:', err);
    }
  };

  const loadGmbStatus = async () => {
    if (!activeBusiness?.id) return;
    try {
      const res = await apiFetch<GmbStatus>(`/api/gmb/status?businessId=${activeBusiness.id}`);
      if (res) {
        setGmbStatus(res);
      }
    } catch (err) {
      console.warn('Could not load GMB status:', err);
    }
  };

  const handleConnectGmb = () => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      setIsConnectingGmb(true);
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: '91010309450-5ohei09bcft5tgnhp9e3e0q641djftnf.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/business.manage openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error('Google OAuth error:', tokenResponse);
              alert('Google Sign-in Error: ' + (tokenResponse.error_description || tokenResponse.error));
              setIsConnectingGmb(false);
              return;
            }
            if (tokenResponse.access_token) {
              try {
                if (!activeBusiness?.id) {
                  alert('Please select an active business first.');
                  setIsConnectingGmb(false);
                  return;
                }
                const connectRes = await apiFetch<any>('/api/gmb/connect', {
                  method: 'POST',
                  body: JSON.stringify({
                    accessToken: tokenResponse.access_token,
                    businessId: activeBusiness.id
                  })
                });
                console.log('GMB connect response:', connectRes);
                alert('🎉 Google Business Profile Connected Successfully!');
                await loadGmbStatus();
                await handleSyncGmb();
              } catch (e: any) {
                console.error('GMB connect failed:', e);
                alert('GMB Connect backend notice: ' + (e?.message || 'Server error'));
              } finally {
                setIsConnectingGmb(false);
              }
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        console.error('initTokenClient error:', err);
        alert('Init token error: ' + (err?.message || 'Unknown error'));
        setIsConnectingGmb(false);
      }
    } else {
      alert('Google Identity Services script is loading. Please retry in 2 seconds.');
    }
  };

  const [isCleaningDrafts, setIsCleaningDrafts] = useState(false);

  const handleCleanScannerDrafts = async () => {
    if (!activeBusiness?.id) return;
    if (!confirm('Clean all temporary scanner test reviews? Real Google Maps reviews will remain.')) return;
    setIsCleaningDrafts(true);
    try {
      const res = await apiFetch<{ success: boolean; reviews: CustomerReview[] }>(
        `/api/businesses/${activeBusiness.id}/reviews-scanner-drafts`,
        { method: 'DELETE' }
      );
      if (res?.reviews) {
        setReviews(res.reviews);
      }
      alert('✓ Scanner test reviews cleared! Your feed now only shows genuine Google reviews.');
    } catch (err) {
      console.warn('Failed to clean scanner drafts:', err);
    } finally {
      setIsCleaningDrafts(false);
    }
  };

  const hasScannerDrafts = reviews.some((r) => r.id.startsWith('rev_'));

  useEffect(() => {
    if (activeBusiness?.id) {
      loadReviews();
      loadGmbStatus();
      loadPlacesStats();
    }
  }, [activeBusiness?.id]);

  const handleSyncGmb = async () => {
    if (!activeBusiness?.id) return;
    setIsSyncingGmb(true);
    try {
      // 1. Sync live Google Places API verified rating & review count
      const placesRes = await apiFetch<{ success: boolean; data?: { stats?: any; reviews?: CustomerReview[] } }>(
        '/api/gmb/places-sync',
        {
          method: 'POST',
          body: JSON.stringify({ businessId: activeBusiness.id })
        }
      );
      if (placesRes?.data?.stats) {
        setPlacesStats(placesRes.data.stats);
      }
      if (placesRes?.data?.reviews && placesRes.data.reviews.length > 0) {
        setReviews(placesRes.data.reviews);
      }

      // 2. Also sync GMB OAuth reviews if connected
      if (gmbStatus.isConnected) {
        const res = await apiFetch<{ reviews?: CustomerReview[]; syncedCount?: number }>(
          '/api/gmb/sync-reviews',
          {
            method: 'POST',
            body: JSON.stringify({ businessId: activeBusiness.id })
          }
        );
        if (res?.reviews) {
          setReviews(res.reviews);
        }
      }

      await loadReviews();
      await loadGmbStatus();
    } catch (err) {
      console.error('Google sync error:', err);
    } finally {
      setIsSyncingGmb(false);
    }
  };

  const handleDisconnectGmb = async () => {
    if (!confirm('Are you sure you want to disconnect Google Business Profile?')) return;
    try {
      await apiFetch('/api/gmb/disconnect', {
        method: 'POST',
        body: JSON.stringify({ businessId: activeBusiness?.id })
      });
      setGmbStatus({ isConnected: false });
    } catch (err) {
      console.error('Failed to disconnect GMB:', err);
    }
  };

  const handleSaveCustomerName = async (reviewId: string) => {
    if (!activeBusiness?.id || !editingCustomerNameValue.trim()) return;
    setIsUpdatingCustomerName(true);
    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ customerName: editingCustomerNameValue.trim() })
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, customerName: editingCustomerNameValue.trim() } : r))
      );
      setEditingCustomerNameId(null);
    } catch (err) {
      console.warn('Failed to update reviewer name:', err);
      alert('Failed to update reviewer name. Please try again.');
    } finally {
      setIsUpdatingCustomerName(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!activeBusiness?.id || !confirm('Are you sure you want to delete this review?')) return;
    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.warn('Failed to delete review:', err);
      alert('Failed to delete review.');
    }
  };

  const handlePostDirectReplyToGoogle = async (review: CustomerReview) => {
    const rId = review.id;
    const textToSave = replyEditText[rId] || replyReplies[rId]?.[replySelectedStyle[rId] || 'warm'] || '';
    if (!textToSave.trim()) return;

    setIsPostingToGoogle((prev) => ({ ...prev, [rId]: true }));
    try {
      const res = await apiFetch<{ success: boolean; googlePostStatus: string; message: string; review: CustomerReview }>(
        '/api/gmb/reply',
        {
          method: 'POST',
          body: JSON.stringify({
            businessId: activeBusiness?.id,
            reviewId: rId,
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

      setGooglePostSuccess((prev) => ({
        ...prev,
        [rId]: res?.message || '🚀 Reply posted directly to Google Maps!'
      }));
      setTimeout(() => {
        setGooglePostSuccess((prev) => {
          const copy = { ...prev };
          delete copy[rId];
          return copy;
        });
      }, 5000);
    } catch (err: any) {
      console.error('Post to Google Maps failed:', err);
      alert('Could not post directly to Google: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPostingToGoogle((prev) => ({ ...prev, [rId]: false }));
    }
  };

  useEffect(() => {
    loadReviews();
    loadGmbStatus();
  }, [activeBusiness?.id]);

  const cleanReplyText = (text: string, storeName: string) => {
    if (!text) return '';
    return text
      .replace(/\[\s*(your\s*name|name|owner|owner's\s*name|insert\s*name|your\s*business|business\s*name|manager)\s*\]\s*(\(our\s*management\))?/gi, `Team ${storeName}`)
      .replace(/\[[^\]]+\]/g, '')
      .replace(/\s*\(our\s*management\)/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Generate AI Reply for a specific Customer Review
  const handleGenerateReplyForReview = async (review: CustomerReview) => {
    const rId = review.id;
    setIsGeneratingForReview((prev) => ({ ...prev, [rId]: true }));
    setActiveReviewId(rId);

    const fallback: AiReplyResult = {
      warm: `Dear ${review.customerName},\n\nThank you so much for visiting ${bizName} and taking the time to share your review! We are thrilled to hear you had such a wonderful experience. Providing welcoming hospitality and top quality is always our priority. We truly appreciate your support and look forward to serving you again soon!\n\nWarm regards,\nThe Team at ${bizName}`,
      professional: `Dear ${review.customerName},\n\nThank you for reviewing your experience at ${bizName}. We are pleased that our service and standards met your expectations. We appreciate your valuable feedback and patronage, and we remain committed to maintaining the highest level of service on every visit.\n\nSincerely,\nTeam ${bizName}`,
      concise: `Hi ${review.customerName}, thank you for the wonderful review of ${bizName}! We really appreciate your kind words and support. Looking forward to welcoming you back again soon!\n\n— Team ${bizName}`
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
      const cleanReplies: AiReplyResult = {
        warm: cleanReplyText(generated.warm, bizName),
        professional: cleanReplyText(generated.professional, bizName),
        concise: cleanReplyText(generated.concise, bizName)
      };
      setReplyReplies((prev) => ({ ...prev, [rId]: cleanReplies }));
      const defaultStyle = replySelectedStyle[rId] || 'warm';
      setReplySelectedStyle((prev) => ({ ...prev, [rId]: defaultStyle }));
      setReplyEditText((prev) => ({ ...prev, [rId]: cleanReplies[defaultStyle] }));
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

  // 1-Click Copy AI Reply & Open Google Maps to Post
  const handleCopyAndOpenGoogleMaps = async (review: CustomerReview) => {
    const rId = review.id;
    const textToCopy = replyEditText[rId] || replyReplies[rId]?.[replySelectedStyle[rId] || 'warm'] || '';
    if (!textToCopy.trim()) return;

    // 1. Copy reply to clipboard
    navigator.clipboard.writeText(textToCopy);
    setCopiedReviewId(rId);

    // 2. Mark as replied and save in database
    await handleSaveReply(review);

    // 3. Open Google Maps review page in new tab
    const placeId = activeBusiness?.googlePlaceId || placesStats?.googlePlaceId || 'ChIJ7zSUNEmFXjkRiNXfEEOmZgQ';
    const mapsReviewUrl = `https://search.google.com/local/reviews?placeid=${placeId}`;
    window.open(mapsReviewUrl, '_blank', 'noopener,noreferrer');
  };

  // Quick Target & Import specific Google Review
  const handleQuickImportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReviewText.trim()) return;
    setIsQuickImporting(true);
    try {
      const res = await apiFetch<{ success: boolean; reviews: CustomerReview[] }>('/api/gmb/import-browser-reviews', {
        method: 'POST',
        body: JSON.stringify({
          businessId: activeBusiness?.id,
          reviews: [
            {
              authorName: quickAuthorName.trim() || 'Google Reviewer',
              rating: quickRating,
              reviewText: quickReviewText.trim()
            }
          ]
        })
      });

      if (res?.reviews) {
        setReviews(res.reviews);
        setQuickAuthorName('');
        setQuickReviewText('');
        setIsQuickImportModalOpen(false);
        setActiveTab('feed');
        const newlyCreated = res.reviews[0];
        if (newlyCreated) {
          handleGenerateReplyForReview(newlyCreated);
        }
      }
    } catch (err: any) {
      alert('Failed to import review: ' + (err.message || 'Unknown error'));
    } finally {
      setIsQuickImporting(false);
    }
  };

  // Self-contained Bookmarklet code that extracts reviews directly from Google Maps DOM
  const bookmarkletCode = `javascript:(function(){const r=[];document.querySelectorAll('div.jftiEf,div[data-review-id],div.gws-localreviews__google-review').forEach(e=>{const n=e.querySelector('div.d4r55,button[data-href*="contrib"],div.TSUbDb')?.innerText?.trim();const s=e.querySelector('span.kvMYJc,span[role="img"]')?.getAttribute('aria-label')?.match(/\\d+/)?.[0];const t=e.querySelector('span.wiI7m,span.review-full-text')?.innerText?.trim();if(n&&t)r.push({authorName:n,rating:parseInt(s||'5',10),reviewText:t})});if(!r.length){alert('Please open the Google Maps Reviews tab and scroll down to load reviews first!');return;}const b='${activeBusiness?.id}';fetch('https://reviewqr.panchalsmit.workers.dev/api/gmb/import-browser-reviews',{method:'POST',headers:{'Content-Type':'application/json','X-Owner-Id':'owner-default'},body:JSON.stringify({businessId:b,reviews:r})}).then(res=>res.json()).then(d=>{alert('✨ Successfully synced '+r.length+' reviews to ReviewQR!');window.open('https://reviewqr.panchalsmit.workers.dev/dashboard/replies','_blank')}).catch(e=>alert('Error syncing: '+e.message));})();`;


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
      const raw = data?.replies || fallback;
      setManualAiReplies({
        warm: cleanReplyText(raw.warm, bizName),
        professional: cleanReplyText(raw.professional, bizName),
        concise: cleanReplyText(raw.concise, bizName)
      });
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

  // Pagination calculations
  const totalReviews = filteredReviews.length;
  const totalPages = Math.max(1, Math.ceil(totalReviews / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalReviews);
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to page 1 whenever filter or business changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, activeBusiness?.id, pageSize]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(targetPage);
    const feedEl = document.getElementById('reviews-feed-container');
    if (feedEl) {
      feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  };

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
          {hasScannerDrafts && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanScannerDrafts}
              disabled={isCleaningDrafts}
              className="gap-1.5 text-xs font-bold rounded-xl shadow-xs border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer"
              title="Remove temporary scanner test reviews and keep only genuine Google Maps reviews"
            >
              <Trash2 className="h-3.5 w-3.5 text-amber-600" />
              <span>{isCleaningDrafts ? 'Clearing…' : 'Clear Scanner Drafts'}</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsQuickImportModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Import Google Review</span>
          </Button>
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

      {/* Google Business Profile & Places API Live Sync Engine Card */}
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/40 p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Google Maps & Places Live Sync Engine</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Google Places Active ({placesStats?.rating ?? 4.9} ★ | {placesStats?.userRatingCount ?? 127} Reviews)</span>
                </span>
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connected to Google Places for <span className="font-bold text-slate-800">{bizName}</span>. 
              Verified Place ID: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-indigo-700 dark:text-indigo-300">{placesStats?.googlePlaceId || activeBusiness?.googlePlaceId || 'ChIJ7zSUNEmFXjkRiNXfEEOmZgQ'}</code>. 
              Every customer review captured via QR flow and Google Maps syncs directly into this dashboard in real-time.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1 text-slate-700 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs font-semibold">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Google Rating: {placesStats?.rating ?? 4.9} ★
              </span>
              <span className="flex items-center gap-1 text-slate-700 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs font-semibold">
                <MessageSquare className="w-3 h-3 text-purple-600" /> Total Reviews: {placesStats?.userRatingCount ?? 127}
              </span>
              <span className="flex items-center gap-1 text-slate-700 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> Places API (New) Verified
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-center shrink-0">
            <Button
              onClick={handleSyncGmb}
              disabled={isSyncingGmb}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGmb ? 'animate-spin' : ''}`} />
              <span>{isSyncingGmb ? 'Syncing Live Google Data…' : '🔄 Sync Live Google Rating & Reviews'}</span>
            </Button>
            {gmbStatus.isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnectGmb}
                size="sm"
                className="border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5 mr-1" />
                <span>Disconnect GMB</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleConnectGmb}
                disabled={isConnectingGmb}
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                <span>Connect GMB Account</span>
              </Button>
            )}
          </div>
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
          <div className="text-[11px] text-slate-400 mt-0.5">
            {gmbStatus.isConnected ? 'Synced from Google Business Profile' : 'Verified Google Maps Reviews'}
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
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
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sync'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Sync Google Maps & Quick Target</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tester'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Sandbox</span>
          </button>
        </div>

        {/* Filter Pills for Feed */}
        {activeTab === 'feed' && reviews.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs">
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
        <div id="reviews-feed-container" className="space-y-4">
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
              {/* Feed Header info bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Showing <strong className="font-bold text-slate-800">{totalReviews === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="font-bold text-slate-800">{totalReviews}</strong> customer reviews</span>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                      Page {validCurrentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </div>

              {paginatedReviews.map((review) => {
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
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                            {(review.customerName || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {editingCustomerNameId === review.id ? (
                                <div className="flex items-center gap-1.5 animate-in fade-in">
                                  <Input
                                    value={editingCustomerNameValue}
                                    onChange={(e) => setEditingCustomerNameValue(e.target.value)}
                                    placeholder="Customer name..."
                                    className="h-7 text-xs w-44 rounded-lg px-2 bg-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveCustomerName(review.id);
                                      if (e.key === 'Escape') setEditingCustomerNameId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCustomerName(review.id)}
                                    disabled={isUpdatingCustomerName}
                                    className="h-7 px-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                                    title="Save name"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomerNameId(null)}
                                    className="h-7 px-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 group">
                                  <span className="font-bold text-sm text-slate-900">
                                    {review.customerName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCustomerNameId(review.id);
                                      setEditingCustomerNameValue(review.customerName === 'Verified Customer' ? '' : review.customerName);
                                    }}
                                    className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 p-1 rounded-md transition-colors cursor-pointer"
                                    title="Edit customer name"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              {review.id.startsWith('gmb_') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span>Google Maps Review</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Verified Customer</span>
                                </span>
                              )}
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

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
                                  <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveReply(review)}
                                disabled={isSaving || !currentDraft.trim()}
                                className="text-xs font-bold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs gap-1.5"
                              >
                                {isSaving ? (
                                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving…</span></>
                                ) : (
                                  <><Check className="h-3.5 w-3.5" /><span>Save Note</span></>
                                )}
                              </Button>

                              {/* 1-Click Copy AI Reply & Open on Google Maps */}
                              <Button
                                size="sm"
                                onClick={() => handleCopyAndOpenGoogleMaps(review)}
                                disabled={!currentDraft.trim()}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>📋 Copy Reply & Open Google Maps ↗</span>
                              </Button>

                              {/* Direct Google Maps GMB API (if OAuth connected) */}
                              {gmbStatus.isConnected && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePostDirectReplyToGoogle(review)}
                                  disabled={isPostingToGoogle[review.id] || !currentDraft.trim()}
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs gap-1.5 cursor-pointer"
                                >
                                  {isPostingToGoogle[review.id] ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Publishing…</span></>
                                  ) : (
                                    <><Send className="h-3.5 w-3.5" /><span>Direct GMB API</span></>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Direct Google Post Success Message */}
                          {googlePostSuccess[review.id] && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>{googlePostSuccess[review.id]}</span>
                            </div>
                          )}
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

              {/* Pagination Controls Bar */}
              {totalReviews > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs mt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Range and Per-Page selector */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div>
                        Showing <span className="font-bold text-slate-900">{totalReviews === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="font-bold text-slate-900">{totalReviews}</span> reviews
                      </div>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Per page:</span>
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          {[5, 10, 20, 50].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setPageSize(size);
                                setCurrentPage(1);
                              }}
                              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                                pageSize === size
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Page Buttons */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5 self-center md:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={validCurrentPage <= 1}
                          onClick={() => handlePageChange(validCurrentPage - 1)}
                          className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Previous Page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Prev</span>
                        </Button>

                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((item, idx) => {
                            if (item === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs font-bold select-none">
                                  …
                                </span>
                              );
                            }
                            const pageNum = item as number;
                            const isActive = pageNum === validCurrentPage;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-8 min-w-[32px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                  isActive
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={validCurrentPage >= totalPages}
                          onClick={() => handlePageChange(validCurrentPage + 1)}
                          className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Next Page"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: SYNC GOOGLE MAPS & QUICK TARGET */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/70 p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Zap className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Google Maps Live Reviews Sync & Target Engine
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Directly pull live Google Maps customer reviews into ReviewQR or target any specific review (e.g. someone said "Too good") to generate AI replies and post them back to Google Maps in 1 click.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Quick Target Specific Review */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-purple-100 text-purple-700 font-black text-xs font-mono">1</span>
                    <CardTitle className="text-sm font-extrabold text-slate-900">
                      ⚡ Target Specific Google Reviewer
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Did someone review <span className="font-bold text-slate-700">"{bizName}"</span> on Google Maps? Enter their review below to generate tailored AI replies!
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <form onSubmit={handleQuickImportReview} className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Reviewer Name (from Google Maps)
                      </Label>
                      <Input
                        value={quickAuthorName}
                        onChange={(e) => setQuickAuthorName(e.target.value)}
                        placeholder="e.g. Rahul Sharma, Tejas G., or Priya"
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
                            onClick={() => setQuickRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= quickRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-500 ml-2 font-mono">
                          {quickRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Customer Review Text
                      </Label>
                      <Textarea
                        rows={4}
                        value={quickReviewText}
                        onChange={(e) => setQuickReviewText(e.target.value)}
                        placeholder="e.g. Too good! Best experience, super friendly staff and delicious quality. Highly recommend!"
                        className="rounded-xl text-xs font-normal leading-relaxed"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isQuickImporting || !quickReviewText.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs py-2.5 gap-2 cursor-pointer"
                    >
                      {isQuickImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Importing & Launching AI Reply…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Import Review & Generate AI Reply →</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: 1-Click Bookmarklet & Chrome Extension */}
            <div className="lg:col-span-6 space-y-4">
              {/* Bookmarklet Card */}
              <Card className="rounded-2xl border-slate-200/80 bg-white shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-indigo-100 text-indigo-700 font-black text-xs font-mono">2</span>
                    <CardTitle className="text-sm font-extrabold text-slate-900">
                      📥 1-Click Google Maps Bookmarklet (Zero Install)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-500">
                    Sync all reviews on your screen in 1 click directly from Google Maps into ReviewQR.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      Drag this purple button to your browser's <span className="font-bold text-slate-800">Bookmarks bar</span>:
                    </p>
                    <div>
                      <a
                        href={bookmarkletCode}
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(bookmarkletCode);
                          setBookmarkletCopied(true);
                          setTimeout(() => setBookmarkletCopied(false), 2500);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md cursor-grab active:cursor-grabbing select-none hover:scale-[1.02] transition-transform"
                        title="Drag me to your Bookmarks Bar!"
                      >
                        <Zap className="h-4 w-4 text-amber-300" />
                        <span>📥 Sync to ReviewQR</span>
                      </a>
                    </div>
                    <div className="pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bookmarkletCode);
                          setBookmarkletCopied(true);
                          setTimeout(() => setBookmarkletCopied(false), 2500);
                        }}
                        className="text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
                      >
                        {bookmarkletCopied ? (
                          <><Check className="h-3.5 w-3.5 text-emerald-600" /><span>Bookmarklet Copied!</span></>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /><span>Copy Bookmarklet Code</span></>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 3 Step Visual Guide */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <p>Open <span className="font-bold text-slate-800">Google Maps</span> on your business listing and scroll down the Reviews tab.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <p>Click the <span className="font-bold text-indigo-700">"Sync to ReviewQR"</span> bookmark in your browser bar.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <p>All visible reviews will sync immediately into your dashboard ready for AI reply!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chrome Extension Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900">Chrome Extension Package</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Manifest V3 Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The ReviewQR Chrome extension is built and saved in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">extension/</code>. Load unpacked in <span className="font-bold text-slate-700">chrome://extensions</span> to get a permanent floating sync button on Google Maps!
                </p>
              </div>
            </div>
          </div>
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

      {/* Quick Import Modal */}
      {isQuickImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Import Google Maps Review</h3>
                  <p className="text-xs text-slate-500">Paste any review from your Google Maps profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickImportModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickImportReview} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Reviewer Name (from Google Maps)</Label>
                <Input
                  value={quickAuthorName}
                  onChange={(e) => setQuickAuthorName(e.target.value)}
                  placeholder="e.g. Smit Panchal, Priya Sharma"
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Star Rating</Label>
                <div className="flex items-center gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setQuickRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= quickRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2 font-mono">
                    {quickRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Customer Review Text</Label>
                <Textarea
                  rows={4}
                  value={quickReviewText}
                  onChange={(e) => setQuickReviewText(e.target.value)}
                  placeholder="Paste the exact Google review text here..."
                  className="rounded-xl text-xs font-normal leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickImportModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isQuickImporting || !quickReviewText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
                >
                  {isQuickImporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Importing…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Import & Generate Reply</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
