import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { getAdminIdentity } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { enforceRequestRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const getNavContext = unstable_cache(
  async (userId: string) => {
    const [ordersCount, identity] = await Promise.all([
      prisma.order.count({ where: { clerkUserId: userId } }),
      // Re-use admin identity which is already cached via React cache()
      Promise.resolve(null),
    ]);
    return { ordersCount };
  },
  ["nav-context"],
  { revalidate: 30 }
);

export async function GET(request: Request) {
  const limited = enforceRequestRateLimit(request, {
    namespace: "navigation-context",
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const identity = await getAdminIdentity();

    if (!identity.userId) {
      return NextResponse.json(
        { ordersCount: 0, isAdmin: false },
        { headers: { "Cache-Control": "private, max-age=10" } }
      );
    }

    const { ordersCount } = await getNavContext(identity.userId);

    return NextResponse.json(
      { ordersCount, isAdmin: identity.isAdmin },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (error) {
    console.error("Failed to load navigation context:", error);
    return NextResponse.json(
      { ordersCount: 0, isAdmin: false },
      { status: 200, headers: { "Cache-Control": "private, max-age=5" } }
    );
  }
}
