import assert from "node:assert/strict";
import test from "node:test";

import { consumeRateLimitKey, getClientAddress } from "../lib/rate-limit";

test("fixed-window rate limits allow the budget and reject excess requests", () => {
  const policy = { namespace: "test-budget", limit: 2, windowMs: 1_000 };

  assert.equal(consumeRateLimitKey("client-a", policy, 1_000).allowed, true);
  assert.equal(consumeRateLimitKey("client-a", policy, 1_100).allowed, true);
  assert.equal(consumeRateLimitKey("client-a", policy, 1_200).allowed, false);
  assert.equal(consumeRateLimitKey("client-a", policy, 2_001).allowed, true);
});

test("rate limits isolate clients and prefer Cloudflare's client address", () => {
  const policy = { namespace: "test-clients", limit: 1, windowMs: 1_000 };
  assert.equal(consumeRateLimitKey("client-a", policy, 5_000).allowed, true);
  assert.equal(consumeRateLimitKey("client-b", policy, 5_000).allowed, true);

  const request = new Request("https://example.test", {
    headers: {
      "cf-connecting-ip": "203.0.113.9",
      "x-real-ip": "192.0.2.1",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    },
  });
  assert.equal(getClientAddress(request), "203.0.113.9");
});
