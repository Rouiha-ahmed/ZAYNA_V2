import assert from "node:assert/strict";
import test from "node:test";

import { flattenCompleteCategoryTrees } from "../lib/navigation-menu";
import { homepageCategoryWhere } from "../lib/storefront-homepage-builder";
import { navigationCategoryWhere } from "../lib/storefront-navigation";

test("Homepage category eligibility has one explicit source of truth", () => {
  assert.equal(homepageCategoryWhere.featured, true);
  assert.equal(homepageCategoryWhere.isActive, true);
  assert.equal(homepageCategoryWhere.archivedAt, null);
});

test("top navigation requires an active, non-archived, opted-in root", () => {
  assert.equal(navigationCategoryWhere.isActive, true);
  assert.equal(navigationCategoryWhere.archivedAt, null);
  assert.deepEqual(navigationCategoryWhere.OR[0], {
    parentId: null,
    showInNavigation: true,
  });
  assert.deepEqual(navigationCategoryWhere.OR[1], {
    parent: {
      is: {
        parentId: null,
        showInNavigation: true,
        isActive: true,
        archivedAt: null,
      },
    },
  });
});

test("Homepage and navigation visibility use separate fields", () => {
  assert.equal(homepageCategoryWhere.featured, true);
  assert.equal("showInNavigation" in homepageCategoryWhere, false);
  assert.equal("featured" in navigationCategoryWhere, false);
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
