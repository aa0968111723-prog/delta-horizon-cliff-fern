import assert from "node:assert/strict";
import test from "node:test";
import { PROVIDER_ORDER, PROVIDERS, isProvider } from "./providers.ts";

test("Drive / Canva / IG use official OAuth authorize + token URLs", () => {
  assert.deepEqual(PROVIDER_ORDER, ["drive", "canva", "instagram"]);
  assert.equal(PROVIDERS.drive.authorizeUrl, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(PROVIDERS.drive.tokenUrl, "https://oauth2.googleapis.com/token");
  assert.ok(PROVIDERS.drive.scopes.some((s) => s.includes("drive.readonly")));
  assert.equal(PROVIDERS.drive.pkce, false);

  assert.equal(PROVIDERS.canva.authorizeUrl, "https://www.canva.com/api/oauth/authorize");
  assert.equal(PROVIDERS.canva.tokenUrl, "https://api.canva.com/rest/v1/oauth/token");
  assert.equal(PROVIDERS.canva.pkce, true);

  assert.equal(PROVIDERS.instagram.authorizeUrl, "https://www.instagram.com/oauth/authorize");
  assert.equal(PROVIDERS.instagram.tokenUrl, "https://api.instagram.com/oauth/access_token");
  assert.ok(PROVIDERS.instagram.scopes.includes("instagram_business_basic"));
});

test("client secrets stay in server env names, never VITE_", () => {
  for (const id of PROVIDER_ORDER) {
    const meta = PROVIDERS[id];
    assert.equal(/^VITE_/.test(meta.env.clientId), false);
    assert.equal(/^VITE_/.test(meta.env.clientSecret), false);
    assert.ok(meta.env.clientId.length > 4);
    assert.ok(meta.env.clientSecret.length > 4);
    assert.equal(isProvider(id), true);
  }
  assert.equal(isProvider("twitter"), false);
});

test("callback path is /api/connections/:provider/callback", () => {
  for (const id of PROVIDER_ORDER) {
    assert.equal(`/api/connections/${id}/callback`, `/api/connections/${id}/callback`);
    assert.equal(`/api/connections/${id}/start`.includes(id), true);
  }
});
