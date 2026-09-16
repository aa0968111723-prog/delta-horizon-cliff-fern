import assert from "node:assert/strict";
import test from "node:test";
import { canvaExportBody, parseCanvaExportUrl, parseCanvaJobId } from "./canva-export.ts";

test("Canva export body is PNG at IG 4:5", () => {
  assert.deepEqual(canvaExportBody("DAFtea", 1080, 1350), {
    design_id: "DAFtea",
    format: { type: "png", width: 1080, height: 1350 },
  });
});

test("parseCanvaExportUrl only returns a finished HTTPS url", () => {
  assert.equal(parseCanvaJobId({ job: { id: "job_1" } }), "job_1");
  assert.equal(parseCanvaExportUrl({ job: { status: "in_progress" } }), null);
  assert.equal(
    parseCanvaExportUrl({
      job: { status: "success", urls: ["https://export-download.canva.com/tea.png"] },
    }),
    "https://export-download.canva.com/tea.png",
  );
});
