import assert from "node:assert/strict";
import test from "node:test";
import { styleAnalysisFromCanvaMetadata } from "./canva-style.ts";

test("Canva metadata style summary stays honest and never claims Autofill", () => {
  const analysis = styleAnalysisFromCanvaMetadata({
    title: "09/24 浮游禪光主視覺",
    pageCount: "6",
  });
  assert.match(analysis.summary, /浮游禪光/);
  assert.match(analysis.summary, /不是像素分析/);
  assert.equal(analysis.colors.length, 0);
  assert.equal(analysis.recommendations.some((item) => /Enterprise/.test(item)), true);
  assert.doesNotMatch(analysis.summary, /已自動套用|像素分析完成/);
});
