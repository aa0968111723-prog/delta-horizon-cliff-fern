import assert from "node:assert/strict";
import test from "node:test";
import { directionPosterSvg } from "./poster.ts";
import { attachThreadsStill, threadsPosterInput } from "./threads-still.ts";

test("Threads still is 1:1 and keeps the student hook, not the event name", () => {
  const input = threadsPosterInput({
    hook: "可以自己來？",
    campaignName: "茶會",
    subhead: "9/24 19:00 · 淡水校園",
    cta: "來坐一下",
  });
  assert.equal(input.width, 1080);
  assert.equal(input.height, 1080);
  assert.equal(input.headline, "可以自己來？");
  const svg = directionPosterSvg(input);
  assert.match(svg, /可以自己來/);
  assert.match(svg, /width="1080"/);
  assert.match(svg, /height="1080"/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.doesNotMatch(svg, /temple|寺廟|誠摯邀請|負責人|Assignee/);
});

test("Threads still continues a pinned Drive photo", () => {
  const tea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect x="140" y="420" width="220" height="400" fill="#1C2422"/></svg>`;
  const input = threadsPosterInput(
    {
      hook: "可以自己來？",
      campaignName: "茶會",
      subhead: "9/24 19:00 · 淡水校園",
      cta: "來坐一下",
    },
    { photoEmbed: tea, sourceCredit: "Google Drive / 2025 茶會現場" },
  );
  const svg = directionPosterSvg(input);
  assert.match(svg, /data-source-photo="1"/);
  assert.match(svg, /Google Drive \/ 2025 茶會現場/);
});

test("attachThreadsStill only writes onto that campaign's Threads row", () => {
  const next = attachThreadsStill(
    [
      { kind: "carousel", campaignId: "c1", imageAssetId: "hero" },
      { kind: "threads", campaignId: "c1" },
      { kind: "line", campaignId: "c1" },
      { kind: "threads", campaignId: "c2" },
    ],
    "threads_1",
    "c1",
  );
  assert.equal(next[0]?.imageAssetId, "hero");
  assert.equal(next[1]?.imageAssetId, "threads_1");
  assert.equal(next[2]?.imageAssetId, undefined);
  assert.equal(next[3]?.imageAssetId, undefined);
});

test("attachThreadsStill does nothing until a campaign is known", () => {
  const rows = [{ kind: "threads" as const, campaignId: "c1", imageAssetId: "hero" }];
  assert.equal(attachThreadsStill(rows, "threads_1")[0]?.imageAssetId, "hero");
});
