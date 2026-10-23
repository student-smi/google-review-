import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

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
          desc: 'Ensure operating hours including Sunday/Holiday timings are current on Google Maps.',
          tip: 'Indian customers always check timings before travelling during Diwali, Eid & national holidays. Special hours preserve rating sentiment.',
          done: true
        },
        {
          id: 'photos',
          title: 'High-Resolution Store & Product Photos',
          desc: 'Upload at least 15 photos: storefront, interior dining/sales area, billing counter, and signature items.',
          tip: 'Profiles with storefront signage photos receive 42% more direction requests on Google Maps.',
          done: true
        },
        {
          id: 'category',
          title: 'Specific Primary Business Category',
          desc: 'Select the most specific category (e.g. "Indian Sweet Shop" or "Vegetarian Restaurant" instead of generic "Store").',
          tip: 'Google Map algorithms heavily favor exact primary categories for "near me" local pack queries.',
          done: false
        }
      ]
    },
    {
      group: 'Review Velocity & Engagement',
      items: [
        {
          id: 'reply_rate',
          title: 'Maintain 100% Review Reply Rate',
          desc: 'Acknowledge both glowing 5-star compliments and critical constructive feedback within 48 hours.',
          tip: 'Google explicitly confirms in official docs that merchant responses directly improve local SEO ranking prominence.',
          done: false
        },
        {
          id: 'counter_qr',
          title: 'Deploy Acrylic Standee at Billing Counter',
          desc: 'Invite happy customers to scan the QR while their bill or takeaway order is being packaged.',
          tip: 'Asking right after an enjoyable interaction yields an 8x higher submission completion rate.',
          done: true
        }
      ]
    }
  ]);

  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const toggleItem = (groupIdx: number, itemIdx: number) => {
    setGroups((prev) => {
      const copy = [...prev];
      copy[groupIdx].items[itemIdx].done = !copy[groupIdx].items[itemIdx].done;
      return copy;
    });
  };

  const totalItems = groups.flatMap((g) => g.items).length;
  const completedItems = groups.flatMap((g) => g.items).filter((i) => i.done).length;
  const percent = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ClickUp 4.0 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Local SEO & Maps Optimization
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
              Google Maps 3-Pack
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Actionable optimization criteria proven to elevate visibility in Google Maps local pack without gimmicks.
          </p>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <ProgressRing progress={percent} size={46} strokeWidth={4.5}>
            <span className="text-[11px] font-black">{percent}%</span>
          </ProgressRing>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {completedItems} of {totalItems} Completed
            </div>
            <div className="text-[10px] text-slate-400">Readiness Score</div>
          </div>
        </div>
      </div>

      {/* Task Groups */}
      <div className="space-y-5">
        {groups.map((group, groupIdx) => (
          <Card
            key={group.group}
            className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B101B] shadow-xs"
          >
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-purple-600" />
                <span>{group.group}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {group.items.map((item, itemIdx) => {
                const isExpanded = expandedTip === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      item.done
                        ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => toggleItem(groupIdx, itemIdx)}
                        className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            item.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 hover:border-purple-500'
                          }`}
                        >
                          {item.done && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>

                        <div>
                          <div
                            className={`text-xs sm:text-sm font-bold ${
                              item.done
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {item.desc}
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setExpandedTip(isExpanded ? null : item.id)}
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline shrink-0 cursor-pointer pt-0.5"
                      >
                        <span>SEO Tip</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-purple-50/60 dark:bg-purple-950/30 p-3 rounded-xl animate-in fade-in space-y-1">
                        <span className="font-bold text-purple-700 dark:text-purple-300">
                          Google Maps Insight:
                        </span>
                        <p className="leading-relaxed">{item.tip}</p>
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
