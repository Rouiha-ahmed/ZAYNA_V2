import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const ASSET_ROOT = path.join(process.cwd(), "images");
const ALLOWED_DIRECTORIES = new Set(["products", "brands", "banner", "categories"]);

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: assetPath } = await params;

  if (!assetPath?.length || assetPath.some((segment) => segment.includes(".."))) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  if (!ALLOWED_DIRECTORIES.has(assetPath[0])) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const filePath = path.normalize(path.join(ASSET_ROOT, ...assetPath));
  if (!filePath.startsWith(ASSET_ROOT)) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
