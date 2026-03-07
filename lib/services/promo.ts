import type { Prisma } from "@prisma/client";

import type { PromoCodeRecord } from "@/lib/promo";
import { prisma } from "@/lib/prisma";

export const findPromoCodeByCode = async (
  code: string
): Promise<PromoCodeRecord | null> => {
  const promo = await prisma.promoCode.findUnique({
    where: {
      code,
    },
  });

  if (!promo) {
    return null;
  }

  return {
    _id: promo.id,
    code: promo.code,
    active: promo.active,
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    minimumOrderAmount: Number(promo.minimumOrderAmount),
    allowedPaymentMethods: promo.allowedPaymentMethods,
    startsAt: promo.startsAt?.toISOString(),
    endsAt: promo.endsAt?.toISOString(),
    usageLimit: promo.usageLimit ?? undefined,
    usedCount: promo.usedCount,
  };
};

export const incrementPromoUsage = async (
  tx: Prisma.TransactionClient,
  promoId: string
) => {
  await tx.promoCode.update({
    where: {
      id: promoId,
    },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
};
