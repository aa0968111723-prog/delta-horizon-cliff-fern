import assert from "node:assert/strict";
import test from "node:test";
import { createSearchFromHit, createSearchParams, isStudioHit } from "./create-search.ts";
import type { CreativeHit } from "../zen/search.ts";

test("createSearchParams omits empty mode / idea / asset keys", () => {
  assert.deepEqual(createSearchParams({}), {});
  assert.deepEqual(createSearchParams({ mode: "from-image", idea: "", asset: "", campaign: "", remote: "" }), { mode: "from-image" });
  assert.deepEqual(createSearchParams({ mode: "campaign", idea: "浮游禪光", campaign: "camp_floating_light" }), {
    mode: "campaign",
    idea: "浮游禪光",
    campaign: "camp_floating_light",
  });
  assert.deepEqual(
    createSearchParams({
      mode: "from-image",
      idea: "延續「龜龜」的風格，做新的活動，不要複製舊作品。",
      asset: "asset_turtle",
    }),
    {
      mode: "from-image",
      idea: "延續「龜龜」的風格，做新的活動，不要複製舊作品。",
      asset: "asset_turtle",
    },
  );
  assert.deepEqual(createSearchParams({ mode: "from-drive", idea: "2025 茶會現場", remote: "drv_tea_2025" }), {
    mode: "from-drive",
    idea: "2025 茶會現場",
    remote: "drv_tea_2025",
  });
});

function hit(partial: Partial<CreativeHit> & Pick<CreativeHit, "source" | "title">): CreativeHit {
  return { id: partial.id ?? partial.title, subtitle: "", kind: "x", score: 10, ...partial };
}

test("createSearchFromHit pins the Drive / Canva file, not just the filename", () => {
  assert.deepEqual(
    createSearchFromHit(hit({ source: "drive", title: "2025 茶會現場", remoteId: "drv_tea_2025" })),
    { mode: "from-drive", idea: "茶會", remote: "drv_tea_2025" },
  );
  assert.deepEqual(
    createSearchFromHit(hit({ source: "canva", title: "茶會 IG 主視覺", remoteId: "canva_tea" })),
    { mode: "from-canva", idea: "茶會", remote: "canva_tea" },
  );
  assert.deepEqual(
    createSearchFromHit(hit({ source: "drive", title: "浮游禪光企劃", remoteId: "drv_plan_light" })),
    { mode: "from-drive", idea: "浮游禪光", remote: "drv_plan_light" },
  );
});

test("an IG post with a leftover studio project still opens from-ig on the Hook", () => {
  const ig = hit({
    source: "instagram",
    title: "最近是不是很久沒有好好坐下來？\n9/24 浮游禪光",
    projectId: "proj_floating_light",
    assetId: "asset_zen_mark",
  });
  assert.equal(isStudioHit(ig), false);
  assert.deepEqual(createSearchFromHit(ig), {
    mode: "from-ig",
    idea: "最近是不是很久沒有好好坐下來？",
    asset: "asset_zen_mark",
  });
});

test("only a local canvas without a remote/asset is a studio hit", () => {
  assert.equal(isStudioHit(hit({ source: "local", title: "茶會 · Carousel", projectId: "proj_tea" })), true);
  assert.equal(isStudioHit(hit({ source: "drive", title: "2025 茶會現場", projectId: "proj_tea", remoteId: "drv" })), false);
});
