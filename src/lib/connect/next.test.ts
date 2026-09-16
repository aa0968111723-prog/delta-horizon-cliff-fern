import assert from "node:assert/strict";
import test from "node:test";
import { connectReturnPath, persistableImageSrc, sanitizeConnectNext, withConnectNext } from "./next.ts";

test("OAuth next only returns to the create loop", () => {
  assert.equal(sanitizeConnectNext("/create"), "/create");
  assert.equal(sanitizeConnectNext("/ig?item=proj_1"), "/ig?item=proj_1");
  assert.equal(sanitizeConnectNext("/calendar?day=2026-09-16"), "/calendar?day=2026-09-16");
  const withQuery = sanitizeConnectNext("/create?q=tea");
  assert.equal(withQuery, "/create?q=tea");
  assert.equal(sanitizeConnectNext("https://evil.example/create"), "/connect");
  assert.equal(sanitizeConnectNext("//evil.example"), "/connect");
  assert.equal(sanitizeConnectNext("/admin"), "/connect");
  assert.equal(sanitizeConnectNext("/create?ok=canva"), "/create");
});

test("callback lands on create with connected flag", () => {
  assert.equal(connectReturnPath("/create", { ok: "canva" }), "/create?ok=canva");
  assert.equal(connectReturnPath("/create", { notice: "denied" }), "/create?notice=denied");
  assert.equal(connectReturnPath("https://evil.example", { ok: "canva" }), "/connect?ok=canva");
});

test("pack images that are data URLs are not persisted", () => {
  assert.equal(persistableImageSrc("https://cdn.example/zen.png"), "https://cdn.example/zen.png");
  assert.equal(persistableImageSrc("data:image/png;base64,aaa"), null);
});

test("Canva OAuth start keeps a return path into create", () => {
  assert.equal(withConnectNext("/api/connect/canva", "/create"), "/api/connect/canva?next=%2Fcreate");
  assert.equal(withConnectNext("/api/connect/canva", "/connect"), "/api/connect/canva");
  assert.equal(withConnectNext("/api/connect/canva", "https://evil.example"), "/api/connect/canva");
});
