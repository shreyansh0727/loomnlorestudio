# Loom & Lore

A premium textile storefront and studio dashboard built with Next.js, Supabase and
Razorpay. It supports guest and account checkout, a B2C retail limit, GST-verified B2B
wholesale ordering, manual shipping quotes, printable invoices and Resend transactional
email.

## What is included

**Storefront**

- Editorial homepage driven by admin-managed hero, ticker, category, product, combo,
  banner and editorial sections.
- Category-wise catalogue with product variants, stock, featured rails and combo bundles.
- Cart with a hard B2C limit of **10 units per product** (counted across product lines and
  the components inside combos). B2B accounts use wholesale prices and per-product MOQ.
- Guest checkout and optional email/password accounts. Verified accounts automatically
  claim past guest orders placed with the same email.
- Coupon validation for public and private codes, first-order rules, usage limits and
  audience targeting.
- Order tracking with a private token link, plus a manual "order number + email" lookup.
- Printable retail invoices for B2C and GST tax invoices for approved B2B buyers.
- Pop-up offers with scheduling, frequency and priority.

**Studio dashboard (`/admin`)**

- Revenue and order overview, recent orders and email activity.
- Order management: status changes, internal notes, tracking details, refunds, stock
  restoration, email resends, Razorpay shipping payment links and invoices.
- Catalogue management: categories, products, variants, stock and combo bundles.
- Coupon management, including private and first-order coupons.
- B2B application review with GSTIN details.
- Homepage section builder, pop-up offers, media uploads and store settings.
- Seller identity, GST rate and invoice details.

**Payments and operations**

- Razorpay Orders API with signature verification, capture, server-side amount checks and
  a `order.paid` webhook.
- Stock is allocated transactionally at payment time. If a payment lands after stock has
  gone, the order is parked in **Payment review**, never oversold. An admin can restock
  and allocate stock + issue the invoice from the order page.
- Shipping is quoted manually after the product payment. The admin creates a Razorpay
  payment link, which is emailed to the customer and tracked by the `payment_link.paid`
  webhook.
- Transactional email via Resend for confirmation, status updates and shipping payments.
  Every attempt is logged; unconfigured email is recorded as `skipped`.

## Stack

- Next.js 16 (App Router, server actions, Turbopack) and React 19
- TypeScript in strict mode, Tailwind CSS v4, Fraunces + Manrope
- Supabase Postgres, Auth and Storage, with RLS on all customer tables
- Razorpay (Orders, Checkout, Payment Links, webhooks)
- Resend
- Zod validation and Vitest unit tests

## Local setup

### 1. Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- Razorpay test keys (optional for browsing; required for checkout)
- A Resend account and verified sending domain (optional)

```bash
npm install
```

### 2. Create the database

Run the SQL files in `supabase/migrations/` in this order, using the Supabase SQL editor
or the Supabase CLI:

1. `20261024000100_schema.sql` — tables, indexes, triggers, sequences and the public
   `media` storage bucket.
2. `20261024000200_rls.sql` — row-level security policies and grants.
3. `20261024000300_functions.sql` — stock allocation/restoration RPCs and privileged
   sequence grants.

The functions are `security definer` and executable only by `service_role`. Never expose
the service role key to the browser.

### 3. Configure Supabase Auth

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - Add the equivalent production URLs before going live.

The default Supabase confirmation and recovery templates work with `/auth/callback`.
If you prefer token-hash links, point the templates at:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
```

Email confirmation is required before sign-in. Guest checkout does not require an account.

### 4. Environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public origin used in Razorpay callbacks, auth redirects and email links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected reads). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for orders, admin writes and storage uploads. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API credentials. Use test keys locally. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured on the Razorpay webhook. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Resend credentials and verified sender. |
| `ADMIN_EMAILS` | Optional comma-separated bootstrap admins. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Optional admin account created by the seed script. |
| `SEED_FORCE` | Set to `true` only when intentionally replacing seeded catalogue rows. |

`.env.local` is git-ignored. Keep it that way; only `.env.example` belongs in version
control.

### 5. Seed the catalogue

```bash
npm run seed
```

This inserts demo categories, products, variants, combos, coupons, homepage sections, a
pop-up offer and store settings. If `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set,
it also creates (or promotes) an admin account.

The seed refuses to overwrite an existing catalogue unless `SEED_FORCE=true`; review what
is in the database before forcing it.

To promote an existing user manually:

```sql
update public.profiles set role = 'admin' where lower(email) = lower('you@example.com');
```

### 6. Start the app

```bash
npm run dev
```

