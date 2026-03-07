import {
  createAddressForUser,
  getAddressesForUser,
} from "@/lib/services/customer";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    const addresses = await getAddressesForUser({
      clerkUserId: userId,
      fullName: user?.fullName || "Customer",
      email,
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const payload = await req.json();
    const name = String(payload?.name || "").trim();
    const address = String(payload?.address || "").trim();
    const city = String(payload?.city || "").trim();
    const phone = String(payload?.phone || "").trim();
    const state = String(payload?.state || "").trim();
    const zip = String(payload?.zip || "").trim();
    const isDefault = Boolean(payload?.default);

    if (!name || !address || !city || !phone || !state || !zip) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 }
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { error: "Street address must be at least 5 characters." },
        { status: 400 }
      );
    }

    if (state.length < 2) {
      return NextResponse.json(
        { error: "State/Region must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9 -]{3,12}$/.test(zip)) {
      return NextResponse.json(
        { error: "Postal code format is invalid." },
        { status: 400 }
      );
    }

    if (!/^[0-9+() -]{8,20}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone number format is invalid." },
        { status: 400 }
      );
    }

    const created = await createAddressForUser({
      clerkUserId: userId,
      fullName: user?.fullName || "Customer",
      email,
    }, {
      name,
      address,
      city,
      phone,
      state,
      zip,
      default: isDefault,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create address:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create address";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
