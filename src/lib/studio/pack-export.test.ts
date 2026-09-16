import assert from "node:assert/strict";
import test from "node:test";
import { kindHasDownloadablePages, packTextOnlyMembers, packVisualMembers } from "./convert-pack.ts";
import { packCaptionsFilename } from "./export-name.ts";
import {
  packCaptionsText,
  packDownloadableMembers,
  packSkippedKinds,
  type PackMember,
} from "./pack-export.ts";
import type { ContentKind, CopyDeck, ReelsScript } from "./types.ts";

const copy: CopyDeck = {
  eyebrow: "09/24",
  headline: "很久沒有\n好好坐下來了吧",
  subhead: "9/24（三）19:00 · 商管 B302",
  body: "不用準備什麼",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption: "最近是不是連休息都覺得有罪惡感？\n\n9/24 晚上七點，商管 B302。",
  hashtags: ["#淡江大學", "#淡江禪學社", "#靜心"],
  altText: "宿舍窗邊一盞夜燈",
};

const reels: ReelsScript = {
  hook: "最近是不是連休息都覺得有罪惡感？",
  cover: "宿舍窗邊一盞燈",
  beats: [
    {
      range: "0–3 秒",
      visual: "窗邊夜燈",
      caption: "停一下",
      voice: "（無旁白）",
      transition: "變慢",
      asset: "窗邊照片",
    },
  ],
  createdAt: 1,
  source: "mock",
};

function member(kind: ContentKind, extra: Partial<PackMember> = {}): PackMember {
  const formatId =
    extra.activeFormatId ??
    (kind === "threads" ? "feed-square" : kind === "line" ? "feed-landscape" : kind === "reels" ? "reels-cover" : "feed-portrait");
  const board = extra.artboards
    ? extra.artboards
    : kind === "threads"
      ? {}
      : { [formatId]: { id: `${kind}-board`, formatId } };
  return {
    id: kind,
    name: extra.name ?? "浮游禪光",
    contentKind: kind,
    copy,
    reels: extra.reels,
    artboards: extra.artboards ?? board,
    slides: extra.slides,
    activeFormatId: formatId,
  } as PackMember;
}

test("kindHasDownloadablePages skips Threads", () => {
  assert.equal(kindHasDownloadablePages("threads"), false);
  assert.equal(kindHasDownloadablePages("ig-post"), true);
  assert.equal(kindHasDownloadablePages("line"), true);
  assert.equal(kindHasDownloadablePages("reels"), true);
});

test("packVisualMembers skips Threads and keeps LINE", () => {
  const pack = [member("ig-post"), member("threads"), member("line")];
  assert.deepEqual(
    packVisualMembers(pack).map((item) => item.contentKind),
    ["ig-post", "line"],
  );
  assert.deepEqual(
    packTextOnlyMembers(pack).map((item) => item.contentKind),
    ["threads"],
  );
});

test("packDownloadableMembers skips empty artboards even for visual kinds", () => {
  const emptyCarousel = member("carousel", { artboards: {}, activeFormatId: "feed-portrait" });
  const line = member("line");
  const pack = [emptyCarousel, line, member("threads")];
  assert.deepEqual(
    packDownloadableMembers(pack).map((item) => item.contentKind),
    ["line"],
  );
  assert.deepEqual(packSkippedKinds(pack), ["carousel", "threads"]);
});

test("packCaptionsText includes each format, alt, and Reels script", () => {
  const text = packCaptionsText([
    member("ig-post"),
    member("threads"),
    member("line"),
    member("reels", { reels }),
  ]);
  assert.match(text, /## IG 貼文/);
  assert.match(text, /## Threads/);
  assert.match(text, /## LINE 宣傳圖/);
  assert.match(text, /## Reels/);
  assert.match(text, /休息都覺得有罪惡感/);
  assert.match(text, /Alt：宿舍窗邊一盞夜燈/);
  assert.match(text, /Hook：最近是不是連休息都覺得有罪惡感？/);
  assert.match(text, /拍攝清單/);
  assert.match(text, /來坐一下/);
});

test("packCaptionsFilename keeps the project name", () => {
  assert.equal(packCaptionsFilename("浮游禪光/主視覺"), "浮游禪光主視覺-全套文案.txt");
});
