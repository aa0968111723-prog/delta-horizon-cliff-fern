import assert from "node:assert/strict";
import test from "node:test";
import { CONVERT_TARGETS } from "./convert-copy.ts";
import { convertPackOf, missingConvertTargets, packRootId } from "./convert-pack.ts";
import type { ContentKind, Project } from "./types.ts";

function row(
  id: string,
  kind: ContentKind,
  extra: Partial<Pick<Project, "convertedFromId" | "updatedAt">> = {},
): Pick<Project, "id" | "contentKind" | "convertedFromId" | "updatedAt"> {
  return { id, contentKind: kind, convertedFromId: extra.convertedFromId, updatedAt: extra.updatedAt ?? 1 };
}

test("packRootId uses convertedFromId when present", () => {
  assert.equal(packRootId({ id: "a", convertedFromId: "root" }), "root");
  assert.equal(packRootId({ id: "a" }), "a");
});

test("convertPackOf groups origin and converted siblings by kind", () => {
  const origin = row("origin", "ig-post", { updatedAt: 1 });
  const line = row("line", "line", { convertedFromId: "origin", updatedAt: 2 });
  const threads = row("threads", "threads", { convertedFromId: "origin", updatedAt: 3 });
  const pack = convertPackOf([origin, line, threads], "line");
  assert.deepEqual(
    pack.map((item) => item.contentKind),
    ["ig-post", "threads", "line"],
  );
});

test("convertPackOf keeps the newest duplicate kind", () => {
  const origin = row("origin", "ig-post", { updatedAt: 1 });
  const oldLine = row("line-old", "line", { convertedFromId: "origin", updatedAt: 2 });
  const newLine = row("line-new", "line", { convertedFromId: "origin", updatedAt: 9 });
  const pack = convertPackOf([origin, oldLine, newLine], "origin");
  assert.equal(pack.find((item) => item.contentKind === "line")?.id, "line-new");
});

test("missingConvertTargets skips kinds already in the pack", () => {
  const origin = row("origin", "ig-post");
  const line = row("line", "line", { convertedFromId: "origin" });
  const missing = missingConvertTargets(origin, [origin, line]).map((item) => item.id);
  assert.equal(missing.includes("ig-post"), false);
  assert.equal(missing.includes("line"), false);
  assert.deepEqual(
    missing,
    CONVERT_TARGETS.map((item) => item.id).filter((id) => id !== "ig-post" && id !== "line"),
  );
});
