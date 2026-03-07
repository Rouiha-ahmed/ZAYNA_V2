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

export const resolveImageUrl = (source: ImageSource) => {
  if (!source) {
    return "";
  }

  if (typeof source === "string") {
    return source;
  }

  return source.asset?.url || source.url || "";
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
