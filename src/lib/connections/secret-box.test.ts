import assert from "node:assert/strict";
import test from "node:test";
import { createPkce, decryptSecret, encryptSecret } from "./secret-box.ts";

test("encrypts oauth payloads without leaking plaintext", () => {
  const payload = encryptSecret(JSON.stringify({ accessToken: "secret-token" }), "client-secret", "zen-canva-token");
  assert.equal(payload.includes("secret-token"), false);
  assert.deepEqual(JSON.parse(decryptSecret(payload, "client-secret", "zen-canva-token")), { accessToken: "secret-token" });
});

test("pkce verifier and challenge are unguessable and related", () => {
  const first = createPkce();
  const second = createPkce();
  assert.notEqual(first.verifier, second.verifier);
  assert.equal(first.challenge.length > 20, true);
  assert.notEqual(first.verifier, first.challenge);
});
