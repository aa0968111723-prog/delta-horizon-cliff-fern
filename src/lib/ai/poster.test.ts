import assert from "node:assert/strict";
import test from "node:test";
import { atmospherePosterSvg, directionLookOf, directionLookSvg, directionPosterSvg, encodeUtf8Base64, licenseFromLook, mockPosterImage, reelsAtmosphereInput, sourcePhotoMarkup, withSourceLook, wrapCjk, xmlEscape } from "./poster.ts";

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

test("wrapCjk keeps a short student hook on one line", () => {
  assert.deepEqual(wrapCjk("最近是不是很久沒坐好", 12), ["最近是不是很久沒坐好"]);
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

test("atmosphere poster keeps turtle and light, and does not burn the student headline", () => {
  const svg = directionPosterSvg({
    headline: "可以自己來？",
    subhead: "浮游禪光",
    name: "方向 A · 淡水夜",
    palette: "靜水、琥珀點",
    width: 1080,
    height: 1920,
    atmosphere: true,
    variation: "mood",
  });
  assert.match(svg, /width="1080"/);
  assert.match(svg, /height="1920"/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.match(svg, /氣氛畫面/);
  assert.doesNotMatch(svg, /<text[\s>]/);
  assert.doesNotMatch(svg, /可以自己來/);
  assert.doesNotMatch(svg, /浮游禪光/);
  assert.doesNotMatch(svg, /方向 A/);
  assert.doesNotMatch(svg, /淡江禪學社/);
  const still = atmospherePosterSvg({
    headline: "最近是不是很久沒有好好坐下來？",
    width: 1080,
    height: 1920,
  });
  assert.doesNotMatch(still, /<text[\s>]/);
  assert.equal(reelsAtmosphereInput().atmosphere, true);
  assert.equal(reelsAtmosphereInput().width, 1080);
  assert.equal(reelsAtmosphereInput().height, 1920);
});

test("encodeUtf8Base64 round-trips a student hook without Node-only callers", () => {
  const svg = directionPosterSvg({
    headline: "最近是不是連休息都覺得有罪惡感？",
    width: 1080,
    height: 1350,
  });
  const encoded = encodeUtf8Base64(svg);
  assert.equal(Buffer.from(encoded, "base64").toString("utf8"), svg);
});

test("Drive tea photo is nested into 主視覺 and credited, not copied as a temple poster", () => {
  const tea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect x="140" y="420" width="220" height="400" fill="#1C2422"/></svg>`;
  const svg = directionPosterSvg({
    headline: "可以自己來？",
    width: 1080,
    height: 1350,
    photoEmbed: tea,
    sourceCredit: "Google Drive / 2025 茶會現場",
  });
  assert.match(svg, /data-source-photo="1"/);
  assert.match(svg, /x="140"/);
  assert.match(svg, /Google Drive \/ 2025 茶會現場/);
  assert.match(svg, /可以自己來/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.doesNotMatch(svg, /寺廟|佛像|誠摯邀請/);
  const layer = sourcePhotoMarkup(tea, 1080, 1350, "composition");
  assert.match(layer, /data-source-photo="1"/);
  assert.notEqual(layer, sourcePhotoMarkup(tea, 1080, 1350));
});

test("A/B/C direction looks keep the same Drive photo but shift composition", () => {
  const tea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect x="140" y="420" width="220" height="400" fill="#1C2422"/></svg>`;
  const look = { photoEmbed: tea, sourceCredit: "Google Drive / 2025 茶會現場" };
  const dir = { headline: "可以自己來？", subhead: "下週茶會", palette: "靜水、琥珀點", name: "方向 A" };
  const a = directionLookSvg(dir, 0, look);
  const b = directionLookSvg(dir, 1, look);
  const c = directionLookSvg(dir, 2, look);
  assert.equal(directionLookOf(0), "composition");
  assert.equal(directionLookOf(1), "mood");
  assert.equal(directionLookOf(2), "background");
  assert.match(a, /data-source-photo="1"/);
  assert.match(b, /data-source-photo="1"/);
  assert.match(c, /data-source-photo="1"/);
  assert.notEqual(a, b);
  assert.notEqual(b, c);
  assert.equal(licenseFromLook(look), "來源：Google Drive / 2025 茶會現場 · AI 延續，不複製");
  assert.equal(licenseFromLook(), "來源：AI Generated");
});

test("Reels atmosphere continues a pinned photo without burning credit text", () => {
  const tea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect x="140" y="420" width="220" height="400" fill="#1C2422"/></svg>`;
  const svg = directionPosterSvg(
    withSourceLook(reelsAtmosphereInput("靜水、琥珀點"), {
      photoEmbed: tea,
      sourceCredit: "Google Drive / 2025 茶會現場",
    }),
  );
  assert.match(svg, /data-source-photo="1"/);
  assert.doesNotMatch(svg, /<text[\s>]/);
  assert.doesNotMatch(svg, /Google Drive/);
});
