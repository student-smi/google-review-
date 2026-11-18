# CLAUDE.md

Guidance for Claude Code (and any other agent) working in this repository.

## What this project is

**ReviewQR** (aka **Loctimize**) is a production SaaS for Indian local businesses
(restaurants, sweet shops, clinics, salons, retail, consultants) that turns a
QR code / standee on the counter into genuine Google reviews, plus an
AI copilot for the owner to manage replies, local SEO and Google Business
Profile posts.

- Live: https://reviewqr.panchalsmit.workers.dev (custom domain: loctimize.in)
- Style guide: `/design` → redirects to `/dashboard` now (legacy route)
- Customer demo flow: `/r/:code` (e.g. `/r/royal-counter`)

**Core customer loop:** customer scans QR → `/r/:code` → picks "experience chips"
(delicious food, fast service, etc.) or speaks (EN/HI/GU/Hinglish voice input) →
AI (or deterministic fallback) drafts a *structured-but-never-fabricated* review →
customer copies it and is sent straight to the business's real Google review URL.

**Core owner loop:** sign up (Google OAuth or Better Auth) → onboarding wizard →
create business(es)/brand/locations → generate styled QR codes/standees →
dashboard: reviews & AI replies, keyword/local-SEO management, Google Posts
studio, analytics, team/RBAC, billing (manual UPI + CRM), multi-branch hierarchy.

There's also a **Super Admin CRM** (`/admin`, restricted to one hardcoded email)
for leads, customers, plans, billing/receipts, and a **Chrome extension**
(`extension/`) that scrapes a business's real Google Maps reviews and syncs
them into the dashboard for AI-assisted replies.

### Non-negotiable product rules (see `README.md` §1 for full list)
1. AI only *structures* what the customer actually said — never invents dishes,
   names, prices, dates.
2. **Zero review-gating**: every scan goes straight to the real Google review
   link, regardless of sentiment/rating. Never route unhappy customers away.
3. No rewards/coupons tied to leaving a review, no pre-selected star ratings.
4. No SEO/ranking guarantees — only honest, policy-compliant help.
5. Fail-open: if AI/quota/network fails, fall back to a template draft or a
   direct Google link, never block the customer.

Any feature touching the customer review flow, AI drafting, or the "go to
Google" button must preserve these invariants — check `server/ai/guardrails.ts`
and `server/routes/public.ts` before changing that path.

## Tech stack

- **Frontend**: Vite + React 19 + TypeScript (strict), React Router v7,
  Tailwind CSS v4, Lucide icons, Framer Motion, Recharts, `qr-code-styling`,
  `html-to-image`, `jspdf`, i18next (en/hi/gu + Hinglish).
- **Backend/edge**: Hono, running as a single Cloudflare Worker
  (`server/index.ts` is the entrypoint — also serves the built SPA via the
  `ASSETS` binding and handles `/r/:code` server-side HTML injection for
  zero-latency first paint).
- **DB**: Cloudflare D1 (SQLite) + Drizzle ORM, migrations in `drizzle/`
  (`drizzle.config.ts`, generate with `npm run db:generate`).
- **Cache/routing**: Cloudflare KV, used *only* for `/r/:code` lookups,
  written only on QR create/update (never per-scan — stay under the 1,000
  writes/day free-tier KV limit).
- **AI**: Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) via
  `server/ai/provider.ts`, with strict guardrails/validators in
  `server/ai/guardrails.ts` and templates in `server/ai/prompts.ts`.
- **Auth**: Better Auth tables (`users`/`sessions`/`accounts`/`verifications`
  in `server/db/schema.ts`) + Google OAuth (`gauth_...` tokens) + a dev/guest
  fallback owner id (`X-Owner-Id` header) — see `server/middleware/auth.ts`.
- **Deploy target**: Cloudflare Workers Free Tier, budget-constrained by
  design (see README §2 — Workers CPU, D1 reads/writes, KV writes, AI
  neurons are all rationed in code, e.g. 25 AI drafts/day/business cap).

## Repo layout

