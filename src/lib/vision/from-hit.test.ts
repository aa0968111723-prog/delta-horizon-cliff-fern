import assert from "node:assert/strict";
import test from "node:test";
import { canvaOpenUrl, styleBriefFromReport, styleReportFromHit } from "./from-hit.ts";

test("Canva hits become style DNA instead of a copied poster", () => {
  const report = styleReportFromHit({
    source: "canva",
    title: "茶會海報",
    subtitle: "Canva / 茶會",
    tags: ["茶會", "海報"],
    notes: "https://www.canva.com/design/tea/edit",
  });
  assert.match(report.color, /配色|留白/);
  assert.match(report.composition, /Hook|文字層級/);
  assert.match(report.tooOld, /正式|層級/);
  assert.equal(canvaOpenUrl({ source: "canva", notes: "https://www.canva.com/design/tea/edit" }), "https://www.canva.com/design/tea/edit");
  assert.equal(canvaOpenUrl({ source: "canva", notes: "Canva 設計" }), "");
  assert.match(styleBriefFromReport(report, "Canva / 茶會"), /不要複製/);
});

test("IG hits teach Hook and stay-feel, Drive hits keep the room", () => {
  const ig = styleReportFromHit({
    source: "instagram",
    title: "有時候只是想有人陪著坐",
    subtitle: "Instagram / 2025-09-18",
    tags: ["Hook"],
    notes: "收藏數相對高。",
  });
  assert.match(ig.stayFeel, /Hook|停留/);
  const drive = styleReportFromHit({
    source: "drive",
    title: "2025 夜間茶會照片",
    subtitle: "Google Drive / 2025 茶會",
    tags: ["茶會", "晚上", "同學互動"],
    notes: "很多人圍坐。",
  });
  assert.match(drive.people, /圍坐|側臉/);
  assert.match(drive.light, /夜|暖/);
});
