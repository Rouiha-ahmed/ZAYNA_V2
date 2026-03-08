# Zayna

Zayna is a Next.js ecommerce/parapharmacy storefront using Clerk for authentication, Prisma for data access, PostgreSQL for persistence, and Stripe for card checkout.

Full project documentation is available in [docs/APPLICATION_DOCUMENTATION.md](./docs/APPLICATION_DOCUMENTATION.md).

## Stack

- Next.js App Router
- Clerk
- Prisma ORM
- PostgreSQL
- Stripe Checkout + webhook

## Environment Variables

Create `.env` from `.env.example` and fill:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zayna"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ADMIN_EMAILS="admin@example.com"
ADMIN_USER_IDS=""

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_replace_me"
CLERK_SECRET_KEY="sk_test_replace_me"

STRIPE_SECRET_KEY="sk_test_replace_me"
STRIPE_WEBHOOK_SECRET="whsec_replace_me"
```

Prisma CLI reads from `.env` in this repo.

`ADMIN_EMAILS` controls who can access `/admin`. In local development, if you do not set `ADMIN_EMAILS` or `ADMIN_USER_IDS`, the admin area falls back to allowing the signed-in user.

## Install

```bash
npm install
```

## Database Setup

If you want the full step-by-step guide, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

Generate the Prisma client:

```bash
npm run db:generate
```

Create and apply the checked-in local migration:

```bash
npm run db:migrate
```

If you only want to sync schema without creating a migration:

```bash
npm run db:push
```

Seed demo catalog data:

```bash
npm run db:seed
```

Run the full local database setup in one command:

```bash
npm run db:setup
```

The seed creates demo categories, brands, promo codes, and products using the local repository images exposed through `/api/assets/...`.

## Run Locally

```bash
npm run dev
```

App URL:

```bash
http://localhost:3000
```

## Stripe Webhook

Card checkout uses Stripe Checkout. For local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the returned `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

Test card:

```text
4242 4242 4242 4242
```

Use any future expiry date, any CVC, and any ZIP code.

## Build

```bash
npm run build
```

## Deployment Notes

- Deploy on Vercel with the same env vars from `.env.example`.
- Provision a PostgreSQL database and set `DATABASE_URL`.
- Run Prisma migrations during deployment with:

```bash
npm run db:deploy
```

- Seed only when you need demo data in a fresh environment:

```bash
npm run db:seed
```
