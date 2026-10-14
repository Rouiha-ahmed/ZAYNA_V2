import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { computeCMIHash, verifyCMICallback } from "../lib/cmi";

const storeKey = "test-store-key-that-is-not-a-production-secret";
const params = {
  amount: "299.00",
  clientid: "123456",
  oid: "ZAYNA-1001",
  ProcReturnCode: "00",
};

test("CMI hashing keeps the documented alphabetical parameter order", () => {
  const expected = createHmac("sha512", storeKey)
    .update("00|299.00|123456|ZAYNA-1001")
    .digest("base64");

  assert.equal(computeCMIHash(params, storeKey), expected);
});

test("CMI callback verification accepts valid hashes and rejects tampering", () => {
  const HASH = computeCMIHash(params, storeKey);

  assert.equal(verifyCMICallback({ ...params, HASH }, storeKey), true);
  assert.equal(
    verifyCMICallback({ ...params, amount: "1.00", HASH }, storeKey),
    false,
  );
  assert.equal(verifyCMICallback({ ...params, HASH: "short" }, storeKey), false);
  assert.equal(verifyCMICallback(params, storeKey), false);
});

test("CMI callback verification supports the lowercase hash field", () => {
  const hash = computeCMIHash(params, storeKey);
  assert.equal(verifyCMICallback({ ...params, hash }, storeKey), true);
});
