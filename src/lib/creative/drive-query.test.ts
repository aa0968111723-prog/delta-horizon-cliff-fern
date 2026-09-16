import assert from "node:assert/strict";
import test from "node:test";
import { canvaSearchQuery, driveFileQuery, driveQueryFromNl } from "./drive-query.ts";

test("spoken tea query extracts 茶會 not the whole sentence", () => {
  const terms = driveQueryFromNl("找以前晚上的茶會照片");
  assert.ok(terms.includes("茶會"));
  assert.ok(terms.includes("夜間"));
  assert.equal(terms.some((term) => term.includes("找以前")), false);
});

test("turtle query extracts 龜", () => {
  assert.ok(driveQueryFromNl("找有龜龜的素材").some((term) => term.includes("龜")));
});

test("drive file query never interpolates quotes", () => {
  const q = driveFileQuery("茶會'; extra", "folder1");
  assert.equal(q.includes(";"), false);
  assert.ok(q.includes("folder1"));
  assert.ok(q.includes("name contains '茶會"));
});

test("canva search uses a short club term", () => {
  assert.equal(canvaSearchQuery("找以前茶會 Canva"), "茶會");
});
