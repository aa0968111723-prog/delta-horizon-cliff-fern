import assert from "node:assert/strict";
import test from "node:test";
import {
  IMAGINE_IMAGE_MODEL,
  REVISION_PRESETS,
  buildEditPayload,
  buildGeneratePayload,
  imagineResultFromBody,
} from "./imagine-request.ts";

test("edit payload is official Imagine edits shape, not a mocked image", () => {
  const payload = buildEditPayload({
    imageUrl: "data:image/png;base64,abc",
    instruction: "拿掉宗教感",
    ratio: "9:16",
  });
  assert.equal(payload.model, IMAGINE_IMAGE_MODEL);
  assert.equal(payload.image.type, "image_url");
  assert.equal(payload.image.url.startsWith("data:image/"), true);
  assert.equal(payload.response_format, "b64_json");
  assert.match(payload.prompt, /9:16/);
  assert.match(payload.prompt, /no religious/i);
  assert.doesNotMatch(payload.prompt, /mock|placeholder/i);
});

test("generate payload asks for b64 so the studio can store the file", () => {
  const payload = buildGeneratePayload("quiet dorm lamp", "4:5", "paper white, teal accent");
  assert.equal(payload.n, 1);
  assert.equal(payload.response_format, "b64_json");
  assert.match(payload.prompt, /4:5/);
  assert.match(payload.prompt, /Tamsui|Tamkang/i);
  assert.match(payload.prompt, /paper white/);
  assert.match(payload.prompt, /no Buddha/i);
  assert.match(payload.prompt, /no lotus/i);
  assert.doesNotMatch(payload.prompt, /mock|placeholder/i);
});

test("imagineResultFromBody reads b64 and never invents pixels", () => {
  const hit = imagineResultFromBody({ data: [{ b64_json: "QQ==", revised_prompt: "quiet" }] });
  assert.equal(hit?.b64, "QQ==");
  assert.equal(hit?.revisedPrompt, "quiet");
  assert.equal(imagineResultFromBody({ data: [] }), null);
  assert.equal(imagineResultFromBody({}), null);
});

test("revision presets stay in everyday Tamkang language, not temple language", () => {
  const blob = REVISION_PRESETS.map((item) => `${item.label} ${item.instruction}`).join(" ");
  assert.match(blob, /淡江|Tamkang|Tamsui|dorm/i);
  assert.doesNotMatch(blob, /佛像|蓮花|金光/);
});
