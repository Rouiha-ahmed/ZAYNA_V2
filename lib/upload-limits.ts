export const MEBIBYTE = 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 5 * MEBIBYTE;
export const MAX_BRAND_LOGO_BYTES = 2 * MEBIBYTE;
export const MAX_PRODUCT_IMAGE_FILES = 6;
export const MAX_PRODUCT_UPLOAD_BATCH_BYTES = 20 * MEBIBYTE;
export const MAX_IMAGE_INPUT_PIXELS = 40_000_000;

// 20 MiB of files plus multipart fields and boundaries. This remains bounded
// while supporting the existing six-image product workflow.
export const SERVER_ACTION_BODY_SIZE_LIMIT = "22mb";

export function validateProductImageBatch(files: File[]) {
  if (files.length > MAX_PRODUCT_IMAGE_FILES) {
    throw new Error("Vous pouvez importer jusqu'a 6 photos par produit.");
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_PRODUCT_UPLOAD_BATCH_BYTES) {
    throw new Error("L'ensemble des photos doit faire moins de 20 Mo.");
  }
}
