import { getProductsByCategoryId } from "@/lib/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim();
    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing categoryId query parameter" },
        { status: 400 }
      );
    }

    const products = await getProductsByCategoryId(categoryId);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch products by category" },
      { status: 500 }
    );
  }
}
