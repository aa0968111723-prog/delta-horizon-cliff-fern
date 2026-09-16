import assert from "node:assert/strict";
import test from "node:test";
import { exportFilename, packCaptionsFilename } from "./export-name.ts";

test("exportFilename sanitizes the project name and keeps size", () => {
  assert.equal(exportFilename("浮游禪光/主視覺", "4:5", "", 2160, 2700, "png"), "浮游禪光主視覺-4:5-2160x2700.png");
  assert.equal(
    exportFilename("浮游禪光", "1.91:1", "-p2", 2160, 1132, "png"),
    "浮游禪光-1.91:1-p2-2160x1132.png",
  );
  assert.match(exportFilename("", "9:16", "", 1080, 1920, "jpg"), /^export-9:16-1080x1920\.jpg$/);
});

test("packCaptionsFilename sanitizes like PNG names", () => {
  assert.equal(packCaptionsFilename("浮游禪光/主視覺"), "浮游禪光主視覺-全套文案.txt");
  assert.match(packCaptionsFilename(""), /^export-全套文案\.txt$/);
});
