import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mockVisionFromLook } from "./vision-look.ts";

function b64(text: string) {
  return Buffer.from(text, "utf8").toString("base64");
}

test("Drive tea-party still is not labelled 太 AI", () => {
  const svg = readFileSync(new URL("../../../public/seed/tamsui.svg", import.meta.url), "utf8");
  const look = mockVisionFromLook({
    imageBase64: b64(svg),
    mime: "image/svg+xml",
    sourceNote: "Google Drive / 2025 茶會現場",
  });
  assert.equal(look.tooAi, false);
  assert.equal(look.tooReligious, false);
  assert.equal(look.fitsTamkang, true);
  assert.match(look.content, /現場|校園/);
  assert.match(look.people, /同學|座位/);
  assert.ok(look.suggestions.some((item) => /Carousel/.test(item)));
});

test("three-orb poster without a source photo can be 太 AI", () => {
  const svg = readFileSync(new URL("../../../public/seed/trilight.svg", import.meta.url), "utf8");
  const look = mockVisionFromLook({ imageBase64: b64(svg), mime: "image/svg+xml" });
  assert.equal(look.tooAi, true);
  assert.equal(look.tooReligious, false);
});

test("nested source photo mark keeps documentary even with orbs", () => {
  const look = mockVisionFromLook({
    imageBase64: b64('<svg><g data-source-photo="1"></g><circle /><circle /><circle /></svg>'),
    mime: "image/svg+xml",
  });
  assert.equal(look.tooAi, false);
  assert.equal(look.fitsTamkang, true);
});

test("tamsui documentary still is not 太 AI even without a Drive caption", () => {
  const svg = readFileSync(new URL("../../../public/seed/tamsui.svg", import.meta.url), "utf8");
  const look = mockVisionFromLook({ imageBase64: b64(svg), mime: "image/svg+xml" });
  assert.equal(look.tooAi, false);
  assert.equal(look.fitsTamkang, true);
});

test("own IG orb poster is still 太 AI even with an Instagram source note", () => {
  const svg = readFileSync(new URL("../../../public/seed/trilight.svg", import.meta.url), "utf8");
  const look = mockVisionFromLook({
    imageBase64: b64(svg),
    mime: "image/svg+xml",
    sourceNote: "Instagram / 2026-09-17",
  });
  assert.equal(look.tooAi, true);
  assert.equal(look.fitsTamkang, true);
});
