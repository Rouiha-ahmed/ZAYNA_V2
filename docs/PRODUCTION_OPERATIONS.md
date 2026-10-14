# Production operations

## Runtime

- Use Node.js 24 LTS and npm 11. The committed `package-lock.json` is authoritative; install with `npm ci`.
- Run one application process on the initial single VPS. The application rate limiter is bounded and in-memory, so counters reset on restart and are not shared between processes. Move the same policies to a shared store before horizontal scaling.
- The reverse proxy must overwrite `X-Forwarded-For` and `X-Real-IP` rather than append client-supplied values. When Cloudflare is enabled, only trust `CF-Connecting-IP` from Cloudflare-origin traffic.

## Required production configuration

Copy `.env.example` to the server's protected environment store; do not commit `.env` files. Values without the `NEXT_PUBLIC_` prefix are server-only secrets.

- `DATABASE_URL`: PostgreSQL connection string. Use `DATABASE_URL_POOLED` only when the runtime provides a pooler.
- `NEXT_PUBLIC_BASE_URL`: canonical HTTPS public origin.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: matching production Clerk instance keys.
- `ADMIN_EMAILS` and/or `ADMIN_USER_IDS`: explicit admin allowlist. Production has no admin fallback.
- `CRON_SECRET`: unique random value of at least 32 bytes. It is required even when an admin manually triggers loyalty expiration.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: base64-encoded 32-byte key, kept stable across restarts.
- `CMI_CLIENT_ID` and `CMI_STORE_KEY`: required only when `NEXT_PUBLIC_ENABLE_CMI=true`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and WhatsApp sender/template variables: required only when WhatsApp notifications are enabled.

The `HEYPARA_*` variables affect only the offline import script and are not needed by the running storefront.

## Monitoring and scheduled work

- `GET /api/health` checks the application and a lightweight `SELECT 1` database query. It returns only `{"status":"ok"}` or `{"status":"unavailable"}` and must not be publicly cached.
- Schedule a daily `POST /api/admin/loyalty/expire` with `Authorization: Bearer <CRON_SECRET>`. Per-lot unique idempotency keys make retries safe. Do not configure a timer until deployment.
- CMI callbacks are authenticated by their HMAC and deliberately do not use the normal aggressive public-route rate limits. Apply conservative edge/network limits separately.

## Credential rotation before staging

Rotate every currently provisioned database password, Clerk secret key, Twilio auth token, CMI store key, cron bearer secret, and Server Action encryption key before the first external staging deployment. Update the protected server environment and provider dashboards together; never paste values into issues, CI YAML, logs, or documentation.

## Manual browser/payment checks

After an HTTPS staging environment exists, verify Clerk sign-in/sign-out/admin denial, remote product imagery, CMI form submission/callbacks, WhatsApp delivery, multi-image uploads at the documented limits, CSP console reports, and reverse-proxy client IP handling.

## Known development-tool advisory

As of 2026-10-07, `npm audit --omit=dev` reports zero vulnerabilities. A full audit still reports the high-severity `braces` stack-exhaustion advisory through `eslint-config-next` and the shadcn/ts-morph/fast-glob toolchain. No patched `braces` npm release is available, and npm's proposed `--force` resolution downgrades shadcn across a breaking boundary. These packages are development/build tools and are omitted from the production runtime. Recheck this advisory during routine dependency maintenance and upgrade normally when the upstream toolchains publish compatible fixes.
