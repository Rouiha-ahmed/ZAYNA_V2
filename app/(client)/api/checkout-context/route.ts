import { getCheckoutContextForUser } from "@/lib/services/customer";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { enforceRequestRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = enforceRequestRateLimit(request, {
    namespace: "checkout-context",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses[0]?.emailAddress ||
      "";

    const context = await getCheckoutContextForUser({
      clerkUserId: userId,
      fullName: user?.fullName || "Customer",
      email,
    });

    return NextResponse.json(context);
  } catch (error) {
    console.error("Failed to load checkout context:", error);
    return NextResponse.json(
      { error: "Failed to load checkout context" },
      { status: 500 }
    );
  }
}
