import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePromoDiscount,
  getPromoCodeStatus,
  normalizePromoCode,
  validatePromoCodeConfiguration,
  type PromoCodeRecord,
} from "../lib/promo";

const now = new Date("2026-10-01T12:00:00.000Z");
const base: PromoCodeRecord = {
  _id: "promo-1",
  code: "WELCOME10",
  active: true,
  discountType: "percentage",
  discountValue: 10,
  minimumOrderAmount: 0,
  allowedPaymentMethods: ["cod", "cmi_card"],
  usedCount: 2,
};

test("promo status combines activation, dates, limits and archive state", () => {
  assert.equal(getPromoCodeStatus(base, now), "ACTIVE");
  assert.equal(getPromoCodeStatus({ ...base, startsAt: "2026-10-02T00:00:00.000Z" }, now), "SCHEDULED");
  assert.equal(getPromoCodeStatus({ ...base, endsAt: "2026-09-30T23:59:59.000Z" }, now), "EXPIRED");
  assert.equal(getPromoCodeStatus({ ...base, endsAt: "2026-10-05T23:59:59.000Z" }, now), "EXPIRING_SOON");
  assert.equal(getPromoCodeStatus({ ...base, active: false }, now), "INACTIVE");
  assert.equal(getPromoCodeStatus({ ...base, usageLimit: 2 }, now), "LIMIT_REACHED");
  assert.equal(getPromoCodeStatus({ ...base, archivedAt: "2026-09-01T00:00:00.000Z" }, now), "ARCHIVED");
});

test("promo validation protects percentages, date ranges and usage limits", () => {
  const valid = {
    title: "Bienvenue",
    code: "WELCOME10",
    discountType: "percentage" as const,
    discountValue: 10,
    minimumOrderAmount: 100,
    allowedPaymentMethods: ["cod" as const],
    startsAt: new Date("2026-10-01T00:00:00.000Z"),
    endsAt: new Date("2026-10-31T23:59:59.000Z"),
    usageLimit: 100,
  };
  assert.doesNotThrow(() => validatePromoCodeConfiguration(valid));
  assert.throws(() => validatePromoCodeConfiguration({ ...valid, discountValue: 101 }), /100/);
  assert.throws(() => validatePromoCodeConfiguration({ ...valid, usageLimit: 0 }), /entier positif/);
  assert.throws(() => validatePromoCodeConfiguration({ ...valid, endsAt: valid.startsAt }), /postérieure/);
});

test("archived promo codes remain invalid at checkout and codes normalize consistently", () => {
  assert.equal(normalizePromoCode("  été bienvenue 10! "), "ETE-BIENVENUE-10");
  const result = calculatePromoDiscount(
    { ...base, archivedAt: "2026-09-01T00:00:00.000Z" },
    500,
    "cod"
  );
  assert.equal(result.valid, false);
  assert.equal(result.discountAmount, 0);
});
