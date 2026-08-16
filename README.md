# salon-frontend

Next.js 16 (App Router) storefront for the salon. Every word and image on the
public pages is edited in the Django admin and fetched from `/api/v1/`; this app
renders it and takes bookings.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000 — needs the Django API on :8001
```

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run check` | lint + typecheck + tests |
| `npm run check:auth` | Report whether Clerk keys are configured |

Copy `.env.example` to `.env.local` first. `SALON_SITE_URL` **must** be set to
the real origin in production — unset, the app publishes `localhost:3000` as its
canonical URL to every crawler.

## Where things live

Application code is under `src/`; the repository root holds only configuration.

```
src/
├── app/              Routes. Every page is a Server Component.
├── features/         Code that belongs to one part of the product.
│   ├── booking/      The four-step booking flow and "your bookings"
│   ├── auth/         Sign-in controls and the Clerk panels
│   ├── contact/      The contact form
│   ├── homepage/     The landing page's bands (hero, gallery, classes …)
│   └── about/        The About page's sections
├── components/
│   ├── ui/           Unopinionated primitives (button, card, dialog …)
│   ├── layout/       The header and footer, used by every route
│   └── shared/       Reused across features but not primitives
├── lib/
│   ├── api/          The only place that talks to Django
│   ├── types/        The shapes those endpoints return
│   ├── fallbacks/    Bundled copy served when the API is unreachable
│   ├── seo/          Canonical URLs, sitemap helpers, JSON-LD builders
│   └── *.ts          auth flags, motion preference, class helper
├── providers/        App-wide context providers
├── stores/           Zustand — client state only, never server data
└── proxy.ts          Clerk middleware (Next 16 renamed `middleware` to `proxy`)

public/               Static assets
tests/                Vitest, node environment
scripts/              Developer tooling, not shipped
```

**Two rules worth knowing before you add code:**

1. **Server data is fetched on the server.** `src/lib/api/` reads Django in
   Server Components and passes the result down as props. Do not copy that data
   into `src/stores/` — it would give it a second, staler home.
2. **`"use client"` goes on the smallest component that needs it**, not the page.
   A Server Component can render a Client Component, and children passed to a
   client component still render on the server.

## How data reaches the page

```
Django /api/v1/homepage/  ─→ lib/api/content.ts  ─→ app/page.tsx ─→ components
              /about/     ─→ lib/api/about.ts
              /booking-config/ ─→ lib/api/booking.ts
```

Each reader has a timeout, a revalidation window and a fallback, so a stopped
backend costs the ability to *edit* the site, not to serve it. The booking
config is the exception: it falls back to **empty** rather than inventing a
stylist or a payment QR, because a made-up QR would send a real payment to the
wrong account.

## Accounts

Clerk, and entirely optional — with no keys set the site runs with no sign-in
link and bookings are recorded anonymously. `/services` and `/status` require an
account; each page checks `auth()` itself, and `proxy.ts` redirects early so the
response is a real 307 rather than a streamed 200.
