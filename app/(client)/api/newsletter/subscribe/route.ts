import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    await prisma.newsletterSubscription.upsert({
      where: {
        email,
      },
      update: {
        isActive: true,
      },
      create: {
        email,
      },
    });

    return NextResponse.json(
      { success: true },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to subscribe to newsletter:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter." },
      { status: 500 }
    );
  }
}

