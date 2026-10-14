-- Storefront navigation membership is independent from catalogue and Homepage visibility.
-- Existing and newly-created categories stay out of the main menu until an admin opts in.
ALTER TABLE "Category"
  ADD COLUMN "showInNavigation" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Category_showInNavigation_isActive_archivedAt_parentId_idx"
  ON "Category"("showInNavigation", "isActive", "archivedAt", "parentId");
