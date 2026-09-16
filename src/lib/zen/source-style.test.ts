import assert from "node:assert/strict";
import test from "node:test";
import {
  igStillHref,
  pickSourceRefs,
  sourceCreditFromHits,
  stillPayloadFromEmbed,
  styleFromHits,
  visionFromHits,
} from "./source-style.ts";
import type { CreativeHit } from "./search.ts";

function hit(source: CreativeHit["source"], title: string): CreativeHit {
  return { id: title, source, title, subtitle: source, kind: "x", score: 10 };
}

test("pickSourceRefs prefers Canva when arriving from Canva", () => {
  const hits = [
    hit("drive", "2025 茶會現場"),
    hit("canva", "茶會 IG 主視覺"),
    hit("instagram", "坐下來"),
  ];
  const picked = pickSourceRefs("from-canva", hits);
  assert.equal(picked.length, 1);
  assert.equal(picked[0]?.source, "canva");
});

test("pickSourceRefs pins the Drive file that was added from search", () => {
  const hits = [
    { id: "remote:drv_plan", source: "drive" as const, title: "浮游禪光企劃", subtitle: "", kind: "x", score: 8, remoteId: "drv_plan" },
    { id: "remote:drv_tea_2025", source: "drive" as const, title: "2025 茶會現場", subtitle: "", kind: "x", score: 9, remoteId: "drv_tea_2025" },
    hit("canva", "招新版型"),
  ];
  const picked = pickSourceRefs("from-drive", hits, { remoteId: "drv_tea_2025" });
  assert.equal(picked[0]?.title, "2025 茶會現場");
  assert.ok(picked.some((row) => row.title === "浮游禪光企劃"));
});

test("sourceCreditFromHits labels Google Drive, not a generic brand kit", () => {
  assert.equal(sourceCreditFromHits([hit("drive", "2025 茶會現場")]), "Google Drive / 2025 茶會現場");
  assert.equal(sourceCreditFromHits([]), "");
});

test("styleFromHits continues DNA and never says copy the old poster", () => {
  const text = styleFromHits([hit("canva", "招新版型")]);
  assert.match(text, /Canva/);
  assert.match(text, /不要/);
  assert.doesNotMatch(text, /整張沿用舊海報檔/);
  assert.doesNotMatch(text, /Assignee/);
});

test("stillPayloadFromEmbed reads SVG markup and data URIs", () => {
  const svg = stillPayloadFromEmbed('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.ok(svg);
  assert.equal(svg.mime, "image/svg+xml");
  assert.ok(svg.imageBase64.length > 8);
  const data = stillPayloadFromEmbed("data:image/jpeg;base64,abcd");
  assert.deepEqual(data, { imageBase64: "abcd", mime: "image/jpeg" });
  assert.equal(stillPayloadFromEmbed(""), null);
});

test("igStillHref prefers the hydrated blob then the seed file", () => {
  assert.equal(igStillHref({ assetId: "asset_tamsui" }, { asset_tamsui: "blob:tea" }, "/seed/tamsui.svg"), "blob:tea");
  assert.equal(igStillHref({ assetId: "asset_tamsui" }, {}, "/seed/tamsui.svg"), "/seed/tamsui.svg");
  assert.equal(igStillHref({ mediaUrl: "https://ig/x.jpg" }, {}), "https://ig/x.jpg");
});

test("from-image can keep a past IG still as the source photo", () => {
  const hits = [
    { id: "ig", source: "instagram" as const, title: "有時候", subtitle: "", kind: "x", score: 10, assetId: "asset_tamsui" },
    { id: "drive", source: "drive" as const, title: "企劃", subtitle: "", kind: "x", score: 8 },
  ];
  const picked = pickSourceRefs("from-image", hits, { assetId: "asset_tamsui" });
  assert.equal(picked[0]?.assetId, "asset_tamsui");
  assert.ok(picked.some((row) => row.source === "instagram"));
});

test("visionFromHits reads Drive/Canva/IG as style DNA, not a copy", () => {
  const vision = visionFromHits([
    hit("drive", "2025 茶會現場"),
    hit("canva", "茶會 IG 主視覺"),
    hit("instagram", "最近是不是很久沒有好好坐下來？"),
  ]);
  assert.ok(vision);
  assert.match(vision.content, /Google Drive「2025 茶會現場」/);
  assert.match(vision.content, /Canva/);
  assert.match(vision.suggestions.join(" "), /品牌 DNA/);
  assert.equal(vision.tooReligious, false);
  assert.doesNotMatch(vision.content, /複製舊海報檔|Assignee/);
});
