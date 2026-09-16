import assert from "node:assert/strict";
import test from "node:test";
import { createSearchParams } from "./create-search.ts";

test("createSearchParams omits empty mode / idea / asset keys", () => {
  assert.deepEqual(createSearchParams({}), {});
  assert.deepEqual(createSearchParams({ mode: "from-image", idea: "", asset: "", campaign: "" }), { mode: "from-image" });
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
});
