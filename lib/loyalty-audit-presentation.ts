export type LoyaltyAuditPresentationInput = {
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  actorEmail: string | null;
  actorUserId: string | null;
};

export type LoyaltyAuditPresentationContext = {
  actorName?: string | null;
  orderNumber?: string | null;
  customerName?: string | null;
  rewardName?: string | null;
};

export type LoyaltyAuditPresentation = {
  title: string;
  details: string[];
  actor: string;
  subject?: { label: string; href: string };
  isFallback: boolean;
};

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 });

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const actionKey = (action: string) => action.replaceAll(":", ".");

const technicalActor = (value: string | null | undefined) =>
  Boolean(value && /^(user_|admin_|system_|usr_)/i.test(value));

const actorLabel = (
  event: LoyaltyAuditPresentationInput,
  context: LoyaltyAuditPresentationContext,
  metadata: Record<string, unknown> | null
) => {
  const storedLabel = typeof metadata?.actorLabel === "string" ? metadata.actorLabel : null;
  if (context.actorName && !technicalActor(context.actorName)) return context.actorName;
  if (storedLabel && !technicalActor(storedLabel)) return storedLabel;
  if (event.actorEmail) return event.actorEmail;
  if (!event.actorUserId) return "Système";
  return "Administrateur";
};

const tierLabel = (value: unknown) => {
  if (value === "bronze") return "Bronze";
  if (value === "silver") return "Argent";
  if (value === "gold") return "Gold";
  return typeof value === "string" ? value : "—";
};

const rewardTypeLabel = (value: unknown) => {
  if (value === "fixed_discount") return "Remise fixe";
  if (value === "percentage_discount") return "Remise en pourcentage";
  if (value === "free_delivery") return "Livraison offerte";
  if (value === "gift") return "Cadeau";
  if (value === "custom") return "Avantage personnalisé";
  return "Récompense";
};

type FieldDefinition = {
  label: string;
  format: (value: unknown) => string;
};

const raw = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Activé" : "Désactivé";
  if (typeof value === "number") return number.format(value);
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};
const months = (value: unknown) => `${raw(value)} mois`;
const days = (value: unknown) => `${raw(value)} jours`;
const points = (value: unknown) => `${raw(value)} points`;

const settingFields: Record<string, FieldDefinition> = {
  statusValidityMonths: { label: "Validité du statut", format: months },
  pointExpirationMonths: { label: "Expiration après inactivité", format: months },
  expirationAlertDays: { label: "Alertes avant expiration", format: days },
  separateStatusAndPoints: { label: "Séparation du statut et des points", format: raw },
  newCustomerDays: { label: "Durée du segment nouveau client", format: days },
  activeCustomerDays: { label: "Durée du segment client actif", format: days },
  inactiveCustomerDays: { label: "Seuil d’inactivité", format: days },
  loyalMinimumOrders: { label: "Commandes minimum du client fidèle", format: raw },
  loyalMinimumRevenue: { label: "CA minimum du client fidèle", format: (value) => money.format(Number(value || 0)) },
  reengagementCycleMultiplier: { label: "Multiplicateur de relance", format: raw },
  minimumOrdersForCycle: { label: "Achats nécessaires au calcul du cycle", format: raw },
};

const change = (label: string, before: unknown, after: unknown, format = raw) =>
  `${label} : ${format(before)} → ${format(after)}`;

const settingsChanges = (metadata: Record<string, unknown> | null) => {
  const before = record(metadata?.before);
  const after = record(metadata?.after);
  const details: string[] = [];

  if (before && after) {
    for (const [key, definition] of Object.entries(settingFields)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        details.push(change(definition.label, before[key], after[key], definition.format));
      }
    }
  }

  const beforeTiers = array(metadata?.tiersBefore).map(record).filter(Boolean) as Record<string, unknown>[];
  const afterTiers = array(metadata?.tiersAfter || metadata?.tiers).map(record).filter(Boolean) as Record<string, unknown>[];
  for (const nextTier of afterTiers) {
    const previousTier = beforeTiers.find((item) => item.tier === nextTier.tier);
    if (!previousTier) continue;
    const tier = tierLabel(nextTier.tier);
    if (previousTier.pointsPer100Mad !== nextTier.pointsPer100Mad) {
      details.push(change(`Points gagnés par 100 MAD — ${tier}`, previousTier.pointsPer100Mad, nextTier.pointsPer100Mad, points));
    }
    if (Number(previousTier.revenueThreshold) !== Number(nextTier.revenueThreshold)) {
      details.push(change(`Seuil du niveau ${tier}`, previousTier.revenueThreshold, nextTier.revenueThreshold, (value) => money.format(Number(value || 0))));
    }
    if (previousTier.qualificationMonths !== nextTier.qualificationMonths) {
      details.push(change(`Période de qualification — ${tier}`, previousTier.qualificationMonths, nextTier.qualificationMonths, months));
    }
  }

  if (!details.length && afterTiers.length) {
    details.push(`${afterTiers.length} règles de niveau enregistrées`);
  }
  return details;
};

