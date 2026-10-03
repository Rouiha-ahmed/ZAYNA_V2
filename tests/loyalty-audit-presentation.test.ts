import assert from "node:assert/strict";
import test from "node:test";

import { getLoyaltyAuditEventPresentation } from "../lib/loyalty-audit-presentation";

const base = {
  entity: "LoyaltyProgramSettings",
  entityId: "default",
  actorEmail: null,
  actorUserId: "user_technical_identifier",
};

test("loyalty audit maps settings fields and actors to business French", () => {
  const presentation = getLoyaltyAuditEventPresentation(
    {
      ...base,
      action: "loyalty.settings_updated",
      metadata: {
        before: { statusValidityMonths: 12, loyalMinimumRevenue: 5000 },
        after: { statusValidityMonths: 18, loyalMinimumRevenue: 6000 },
      },
    },
    { actorName: "Khalid Admin" }
  );

  assert.equal(presentation.title, "Paramètres du programme de fidélité modifiés");
  assert.equal(presentation.actor, "Khalid Admin");
  assert.ok(presentation.details.some((detail) => detail.includes("12 mois → 18 mois")));
  assert.ok(presentation.details.some((detail) => detail.includes("5 000") && detail.includes("6 000")));
});

test("order reconciliation explains the real operation and links the business order number", () => {
  const presentation = getLoyaltyAuditEventPresentation(
    {
      ...base,
      action: "loyalty:order_reconciled",
      entity: "Order",
      entityId: "order-database-id",
      metadata: { isValidCommercialOrder: true, tier: "gold" },
    },
    { orderNumber: "ZY1048" }
  );

  assert.equal(presentation.title, "Points et statut fidélité recalculés pour la commande");
  assert.deepEqual(presentation.subject, {
    label: "Commande #ZY1048",
    href: "/admin/orders/order-database-id",
  });
  assert.deepEqual(presentation.details, ["Niveau obtenu : Gold"]);
});

test("technical actor ids and unknown actions use safe fallbacks", () => {
  const presentation = getLoyaltyAuditEventPresentation({
    ...base,
    action: "loyalty.new_unknown_event",
    metadata: null,
  });

  assert.equal(presentation.title, "Modification du programme de fidélité");
  assert.equal(presentation.actor, "Administrateur");
  assert.equal(presentation.isFallback, true);
  assert.equal(presentation.title.includes("loyalty"), false);
});

test("events without an actor are presented as system events", () => {
  const presentation = getLoyaltyAuditEventPresentation({
    ...base,
    action: "loyalty.expiration_processed",
    actorUserId: null,
    metadata: { customerCount: 2, expiredPoints: 40 },
  });

  assert.equal(presentation.actor, "Système");
  assert.ok(presentation.details.includes("Points expirés : 40 points"));
});
