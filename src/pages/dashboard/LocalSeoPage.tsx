import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import { CheckCircle2, Circle, AlertCircle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface ChecklistGroup {
  group: string;
  items: Array<{
    id: string;
    title: string;
    desc: string;
    tip: string;
    done: boolean;
  }>;
}

export function LocalSeoPage() {
  const [groups, setGroups] = useState<ChecklistGroup[]>([
    {
      group: 'Google Business Profile Completeness',
      items: [
        {
          id: 'hours',
          title: 'Accurate Opening & Festival Hours',
          desc: 'Ensure operating hours including Sunday/Holiday timings are current.',
          tip: 'Customers check Google Maps on festivals like Diwali & Eid. Updating special hours builds trust.',
          done: true
        },
        {
          id: 'photos',
          title: 'High-Resolution Store & Product Photos',
          desc: 'Upload at least 15 photos: storefront, interior, billing counter, and top dishes/products.',
          tip: 'Profiles with real storefront photos get 42% more direction requests on Google Maps.',
          done: true
        },
        {
          id: 'category',
          title: 'Specific Primary Business Category',
          desc: 'Choose the most specific category (e.g. "Indian Sweet Shop" instead of "Store").',
          tip: 'Google ranks specific primary categories significantly higher in "near me" map pack searches.',
          done: false
        }
      ]
    },
    {
      group: 'Review Velocity & Engagement',
      items: [
        {
          id: 'reply_rate',
          title: 'Reply to 100% of Incoming Reviews',
          desc: 'Acknowledge both positive compliments and constructive feedback within 48 hours.',
          tip: 'Google explicitly confirms that replying to reviews improves your local SEO ranking prominence.',
          done: false
        },
        {
          id: 'counter_qr',
          title: 'Place ReviewQR Table-Tent at Billing Counter',
          desc: 'Ask satisfied customers at checkout to scan and share their authentic experience.',
          tip: 'Review requests made right after a great transaction have an 8x higher completion rate.',
          done: true
        }
      ]
    }
  ]);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const toggleItem = (groupIdx: number, itemIdx: number) => {
    setGroups(prev => {
      const copy = [...prev];
      copy[groupIdx].items[itemIdx].done = !copy[groupIdx].items[itemIdx].done;
      return copy;
    });
  };

  const totalItems = groups.flatMap(g => g.items).length;
  const completedItems = groups.flatMap(g => g.items).filter(i => i.done).length;
  const percent = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Local SEO Checklist
            </h1>
            <Badge variant="saffron" className="text-xs">Interactive Audit</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Actionable optimization steps for Google Maps and Local 3-Pack prominence. No bogus ranking promises.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ProgressRing progress={percent} size={50} strokeWidth={5}>
            <span className="text-xs font-bold">{percent}%</span>
          </ProgressRing>
          <div className="text-left">
            <div className="text-xs font-semibold text-foreground">{completedItems} of {totalItems} Done</div>
            <div className="text-[11px] text-muted-foreground">Audit Score</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group, groupIdx) => (
          <Card key={group.group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{group.group}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((item, itemIdx) => {
                const isExpanded = expandedTip === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border p-4 transition-all hover:bg-secondary/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => toggleItem(groupIdx, itemIdx)}
                        className="flex items-start gap-3 text-left flex-1"
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className={`text-sm font-semibold ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {item.desc}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setExpandedTip(isExpanded ? null : item.id)}
                        className="text-xs text-primary font-medium flex items-center gap-1 hover:underline shrink-0"
                      >
                        <span>Tip</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/70 text-xs text-muted-foreground bg-secondary/40 p-3 rounded-xl animate-in fade-in">
                        <span className="font-semibold text-foreground">Pro-Tip: </span>
                        {item.tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
