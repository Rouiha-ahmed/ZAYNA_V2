import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOGUE_TAXONOMY,
  classifyProduct,
} from "../lib/product-category-classifier";

test("catalogue taxonomy is a deterministic hierarchy with at most two levels", () => {
  const slugs = new Set(CATALOGUE_TAXONOMY.map((category) => category.slug));
  assert.equal(slugs.size, CATALOGUE_TAXONOMY.length);
  for (const category of CATALOGUE_TAXONOMY) {
    if (!category.parentSlug) continue;
    const parent = CATALOGUE_TAXONOMY.find(
      (candidate) => candidate.slug === category.parentSlug,
    );
    assert.ok(parent, `Missing parent ${category.parentSlug}`);
    assert.equal(parent.parentSlug, null, `${category.slug} would create a third level`);
  }
});

test("classifier maps representative catalogue families without brand-only categories", () => {
  const examples: Array<[string, string]> = [
    ["Avène Fluide Solaire SPF50+ 50ml", "solaire"],
    ["Shampooing Anti-Pelliculaire 200ml", "shampooings"],
    ["Crème Hydratante Visage 40ml", "hydratants-visage"],
    ["Vitamine C 1000mg 30 Comprimés", "vitamines-mineraux"],
    ["Liniment Oléo-Calcaire Bébé 500ml", "hygiene-soins-bebe"],
    ["Lessive Liquide Neutre Bio 1.5L", "entretien-du-linge"],
  ];
  for (const [name, expected] of examples) {
    assert.ok(
      classifyProduct({ name }).categorySlugs.includes(expected),
      `${name} should include ${expected}`,
    );
  }
  assert.equal(
    CATALOGUE_TAXONOMY.some((category) => /avene|bioderma|uriage/i.test(category.title)),
    false,
  );
});

test("classifier is idempotent for equivalent normalized input", () => {
  const first = classifyProduct({ name: "  CRÈME   HYDRATANTE VISAGE 50ML " });
  const second = classifyProduct({ name: "crème hydratante visage 50ml" });
  assert.deepEqual(first.categorySlugs, second.categorySlugs);
  assert.equal(first.confidence, second.confidence);
});
