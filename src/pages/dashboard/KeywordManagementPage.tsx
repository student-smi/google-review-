import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tag,
  Sparkles,
  Plus,
  X,
  Check,
  CheckCircle2,
  Save,
  Loader2,
  Wand2,
  Smartphone,
  ExternalLink,
  Layers,
  TrendingUp,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import type { BusinessItem } from './DashboardLayout';
import { apiFetch } from '@/lib/api';

const DEFAULT_CHIPS = [
  'Fast service',
  'Friendly staff',
  'Clean & hygienic',
  'Great value',
  'Neat packaging',
  'Attentive service',
  'Highly recommended'
];

export function KeywordManagementPage() {
  const { activeBusiness, refreshBusinesses } = useOutletContext<{
    activeBusiness: BusinessItem | null;
    refreshBusinesses?: () => Promise<void>;
  }>();

  const [chips, setChips] = useState<string[]>(() => {
    if (activeBusiness?.chipsJson) {
      try {
        const parsed = JSON.parse(activeBusiness.chipsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_CHIPS;
  });

  const [newChipInput, setNewChipInput] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(activeBusiness?.category || 'services');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [detailedAiSuggestions, setDetailedAiSuggestions] = useState<Array<{
    keyword: string;
    type: 'local_seo' | 'product_service' | 'experience_topic';
    reason: string;
    source: string;
    confidence: string;
  }>>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewSelectedChip, setPreviewSelectedChip] = useState<number>(0);

  // Sync when activeBusiness changes
  useEffect(() => {
    if (activeBusiness) {
      setSelectedIndustry(activeBusiness.category || 'services');
      if (activeBusiness.chipsJson) {
        try {
          const parsed = JSON.parse(activeBusiness.chipsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChips(parsed);
            return;
          }
        } catch {}
      }
      setChips(DEFAULT_CHIPS);
    }
  }, [activeBusiness?.id, activeBusiness?.chipsJson]);

  const handleAddChip = (text?: string) => {
    const chipToAdd = (text || newChipInput).trim();
    if (!chipToAdd) return;
    if (chips.some((c) => c.toLowerCase() === chipToAdd.toLowerCase())) {
      setNewChipInput('');
      return;
    }
    setChips((prev) => [...prev, chipToAdd]);
    if (!text) setNewChipInput('');
  };

  const handleRemoveChip = (indexToRemove: number) => {
    setChips((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleResetDefaults = () => {
    setChips(DEFAULT_CHIPS);
  };

  const handleGenerateAiKeywords = async () => {
    if (!activeBusiness) return;
    setIsGeneratingAi(true);
    setAiStatusMsg('');
    try {
      const data = await apiFetch<{
        success: boolean;
        data?: {
          businessName: string;
          businessCategory: string;
          location: string;
          keywordSuggestions: Array<{
            keyword: string;
            type: 'local_seo' | 'product_service' | 'experience_topic';
            reason: string;
            source: string;
            confidence: string;
          }>;
        };
        keywords?: string[];
      }>('/api/ai/local-seo-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          placeId: activeBusiness.googlePlaceId,
          businessName: activeBusiness.name,
          category: selectedIndustry || activeBusiness.category || 'services',
          city: activeBusiness.city,
          address: activeBusiness.address
        })
      });

      if (data?.success && data?.data?.keywordSuggestions) {
        const items = data.data.keywordSuggestions;
        setDetailedAiSuggestions(items);
        setAiSuggestions(items.map((k) => k.keyword));
        setAiStatusMsg(`AI Places Engine generated ${items.length} category & location-specific keywords for "${activeBusiness.name}"!`);
      } else if (data?.success && Array.isArray(data.keywords)) {
        setAiSuggestions(data.keywords);
        setAiStatusMsg(`AI recommended ${data.keywords.length} authentic highlight keywords for "${activeBusiness.name}"!`);
      } else {
        setAiStatusMsg('Could not fetch suggestions. Please try again.');
      }
    } catch (err) {
      console.warn('AI suggestions error:', err);
      setAiStatusMsg('Failed to generate suggestions.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddAllAi = () => {
    const toAdd = aiSuggestions.filter(
      (k) => !chips.some((c) => c.toLowerCase() === k.toLowerCase())
    );
    setChips((prev) => [...prev, ...toAdd]);
  };

  const handleSaveKeywords = async () => {
    if (!activeBusiness?.id) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await apiFetch(`/api/businesses/${activeBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chipsJson: JSON.stringify(chips)
        })
      });

      refreshBusinesses?.();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.warn('Failed to save keywords:', err);
      alert('Could not save keywords. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Keyword Management
            </h1>
            <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              Live Standee Chips
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Customize the service & product keywords customers tap when they scan your standee. The AI incorporates these into authentic Google reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeBusiness?.slug && (
            <a href={`/r/${activeBusiness.slug}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Test Live QR Flow</span>
              </Button>
            </a>
          )}

          <Button
            onClick={handleSaveKeywords}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-4 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving to Standees…</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved & Live!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Keywords ✨</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              All {chips.length} keywords saved successfully! Active customer QR standees now display these updated highlight chips immediately.
            </span>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">Cloudflare KV Synced</Badge>
        </div>
      )}

      {/* Main Grid: Left Editor (7 cols) + Right Mobile Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Keyword Management & AI Engine */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Active Keywords Manager */}
          <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span>Current Active Standee Keywords</span>
                </CardTitle>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {chips.length} Keywords Active
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Customers can select multiple points on their phone to construct customized 5-star reviews.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Active Chip Pills */}
              <div className="min-h-[90px] p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                {chips.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No keywords added yet. Type a keyword below or use AI recommendations!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs hover:border-purple-300 transition-colors group"
                      >
                        <Tag className="h-3 w-3 text-purple-500" />
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChip(index)}
                          title={`Remove ${chip}`}
                          className="h-4 w-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Keyword Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Add New Keyword or Service Specialty
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newChipInput}
                    onChange={(e) => setNewChipInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChip();
                      }
                    }}
                    placeholder="e.g. Fast Haircut, Painless Root Canal, Pure Ghee, Prompt Delivery…"
                    className="text-xs rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddChip()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-4 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Tag</span>
                  </Button>
                </div>
              </div>

              {/* Reset to Defaults Helper */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span>Tip: Keep keywords between 2 to 4 words for best mobile readability.</span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-slate-500 hover:text-purple-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: AI Keyword Generator Engine */}
          <Card className="rounded-2xl border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                    <span>AI Keyword Generator for {activeBusiness?.name || 'Your Business'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    AI analyzes your business category, city, and specialties to recommend high-converting review highlights.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {aiSuggestions.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAllAi}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add All AI Tags</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateAiKeywords}
                    className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 px-3.5 cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>AI Analyzing…</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5 text-amber-300" />
                        <span>{aiSuggestions.length > 0 ? 'Regenerate Suggestions' : '✨ AI Suggest Keywords'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Category Pills Filter */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Target Industry / Business Category (Dynamic)
                    </span>
                    {selectedIndustry && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                        Active: {selectedIndustry}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Category Input with Datalist */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      list="dynamic-industry-suggestions"
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      placeholder="e.g. Electronics store, Dental clinic, Indian sweets, Auto garage…"
                      className="text-xs rounded-xl h-9"
                    />
                    {activeBusiness?.category && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIndustry(activeBusiness.category || '')}
                        className={`text-xs font-bold rounded-xl shrink-0 h-9 px-3 gap-1.5 cursor-pointer ${
                          selectedIndustry.toLowerCase() === (activeBusiness.category || '').toLowerCase()
                            ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-400'
                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Reset to Google verified store category"
                      >
                        <Tag className="h-3 w-3 text-purple-600" />
                        <span>Google Category: {activeBusiness.category}</span>
                      </Button>
                    )}
                  </div>

                  <datalist id="dynamic-industry-suggestions">
                    <option value="Electronics store" />
                    <option value="Cafe & Restaurant" />
                    <option value="Sweets & Bakery" />
                    <option value="Clinic & Dental" />
                    <option value="Salon & Spa" />
                    <option value="Jewellery & Fashion" />
                    <option value="Gym & Fitness center" />
                    <option value="Auto Garage & Repair" />
                    <option value="Digital Agency & IT" />
                    <option value="Coaching & Classes" />
                    <option value="CA, Tax & Legal" />
                    <option value="Supermarket & Retail" />
                    <option value="Mobile & Laptop Repair" />
                    <option value="Hotel & Lodging" />
                    <option value="Hospital & Healthcare" />
                  </datalist>
                </div>

                {/* Quick Industry Template Pills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Industry Templates:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    {[
                      { id: 'Electronics store', label: '⚡ Electronics & Gadgets' },
                      { id: 'Digital Agency & IT', label: '🚀 Digital Agency & IT' },
                      { id: 'Cafe & Restaurant', label: '☕ Cafe & Restaurant' },
                      { id: 'Sweets & Bakery', label: '🍰 Sweets & Bakery' },
                      { id: 'Clinic & Dental', label: '🩺 Clinic & Dental' },
                      { id: 'Salon & Spa', label: '💇 Salon & Spa' },
                      { id: 'Jewellery & Fashion', label: '💎 Jewellery & Fashion' },
                      { id: 'Gym & Fitness', label: '🏋️ Gym & Fitness' },
                      { id: 'Auto Garage', label: '🚗 Auto Garage' },
                      { id: 'Coaching & Classes', label: '📚 Coaching & Classes' },
                      { id: 'CA, Tax & Legal', label: '⚖️ CA, Tax & Legal' }
                    ].map((item) => {
                      const isSelected =
                        selectedIndustry.toLowerCase() === item.id.toLowerCase() ||
                        (selectedIndustry.toLowerCase().includes(item.id.toLowerCase().split(' ')[0]) &&
                          item.id.toLowerCase().split(' ')[0].length > 3);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIndustry(item.id)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {aiStatusMsg && (
                <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>{aiStatusMsg}</span>
                </div>
              )}

              {/* AI Generated Suggestion Pills */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Click any tag to add directly to your standee:
                    </span>
                    <Link
                      to="/dashboard/local-seo"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      <span>Full Places SEO Report</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                    {aiSuggestions.map((tag) => {
                      const alreadyAdded = chips.some((c) => c.toLowerCase() === tag.toLowerCase());
                      const detail = detailedAiSuggestions.find((d) => d.keyword.toLowerCase() === tag.toLowerCase());

                      let typeBadge = null;
                      if (detail?.type === 'local_seo') {
                        typeBadge = <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">Local</span>;
                      } else if (detail?.type === 'product_service') {
                        typeBadge = <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">Product</span>;
                      } else if (detail?.type === 'experience_topic') {
                        typeBadge = <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 font-bold">Review</span>;
                      }

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddChip(tag)}
                          disabled={alreadyAdded}
                          title={detail?.reason || tag}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                            alreadyAdded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60 cursor-not-allowed shadow-2xs'
                              : 'bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 border border-indigo-200 hover:border-indigo-400 cursor-pointer shadow-xs hover:scale-[1.02]'
                          }`}
                        >
                          {alreadyAdded ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Plus className="h-3 w-3 text-indigo-600" />
                          )}
                          <span>{tag}</span>
                          {typeBadge}
                          {alreadyAdded && <span className="text-[9px] text-emerald-600 font-bold uppercase ml-0.5">Added</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Mobile Standee Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-purple-600" />
              <span>Live Customer Mobile Preview</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Instant Sync
            </span>
          </div>

          {/* Smartphone Bezel Simulator */}
          <div className="rounded-[36px] p-4 bg-slate-900 border-4 border-slate-800 shadow-2xl max-w-sm mx-auto">
            {/* Phone Screen Area */}
            <div className="rounded-[28px] bg-slate-50 p-4 space-y-3.5 text-slate-900 shadow-inner">
              {/* Phone Status Bar Mock */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>5G</span>
                </div>
              </div>

              {/* Brand Header */}
              <div className="rounded-2xl bg-white p-3 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {activeBusiness?.name?.substring(0, 1) || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {activeBusiness?.name || 'Upmark'}
                    </h4>
                    <span className="text-[10px] text-slate-400">Google Review Assistant</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50">
                  Verified
                </Badge>
              </div>

              {/* Customer Prompt */}
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  How was your experience today?
                </h3>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tap what stood out. AI will write 3 authentic 5-star Google review options for you:
                </p>
              </div>

              {/* Live Keyword Chips on Phone */}
              <div className="flex flex-wrap gap-1.5 py-1">
                {chips.slice(0, 10).map((chip, idx) => {
                  const isSelected = previewSelectedChip === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewSelectedChip(idx)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      {isSelected ? `✓ ${chip}` : chip}
                    </button>
                  );
                })}
                {chips.length > 10 && (
                  <span className="px-2 py-1 rounded-xl text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200">
                    +{chips.length - 10} more
                  </span>
                )}
              </div>

              {/* Voice button on phone */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Voice or details:</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs">
                  🎙️ બોલીને લખો (Voice)
                </span>
              </div>

              {/* Generate Button Mockup */}
              <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>૩ રિવ્યૂ બનાવો ✨ (Generate 3 Reviews)</span>
              </div>
            </div>
          </div>

          {/* Local SEO Benefit info */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span>Why Keyword Highlights Matter:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Google Maps searches prioritize businesses whose reviews mention specific services (e.g. <em>"Creative Strategy"</em> or <em>"Transparent Pricing"</em>). When customers tap these chips, AI naturally weaves them into high-ranking keyword-rich reviews!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
