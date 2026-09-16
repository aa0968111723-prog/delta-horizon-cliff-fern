import assert from "node:assert/strict";
import test from "node:test";
import {
  CALENDAR_DRAG_MIME,
  parseCalendarDrag,
  parseCalendarDragPayload,
  serializeCalendarDrag,
  writeCalendarDrag,
} from "./calendar-dnd.ts";

function fakeTransfer(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    effectAllowed: "none",
    setData(type: string, value: string) {
      store.set(type, value);
    },
    getData(type: string) {
      return store.get(type) ?? "";
    },
  } as unknown as DataTransfer;
}

test("parseCalendarDragPayload reads pack, content, and wave targets", () => {
  assert.deepEqual(parseCalendarDragPayload(serializeCalendarDrag({ kind: "pack", ids: ["a", "b"] })), {
    kind: "pack",
    ids: ["a", "b"],
  });
  assert.deepEqual(parseCalendarDragPayload(serializeCalendarDrag({ kind: "content", id: "p1" })), {
    kind: "content",
    id: "p1",
  });
  assert.deepEqual(
    parseCalendarDragPayload(serializeCalendarDrag({ kind: "wave", campaignId: "c1", waveId: "w1" })),
    { kind: "wave", campaignId: "c1", waveId: "w1" },
  );
});

test("parseCalendarDragPayload rejects junk", () => {
  assert.equal(parseCalendarDragPayload(""), null);
  assert.equal(parseCalendarDragPayload("{"), null);
  assert.equal(parseCalendarDragPayload(JSON.stringify({ kind: "pack" })), null);
  assert.equal(parseCalendarDragPayload(JSON.stringify({ kind: "content", id: "" })), null);
});

test("writeCalendarDrag fills mime and text/plain so drop can read either", () => {
  const transfer = fakeTransfer();
  writeCalendarDrag(transfer, { kind: "pack", ids: ["origin", "line"] });
  assert.equal(transfer.effectAllowed, "move");
  assert.equal(transfer.getData(CALENDAR_DRAG_MIME), '{"kind":"pack","ids":["origin","line"]}');
  assert.equal(parseCalendarDrag(transfer)?.kind, "pack");
  const plainOnly = fakeTransfer({
    "text/plain": serializeCalendarDrag({ kind: "content", id: "solo" }),
  });
  assert.deepEqual(parseCalendarDrag(plainOnly), { kind: "content", id: "solo" });
});
