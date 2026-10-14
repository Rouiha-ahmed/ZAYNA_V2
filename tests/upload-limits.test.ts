import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_PRODUCT_IMAGE_FILES,
  MAX_PRODUCT_UPLOAD_BATCH_BYTES,
  validateProductImageBatch,
} from "../lib/upload-limits";

const sizedFile = (size: number) => ({ size }) as File;

test("product upload batches preserve six images within the aggregate budget", () => {
  const files = Array.from(
    { length: MAX_PRODUCT_IMAGE_FILES },
    () => sizedFile(Math.floor(MAX_PRODUCT_UPLOAD_BATCH_BYTES / MAX_PRODUCT_IMAGE_FILES)),
  );
  assert.doesNotThrow(() => validateProductImageBatch(files));
});

test("product upload batches reject excessive count and aggregate size", () => {
  assert.throws(
    () =>
      validateProductImageBatch(
        Array.from({ length: MAX_PRODUCT_IMAGE_FILES + 1 }, () => sizedFile(1)),
      ),
    /6 photos/,
  );
  assert.throws(
    () => validateProductImageBatch([sizedFile(MAX_PRODUCT_UPLOAD_BATCH_BYTES + 1)]),
    /20 Mo/,
  );
});
