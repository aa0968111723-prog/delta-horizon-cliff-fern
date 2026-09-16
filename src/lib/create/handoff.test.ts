import assert from "node:assert/strict";
import test from "node:test";
import { parseHandoff } from "./handoff.ts";

test("parseHandoff keeps a plain idea string", () => {
  const parsed = parseHandoff(null, "下週有一場茶會");
  assert.equal(parsed?.idea, "下週有一場茶會");
});

test("parseHandoff prefers JSON payload and still accepts zen-idea", () => {
  const parsed = parseHandoff(
    JSON.stringify({ idea: "延續茶會海報", tab: "image", visionAction: "similar", convertKind: "carousel" }),
    "ignored fallback",
  );
  assert.equal(parsed?.idea, "延續茶會海報");
  assert.equal(parsed?.tab, "image");
  assert.equal(parsed?.visionAction, "similar");
  assert.equal(parsed?.convertKind, "carousel");
});

test("parseHandoff returns null when empty", () => {
  assert.equal(parseHandoff(null, null), null);
});

test("parseHandoff keeps autoRun so homepage can start IdeaFlow", () => {
  const parsed = parseHandoff(JSON.stringify({ idea: "浮游禪光", tab: "campaign", autoRun: true }), null);
  assert.equal(parsed?.autoRun, true);
  assert.equal(parsed?.tab, "campaign");
});
