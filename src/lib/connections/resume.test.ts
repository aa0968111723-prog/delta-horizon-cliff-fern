import assert from "node:assert/strict";
import test from "node:test";
import { oauthPath, parseOAuthNext, takeOAuthResume, writeOAuthResume } from "./resume.ts";

test("oauthPath only returns create, instagram, or connections", () => {
  assert.equal(oauthPath("create"), "/create?tab=campaign");
  assert.equal(oauthPath("instagram"), "/instagram");
  assert.equal(oauthPath("connections"), "/connections");
  assert.equal(oauthPath("https://evil.example"), "/connections");
  assert.equal(oauthPath(""), "/connections");
  assert.equal(parseOAuthNext("create"), "create");
  assert.equal(parseOAuthNext("nope"), "connections");
});

test("takeOAuthResume consumes a matching resume only once", () => {
  writeOAuthResume("canva-push");
  assert.equal(takeOAuthResume("ig-publish"), false);
  assert.equal(takeOAuthResume("canva-push"), true);
  assert.equal(takeOAuthResume("canva-push"), false);
  writeOAuthResume("ig-publish");
  assert.equal(takeOAuthResume("ig-publish"), true);
  assert.equal(takeOAuthResume("ig-publish"), false);
});
