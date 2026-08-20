# Creator Commerce

A multi-tenant platform where creators open and run their own merch shop.

Every user can create a store, customise it, add products with real variant
matrices, and take orders through a public storefront at `/@their-handle`.
Built for VTubers, streamers, artists, illustrators, writers, musicians,
content creators and small businesses.

**Phases 1 and 2 are complete, plus Phase 3's payment layer.** Buyers pay by
PromptPay / e-wallet / bank transfer QR straight into the creator's own account —
no card processor, no funds held by the platform. Fulfillment providers, custom
domains and payouts are still not built — see [Roadmap](#roadmap).

---

## Contents

- [Quick start](#quick-start)
- [What is built](#what-is-built)
- [Project structure](#project-structure)
- [Architecture decisions](#architecture-decisions)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Seed data](#seed-data)
- [Scripts](#scripts)
- [Roadmap](#roadmap)
- [Recommended next step](#recommended-next-step)

---

## Quick start

### Requirements

- Node.js 20 or newer
- pnpm 9 or newer
- A running PostgreSQL 14+ instance

### 1. Install

```bash
pnpm install
```

### 2. Configure

```bash
cp .env.example .env
```

Then edit `.env`:

- point `DATABASE_URL` at your PostgreSQL database
- replace both JWT secrets with random strings of at least 24 characters

The API refuses to boot on an invalid `.env` and prints exactly which variables
are wrong, rather than failing later on the first request.

### 3. Create the schema

```bash
pnpm db:migrate
```

A baseline migration is committed at
`apps/api/prisma/migrations/20260820000000_init`, so this applies the full schema
in one step. For a throwaway database, `pnpm db:push` also works.

### 4. Seed the demo store

```bash
pnpm db:seed
```

### 5. Run both apps

```bash
pnpm dev
```

| Surface         | URL                          |
| --------------- | ---------------------------- |
| Web app         | http://localhost:3000        |
| API             | http://localhost:4000        |
| REST base       | http://localhost:4000/api/v1 |
| Health check    | http://localhost:4000/health |
| Demo storefront | http://localhost:3000/@neko  |

Sign in with the seeded creator:

```
email:    nagi@neko.studio
password: Password123
```

A platform administrator is also seeded as `admin@platform.local` with the same
password.

> The project uses pnpm workspaces. `npm install && npm run dev` works too if you
> have npm, but the lockfile and the workspace protocol (`workspace:*`) are pnpm's.

---

## What is built

### Phase 1

| Area                                                                          | Status         |
| ----------------------------------------------------------------------------- | -------------- |
| Monorepo, strict TypeScript, ESLint, Prettier                                 | Done           |
| Environment validation, centralised errors, rate limiting                     | Done           |
| Auth: register, login, logout, refresh rotation, forgot/reset password, `/me` | Done           |
| Store creation and the four-step onboarding wizard                            | Done           |
| Dashboard shell: sidebar, store switcher, dark mode                           | Done           |
| Dashboard home: stat cards, sales chart, recent orders, top products          | Done           |
| Product CRUD, duplication, media, SEO                                         | Done           |
| Product options and generated variant matrix                                  | Done           |
| Collection CRUD with product assignment                                       | Done           |
| Media library with a swappable storage driver                                 | Done           |
| Public storefront: home sections, product page, collection page, all-products | Done           |
| Cart: anonymous, persistent, discount codes                                   | Done           |
| Checkout and order creation with immutable line snapshots                     | Done           |
| Order management: status, payment, fulfillment, tracking                      | Done           |
| Customer records built at checkout, with detail pages                         | Done           |
| Theme editor: colours, typography, layout, effects, live preview              | Done           |
| Multi-tenant authorisation and RBAC enforced server-side                      | Done           |
| Payment provider abstraction (`manual` only)                                  | Interface only |
| Fulfillment provider abstraction (`manual` only)                              | Interface only |

### Phase 2

| Area                                                                     | Status          |
| ------------------------------------------------------------------------ | --------------- |
| Drag-and-drop section editor with live preview                           | Done            |
| Per-section settings panels for all 13 section types                     | Done            |
| Section add / duplicate / hide / delete                                  | Done            |
| Discount management: create, edit, schedule, enable/disable, delete      | Done            |
| Team management: invite, change role, additive permission grants, remove | Done            |
| Themes, media library, customer management, analytics, RBAC              | Done in Phase 1 |

### Phase 3 — payments only

| Area                                                                   | Status    |
| ---------------------------------------------------------------------- | --------- |
| PromptPay QR generation (mobile / national ID / e-wallet)              | Done      |
| Payment channel management: bank transfer, TrueMoney, custom QR        | Done      |
| Per-order dynamic QR carrying the exact amount and an order reference  | Done      |
| Buyer slip upload, creator review, automatic paid/confirmed transition | Done      |
| POD integrations, automated fulfillment, tracking synchronisation      | Not built |
| Card/gateway processors, custom domains, creator payouts               | Not built |
| Advanced analytics: real visitor tracking, sales by collection         | Not built |

---

## Project structure

```text
Vmerce/
├── apps/
│   ├── api/                        Express + Prisma REST API
│   │   ├── prisma/
│   │   │   ├── migrations/         Committed baseline migration
│   │   │   ├── schema.prisma       31 models
│   │   │   └── seed.ts             Demo tenant: Neko Studio
│   │   └── src/
│   │       ├── config/             env validation, Prisma client, logger
│   │       ├── controllers/        HTTP in / HTTP out only
│   │       ├── mappers/            Prisma rows → wire DTOs
│   │       ├── middlewares/        auth, tenant guard, validation, errors
│   │       ├── modules/            pluggable subsystems
│   │       │   ├── fulfillment/    adapter interface + manual adapter
│   │       │   ├── payments/       provider interface + manual provider
│   │       │   └── storage/        storage driver interface + local driver
│   │       ├── repositories/       all Prisma access
│   │       ├── routes/             routing + per-route permissions
│   │       ├── services/           business logic
│   │       ├── utils/              errors, responses, crypto, slugs
│   │       ├── validators/         route-param schemas
│   │       ├── app.ts
│   │       └── server.ts
│   │
│   └── web/                        Next.js 15 App Router
│       ├── app/
│       │   ├── (auth)/             login, register, forgot password
│       │   ├── (dashboard)/        creator dashboard
│       │   ├── (storefront)/       public shop at /@handle
│       │   ├── onboarding/
│       │   ├── layout.tsx
│       │   └── globals.css         design tokens + storefront theme surface
│       ├── components/             shared UI (ui/ holds the shadcn layer)
│       ├── features/               auth, stores, products, collections,
│       │                           orders, customers, analytics, editor,
│       │                           storefront
│       ├── hooks/
│       ├── lib/
│       ├── services/               fetch clients (browser + server)
│       └── stores/                 Zustand session store
│
├── packages/
│   ├── config/                     shared tsconfig bases
│   ├── shared/                     Zod schemas, RBAC matrix, theme presets,
│   │                               section library, money helpers
│   └── types/                      enums, API envelopes, DTOs
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Architecture decisions

### Money is always an integer

Every amount in the database, the API and the UI is an integer in the smallest
currency unit (satang, cents). The product editor accepts `890.50` as text and
converts once, in `toProductPayload`. No float ever reaches an order total.

### Layering is enforced, not suggested

```
route (+ permission)
  → controller     HTTP shape only
  → service        business rules, transactions
  → repository     the only place Prisma is called
  → Prisma
```

Controllers never touch Prisma; repositories never contain rules. DTO mapping
lives in `mappers/`, so a Prisma row is never spread onto the wire — which is
what keeps `passwordHash` out of every auth response.

### Multi-tenancy is checked on the server, every time

Every store-scoped route sits behind `requireStoreAccess(...permissions)`, which
resolves `:storeId` against the caller's `StoreMember` rows before any controller
runs. Two details matter:

- A user with no membership gets **404, not 403**, so store ids cannot be
  enumerated by probing.
- Repository queries include `storeId` in the predicate itself
  (`findFirst({ where: { id, storeId } })`), so a leaked id from another tenant
  simply misses.

Frontend route protection exists for UX only. It is never the security boundary.

### RBAC is a matrix, not a set of `if` statements

`packages/shared/src/rbac.ts` maps each role to a permission list, and
`StoreMember.extraPermissions` allows additive per-member grants. Routes declare
the permissions they need; the middleware does the intersection. Adding a
permission is a one-line change in one file.

### Tokens

- Access token: JWT, 15 minutes, held **in memory only** on the client.
- Refresh token: opaque 48-byte value, stored **hashed** (SHA-256), sent as an
  httpOnly cookie scoped to `/api/v1/auth`, and **rotated on every use**.
- A password reset revokes every refresh token for that user.
- Concurrent 401s share one in-flight refresh, so a page with six queries
  refreshes once.

### Variants

Options expand into a variant matrix via `cartesian`, capped at 500 combinations.
When a product is saved, variants are matched to existing database rows **by their
option-value signature**, not by id. Adding a colour inserts only the new
combinations; renaming a value creates a new row rather than silently rewriting
another variant's stock.

Values can carry an optional `group` label. The storefront uses it to turn a
40-device list into a two-step picker (brand, then model), and greys out
combinations that no enabled variant covers.

### Orders are immutable

`OrderItem` stores a frozen snapshot: product title, variant title, SKU, image,
unit price, and a JSON blob of option values and supplier SKU. Product and
variant links are `onDelete: SetNull`. Deleting a product never rewrites history.

Order numbers come from an atomic per-store counter
(`UPDATE stores SET orderSequence = orderSequence + 1 RETURNING`), so two
simultaneous checkouts cannot mint the same number.

### Pricing is recomputed server-side

The storefront sends variant ids and quantities — never prices. `priceCart` is
the single source of truth for subtotals, discounts and shipping, and it runs
again at checkout. Stock is re-read and decremented inside the same transaction
as the order insert, so the last item cannot be sold twice.

### Theming without generated CSS

A store's theme is stored as JSON and flattened into CSS custom properties
(`--store-primary`, `--store-radius`, …) by `themeToCssVariables`. The storefront
reads only those variables. No per-store Tailwind classes are generated at any
point, and the theme editor's live preview uses the exact same mechanism as the
real storefront.

### The section editor sends the whole stack

`PATCH /stores/:storeId/pages/:pageId` takes the full ordered section list, and
array order _is_ render order. Sections that arrive with an `id` are updated in
place so identity survives a reorder; ids that disappear from the payload are
deleted. An id the client invented, or one belonging to another page, is treated
as a new section rather than trusted.

Settings are validated against a schema for that section's own type
(`sectionSettingsSchemas`), so a malformed `limit` cannot reach the storefront
renderer. Header and footer are page chrome: the schema rejects more than one of
either, or a payload that does not keep the header first and the footer last, and
the editor simply never offers those moves.

### Payments: the platform never touches the money

A buyer transfers directly to the creator's own PromptPay, e-wallet or bank
account. No card details exist anywhere in the system, and the platform is never
an intermediary holding funds.

`StorePaymentChannel` holds one payment destination — a mobile number, a national
or tax ID, a 15-digit e-wallet id, a bank account, or a QR image the creator
uploaded. At checkout the buyer picks a channel; identifiers are **masked** until
an order exists, so browsing checkout does not hand out the creator's account
number.

For the PromptPay channel types the API builds an **EMVCo Merchant Presented Mode
payload** carrying the exact order total and the order number as a reference, then
renders it as an inline SVG data URI. The generated string is the standard form:

```text
0002 01                                    payload format
0102 12                                    dynamic (one-off, has an amount)
2937 0016A00000067701011101130066812345678 PromptPay AID + mobile proxy
5303 764                                   THB
5406 100.00                                amount
5802 TH
6304 F142                                  CRC-16/CCITT-FALSE
```

The builder lives in `packages/shared/src/promptpay.ts`: pure, dependency-free,
and covered by 17 unit tests (`pnpm --filter @cc/shared test`) including the
published CRC-16/CCITT-FALSE check value, proxy normalisation, and a tamper test.
That matters because a QR cannot be verified by reading the code — either the
payload is byte-correct or a banking app rejects it.

**What a QR cannot do:** a bank transfer has no gateway to call back, so nothing
in the system can observe that money arrived. Confirmation is therefore explicit:
the buyer uploads their transfer slip, the creator reviews it, and approving the
slip is what flips the order to `PAID`/`CONFIRMED`. The amount the buyer types is
**not** trusted — the order total is authoritative, and a mismatch is flagged to
the reviewer rather than accepted. One pending slip per order keeps the queue
unambiguous.

Payment instructions are **snapshotted onto the order** as JSON at checkout, so
editing or deleting a channel afterwards cannot change what an existing buyer was
told to pay.

### Provider abstractions ship before providers

Payments, fulfillment and file storage each sit behind an interface with one
concrete implementation:

- `PaymentProvider` → `manual` (records intent; the creator confirms by hand).
  No fake card processing exists anywhere in the codebase.
- `FulfillmentProviderAdapter` → `manual`. `createOrder`, `getOrder`,
  `cancelOrder`, `getShippingRates`, `getTracking`, `syncProducts`.
- `StorageDriver` → `local` (writes under `apps/api/uploads`). Binaries never go
  into PostgreSQL; only the key and public URL are stored.

Adding Stripe, CJdropshipping or S3 means registering an implementation. Nothing
in the order system is coupled to a specific supplier.

### Frontend data flow

- The **storefront** is Server Components calling the public API directly through
  `serverFetch`. Cart interactions are the only client-side part.
- The **dashboard** is client-driven with TanStack Query, because the API is a
  separate origin using bearer tokens. Query keys are namespaced by store id, so
  switching stores refetches cleanly.

---

## Database schema

31 models. Almost every commerce entity carries a `storeId`, and store-scoped
unique constraints are scoped by it (`@@unique([storeId, slug])`).

```text
Identity & access
  User ── Account (Google / Discord / Twitch, structure only)
       ── RefreshToken (hashed, rotating)
       ── PasswordResetToken
       ── StoreMember ──> Store
  Role ── RolePermission                    seeded from the shared RBAC matrix

Store
  Store ── StoreTheme                        colours / typography / layout / effects
        ── StorePage ── StoreSection         section config as JSON
        ── FulfillmentProvider

Catalogue
  Product ── ProductMedia
          ── ProductOption ── ProductOptionValue
          ── ProductVariant ── VariantOptionValue ──> ProductOptionValue
                            └─ FulfillmentMapping ──> FulfillmentProvider
          └─ CollectionProduct ──> Collection

Commerce
  Cart ── CartItem ──> ProductVariant
  Customer ── Address
  Order ── OrderItem       immutable snapshot, nullable product/variant links
        ── OrderAddress
        └─ FulfillmentOrder ──> FulfillmentProvider
  Discount                 percentage / fixed amount / free shipping

Payments
  StorePaymentChannel      one payment destination per row; masked in public views
  PaymentProof             buyer-uploaded slip + review state
  Order.paymentInstruction frozen copy of the QR / account details shown

Media
  Media                    storage key + URL only, never binary
```

Enums mirror the spec exactly: `OrderStatus`, `PaymentStatus`,
`FulfillmentStatus`, `ProductStatus`, `FulfillmentType`, `InventoryMode`,
`DiscountType`, `SectionType`, `ThemePreset`, `CreatorType`, `UserRole`,
`StorePermission`, `PaymentChannelType`, `PaymentProofStatus`. Runtime-safe mirrors live in `@cc/types` so the browser never
imports the Prisma client.

---

## API reference

Base: `/api/v1`. Success:

```json
{ "success": true, "data": {}, "message": null }
```

Failure:

```json
{ "success": false, "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found" } }
```

Validation failures add `error.details`, an array of `{ path, message }` that the
web app maps straight onto form fields.

### Public

```text
GET    /health
GET    /api/v1

POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password

GET    /storefront/:handle
GET    /storefront/:handle/home
GET    /storefront/:handle/products
GET    /storefront/:handle/products/:productSlug
GET    /storefront/:handle/collections
GET    /storefront/:handle/collections/:collectionSlug
GET    /storefront/:handle/checkout-options
GET    /storefront/:handle/order-lookup?orderNumber=&email=
POST   /storefront/:handle/orders/:orderNumber/payment-proof   multipart, rate-limited

GET    /storefront/:handle/cart
POST   /storefront/:handle/cart/items
PATCH  /storefront/:handle/cart/items/:itemId
DELETE /storefront/:handle/cart/items/:itemId
POST   /storefront/:handle/cart/discount
POST   /storefront/:handle/checkout
```

### Authenticated

```text
GET    /me
POST   /auth/logout-all

GET    /stores
POST   /stores
POST   /stores/onboarding
GET    /stores/check-handle?handle=
GET    /stores/theme-presets
GET    /stores/section-library
GET    /stores/banks
```

### Store-scoped

Every route below requires the listed permission, resolved from the caller's
membership in that store.

```text
GET    /stores/:storeId                              STORE_VIEW
PATCH  /stores/:storeId                              SETTINGS_EDIT
GET    /stores/:storeId/theme                        STORE_VIEW
PATCH  /stores/:storeId/theme                        THEME_EDIT
GET    /stores/:storeId/pages                        STORE_VIEW
GET    /stores/:storeId/pages/:pageId                STORE_VIEW
PATCH  /stores/:storeId/pages/:pageId                THEME_EDIT

GET    /stores/:storeId/products                     PRODUCT_VIEW
POST   /stores/:storeId/products                     PRODUCT_CREATE
POST   /stores/:storeId/products/generate-variants   PRODUCT_VIEW
GET    /stores/:storeId/products/:productId          PRODUCT_VIEW
PATCH  /stores/:storeId/products/:productId          PRODUCT_EDIT
POST   /stores/:storeId/products/:productId/duplicate PRODUCT_CREATE
DELETE /stores/:storeId/products/:productId          PRODUCT_DELETE

GET    /stores/:storeId/collections                  PRODUCT_VIEW
POST   /stores/:storeId/collections                  PRODUCT_CREATE
POST   /stores/:storeId/collections/reorder          PRODUCT_EDIT
GET    /stores/:storeId/collections/:collectionId    PRODUCT_VIEW
PATCH  /stores/:storeId/collections/:collectionId    PRODUCT_EDIT
DELETE /stores/:storeId/collections/:collectionId    PRODUCT_DELETE

GET    /stores/:storeId/orders                       ORDER_VIEW
GET    /stores/:storeId/orders/:orderId              ORDER_VIEW
PATCH  /stores/:storeId/orders/:orderId              ORDER_UPDATE

GET    /stores/:storeId/customers                    CUSTOMER_VIEW
GET    /stores/:storeId/customers/:customerId        CUSTOMER_VIEW

GET    /stores/:storeId/analytics/overview?days=     ANALYTICS_VIEW

GET    /stores/:storeId/media                        STORE_VIEW
POST   /stores/:storeId/media                        STORE_EDIT
DELETE /stores/:storeId/media/:mediaId               STORE_EDIT

GET    /stores/:storeId/discounts                    STORE_VIEW
POST   /stores/:storeId/discounts                    SETTINGS_EDIT
GET    /stores/:storeId/discounts/:discountId        STORE_VIEW
PATCH  /stores/:storeId/discounts/:discountId        SETTINGS_EDIT
DELETE /stores/:storeId/discounts/:discountId        SETTINGS_EDIT

GET    /stores/:storeId/team                         STORE_VIEW
POST   /stores/:storeId/team                         TEAM_MANAGE
PATCH  /stores/:storeId/team/:memberId               TEAM_MANAGE
DELETE /stores/:storeId/team/:memberId               TEAM_MANAGE

GET    /stores/:storeId/payments/channels            SETTINGS_EDIT
POST   /stores/:storeId/payments/channels            SETTINGS_EDIT
POST   /stores/:storeId/payments/channels/reorder    SETTINGS_EDIT
GET    /stores/:storeId/payments/channels/:channelId SETTINGS_EDIT
PATCH  /stores/:storeId/payments/channels/:channelId SETTINGS_EDIT
DELETE /stores/:storeId/payments/channels/:channelId SETTINGS_EDIT
GET    /stores/:storeId/payments/pending-count       ORDER_VIEW
PATCH  /stores/:storeId/payments/proofs/:proofId     ORDER_UPDATE
GET    /stores/:storeId/orders/:orderId/payment-proofs  ORDER_VIEW
```

### Security

`helmet`, CORS with an origin allowlist, a global rate limit plus a tighter one
on credential endpoints, Zod validation on every body / query / param, and a
single error handler that never emits stack traces, Prisma messages, password
hashes or tokens.

---

## Seed data

`pnpm db:seed` creates the demo tenant, wiping and recreating only the `neko`
store so it is safe to re-run.

```text
Store        Neko Studio  (@neko, VTuber, THB, theme preset VTUBER)
Collections  New Drop · Phone Cases · Stickers · VTuber Goods
Discounts    WELCOME10 (active) · FREESHIP (active) · SEASON3 (scheduled)
             LAUNCH20 (expired) · OLDCODE (disabled)
Team         Nagi (owner) · Mika (staff + THEME_EDIT and ANALYTICS_VIEW grants)
Payments     PromptPay mobile (default, QR) · TrueMoney Wallet (QR) · KBank transfer
Customers    4, with addresses
Orders       9, spread across the last 26 days and every status
Providers    Manual fulfillment (enabled) · CJdropshipping (disabled)

Products
  Cyber Neko MagSafe Case    5 models × 4 colours × 2 types = 40 variants
  Midnight Acrylic Stand     3 sizes × 2 poses = 6 variants, stock tracked
  Neko Logo Sticker Pack     2 pack sizes
  Tokyo Night Art Print      3 sizes × 2 finishes = 6 variants
  Wallpaper Bundle           digital, draft
```

Variant prices carry per-option adjustments — MagSafe adds ฿150, a Pro Max adds
฿100 — so the demo store exercises real variant pricing rather than one flat
price repeated 40 times.

Placeholder imagery comes from `picsum.photos` with deterministic seeds, so the
demo store looks the same on every reseed.

> The seeded payment identifiers are placeholders. Replace them in
> **Dashboard → Payments** before taking a real order, or buyers will scan a QR
> pointing at a number that is not yours.

---

## Scripts

Run from the repository root.

| Command                         | Description                         |
| ------------------------------- | ----------------------------------- |
| `pnpm dev`                      | API and web app together            |
| `pnpm dev:api` / `pnpm dev:web` | One at a time                       |
| `pnpm build`                    | Build shared packages, API and web  |
| `pnpm typecheck`                | `tsc --noEmit` across every package |
| `pnpm lint`                     | ESLint across every package         |
| `pnpm format`                   | Prettier write                      |
| `pnpm --filter @cc/shared test` | Unit tests (PromptPay payload)      |
| `pnpm db:migrate`               | Apply migrations (dev)              |
| `pnpm db:push`                  | Push the schema without a migration |
| `pnpm db:seed`                  | Seed the demo store                 |
| `pnpm db:studio`                | Prisma Studio                       |
| `pnpm db:reset`                 | Drop, re-migrate, reseed            |

---

## Roadmap

### Phase 2 — done

1. ~~Section editor with `dnd-kit`: reorder, hide, duplicate, delete, add sections~~
2. ~~Per-section settings panels for every section type~~
3. ~~Discount management UI on top of the existing engine~~
4. ~~Team invitations and per-member permission grants~~
5. Deeper analytics — sales by collection and real visitor tracking moved to Phase 3,
   since both need an events pipeline rather than order aggregates

### Phase 3 — partly done

1. ~~Payments: PromptPay / e-wallet / bank transfer QR paid directly to the creator~~
2. Automated slip verification, so confirmation is not always manual
3. Fulfillment adapters: Printful, Printify, CJdropshipping
4. Automated fulfillment and tracking synchronisation
5. Custom domains and creator payouts
6. Advanced analytics on a real events pipeline

Card and wallet _gateways_ (Stripe, Omise/Opn, 2C2P, ShopeePay) are intentionally
skipped: they mean holding funds, KYC and settlement. Direct QR transfer suits a
creator shop better, and `PaymentProvider` remains in place if a gateway is ever
wanted alongside it.

`FulfillmentMapping` already models variant → supplier-SKU, and both provider
registries accept new implementations without touching the order system.

---

## Recommended next step

**Automate slip verification.**

Payment collection works today, but every order needs a human to eyeball a slip.
Thai banks and third-party services (SlipOK, EasySlip, Slip2Go, or a bank's own
API) will read the mini-QR printed on a transfer slip and confirm the amount,
timestamp and destination account against the bank's records.

The seam for it already exists: `paymentProofService.review` is the single place
an order becomes paid, and `PaymentProof` already stores the slip, the claimed
amount and a reference.

What to add:

1. A `SlipVerifier` interface next to the payment and fulfillment registries,
   with one adapter per service and a `manual` no-op default
2. On upload, call the verifier and attach its verdict to the `PaymentProof`
3. Auto-approve only on an exact match of amount **and** destination account,
   leaving anything else in the queue for a human
4. Store the verifier's raw response for dispute handling

After that, the remaining Phase 3 work is fulfillment adapters, custom domains
and payouts — none of which the payment layer blocks.
