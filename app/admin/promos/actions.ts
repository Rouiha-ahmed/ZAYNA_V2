"use server";

import type { PaymentMethod, PromoDiscountType } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";

import { getAdminDataTag, requireAdmin } from "@/lib/admin";
import {
  normalizePromoCode,
  validatePromoCodeConfiguration,
  type PromoCodeConfiguration,
} from "@/lib/promo";
import { prisma } from "@/lib/prisma";

export type PromoMutationState = {
  success: boolean;
  message: string;
  revision: number;
};

const result = (
  success: boolean,
  message: string,
  revision = 0
): PromoMutationState => ({ success, message, revision });

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const date = (formData: FormData, key: string, endOfDay = false) => {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Une date saisie est invalide.");
  return parsed;
};

const number = (formData: FormData, key: string, fallback = 0) => {
  const value = text(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) throw new Error("Une valeur numérique est invalide.");
  return parsed;
};

const configurationFrom = (formData: FormData): PromoCodeConfiguration => {
  const discountTypeValue = text(formData, "discountType");
  const discountType: PromoDiscountType =
    discountTypeValue === "fixed" ? "fixed" : "percentage";
  const usageLimitValue = text(formData, "usageLimit");
  const usageLimit = usageLimitValue ? Number.parseInt(usageLimitValue, 10) : null;
  const allowed = formData
    .getAll("allowedPaymentMethods")
    .filter(
      (value): value is PaymentMethod =>
        typeof value === "string" &&
        ["cod", "cmi_card", "installments"].includes(value)
    );

  const configuration = {
    title: text(formData, "title"),
    code: normalizePromoCode(text(formData, "code") || text(formData, "title")),
    discountType,
    discountValue: number(formData, "discountValue"),
    minimumOrderAmount: number(formData, "minimumOrderAmount"),
    allowedPaymentMethods: allowed,
    startsAt: date(formData, "startsAt"),
    endsAt: date(formData, "endsAt", true),
    usageLimit,
  } satisfies PromoCodeConfiguration;

  validatePromoCodeConfiguration(configuration);
  return configuration;
};

const refreshPromos = () => {
  revalidateTag(getAdminDataTag(), "max");
  revalidatePath("/admin/promos");
  revalidatePath("/admin", "layout");
};

const assertUniqueCode = async (code: string, excludeId?: string) => {
  const duplicate = await prisma.promoCode.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) throw new Error("Ce code promo existe déjà.");
};

export async function savePromoCodeState(
  previous: PromoMutationState,
  formData: FormData
): Promise<PromoMutationState> {
  const revision = previous.revision + 1;
  try {
    await requireAdmin();
    const id = text(formData, "id");
    const configuration = configurationFrom(formData);
    await assertUniqueCode(configuration.code, id || undefined);
    const active = formData.get("active") === "on";

    if (id) {
      const current = await prisma.promoCode.findUnique({
        where: { id },
        select: { id: true, archivedAt: true, usedCount: true },
      });
      if (!current) throw new Error("Ce code promo n’existe plus.");
      if (current.archivedAt) throw new Error("Désarchivez ce code avant de le modifier.");
      if (
        configuration.usageLimit !== null &&
        configuration.usageLimit < current.usedCount
      ) {
        throw new Error("La limite ne peut pas être inférieure aux utilisations déjà enregistrées.");
      }
      await prisma.promoCode.update({
        where: { id },
        data: { ...configuration, active },
      });
      refreshPromos();
      return result(true, "Code promo mis à jour.", revision);
    }

    await prisma.promoCode.create({
      data: { ...configuration, active },
    });
    refreshPromos();
    return result(true, "Code promo ajouté.", revision);
  } catch (error) {
    return result(
      false,
      error instanceof Error ? error.message : "Impossible d’enregistrer ce code promo.",
      revision
    );
  }
}

export async function setPromoActiveAction(id: string, active: boolean) {
  await requireAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) return result(false, "Code promo introuvable.");
  if (promo.archivedAt) return result(false, "Un code archivé ne peut pas être activé.");
  if (active) {
    validatePromoCodeConfiguration({
      title: promo.title,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      minimumOrderAmount: Number(promo.minimumOrderAmount),
      allowedPaymentMethods: promo.allowedPaymentMethods,
      startsAt: promo.startsAt,
      endsAt: promo.endsAt,
      usageLimit: promo.usageLimit,
    });
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return result(false, "La limite d’utilisation est déjà atteinte.");
    }
  }
  await prisma.promoCode.update({ where: { id }, data: { active } });
  refreshPromos();
  return result(true, active ? "Code promo activé." : "Code promo désactivé.");
}

export async function archivePromoCodeAction(id: string) {
  const identity = await requireAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id }, select: { archivedAt: true } });
  if (!promo) return result(false, "Code promo introuvable.");
  if (promo.archivedAt) return result(false, "Ce code promo est déjà archivé.");
  await prisma.promoCode.update({
    where: { id },
    data: {
      active: false,
      archivedAt: new Date(),
      archivedBy: identity.userId || identity.email || "admin",
    },
  });
  refreshPromos();
  return result(true, "Code promo archivé. Son historique est conservé.");
}

export async function restorePromoCodeAction(id: string) {
  await requireAdmin();
  await prisma.promoCode.update({
    where: { id },
    data: { active: false, archivedAt: null, archivedBy: null },
  });
  refreshPromos();
  return result(true, "Code promo restauré en mode inactif.");
}

const nextDuplicateCode = async (source: string) => {
  const base = `${normalizePromoCode(source).slice(0, 32)}-COPIE`;
  let candidate = base;
  let index = 2;
  while (
    await prisma.promoCode.findFirst({
      where: { code: { equals: candidate, mode: "insensitive" } },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
};

export async function duplicatePromoCodeAction(id: string) {
  await requireAdmin();
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) return result(false, "Code promo introuvable.");
  const code = await nextDuplicateCode(promo.code);
  await prisma.promoCode.create({
    data: {
      title: `${promo.title} (copie)`,
      code,
      active: false,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumOrderAmount: promo.minimumOrderAmount,
      allowedPaymentMethods: promo.allowedPaymentMethods,
      startsAt: promo.startsAt,
      endsAt: promo.endsAt,
      usageLimit: promo.usageLimit,
      usedCount: 0,
    },
  });
  refreshPromos();
  return result(true, `Copie ${code} créée en mode inactif.`);
}
