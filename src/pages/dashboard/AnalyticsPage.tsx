import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, ArrowUpRight, BarChart2, ShieldAlert } from 'lucide-react';

export function AnalyticsPage() {
  const [funnel] = useState([
    { step: '1. QR Scans', count: 324, percent: '100%', desc: 'Unique customer camera scans' },
    { step: '2. "Help Me Write" Tapped', count: 182, percent: '56.1%', desc: 'Customers choosing guided assistant' },
    { step: '3. Google Review Page Clicks', count: 139, percent: '42.9%', desc: 'Customers reaching Google rating box' }
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Conversion Analytics & Funnel
          </h1>
          <Badge variant="outline" className="text-xs">Past 30 Days</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track customer progression from physical QR scan to official Google Review click.
        </p>
      </div>

      {/* Funnel breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Review Funnel</CardTitle>
          <CardDescription>
            Conversion efficiency across all active QR placements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {funnel.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">{item.step}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">{item.count}</span>
                  <Badge variant="primary" className="text-xs">{item.percent}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-start gap-3 mt-4">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground">Honest Google Analytics Disclaimer:</span>
              <p>
                Google does not notify third-party SaaS when a user completes their review submission inside the Google Maps app without OAuth Business Profile API sync. "Google Review Clicks" measures intent and direct handoff to the Google Review page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
