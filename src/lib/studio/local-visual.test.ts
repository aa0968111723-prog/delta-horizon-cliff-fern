import assert from "node:assert/strict";
import test from "node:test";
import { matchLocalVisualAsset, nextLocalVisualAsset } from "./local-visual.ts";
import type { AssetMeta } from "./types.ts";

const SEED_DUSK_ID = "asset_tamsui_dusk";
const SEED_NIGHT_ID = "asset_night_lamp";
const SEED_WINDOW_ID = "asset_window_light";

function asset(
  partial: Pick<AssetMeta, "id" | "name" | "kind" | "category" | "tags">,
): AssetMeta {
  return {
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    createdAt: 0,
    updatedAt: 0,
    source: "seed",
    licenseNotes: "",
    licenseOwner: "禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
    ...partial,
  };
}

const SEED_ASSETS: AssetMeta[] = [
  asset({ id: "asset_zen_mark", name: "三色光標誌", kind: "logo", category: "logo", tags: ["logo"] }),
  asset({ id: "asset_gugu", name: "龜龜", kind: "logo", category: "mascot", tags: ["龜龜"] }),
  asset({ id: SEED_DUSK_ID, name: "淡水河傍晚", kind: "image", category: "campus", tags: ["淡水", "夕陽"] }),
  asset({ id: SEED_WINDOW_ID, name: "窗邊光與坐墊", kind: "image", category: "photo", tags: ["坐墊", "窗邊"] }),
  asset({ id: SEED_NIGHT_ID, name: "宿舍夜燈", kind: "image", category: "photo", tags: ["夜", "宿舍"] }),
];

test("local directions map onto the matching seed photos", () => {
  assert.equal(matchLocalVisualAsset({ title: "夜晚的安靜" }, SEED_ASSETS)?.id, SEED_NIGHT_ID);
  assert.equal(matchLocalVisualAsset({ title: "窗邊的白天" }, SEED_ASSETS)?.id, SEED_WINDOW_ID);
  assert.equal(matchLocalVisualAsset({ title: "淡水的光" }, SEED_ASSETS)?.id, SEED_DUSK_ID);
});

test("prompt keywords still pick campus photos, never the logo", () => {
  const night = matchLocalVisualAsset({ imagePrompt: "dim dorm desk at night" }, SEED_ASSETS);
  assert.equal(night?.id, SEED_NIGHT_ID);
  const dusk = matchLocalVisualAsset({ imagePrompt: "Tamsui riverside at dusk" }, SEED_ASSETS);
  assert.equal(dusk?.id, SEED_DUSK_ID);
  const windowLight = matchLocalVisualAsset(
    { imagePrompt: "sunlit classroom with cushions and window blinds" },
    SEED_ASSETS,
  );
  assert.equal(windowLight?.id, SEED_WINDOW_ID);
  assert.notEqual(matchLocalVisualAsset({ title: "隨便" }, SEED_ASSETS)?.kind, "logo");
});

test("換一張 walks the photo list and skips stamps", () => {
  const first = matchLocalVisualAsset({ title: "夜晚的安靜" }, SEED_ASSETS);
  const second = nextLocalVisualAsset({ title: "夜晚的安靜" }, SEED_ASSETS, first?.id ?? null);
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(second?.id, first?.id);
  assert.notEqual(second?.kind, "logo");
});
