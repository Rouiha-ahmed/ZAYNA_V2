"use server";

import { PaymentMethod } from "@/lib/promo";
import { createManualOrderRecord } from "@/lib/services/orders";
import { Address } from "@/types";
import { CartItem } from "@/store";
import { auth, currentUser } from "@clerk/nextjs/server";

type GroupedCartItems = {
  product: CartItem["product"];
  quantity: number;
};

type CreateManualOrderInput = {
  items: GroupedCartItems[];
  address?: Address | null;
  paymentMethod: Exclude<PaymentMethod, "cmi_card">;
  promoCode?: string;
  installmentMonths?: number;
};

export async function createManualOrder(input: CreateManualOrderInput) {
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

  return createManualOrderRecord({
    ...input,
    identity: {
      clerkUserId: userId,
      fullName: user?.fullName || "Customer",
      email: customerEmail,
    },
  });
}

