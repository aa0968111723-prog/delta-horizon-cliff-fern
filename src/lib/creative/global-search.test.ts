import assert from "node:assert/strict";
import test from "node:test";
import { searchGlobalCreative } from "./global-search.ts";
import type { ExternalMemoryItem } from "../connections/types.ts";

const canva: ExternalMemoryItem = {
  id: "DAFtea",
  provider: "canva",
  title: "茶會主視覺",
  mimeType: "canva/design",
  isFolder: false,
  modifiedAt: "",
  webUrl: "",
  thumbnailUrl: "",
  parentId: "canva",
  snippet: "夜間茶會",
  syncedAt: 1,
  collection: "茶會",
};

test("global search can filter to Canva without inventing other sources", () => {
  const results = searchGlobalCreative("茶會", {
    assets: [],
    campaigns: [],
    contentItems: [],
    externalItems: [canva],
  }, "canva");
  assert.equal(results.length, 1);
  assert.equal(results[0]?.provider, "Canva");
  assert.equal(
    searchGlobalCreative("茶會", { assets: [], campaigns: [], contentItems: [], externalItems: [canva] }, "instagram").length,
    0,
  );
});
