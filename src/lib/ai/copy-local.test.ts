import assert from "node:assert/strict";
import test from "node:test";
import { buildLocalCopyDraft } from "./copy-local.ts";
import type { CopyBriefLocal } from "./copy-local.ts";

function brief(partial: Partial<CopyBriefLocal> = {}): CopyBriefLocal {
  return {
    topic: "campus",
    tone: "student",
    eventName: "",
    schedule: "",
    location: "",
    detail: "",
    painPoint: "",
    cta: "來坐一下",
    audienceIds: [],
    signupUrl: "",
    ...partial,
  };
}

test("imageCue becomes the hook instead of a generic pain-point line", () => {
  const cue = "走上坡的時候，你通常在想什麼？";
  const student = buildLocalCopyDraft(brief({ imageCue: cue }), "student");
  const short = buildLocalCopyDraft(brief({ imageCue: cue, tone: "short" }), "short");
  const humor = buildLocalCopyDraft(brief({ imageCue: cue, tone: "humor" }), "humor");
  assert.equal(student.hook, cue);
  assert.equal(short.hook, cue);
  assert.match(humor.hook, /龜龜/);
  assert.doesNotMatch(student.hook, /說真的，最近你有好好休息嗎/);
  assert.match(student.altText ?? "", /走上坡/);
});

test("without imageCue the student hook stays the rest line", () => {
  const draft = buildLocalCopyDraft(brief(), "student");
  assert.match(draft.hook, /好好休息|說真的/);
});