```
src/                      React SPA
  pages/                  Landing, Auth, Onboarding, customer flow, dashboard/*, admin/*
  components/             admin/, app/ (shell), auth/, google/, ui/ (design-system primitives)
  lib/                     api.ts (fetch wrapper + owner/session id), auth.ts, gmb.ts, i18n/
  context/HierarchyContext.tsx   brand/business/branch hierarchy state
server/                   Hono app on Cloudflare Workers
  index.ts                 entrypoint: routing, /r/:code SSR injection, daily cron cleanup
  routes/                  public, auth, businesses, qr, analytics, ai, media, gmb, admin, hierarchy
  db/schema.ts              Drizzle schema (source of truth for all tables)
  db/scoped.ts               per-owner authorization-scoped DB query helpers (start here for data access)
  middleware/auth.ts         session/owner resolution + blocked-user check
  ai/provider.ts             AI generation (reviews, owner replies, keywords, Google Posts)
  ai/guardrails.ts           anti-fabrication / word-count / fallback-template enforcement
extension/                 Chrome MV3 extension: scrapes Google Maps reviews → syncs to API
drizzle/                   SQL migrations + snapshots (generated — don't hand-edit)
scripts/                   seed.ts / seed.sql / insert-reviews.sql (local D1 seeding)
tests/unit/                 Vitest; tests/helpers/mock-d1.ts mocks D1 for route/unit tests
wrangler.toml               Worker config: D1 binding DB, KV binding KV, AI binding, custom domain, cron
```

## Commands

```bash
npm install --legacy-peer-deps   # React 19 + some deps need this
npm run dev                      # Vite dev server (frontend only, proxies /api and /r to deployed worker)
npx wrangler dev server/index.ts --port 8787   # full local worker + local D1/KV
npm test                         # vitest run (tests/unit)
npm run typecheck                # tsc --noEmit
npm run build                    # vite build -> dist/
npm run db:generate              # drizzle-kit generate from server/db/schema.ts
npm run db:migrate               # apply migrations to local D1
npm run db:migrate:prod          # apply migrations to remote/production D1 (careful)
npm run worker:deploy            # build + wrangler deploy
```

Secrets/env live in `.env` (gitignored) and `wrangler.toml` `[vars]` /
Cloudflare dashboard secrets — never print or commit real values
(`CLOUDFLARE_API_KEY`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_PLACES_API_KEY`, etc.).

## Conventions worth knowing before editing

- **Multi-tenant hierarchy**: `brands` (tier 1, optional) → `businesses`
  (tier 2) → `locations`/branches (tier 3), with RBAC via `memberships`
  (`super_admin | brand_admin | business_admin | branch_manager |
  review_executive | finance_manager`). All data queries should go through
  `createScopedDb(db, ownerId)` in `server/db/scoped.ts` rather than raw
  Drizzle queries in route handlers, so ownership checks stay centralized.
- **Owner identity is dual-mode**: either a real Better Auth/Google session
  (`Authorization: Bearer <token>` or `gauth_<id>_...`) or a client-generated
  guest `owner_...` id persisted in localStorage and sent as `X-Owner-Id`.
  Expect both paths in any auth-touching code; `owner-default` /
  `demo-biz-1` / `104549098573635444181` are special-cased fallbacks — read
  `server/db/scoped.ts` and `server/middleware/auth.ts` before "fixing" auth.
- **Free-tier discipline is a hard constraint, not an optimization**: no
  per-scan KV writes, no heavy server-side image/PDF work (QR/standee
  rendering is client-side), AI calls are capped and must have a
  template-based fallback path (`getFallbackTemplate(s)` in guardrails.ts).
- Tests mock D1 via `tests/helpers/mock-d1.ts` — follow that pattern for new
  route tests rather than hitting a real/local D1.
- i18n strings live inline in `src/lib/i18n/index.ts` (en/hi/gu); new
  customer-facing copy should be added there, not hardcoded in components.

## What to do going forward

There's no open task queue or TODOs in the code — treat this repo as a live,
deployed product and take direction from whatever the user asks next. Recent
history (`git log`) shows active work on: SEO/GSC setup (meta tags, schema
markup, sitemap/robots), landing-page design polish and mobile
responsiveness, the Google Business Profile Posts Studio (AI-generated posts
with direct publishing via `server/routes/gmb.ts`), and the admin CRM
(leads/customers/billing/RBAC). When picking up new work:

1. Figure out which layer the request touches (customer flow, owner
   dashboard, admin CRM, Chrome extension, or infra/SEO) and read the
   corresponding route file + page(s) before changing anything.
2. Preserve the 5 non-negotiable product rules above for anything near the
   customer review flow or AI drafting.
3. Keep Cloudflare free-tier budget constraints in mind (no new per-request
   KV/D1 writes, no server-side heavy compute, cap any new AI call paths).
4. Run `npm run typecheck` and `npm test` before considering a change done;
   there's no CI config in the repo, so these are the local gate.
5. If a change touches the DB schema, generate a migration
   (`npm run db:generate`) rather than hand-writing SQL in `drizzle/`.
