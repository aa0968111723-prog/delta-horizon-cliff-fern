import assert from "node:assert/strict";
import test from "node:test";
import type { LastCreateSession } from "./session.ts";
import { readLastSession, sessionStillFresh, writeLastSession } from "./session.ts";

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
