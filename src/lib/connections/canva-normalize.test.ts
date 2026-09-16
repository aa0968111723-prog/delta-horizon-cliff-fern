import assert from "node:assert/strict";
import test from "node:test";
import { inferCanvaCollection, normalizeCanvaDesigns } from "./canva-normalize.ts";
import { buildCanvaPasteBrief } from "./canva-brief.ts";

test("normalizes Canva Connect designs and drops credential-shaped fields", () => {
  const designs = normalizeCanvaDesigns({
    items: [
      {
        id: "DAFtea",
        title: "2025 夜間茶會",
        urls: { edit_url: "https://www.canva.com/design/DAFtea/edit" },
        thumbnail: { url: "https://example.com/thumb.jpg" },
        updated_at: 1692928800,
        page_count: 6,
      },
    ],
    access_token: "must-not-survive",
  });
  assert.equal(designs.length, 1);
  assert.equal(designs[0]?.provider, "canva");
  assert.equal(designs[0]?.collection, "茶會");
  assert.equal(designs[0]?.webUrl.includes("canva.com"), true);
  assert.equal(JSON.stringify(designs).includes("must-not-survive"), false);
});

test("drops credential-shaped Canva rows instead of indexing them", () => {
  const designs = normalizeCanvaDesigns({
    items: [
      { id: "token-row", title: "secret", access_token: "must-not-survive" },
      { id: "DAFok", title: "浮游禪光主視覺" },
    ],
  });
  assert.equal(designs.length, 1);
  assert.equal(designs[0]?.id, "DAFok");
  assert.equal(JSON.stringify(designs).includes("must-not-survive"), false);
});

test("labels 浮游禪光 designs with Canva provenance collection", () => {
  assert.equal(inferCanvaCollection("09/24 浮游禪光主視覺"), "浮游禪光");
  const designs = normalizeCanvaDesigns({
    items: [{ id: "DAFzen", title: "浮游禪光 Carousel" }],
  });
  assert.equal(designs[0]?.collection, "浮游禪光");
});

test("Canva paste brief never claims Enterprise autofill", () => {
  const brief = buildCanvaPasteBrief({
    campaignName: "浮游禪光",
    hook: "最近是不是很久沒有好好坐下來？",
    schedule: "09/24 19:00",
    location: "淡江大學",
  });
  assert.match(brief, /Canva Enterprise/);
  assert.match(brief, /浮游禪光/);
  assert.doesNotMatch(brief, /已自動套用|autofill 已完成/i);
});
