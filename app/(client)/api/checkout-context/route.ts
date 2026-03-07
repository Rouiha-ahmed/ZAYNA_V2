import { getCheckoutContextForUser } from "@/lib/services/customer";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
