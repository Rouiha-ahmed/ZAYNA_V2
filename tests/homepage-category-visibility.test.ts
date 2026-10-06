import assert from "node:assert/strict";
import test from "node:test";

import { flattenCompleteCategoryTrees } from "../lib/navigation-menu";
import { homepageCategoryWhere } from "../lib/storefront-homepage-builder";

test("Homepage category eligibility has one explicit source of truth", () => {
  assert.equal(homepageCategoryWhere.featured, true);
  assert.equal(homepageCategoryWhere.isActive, true);
  assert.equal(homepageCategoryWhere.archivedAt, null);
});

test("navigation never loses later roots because earlier roots have many children", () => {
  const categories = [
    { id: "visage", parentId: null },
    ...Array.from({ length: 18 }, (_, index) => ({
      id: `visage-child-${index}`,
      parentId: "visage",
    })),
    { id: "cheveux", parentId: null },
    { id: "corps", parentId: null },
    { id: "solaire", parentId: null },
  ];

  const flattened = flattenCompleteCategoryTrees(categories);
  const roots = flattened.filter((category) => !category.parentId);
  assert.deepEqual(roots.map((category) => category.id), [
    "visage",
    "cheveux",
    "corps",
    "solaire",
  ]);
  assert.equal(flattened.length, categories.length);
});