- Storefront: <http://localhost:3000>
- Studio: <http://localhost:3000/admin> (sign in at `/admin/login`)
- Order tracking: `/track`
- Health of the storefront content depends on steps 2 and 5.

## Razorpay

1. Add test keys to `.env.local`.
2. Create a webhook at **Dashboard → Account & Settings → Webhooks** pointing to
   `https://<your-host>/api/razorpay/webhook`.
3. Subscribe to `order.paid` and `payment_link.paid`.
4. Set the webhook secret and copy the same value into `RAZORPAY_WEBHOOK_SECRET`.
5. For webhook testing on localhost, expose the app with a tunnel (for example ngrok) and
   use the tunnel URL in both `NEXT_PUBLIC_SITE_URL` and the webhook URL.

Checkout also verifies the payment signature and captured amount on the server, so a
normal local purchase completes without the webhook. The webhook is the safety net for
browser tabs closed mid-payment and the only automatic confirmation path for shipping
payment links.

### Import a product image

Admin forms accept image URLs or direct uploads. Uploads go to the public `media` bucket
created by the schema (15 MB limit; JPEG, PNG, WebP, AVIF, GIF, MP4, WebM) through a
server action using the service role.

## Email

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` after verifying a domain in Resend. Without
these values the app still works: email attempts are logged with status `skipped` and the
admin order view reports that the customer was not notified.

Emails sent:

- Order confirmation (with invoice link once issued)
- Payment review notice when stock is short
- Status changes (processing, packed, shipped, delivered, cancelled, refunded…)
- Shipping payment request with the Razorpay link

## Business rules

**Retail (B2C)**

- Retail prices are tax-inclusive.
- Maximum 10 units per product across the entire cart, including combo components.
- A retail invoice is generated after payment.

**Wholesale (B2B)**

- The customer submits a business application with GSTIN and billing details.
- An admin approves it in **Studio → Businesses**.
- Approved accounts see wholesale prices and must meet each product's MOQ.
- A GST tax invoice is generated using the business legal name, GSTIN and place of supply.

**Orders and stock**

- A pending order is created before Razorpay opens. Order items are snapshotted.
- On payment, `finalize_paid_order` locks variant rows, validates the captured amount,
  decrements stock, records inventory movements, redeems the coupon and assigns an
  invoice number — in one transaction.
- If stock changed, the order becomes **Payment review** with a shortfall note. Restock
  the variants, then use **Allocate stock & issue invoice** on the order page.
- Cancelling or refunding an order restores reserved stock once, guarded by
  `stock_restored_at`.
- Shipping is quoted separately and added to the order total when paid.

## Invoices and order access

- Order pages use an unguessable UUID access token: `/order/<token>`.
- Invoices use the same token: `/invoice/<token>` (`noindex`, no listing).
- Invoices are available once an invoice number exists and include a print-to-PDF action.
- Emails link to both pages, so guests can return without an account.

## Demo mode

With no Supabase keys and `NODE_ENV !== "production"`, the storefront and studio render a
read-only demo:

- Demo catalogue, orders, businesses and dashboard metrics.
- `/admin` opens without authentication.
- Every write is blocked with a clear message.
- Demo order and invoice links work so the full customer view can be reviewed:
  `/order/d6000000-0000-4000-8000-000000000001` (shipped retail),
  `/order/d6000000-0000-4000-8000-000000000003` (payment review), and
  `/invoice/d6000000-0000-4000-8000-000000000002` (trade invoice).

Demo mode is disabled in production even when keys are missing.

## Scripts

```bash
npm run dev        # Next.js dev server
npm run build      # production build
npm run start      # production server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
npm run seed       # seed Supabase catalogue + optional admin
```

## Project structure

```text
src/app/(store)          Storefront routes (home, shop, cart, checkout, account, orders)
src/app/admin            Studio login and protected dashboard routes
src/app/invoice          Token-protected printable invoice
src/app/api/razorpay     Webhook endpoint
src/app/auth             Email confirmation and OAuth/PKCE callback routes
src/components            Storefront, admin, cart, checkout, order and UI components
src/lib/actions          Server actions (auth, checkout, admin)
src/lib/data             Supabase and demo read models
src/lib/checkout         Catalogue resolution, quote math and order finalisation
supabase/migrations      Schema, RLS and transactional RPCs
scripts/seed.ts          Catalogue seed
```

## Before production

- Replace seeded content, store settings, seller details and GSTIN with real values.
- Use live Razorpay credentials, a production webhook URL and a live webhook secret.
- Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin and add its auth redirect URLs.
- Verify the Resend sending domain and sender address.
- Review RLS and remove any bootstrap admins you no longer need.
- Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`.
