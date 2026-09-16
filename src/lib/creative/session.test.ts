import assert from "node:assert/strict";
import test from "node:test";
import type { LastCreateSession } from "./session.ts";
import { readLastSession, sessionStillFresh, writeLastSession, heroAssetIdsFromSession } from "./session.ts";

test("a saved pack is still there after a same-tab OAuth roundtrip", () => {
  const session = {
    pack: { query: "下週有一場茶會" },
    savedAt: Date.now() - 3 * 60 * 1000,
  } as unknown as LastCreateSession;
  assert.equal(sessionStillFresh(session), true);
  assert.equal(sessionStillFresh({ ...session, savedAt: Date.now() - 25 * 60 * 60 * 1000 }), false);
  assert.equal(sessionStillFresh(null), false);
});

test("session storage roundtrip keeps the pack", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  const session = {
    pack: { query: "下週有一場茶會" },
    dirId: "a",
    copies: [],
    tone: "student",
    imageSrc: null,
    aspect: "4:5",
    canvaStep: "need-connect",
    savedAt: Date.now(),
  } as unknown as LastCreateSession;
  writeLastSession(session);
  const read = readLastSession();
  assert.equal(read?.pack.query, "下週有一場茶會");
  assert.equal(read?.canvaStep, "need-connect");
});

test("session keeps the Canva design id for the round trip", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  writeLastSession({
    pack: { query: "茶會" },
    dirId: "a",
    copies: [],
    tone: "student",
    imageSrc: null,
    aspect: "4:5",
    canvaStep: "opened",
    canvaEditUrl: "https://www.canva.com/design/DAFVztcvd9z/edit",
    canvaDesignId: "DAFVztcvd9z",
    savedAt: Date.now(),
  } as unknown as LastCreateSession);
  const read = readLastSession();
  assert.equal(read?.canvaDesignId, "DAFVztcvd9z");
  assert.equal(read?.canvaStep, "opened");
});

test("session keeps the Canva return asset for IG Preview", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  writeLastSession({
    pack: { query: "茶會" },
    dirId: "a",
    copies: [],
    tone: "student",
    imageSrc: null,
    aspect: "4:5",
    canvaStep: "returned",
    canvaReturnAssetId: "asset_canva_1",
    savedAt: Date.now(),
  } as unknown as LastCreateSession);
  const read = readLastSession();
  assert.equal(read?.canvaReturnAssetId, "asset_canva_1");
  assert.equal(read?.canvaStep, "returned");
});

test("image-only posters remember they are not a full pack yet", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  writeLastSession({
    pack: { query: "我要宣傳茶會", plan: { hook: "帶一個朋友就好" } },
    posterOnly: true,
    dirId: "dir_b",
    copies: [],
    tone: "student",
    imageSrc: "https://cdn.example.com/poster.png",
    aspect: "4:5",
    savedAt: Date.now(),
  } as unknown as LastCreateSession);
  const read = readLastSession();
  assert.equal(read?.posterOnly, true);
  assert.equal(read?.dirId, "dir_b");
  assert.equal(read?.imageSrc, "https://cdn.example.com/poster.png");
});

test("session remembers IndexedDB asset ids when the hero is a local blob", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  writeLastSession({
    pack: { query: "我要宣傳茶會" },
    posterOnly: true,
    dirId: "dir_b",
    copies: [],
    tone: "student",
    imageSrc: null,
    aspect: "4:5",
    feedAssetId: "asset_feed_1",
    storyAssetId: "asset_story_1",
    savedAt: Date.now(),
  } as unknown as LastCreateSession);
  const read = readLastSession();
  assert.equal(read?.feedAssetId, "asset_feed_1");
  assert.equal(read?.storyAssetId, "asset_story_1");
  assert.deepEqual(heroAssetIdsFromSession(read!), {
    feed: "asset_feed_1",
    story: "asset_story_1",
  });
});

test("Canva return asset can stand in for the feed hero", () => {
  assert.deepEqual(
    heroAssetIdsFromSession({ canvaReturnAssetId: "asset_canva_1" }),
    { feed: "asset_canva_1", story: null },
  );
});

test("session keeps the 9:16 cover next to the feed hero", () => {
  const memory = new Map<string, string>();
  const fake = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  (globalThis as { sessionStorage?: typeof fake }).sessionStorage = fake;
  writeLastSession({
    pack: { query: "茶會" },
    dirId: "a",
    copies: [],
    tone: "student",
    imageSrc: "https://cdn.example.com/feed.png",
    reelsCoverSrc: "https://cdn.example.com/story.png",
    aspect: "4:5",
    savedAt: Date.now(),
  } as unknown as LastCreateSession);
  const read = readLastSession();
  assert.equal(read?.imageSrc, "https://cdn.example.com/feed.png");
  assert.equal(read?.reelsCoverSrc, "https://cdn.example.com/story.png");
});
