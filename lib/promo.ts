export type PaymentMethod = "cod" | "cmi_card" | "installments";

export type PromoCodeRecord = {
  _id: string;
  code: string;
  active?: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minimumOrderAmount?: number;
  allowedPaymentMethods?: PaymentMethod[];
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  usageLimit?: number;
  usedCount?: number;
  archivedAt?: string | Date | null;
};

export const PROMO_EXPIRING_SOON_DAYS = 7;

export type PromoCodeStatus =
  | "ARCHIVED"
  | "INACTIVE"
  | "SCHEDULED"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "LIMIT_REACHED";

export type PromoCodeConfiguration = {
  title: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  allowedPaymentMethods: PaymentMethod[];
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
};

const dateTimestamp = (value?: string | Date | null) =>
  value ? new Date(value).getTime() : null;

export function normalizePromoCode(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validatePromoCodeConfiguration(
  configuration: PromoCodeConfiguration
) {
  if (!configuration.title.trim()) throw new Error("Le nom de la campagne est obligatoire.");
  if (!configuration.code) throw new Error("Le code promo est obligatoire.");
  if (
    !Number.isFinite(configuration.discountValue) ||
    configuration.discountValue <= 0
  ) {
    throw new Error("La valeur de remise doit être supérieure à zéro.");
  }
  if (
    configuration.discountType === "percentage" &&
    configuration.discountValue > 100
  ) {
    throw new Error("Une remise en pourcentage ne peut pas dépasser 100 %.");
  }
  if (
    !Number.isFinite(configuration.minimumOrderAmount) ||
    configuration.minimumOrderAmount < 0
  ) {
    throw new Error("Le minimum de commande ne peut pas être négatif.");
  }
  if (
    configuration.usageLimit !== null &&
    (!Number.isInteger(configuration.usageLimit) || configuration.usageLimit < 1)
  ) {
    throw new Error("La limite d’utilisation doit être un entier positif.");
  }
  if (!configuration.allowedPaymentMethods.length) {
    throw new Error("Sélectionnez au moins un moyen de paiement.");
  }
  if (
    configuration.startsAt &&
    configuration.endsAt &&
    configuration.endsAt <= configuration.startsAt
  ) {
    throw new Error("La date de fin doit être postérieure à la date de début.");
  }
}

export function getPromoCodeStatus(
  promo: PromoCodeRecord,
  now = new Date(),
  expiringSoonDays = PROMO_EXPIRING_SOON_DAYS
): PromoCodeStatus {
  if (promo.archivedAt) return "ARCHIVED";
  if (!promo.active) return "INACTIVE";

  const timestamp = now.getTime();
  const startsAt = dateTimestamp(promo.startsAt);
  const endsAt = dateTimestamp(promo.endsAt);

  if (startsAt !== null && startsAt > timestamp) return "SCHEDULED";
  if (endsAt !== null && endsAt < timestamp) return "EXPIRED";
  if (
    typeof promo.usageLimit === "number" &&
    (promo.usedCount || 0) >= promo.usageLimit
  ) {
    return "LIMIT_REACHED";
  }
  if (
    endsAt !== null &&
    endsAt <= timestamp + expiringSoonDays * 24 * 60 * 60 * 1000
  ) {
    return "EXPIRING_SOON";
  }
  return "ACTIVE";
}

export type PromoCalculationResult = {
  valid: boolean;
  message?: string;
  discountAmount: number;
  finalTotal: number;
  promoId?: string;
  promoCode?: string;
};

export function calculatePromoDiscount(
  promo: PromoCodeRecord | null,
  subtotal: number,
  paymentMethod: PaymentMethod
): PromoCalculationResult {
  if (!promo) {
    return {
      valid: false,
      message: "Promo code not found.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const status = getPromoCodeStatus(promo);

  if (status === "ARCHIVED") {
    return {
      valid: false,
      message: "Promo code is unavailable.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (status === "INACTIVE") {
    return {
      valid: false,
      message: "Promo code is inactive.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (status === "SCHEDULED") {
    return {
      valid: false,
      message: "Promo code is not active yet.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }
  if (status === "EXPIRED") {
    return {
      valid: false,
      message: "Promo code has expired.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (
    promo.allowedPaymentMethods?.length &&
    !promo.allowedPaymentMethods.includes(paymentMethod)
  ) {
    return {
      valid: false,
      message: "Promo code is not valid for this payment method.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if ((promo.minimumOrderAmount || 0) > subtotal) {
    return {
      valid: false,
      message: `Minimum order amount is ${promo.minimumOrderAmount}.`,
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (status === "LIMIT_REACHED") {
    return {
      valid: false,
      message: "Promo usage limit reached.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const discountValue = promo.discountValue || 0;
  let discountAmount = 0;
  if (promo.discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (promo.discountType === "fixed") {
    discountAmount = discountValue;
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    valid: true,
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
    promoId: promo._id,
    promoCode: promo.code,
  };
}
