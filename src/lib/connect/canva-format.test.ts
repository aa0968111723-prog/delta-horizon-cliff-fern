import assert from "node:assert/strict";
import test from "node:test";
import {
  canvaBrief,
  canvaNameBase64,
  canvaRemoteFromDesign,
  canvaSize,
  mapAutofillData,
  parseCanvaDisplayName,
} from "./canva-format.ts";

test("canvaSize uses IG custom pixels instead of invalid presets", () => {
  assert.deepEqual(canvaSize("story"), { width: 1080, height: 1920 });
  assert.deepEqual(canvaSize("reels"), { width: 1080, height: 1920 });
  assert.deepEqual(canvaSize("reels-cover"), { width: 1080, height: 1920 });
  assert.deepEqual(canvaSize("feed-portrait"), { width: 1080, height: 1350 });
  assert.deepEqual(canvaSize("threads"), { width: 1080, height: 1080 });
  assert.deepEqual(canvaSize("line"), { width: 1040, height: 1040 });
});

test("canvaBrief keeps zen voice and copy layers", () => {
  const brief = canvaBrief({
    title: "茶會",
    hook: "最近是不是很久沒坐好",
    body: "淡水晚上",
    cta: "來坐一下",
    palette: "霧園 / 靜水",
    composition: "下半問句",
  });
  assert.match(brief, /不要寺廟/);
  assert.match(brief, /下半問句/);
  assert.doesNotMatch(brief, /誠摯邀請/);
});

test("mapAutofillData maps hook body cta and image fields", () => {
  const data = mapAutofillData(
    {
      Headline: { type: "text" },
      Body_Copy: { type: "text" },
      CTA_Button: { type: "text" },
      Hero: { type: "image" },
      ignored_chart: { type: "chart" },
    },
    { title: "茶會", hook: "最近是不是很久沒坐好？", body: "淡水晚上來坐", cta: "來坐一下" },
    "asset_1",
  );
  assert.deepEqual(data.Headline, { type: "text", text: "最近是不是很久沒坐好？" });
  assert.deepEqual(data.Body_Copy, { type: "text", text: "淡水晚上來坐" });
  assert.deepEqual(data.CTA_Button, { type: "text", text: "來坐一下" });
  assert.deepEqual(data.Hero, { type: "image", asset_id: "asset_1" });
  assert.equal("ignored_chart" in data, false);
});

test("canvaNameBase64 stays short enough for Canva headers", () => {
  const encoded = canvaNameBase64("淡江禪學社茶會主視覺");
  assert.equal(Buffer.from(encoded, "base64").toString("utf8"), "淡江禪學社茶會主視覺");
});

test("parseCanvaDisplayName reads team user without tokens", () => {
  assert.equal(parseCanvaDisplayName({ team_user: { display_name: "禪學社" } }), "禪學社");
  assert.equal(parseCanvaDisplayName({}), undefined);
});

test("canvaRemoteFromDesign marks source as Canva, never a copied poster", () => {
  const file = canvaRemoteFromDesign({
    designId: "DAFtea",
    title: "茶會",
    editUrl: "https://www.canva.com/design/DAFtea/edit",
    now: 1,
  });
  assert.equal(file.id, "canva:DAFtea");
  assert.equal(file.provider, "canva");
  assert.equal(file.summary, "Canva / 茶會");
  assert.match(file.summary, /Canva \//);
  assert.doesNotMatch(file.summary, /複製舊作品/);
});
