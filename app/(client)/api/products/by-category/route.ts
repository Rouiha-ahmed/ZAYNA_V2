import { getProductsByCategoryId } from "@/lib/queries";
import { enforceRequestRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const limited = enforceRequestRateLimit(req, {
    namespace: "products-by-category",
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim();
    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing categoryId query parameter" },
        { status: 400 }
      );
    }

    const products = await getProductsByCategoryId(categoryId);

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch products by category" },
      { status: 500 }
    );
  }
}
