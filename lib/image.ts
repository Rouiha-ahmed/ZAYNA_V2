import type { AppImage } from "@/types";

type ImageSource =
  | AppImage
  | {
      url?: string | null;
      asset?: {
        url?: string | null;
      } | null;
    }
  | string
  | null
  | undefined;

const LEGACY_ASSET_PREFIX = "/api/assets/";
const STATIC_ASSET_PREFIX = "/static-assets/";

const normalizeImageUrl = (url: string) =>
  url.startsWith(LEGACY_ASSET_PREFIX)
    ? `${STATIC_ASSET_PREFIX}${url.slice(LEGACY_ASSET_PREFIX.length)}`
    : url;

export const resolveImageUrl = (source: ImageSource) => {
  if (!source) {
    return "";
  }

  if (typeof source === "string") {
    return normalizeImageUrl(source);
  }

  return normalizeImageUrl(source.asset?.url || source.url || "");
};

export const sanitizePublicImageUrl = (
  value: string | null | undefined,
  fallback = ""
) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  const prefixed = /^(https?:)?\/\//.test(trimmed) || trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`;
  const normalized = normalizeImageUrl(prefixed);

  if (!normalized) {
    return fallback;
  }

  const lower = normalized.toLowerCase();
  if (lower.endsWith(".icloud") || normalized.startsWith("/.")) {
    return fallback;
  }

  return normalized;
};

export const urlFor = (source: ImageSource) => ({
  url: () => resolveImageUrl(source),
});

export const toAbsoluteUrl = (baseUrl: string, pathOrUrl: string) => {
  if (!pathOrUrl) {
    return "";
  }

  return new URL(pathOrUrl, baseUrl).toString();
};
