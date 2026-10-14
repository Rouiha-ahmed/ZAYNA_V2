import { NextRequest, NextResponse } from "next/server";

import { getAdminIdentity } from "@/lib/admin";
import { safeEqual } from "@/lib/security";
import { expireDueLoyaltyPoints } from "@/lib/services/loyalty";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    console.error("Loyalty expiration endpoint is disabled: CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const cronAuthorized = safeEqual(providedSecret, configuredSecret);
  const identity = cronAuthorized ? null : await getAdminIdentity();

  if (!cronAuthorized && !identity?.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    // expireDueLoyaltyPoints uses a unique `expiration:<lot id>` idempotency key
    // for every ledger movement, so retries cannot expire the same lot twice.
    const result = await expireDueLoyaltyPoints(
      cronAuthorized
        ? { label: "system:cron" }
        : {
            userId: identity?.userId,
            email: identity?.email,
            label: identity?.displayName,
          },
    );
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Loyalty expiration job failed:", error);
    return NextResponse.json(
      { error: "Loyalty expiration failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
