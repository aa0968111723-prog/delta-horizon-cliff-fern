import assert from "node:assert/strict";
import test from "node:test";
import { canvaStatusFromConfig, instagramStatusFromConfig } from "./provider-status.ts";

test("Canva and Instagram stay unavailable when this environment has no client", () => {
  const canva = canvaStatusFromConfig({ oauthReady: false, connected: false });
  const instagram = instagramStatusFromConfig({ oauthReady: false, connected: false });
  assert.equal(canva.available, false);
  assert.equal(canva.connected, false);
  assert.equal(canva.mode, "none");
  assert.equal(instagram.available, false);
  assert.equal(instagram.capabilities.insights, false);
});

test("Instagram insights stay off until a professional insights grant exists", () => {
  const basic = instagramStatusFromConfig({
    oauthReady: true,
    connected: true,
    scopes: ["instagram_business_basic"],
  });
  assert.equal(basic.capabilities.list, true);
  assert.equal(basic.capabilities.insights, false);

  const granted = instagramStatusFromConfig({
    oauthReady: true,
    connected: true,
    scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
  });
  assert.equal(granted.capabilities.insights, true);
});

test("Canva OAuth never advertises Autofill", () => {
  const status = canvaStatusFromConfig({ oauthReady: true, connected: true, scopes: ["design:meta:read"] });
  assert.equal(status.capabilities.autofill, false);
  assert.equal(status.capabilities.list, true);
});
