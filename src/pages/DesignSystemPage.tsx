import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  Sparkles,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare
} from 'lucide-react';

export function DesignSystemPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 max-w-7xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="saffron">Design System & Tokens</Badge>
            <span className="text-xs text-muted-foreground font-mono">v1.0 (Option A)</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ReviewQR Living Style Guide</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Calm, high-trust craft level inspired by Linear & Stripe Dashboard, with Royal Indigo & Saffron Gold.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="/dashboard">
            <Button size="sm" className="gap-2">
              <span>Go to App</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Toast Notification Banner (Floating) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-3 shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1: Color Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">1. Color Palette Tokens (Option A: Royal Indigo & Saffron)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-primary glow-indigo" />
            <div className="text-xs font-semibold">Primary (Royal Indigo)</div>
            <div className="text-[11px] text-muted-foreground font-mono">#4338CA / #6366F1</div>
          </div>
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-accent glow-saffron" />
            <div className="text-xs font-semibold">Accent (Saffron Gold)</div>
            <div className="text-[11px] text-muted-foreground font-mono">#D97706 / #F59E0B</div>
          </div>
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-background border border-border" />
            <div className="text-xs font-semibold">Background</div>
            <div className="text-[11px] text-muted-foreground font-mono">hsl(var(--background))</div>
          </div>
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-card border border-border" />
            <div className="text-xs font-semibold">Card / Surface</div>
            <div className="text-[11px] text-muted-foreground font-mono">hsl(var(--card))</div>
          </div>
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-emerald-500" />
            <div className="text-xs font-semibold">Success Green</div>
            <div className="text-[11px] text-muted-foreground font-mono">#10B981</div>
          </div>
          <div className="rounded-2xl border border-border p-3 space-y-2 bg-card">
            <div className="h-14 rounded-xl bg-destructive" />
            <div className="text-xs font-semibold">Destructive Red</div>
            <div className="text-[11px] text-muted-foreground font-mono">#EF4444</div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Typography & Indic Multilingual Support */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">2. Typography Hierarchy & Indic Support</h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                Display 2XL • Plus Jakarta Sans 700 (-0.025em)
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                Authentic Google Reviews for Indian Businesses
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
              <div lang="hi" className="space-y-1">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Hindi (Devanagari) • Noto Sans Devanagari (Line-height 1.65)
                </div>
                <p className="text-lg font-medium text-foreground">
                  सच्चे ग्राहकों से असली गूगल रिव्यू प्राप्त करें। कोई नकली रिव्यू नहीं।
                </p>
                <p className="text-sm text-muted-foreground">
                  ग्राहक अपना प्रामाणिक अनुभव कुछ ही सेकंड में लिख सकते हैं।
                </p>
              </div>

              <div lang="gu" className="space-y-1">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Gujarati • Noto Sans Gujarati (Line-height 1.65)
                </div>
                <p className="text-lg font-medium text-foreground">
                  ગ્રાહકો પાસેથી સાચા ગૂગલ રિવ્યૂ ઝડપથી મેળવો. કોઈ ફેક રિવ્યૂ નહીં.
                </p>
                <p className="text-sm text-muted-foreground">
                  તમારા ગ્રાહકો તેમનો સાચો પ્રતિસાદ સરળતાથી આપી શકે છે.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3: Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">3. Button Variants & Interactive States</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => showToast('Primary Button clicked')}>
                Primary Action
              </Button>
              <Button variant="saffron" onClick={() => showToast('Saffron Accent clicked')}>
                <Sparkles className="h-4 w-4" />
                <span>Saffron Accent</span>
              </Button>
              <Button variant="secondary" onClick={() => showToast('Secondary Action clicked')}>
                Secondary
              </Button>
              <Button variant="outline" onClick={() => showToast('Outline Action clicked')}>
                Outline
              </Button>
              <Button variant="ghost" onClick={() => showToast('Ghost Action clicked')}>
                Ghost
              </Button>
              <Button variant="destructive" onClick={() => showToast('Destructive clicked')}>
                Destructive
              </Button>
              <Button variant="primary" isLoading>
                Loading...
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
              <Button size="sm">Small (h-8)</Button>
              <Button size="md">Medium Default (h-10)</Button>
              <Button size="lg">Large Touch Target (h-12)</Button>
              <Button size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: Badges & Status Pills */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">4. Badges & Status Indicators</h2>
        <Card>
          <CardContent className="p-6 flex flex-wrap items-center gap-2.5">
            <Badge variant="default">Default Neutral</Badge>
            <Badge variant="primary">Royal Indigo</Badge>
            <Badge variant="saffron">Saffron Gold</Badge>
            <Badge variant="success">Active / Online</Badge>
            <Badge variant="warning">Quota 80%</Badge>
            <Badge variant="destructive">Quota Exceeded</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 5: Form Inputs & Focus Rings */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">5. Form Controls & Microcopy</h2>
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input placeholder="e.g. Royal Sweets & Bakery" defaultValue="Royal Sweets & Bakery" />
              <p className="text-xs text-muted-foreground">The display name on posters and customer screen.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Google Review Link</Label>
              <Input placeholder="https://g.page/r/..." defaultValue="https://g.page/r/royal-sweets/review" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Valid Google Review format
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Customer Experience Feedback (Guided Prompt)</Label>
              <Textarea placeholder="Customer's real feedback text will appear here..." defaultValue="Visited for Sunday evening snacks. The fresh kaju katli was great, though the billing queue took 10 minutes." />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 6: Data Table & High-Craft Empty State */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">6. Data Table & Empty State</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Dynamic QR Codes</CardTitle>
              <CardDescription>All active QR codes for this business</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Code / Label</th>
                    <th className="px-4 py-3">Scans</th>
                    <th className="px-4 py-3">Drafts</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div>Billing Counter</div>
                      <div className="text-xs text-muted-foreground font-mono">/r/royal-counter</div>
                    </td>
                    <td className="px-4 py-3">142</td>
                    <td className="px-4 py-3">64</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div>Table Tent #4</div>
                      <div className="text-xs text-muted-foreground font-mono">/r/royal-t4</div>
                    </td>
                    <td className="px-4 py-3">89</td>
                    <td className="px-4 py-3">37</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Empty State Preview */}
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-foreground">No Google Reviews Pasted Yet</h4>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Paste customer reviews from your Google Business Profile to generate warm, professional replies.
            </p>
            <Button size="sm" variant="saffron" onClick={() => showToast('Paste review dialog opened')}>
              Paste First Review
            </Button>
          </Card>
        </div>
      </section>

      {/* SECTION 7: Progress Ring & Skeletons */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">7. Progress Rings & Loading Skeletons</h2>
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center gap-4">
              <ProgressRing progress={66} size={64} strokeWidth={6}>
                <span className="text-xs font-bold">2/3</span>
              </ProgressRing>
              <div>
                <div className="font-semibold text-sm">Onboarding Progress</div>
                <div className="text-xs text-muted-foreground">Google Link validated</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ProgressRing progress={24} size={64} strokeWidth={6} className="text-accent">
                <span className="text-xs font-bold text-accent">6/25</span>
              </ProgressRing>
              <div>
                <div className="font-semibold text-sm">Daily AI Budget</div>
                <div className="text-xs text-muted-foreground">19 drafts remaining today</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-mono">Loading Skeleton</div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
