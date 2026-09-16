import assert from "node:assert/strict";
import test from "node:test";
import { directionPosterSvg, mockPosterImage, wrapCjk, xmlEscape } from "./poster.ts";

test("directionPosterSvg keeps the student headline and IG 4:5 size", () => {
  const svg = directionPosterSvg({
    headline: "最近是不是很久沒坐好",
    subhead: "下週茶會",
    palette: "墨松、靜水、琥珀點",
    name: "方向 A · 淡水夜",
    width: 1080,
    height: 1350,
  });
  assert.match(svg, /width="1080"/);
  assert.match(svg, /height="1350"/);
  assert.match(svg, /最近是不是很久沒坐好/);
  assert.match(svg, /下週茶會/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.match(svg, /方向 A/);
  assert.doesNotMatch(svg, /temple|monk|incense|寺廟|佛像|香爐/i);
});

test("xmlEscape keeps a hook with quotes and ampersands safe", () => {
  assert.equal(xmlEscape(`休息 & "坐下來"`), "休息 &amp; &quot;坐下來&quot;");
  const svg = directionPosterSvg({
    headline: `大學很自由，但你真的比較快樂嗎？`,
    width: 1080,
    height: 1080,
  });
  assert.match(svg, /大學很自由/);
  assert.doesNotMatch(svg, /<大學/);
});

test("wrapCjk splits a long hook for the lower third", () => {
  assert.deepEqual(wrapCjk("最近是不是連休息都覺得有罪惡感？", 10), [
    "最近是不是連休息都覺",
    "得有罪惡感？",
  ]);
});

test("variation composition drops the headline lower than the default", () => {
  const base = directionPosterSvg({
    headline: "可以自己來",
    width: 1080,
    height: 1350,
  });
  const shifted = directionPosterSvg({
    headline: "可以自己來",
    width: 1080,
    height: 1350,
    variation: "composition",
  });
  const y = (svg: string) => Number(/<text x="108" y="([^"]+)" fill="#1c2422"/.exec(svg)?.[1]);
  assert.ok(y(shifted) > y(base));
});

test("mockPosterImage is a usable SVG data payload", () => {
  const result = mockPosterImage({
    headline: "先坐下來",
    subhead: "茶會",
    name: "方向 C · 龜龜與光",
    width: 1080,
    height: 1920,
    prompt: "Quiet Tamsui night, not temple",
    variation: "mood",
  });
  assert.equal(result.mime, "image/svg+xml");
  const svg = Buffer.from(result.imageBase64, "base64").toString("utf8");
  assert.match(svg, /先坐下來/);
  assert.match(svg, /height="1920"/);
  assert.doesNotMatch(svg, /禪風海報/);
});