const rewardDetails = (metadata: Record<string, unknown> | null) => {
  const before = record(metadata?.before);
  const after = record(metadata?.after);
  if (before && after) {
    const fields: Array<[string, FieldDefinition]> = [
      ["name", { label: "Nom", format: raw }],
      ["pointsCost", { label: "Coût", format: points }],
      ["monetaryValue", { label: "Valeur", format: (value) => money.format(Number(value || 0)) }],
      ["percentageValue", { label: "Pourcentage", format: (value) => `${raw(value)} %` }],
      ["isActive", { label: "Disponibilité", format: raw }],
    ];
    return fields
      .filter(([key]) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map(([key, definition]) => change(definition.label, before[key], after[key], definition.format));
  }
  const details: string[] = [];
  if (metadata?.pointsCost !== undefined) details.push(`Coût : ${points(metadata.pointsCost)}`);
  if (metadata?.type) details.push(`Type : ${rewardTypeLabel(metadata.type)}`);
  return details;
};

export function getLoyaltyAuditEventPresentation(
  event: LoyaltyAuditPresentationInput,
  context: LoyaltyAuditPresentationContext = {}
): LoyaltyAuditPresentation {
  const metadata = record(event.metadata);
  const key = actionKey(event.action);
  const actor = actorLabel(event, context, metadata);
  const rewardName = context.rewardName || (typeof metadata?.name === "string" ? metadata.name : null);
  const orderSubject = context.orderNumber
    ? { label: `Commande #${context.orderNumber.slice(-8).toUpperCase()}`, href: `/admin/orders/${event.entityId}` }
    : undefined;
  const customerId = event.entity === "User" ? event.entityId : typeof metadata?.userId === "string" ? metadata.userId : null;
  const customerSubject = context.customerName && customerId
    ? { label: context.customerName, href: `/admin/clients/${customerId}` }
    : undefined;

  if (key === "loyalty.settings_updated") return { title: "Paramètres du programme de fidélité modifiés", details: settingsChanges(metadata), actor, isFallback: false };
  if (key === "loyalty.reward_created") return { title: `Récompense créée${rewardName ? ` — ${rewardName}` : ""}`, details: rewardDetails(metadata), actor, isFallback: false };
  if (key === "loyalty.reward_updated") return { title: `Récompense de fidélité modifiée${rewardName ? ` — ${rewardName}` : ""}`, details: rewardDetails(metadata), actor, isFallback: false };
  if (key === "loyalty.reward_archived") return { title: `Récompense archivée${rewardName ? ` — ${rewardName}` : ""}`, details: [], actor, isFallback: false };
  if (key === "loyalty.order_reconciled") return { title: "Points et statut fidélité recalculés pour la commande", details: metadata?.tier ? [`Niveau obtenu : ${tierLabel(metadata.tier)}`] : [], actor, subject: orderSubject, isFallback: false };
  if (key === "loyalty.points_adjusted") return { title: "Solde de points ajusté manuellement", details: [metadata?.previousBalance !== undefined && metadata?.newBalance !== undefined ? change("Solde", metadata.previousBalance, metadata.newBalance, points) : "", metadata?.amount !== undefined ? `Mouvement : ${Number(metadata.amount) > 0 ? "+" : ""}${points(metadata.amount)}` : "", typeof metadata?.reason === "string" ? `Motif : ${metadata.reason}` : ""].filter(Boolean), actor, subject: customerSubject, isFallback: false };
  if (key === "loyalty.reward_redeemed") return { title: `Récompense attribuée${rewardName ? ` — ${rewardName}` : ""}`, details: metadata?.pointsCost !== undefined ? [`Points débités : ${points(metadata.pointsCost)}`] : [], actor, subject: customerSubject, isFallback: false };
  if (key === "loyalty.refund_reversed") return { title: "Points annulés après remboursement", details: [metadata?.refundAmount !== undefined ? `Montant remboursé : ${money.format(Number(metadata.refundAmount || 0))}` : "", metadata?.pointsToReverse !== undefined ? `Points annulés : ${points(metadata.pointsToReverse)}` : ""].filter(Boolean), actor, subject: orderSubject, isFallback: false };
  if (key === "loyalty.balance_reconciled") return { title: "Solde de fidélité recalculé depuis le grand livre", details: metadata?.balance !== undefined ? [`Nouveau solde : ${points(metadata.balance)}`] : [], actor, subject: customerSubject, isFallback: false };
  if (key === "loyalty.expiration_processed") return { title: "Expiration des points traitée", details: [metadata?.expiredPoints !== undefined ? `Points expirés : ${points(metadata.expiredPoints)}` : "", metadata?.customerCount !== undefined ? `Clients concernés : ${raw(metadata.customerCount)}` : ""].filter(Boolean), actor, isFallback: false };
  if (key === "loyalty.suspended") return { title: "Programme de fidélité suspendu", details: typeof metadata?.reason === "string" ? [`Motif : ${metadata.reason}`] : [], actor, subject: customerSubject, isFallback: false };
  if (key === "loyalty.reactivated") return { title: "Programme de fidélité réactivé", details: [], actor, subject: customerSubject, isFallback: false };

  console.warn(`Unmapped loyalty audit event: ${event.action}`);
  return { title: "Modification du programme de fidélité", details: [], actor, isFallback: true };
}
