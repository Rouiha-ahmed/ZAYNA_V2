"use server";

import { getStripe } from "@/lib/stripe";
import {
  calculatePromoDiscount,
  PaymentMethod,
  PromoCalculationResult,
} from "@/lib/promo";
import { toAbsoluteUrl } from "@/lib/image";
import { prisma } from "@/lib/prisma";
import { findPromoCodeByCode } from "@/lib/services/promo";
import { Address } from "@/types";
import { CartItem } from "@/store";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

export interface Metadata {
  orderNumber: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  installmentMonths?: number;
  customerName?: string;
  customerEmail?: string;
  clerkUserId?: string;
  address?: Address | null;
}

export interface GroupedCartItems {
  product: CartItem["product"];
  quantity: number;
}

export async function createCheckoutSession(
  items: GroupedCartItems[],
  metadata: Metadata
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await currentUser();
    const customerEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses[0]?.emailAddress;
    if (!customerEmail) {
      throw new Error("Customer email is not available");
    }

    const customerName = user?.fullName || metadata.customerName || "Customer";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }

    const stripe = getStripe();
    const paymentMethod = metadata.paymentMethod || "cmi_card";
    const promoCode = metadata.promoCode?.trim().toUpperCase();
    const quantityByProductId = new Map<string, number>();

    for (const item of items) {
      const productId = item.product?._id;
      if (!productId) {
        throw new Error("Invalid product in cart");
      }

      quantityByProductId.set(
        productId,
        (quantityByProductId.get(productId) || 0) + Math.max(1, item.quantity || 0)
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: [...quantityByProductId.keys()],
        },
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
    const productById = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = [...quantityByProductId.entries()].map(
      ([productId, quantity]) => {
        const product = productById.get(productId);
        if (!product) {
          throw new Error("One or more products are unavailable");
        }
        if (product.stock < quantity) {
          throw new Error(
            `Stock insuffisant pour "${product.name}". Disponible: ${product.stock}, demande: ${quantity}.`
          );
        }

        return {
          product,
          quantity,
        };
      }
    );

    // Retrieve existing customer or create a new one
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });
    const customerId = customers?.data?.[0]?.id || "";
    const subtotal = normalizedItems.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0
    );

    let promoCalculation: PromoCalculationResult = {
      valid: false,
      discountAmount: 0,
      finalTotal: subtotal,
    };

    if (promoCode) {
      const promo = await findPromoCodeByCode(promoCode);
      promoCalculation = calculatePromoDiscount(promo, subtotal, paymentMethod);
      if (!promoCalculation.valid) {
        throw new Error(promoCalculation.message || "Invalid promo code");
      }
    }

    const subtotalCents = Math.round(subtotal * 100);
    const discountCents = Math.round(promoCalculation.discountAmount * 100);
    const targetTotalCents = Math.max(0, subtotalCents - discountCents);

    const rawItems = normalizedItems.map(({ product, quantity }) => ({
      product,
      quantity,
      baseUnitCents: Math.round(Number(product.price) * 100),
    }));
    const rawTotalCents = rawItems.reduce(
      (sum, entry) => sum + entry.baseUnitCents * entry.quantity,
      0
    );

    const adjustedItems = rawItems.map((entry, index) => {
      const itemTotal = entry.baseUnitCents * entry.quantity;
      const proportionalTotal =
        rawTotalCents > 0
          ? Math.floor((targetTotalCents * itemTotal) / rawTotalCents)
          : 0;
      const unit = Math.max(1, Math.floor(proportionalTotal / entry.quantity));
      return {
        ...entry,
        adjustedUnitCents: unit,
        index,
      };
    });

    let adjustedTotal = adjustedItems.reduce(
      (sum, entry) => sum + entry.adjustedUnitCents * entry.quantity,
      0
    );
    let remainder = targetTotalCents - adjustedTotal;
    for (let i = 0; i < adjustedItems.length && remainder > 0; i++) {
      adjustedItems[i].adjustedUnitCents += 1;
      remainder -= adjustedItems[i].quantity;
      adjustedTotal = adjustedItems.reduce(
        (sum, entry) => sum + entry.adjustedUnitCents * entry.quantity,
        0
      );
      remainder = targetTotalCents - adjustedTotal;
    }

    const sessionPayload: Stripe.Checkout.SessionCreateParams = {
      metadata: {
        orderNumber: metadata.orderNumber,
        customerName,
        customerEmail,
        clerkUserId: userId,
        paymentMethod,
        promoCode: promoCode || "",
        promoDiscount: String(promoCalculation.discountAmount || 0),
        installmentMonths: String(metadata.installmentMonths || 0),
        address: JSON.stringify(metadata.address),
      },
      mode: "payment",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      invoice_creation: {
        enabled: true,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&orderNumber=${metadata.orderNumber}`,
      cancel_url: `${baseUrl}/cart`,
      line_items: adjustedItems.map(({ product, adjustedUnitCents, quantity }) => ({
        price_data: {
          currency: "mad",
          unit_amount: adjustedUnitCents,
          product_data: {
            name: product.name || "Unknown Product",
            description: product.description || undefined,
            metadata: { id: product.id },
            images:
              product.images.length > 0
                ? [toAbsoluteUrl(baseUrl, product.images[0].url)]
                : undefined,
          },
        },
        quantity,
      })),
    };
    if (customerId) {
      sessionPayload.customer = customerId;
    } else {
      sessionPayload.customer_email = customerEmail;
      sessionPayload.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);
    return session.url;
  } catch (error) {
    console.error("Error creating Checkout Session", error);
    throw error;
  }
}

