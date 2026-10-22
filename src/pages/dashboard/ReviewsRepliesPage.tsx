import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea, Label, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Copy,
  Check,
  Star,
  MessageSquare,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';

export function ReviewsRepliesPage() {
  const [reviewText, setReviewText] = useState(
    'Food was great, especially the kaju katli and samosas! But we had to wait 20 minutes for our order on Sunday evening. Staff seemed rushed.'
  );
  const [rating, setRating] = useState(4);
  const [customerName, setCustomerName] = useState('Ankit M.');
  const [selectedStyle, setSelectedStyle] = useState<'warm' | 'professional' | 'concise'>('warm');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const replies = {
    warm: `Dear ${customerName || 'Guest'},\n\nThank you so much for visiting Royal Sweets and sharing your feedback! We are thrilled to hear you loved our fresh kaju katli and samosas. We sincerely apologize for the wait time you experienced during the Sunday evening rush. We are adding extra counter staff on weekends to serve everyone faster. We look forward to welcoming you back soon!\n\nWarm regards,\nRajesh, Royal Sweets Management`,
    professional: `Dear ${customerName || 'Customer'},\n\nThank you for reviewing your experience. We are pleased that the food quality met your expectations. Regarding the delay on Sunday, please accept our apologies as peak hours occasionally lead to queues. We have noted this and are streamlining our order fulfillment process. If you have any further suggestions, please feel free to reach our manager at support@royalsweets.in.\n\nSincerely,\nCustomer Relations Team`,
    concise: `Hi ${customerName || 'there'}, thanks for the great feedback on our kaju katli and samosas! Apologies for the Sunday wait time—we're working on speeding up service during busy hours. Hope to see you again soon!`
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Review & Reply Assistant
            </h1>
            <Badge variant="saffron" className="text-xs">Phase 3 Preview</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate respectful, policy-compliant responses to customer reviews in 3 curated tones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Paste review */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Paste Customer Review</CardTitle>
              <CardDescription>Paste incoming reviews from Google Business Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Customer Name (Optional)</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh P."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Rating Given</Label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-muted-foreground ml-2">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Review Text</Label>
                <Textarea
                  rows={5}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste the customer's exact review here..."
                />
              </div>

              <Button variant="primary" className="w-full gap-2 text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Generate Calibrated Replies</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-secondary/30">
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Google Review Reply Policy</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Replies address specific feedback politely, never argue or blame the customer, and provide offline resolution for issues.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI replies */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Generated Replies</CardTitle>
                <CardDescription>Select tone, edit in place, and copy to Google</CardDescription>
              </div>
              <div className="flex rounded-xl border border-border p-1 bg-secondary/50">
                {(['warm', 'professional', 'concise'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                      selectedStyle === style
                        ? 'bg-card text-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Textarea
                  rows={7}
                  value={replies[selectedStyle]}
                  readOnly
                  className="bg-transparent border-0 p-0 text-sm focus-visible:ring-0 resize-none font-normal leading-relaxed"
                />
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{replies[selectedStyle].length} characters</span>
                  <Button
                    size="sm"
                    variant="saffron"
                    onClick={() => handleCopy(replies[selectedStyle], 0)}
                    className="gap-1.5 text-xs"
                  >
                    {copiedIndex === 0 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedIndex === 0 ? 'Copied!' : 'Copy Reply'}</span>
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
