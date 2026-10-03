import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shopSource = readFileSync(
  new URL("../components/Shop.tsx", import.meta.url),
  "utf8"
);

test("Boutique leaves vertical scrolling to the document", () => {
  assert.doesNotMatch(shopSource, /h-\[calc\(100vh-160px\)\]/);
  assert.doesNotMatch(shopSource, /overflow-y-(?:auto|scroll)/);
  assert.doesNotMatch(shopSource, /md:sticky/);
  assert.match(shopSource, /<aside className="min-w-0 pb-5/);
  assert.match(shopSource, /<div className="relative min-w-0 pr-2">/);
});
