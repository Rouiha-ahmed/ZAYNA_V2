import { searchProducts } from "@/lib/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const selectedCategory = req.nextUrl.searchParams.get("category")?.trim() || "";
    const selectedBrand = req.nextUrl.searchParams.get("brand")?.trim() || "";
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limit = Number(req.nextUrl.searchParams.get("limit") || "");

    const minPriceParam = req.nextUrl.searchParams.get("minPrice");
    const maxPriceParam = req.nextUrl.searchParams.get("maxPrice");
    const parsedMin = minPriceParam ? Number(minPriceParam) : NaN;
    const parsedMax = maxPriceParam ? Number(maxPriceParam) : NaN;
    const hasPriceFilter = Number.isFinite(parsedMin) && Number.isFinite(parsedMax);

    const minPrice = hasPriceFilter ? parsedMin : 0;
    const maxPrice = hasPriceFilter ? parsedMax : 0;

    const products = await searchProducts({
      selectedCategory,
      selectedBrand,
      searchTerm: q,
      minPrice: hasPriceFilter ? minPrice : null,
      maxPrice: hasPriceFilter ? maxPrice : null,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to search products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
