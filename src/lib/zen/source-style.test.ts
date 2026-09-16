import assert from "node:assert/strict";
import test from "node:test";
import { pickSourceRefs, styleFromHits, visionFromHits } from "./source-style.ts";
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

test("styleFromHits continues DNA and never says copy the old poster", () => {
  const text = styleFromHits([hit("canva", "招新版型")]);
  assert.match(text, /Canva/);
  assert.match(text, /不要/);
  assert.doesNotMatch(text, /整張沿用舊海報檔/);
  assert.doesNotMatch(text, /Assignee/);
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
