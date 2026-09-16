import assert from "node:assert/strict";
import test from "node:test";
import { decryptJson, encryptJson } from "./crypto.ts";

test("encryptJson roundtrip does not store plaintext", async () => {
  const secret = "test-secret-for-oauth-cookies";
  const payload = { accessToken: "tok_live_should_not_leak", accountName: "@tkuzen" };
  const sealed = await encryptJson(payload, secret);
  assert.equal(sealed.includes("tok_live_should_not_leak"), false);
  const back = await decryptJson<typeof payload>(sealed, secret);
  assert.equal(back?.accessToken, payload.accessToken);
  assert.equal(await decryptJson(sealed, "wrong-secret"), null);
});
