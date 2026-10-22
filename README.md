# ReviewQR (Google Reviews SaaS for Indian Local Businesses)

> **Live Production URL**: [https://reviewqr.panchalsmit.workers.dev](https://reviewqr.panchalsmit.workers.dev)  
> **Style Guide**: [https://reviewqr.panchalsmit.workers.dev/design](https://reviewqr.panchalsmit.workers.dev/design)  
> **Customer Flow Demo**: [https://reviewqr.panchalsmit.workers.dev/r/royal-counter](https://reviewqr.panchalsmit.workers.dev/r/royal-counter)

ReviewQR is a production-quality, Cloudflare Free-Tier SaaS tailored for Indian local businesses (restaurants, sweet shops, clinics, salons, retail, consulting). It helps real customers write genuine Google reviews in seconds using structured experience chips and voice input (English, Hindi, Gujarati, Hinglish), and provides business owners an AI-powered copilot to respond professionally.

---

## 1. Non-Negotiable Product Integrity Principles

1. **Truthful & Authentic Experience Only**: The AI review assistant only structures details provided by the customer. It never invents dishes, staff names, prices, or dates.
2. **Zero Review-Gating**: Every customer who scans the QR code is presented with an immediate, prominent link to the business's official Google review page, regardless of rating or sentiment. Unhappy customers are never routed away.
3. **No Review Manipulation**: No rewards, coupons, or rating-pushing. Star ratings are never pre-selected or simulated.
4. **No SEO or Ranking Guarantees**: Honest, policy-compliant assistance only.
5. **Fail-Open Customer Journey**: If AI quotas are exhausted or network errors occur, the customer is seamlessly provided a standard fallback draft or guided straight to Google with zero friction.

---

## 2. Cloudflare Free Tier Limits & Budget Discipline

ReviewQR is engineered strictly around Cloudflare's 100% Free Tier:

| Cloudflare Service | Free Tier Limit | ReviewQR Implementation Strategy |
| :--- | :--- | :--- |
| **Workers Requests** | 100,000 requests / day | Static frontend assets served via Workers Assets (**free**, zero Worker CPU hits). Dynamic requests handled by lightweight Hono router. |
| **Workers CPU Time** | 10ms CPU / request | Zero heavy server-side image/PDF generation. Posters & QR vectors are rendered client-side in the browser. |
| **D1 Database** | 5 GB storage<br>5M reads / day<br>100k writes / day | Daily rollups for scan analytics (`scan_daily_stats` upsert: 1 write per active QR per day). Raw ephemeral scans pruned periodically. |
| **KV Storage** | 100k reads / day<br>**1,000 writes / day** | **Strict Cache Only**: Used exclusively for `/r/:code` fast routing. Written **only** on QR creation or update. **Never** per request or per scan! |
| **Workers AI** | 10,000 Neurons / day | Compact prompt templates (< 180 tokens), `@cf/meta/llama-3.1-8b-instruct`, 25 daily drafts cap per business to prevent single-tenant starvation, with seamless template fallback. |
| **Turnstile** | Free (Unlimited tier) | Anti-bot spam protection on public customer flow. |

---

## 3. Technology Stack

- **Frontend**: Vite + React 19 + TypeScript (strict), React Router, Tailwind CSS v4, Lucide Icons, Framer Motion, Recharts.
- **Backend / Edge**: Hono on Cloudflare Workers, unified single-repo deploy.
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM + drizzle-kit migrations.
- **Routing & Cache**: Cloudflare KV for shortcode routing `/r/:code`.
- **AI**: Workers AI (`@cf/meta/llama-3.1-8b-instruct`) behind a provider-agnostic module with anti-fabrication validators.
- **Typography & Indic Support**: Plus Jakarta Sans, Inter, Noto Sans Devanagari (Hindi), Noto Sans Gujarati (Gujarati).

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run local frontend dev server
npm run dev

# 3. Run local Cloudflare Worker with local D1 & KV
npx wrangler dev server/index.ts --port 8787

# 4. Run automated test suite
npm test
```

---

## 5. Cloudflare Production Deployment

```bash
# 1. Build frontend static assets
npm run build

# 2. Apply remote D1 database migrations
npx wrangler d1 migrations apply DB --remote

# 3. Deploy worker and static assets
npx wrangler deploy
```

---

## 6. Upgrading Beyond the Free Tier

When scaling beyond Cloudflare's Free Tier limits:
- **Workers Paid ($5/mo)**: Unlocks 10 million requests/month, 50ms CPU time per request.
- **D1 Paid**: Scales storage beyond 5GB and writes beyond 100k/day at nominal pricing ($0.75/GB-mo).
- **Workers AI Paid**: Pay-as-you-go neurons beyond the daily 10,000 free allocation.
- **Google Business Profile API**: Can be activated to automatically fetch live published reviews and post replies directly without copy-paste.
