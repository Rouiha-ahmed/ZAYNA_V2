import { NextResponse } from "next/server";

import { getAdminIdentity } from "@/lib/admin";
import { getMyOrdersCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const identity = await getAdminIdentity();

    if (!identity.userId) {
      return NextResponse.json(
        { ordersCount: 0, isAdmin: false },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    const ordersCount = await getMyOrdersCount(identity.userId);

    return NextResponse.json(
      {
        ordersCount,
        isAdmin: identity.isAdmin,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to load navigation context:", error);
    return NextResponse.json(
      { error: "Failed to load navigation context" },
      { status: 500 }
    );
  }
}
