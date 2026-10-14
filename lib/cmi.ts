import { createHmac } from "crypto";

import { safeEqual } from "@/lib/security";

export const CMI_GATEWAY_URL = "https://payment.cmi.co.ma/fim/est3Dgate";

/**
 * Compute CMI HMAC-SHA512 hash.
 * All parameter names sorted alphabetically, values joined with "|", signed with store key.
 */
export function computeCMIHash(
  params: Record<string, string>,
  storeKey: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const hashStr = sortedKeys.map((k) => params[k]).join("|");
  return createHmac("sha512", storeKey).update(hashStr).digest("base64");
}

/**
 * Verify a callback from CMI by recomputing the hash over the received params
 * (excluding the HASH field itself) and comparing.
 */
export function verifyCMICallback(
  rawParams: Record<string, string>,
  storeKey: string
): boolean {
  const { HASH, hash, ...rest } = rawParams;
  const received = HASH || hash;
  if (!received) return false;
  const expected = computeCMIHash(rest, storeKey);
  return safeEqual(received, expected);
}

/**
 * Build the form parameters for a CMI payment request.
 * Returns all fields including the computed hash — ready to POST to CMI_GATEWAY_URL.
 */
export function buildCMIFormParams(
  orderNumber: string,
  amountMAD: number,
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    phone: string;
  },
  baseUrl: string
): Record<string, string> {
  const clientId = process.env.CMI_CLIENT_ID;
  const storeKey = process.env.CMI_STORE_KEY;

  if (!clientId || !storeKey) {
    throw new Error(
      "CMI_CLIENT_ID and CMI_STORE_KEY must be set in environment variables"
    );
  }

  const rnd = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const params: Record<string, string> = {
    clientid:         clientId,
    storetype:        "3D_PAY_HOSTING",
    amount:           amountMAD.toFixed(2),
    currency:         "504", // ISO 4217 numeric for MAD
    okUrl:            `${baseUrl}/api/cmi/ok`,
    failUrl:          `${baseUrl}/api/cmi/fail`,
    shopUrl:          `${baseUrl}/api/cmi/callback`,
    oid:              orderNumber,
    lang:             "fr",
    BillToName:       customer.name    || "Client",
    BillToEmail:      customer.email,
    BillToStreet1:    customer.address || "N/A",
    BillToCity:       customer.city    || "N/A",
    BillToCountry:    "MA",
    BillToPostalCode: customer.zip     || "00000",
    BillToTelephone:  customer.phone   || "N/A",
    trantype:         "Auth",
    rnd,
    encoding:         "UTF-8",
  };

  params.hash = computeCMIHash(params, storeKey);
  return params;
}
