import { NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  buckets: Map<string, RateLimitBucket>;
  lastSweepAt: number;
};

export type RateLimitPolicy = {
  namespace: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;
const globalRateLimit = globalThis as typeof globalThis & {
  __zaynaRateLimitStore?: RateLimitStore;
};

const store =
  globalRateLimit.__zaynaRateLimitStore ||
  (globalRateLimit.__zaynaRateLimitStore = {
    buckets: new Map<string, RateLimitBucket>(),
    lastSweepAt: 0,
  });

const sweepExpiredBuckets = (now: number) => {
  if (now - store.lastSweepAt < SWEEP_INTERVAL_MS && store.buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of store.buckets) {
    if (bucket.resetAt <= now) store.buckets.delete(key);
  }

  while (store.buckets.size >= MAX_BUCKETS) {
    const oldestKey = store.buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    store.buckets.delete(oldestKey);
  }

  store.lastSweepAt = now;
};

export function consumeRateLimitKey(
  identifier: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): RateLimitResult {
  sweepExpiredBuckets(now);
  const key = `${policy.namespace}:${identifier.slice(0, 256)}`;
  const existing = store.buckets.get(key);
  const bucket =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + policy.windowMs }
      : existing;

  const allowed = bucket.count < policy.limit;
  if (allowed) bucket.count += 1;
  store.buckets.delete(key);
  store.buckets.set(key, bucket);

  return {
    allowed,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function getClientAddress(request: Request): string {
  // The production reverse proxy must overwrite these headers rather than append
  // untrusted client values. Cloudflare's authenticated header takes precedence.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwarded ||
    "unknown"
  ).slice(0, 128);
}

const rateLimitHeaders = (result: RateLimitResult) => ({
  "Cache-Control": "no-store",
  "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1_000))),
  "X-RateLimit-Limit": String(result.limit),
  "X-RateLimit-Remaining": String(result.remaining),
  "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
});

export function enforceRequestRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  identifier = getClientAddress(request),
): NextResponse | null {
  const result = consumeRateLimitKey(identifier, policy);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please retry later." },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}
