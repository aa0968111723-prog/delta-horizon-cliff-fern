import { actionLabel, riskOf, type EditPlan, type EditorAction } from "./actions.ts";
import type { EditorScene, SceneLayer } from "./scene.ts";

export const UNRECOGNIZED_SUMMARY = "無法對應到畫布操作";

function compact(command: string) {
  return command.replace(/\s+/g, "").toLowerCase();
}

function headlineLayer(scene: EditorScene): SceneLayer | undefined {
  const selected = scene.layers.find((l) => l.id === scene.selectedId && l.type === "text");
  if (selected?.role === "headline" || (selected && /標題|headline/i.test(selected.name))) return selected;
  return (
    scene.layers.find((l) => l.type === "text" && l.role === "headline") ??
    scene.layers.find((l) => l.type === "text" && /標題|headline/i.test(l.name)) ??
    scene.layers
      .filter((l) => l.type === "text" && !l.hidden)
      .slice()
      .sort((a, b) => (b.fontSize ?? 0) - (a.fontSize ?? 0))[0]
  );
}

function imageLayer(scene: EditorScene): SceneLayer | undefined {
  const selected = scene.layers.find((l) => l.id === scene.selectedId && l.type === "image");
  if (selected && selected.w * selected.h >= 200 * 200) return selected;
  return scene.layers
    .filter((l) => l.type === "image" && !l.hidden)
    .slice()
    .sort((a, b) => b.w * b.h - a.w * a.h)[0];
}

function photoAsset(scene: EditorScene, excludeId?: string) {
  const pool = scene.assets.filter(
    (a) => a.id !== excludeId && a.kind !== "logo" && a.category !== "logo" && a.category !== "icon",
  );
  return pool.find((a) => a.category === "photo") ?? pool.find((a) => a.category === "people") ?? pool.find((a) => a.category === "background") ?? pool[0];
}

function color(scene: EditorScene, role: string, fallback: string) {
  return scene.brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}

function plan(summary: string, actions: EditorAction[], notes: string[] = []): EditPlan {
  return { summary, actions, notes, risk: riskOf(actions) };
}

function headlineUpCenter(scene: EditorScene): EditPlan {
  const layer = headlineLayer(scene);
  if (!layer) return plan("找不到標題圖層", [], ["畫布上沒有標題可調整。"]);
  const size = Math.min(120, Math.round((layer.fontSize ?? 64) * 1.28));
  const lines = Math.max(1, (layer.text ?? "").split("\n").length);
  const h = Math.round(size * 1.2 * lines + 20);
  const w = Math.min(scene.width - 96, Math.max(layer.w, Math.round(scene.width * 0.82)));
  return plan("放大標題並移到上方中央", [
    {
      type: "update-layer",
      layerId: layer.id,
      patch: { fontSize: size, h, w, align: "center" },
      label: `標題字級改為 ${size}`,
    },
    { type: "align-layer", layerId: layer.id, mode: "safe-center", label: "標題水平置中" },
    { type: "align-layer", layerId: layer.id, mode: "safe-top", label: "標題移到上方" },
    { type: "select", layerId: layer.id },
  ]);
}

function brighterPhoto(scene: EditorScene): EditPlan {
  const layer = imageLayer(scene);
  if (!layer) return plan("找不到照片", [], ["這頁沒有圖片圖層。"]);
  const other = photoAsset(scene, layer.assetId);
  const actions: EditorAction[] = [
    {
      type: "replace-image",
      layerId: layer.id,
      prefer: "brighter",
      assetId: other?.id,
      label: other ? `換成「${other.name}」並提高亮度` : "提高目前照片亮度",
    },
  ];
  return plan(other ? `換成較明亮的「${other.name}」` : "提高目前照片亮度", actions);
}

function livelyStyle(scene: EditorScene): EditPlan {
  const accent = color(scene, "accent", "#B85C38");
  const bg = color(scene, "background", "#F4E6D4");
  const headline = headlineLayer(scene);
  const image = imageLayer(scene);
  const cta = scene.layers.find((l) => l.type === "text" && l.role === "cta");
  const actions: EditorAction[] = [
    { type: "set-background", color: bg, color2: accent, label: "背景加入活潑點綴色" },
  ];
  if (headline) {
    const size = Math.min(112, Math.round((headline.fontSize ?? 64) * 1.12));
    actions.push({
      type: "update-layer",
      layerId: headline.id,
      patch: { fontSize: size, color: color(scene, "ink", "#1A1814"), align: "center" },
      label: "標題加大、語氣更醒目",
    });
  }
  if (image) {
    actions.push({
      type: "update-layer",
      layerId: image.id,
      patch: { brightness: 1.16, saturate: 1.18, contrast: 1.06 },
      label: "照片提高明度與飽和",
    });
  }
  if (cta) {
    actions.push({
      type: "update-layer",
      layerId: cta.id,
      patch: { text: scene.brand.ctas[1] || scene.brand.ctas[0] || "立刻報名", fontSize: Math.max(cta.fontSize ?? 28, 32) },
      label: "CTA 改成更直接的行動",
    });
  }
  actions.push({
    type: "set-copy",
    patch: { cta: scene.brand.ctas[1] || scene.brand.ctas[0] || scene.copy.cta },
    label: "同步文案 CTA",
  });
  return plan("改成校園活動較活潑的視覺節奏", actions, ["維持品牌色，不使用禁用詞。"]);
}

function toStory(scene: EditorScene): EditPlan {
  if (scene.formatId === "story") {
    return plan("已經是限時動態尺寸", [], ["目前就是 9:16，沒有切換。"]);
  }
  return plan("轉成限時動態 9:16", [
    { type: "set-format", formatId: "story", label: "切換為限時動態尺寸" },
  ]);
}

function deleteBottomLeft(scene: EditorScene): EditPlan {
  const hits = scene.layers.filter((l) => {
    if (l.locked || l.hidden) return false;
    const cx = l.x + l.w / 2;
    const cy = l.y + l.h / 2;
    if (cx > scene.width * 0.5) return false;
    if (cy < scene.height * 0.58) return false;
    if (l.type === "image" && l.w > scene.width * 0.65) return false;
    return true;
  });
  if (!hits.length) return plan("左下角沒有可刪的資訊", [], ["沒有位於左下的文字或小物件。"]);
  return plan(
    `刪除左下角 ${hits.length} 個物件`,
    hits.map((l) => ({
      type: "delete-layer" as const,
      layerId: l.id,
      label: `刪除「${l.name}」`,
    })),
  );
}

function addDateAndQr(scene: EditorScene): EditPlan {
  const date = scene.brief.schedule.trim() || "活動日期見內文";
  const payload = scene.brand.website.trim() || scene.brand.handle || scene.brief.eventName || "signup";
  const size = 196;
  const x = scene.width - 72 - size;
  const y = scene.height - 72 - size - 48;
  return plan("加上活動日期與報名 QR", [
    {
      type: "add-text",
      name: "活動日期",
      role: "custom",
      text: date,
      x: 72,
      y: scene.height - 140,
      w: 520,
      h: 64,
      fontSize: 28,
      align: "left",
      label: `新增日期「${date}」`,
    },
    {
      type: "add-qr",
      payload,
      caption: "掃碼報名",
      x,
      y,
      size,
      label: "新增報名 QR",
    },
  ]);
}

function moreWhitespace(): EditPlan {
  return plan("拉開邊界、減少擁擠資訊", [{ type: "whitespace", amount: "more", label: "增加留白" }]);
}

function threeLayouts(): EditPlan {
  return plan("產生三個不同排版版本", [
    { type: "layout-versions", count: 3, label: "存成排版 A／B／C 供比較" },
  ]);
}

function fallback(command: string, scene: EditorScene): EditPlan {
  const q = compact(command);
  if (/刪除|拿掉|去掉/.test(q) && scene.selectedId) {
    const layer = scene.layers.find((l) => l.id === scene.selectedId);
    if (layer && !layer.locked) {
      return plan(`刪除選取的「${layer.name}」`, [
        { type: "delete-layer", layerId: layer.id, label: `刪除「${layer.name}」` },
      ]);
    }
  }
  if (/置中|居中/.test(q)) {
    const layer = scene.layers.find((l) => l.id === scene.selectedId) ?? headlineLayer(scene);
    if (layer) {
      return plan("選取物件水平置中", [
        { type: "align-layer", layerId: layer.id, mode: "safe-center", label: `「${layer.name}」置中` },
      ]);
    }
  }
  return plan(UNRECOGNIZED_SUMMARY, [], ["請說具體動作，例如：把標題放大並移到上方中央。"]);
}

export function isRecognizedPlan(plan: EditPlan): boolean {
  return plan.summary !== UNRECOGNIZED_SUMMARY;
}

export function interpretMock(command: string, scene: EditorScene): EditPlan {
  const q = compact(command);
  if (!q) return plan("請先輸入要對畫布做的事", [], ["空白指令不會改畫布。"]);
  if ((/標題/.test(q) && (/放大|變大|加大/.test(q) || /中央|置中|上方/.test(q))) || /放大.*標題/.test(q)) {
    return headlineUpCenter(scene);
  }
  if ((/換|改成|換成/.test(q) && /圖|照片|相片/.test(q)) || /明亮/.test(q)) {
    return brighterPhoto(scene);
  }
  if (/淡江|活潑|學生/.test(q)) return livelyStyle(scene);
  if (/限時|限動|story|9:16|9／16|9\/16/.test(q)) return toStory(scene);
  if (/刪除|拿掉|去掉/.test(q) && /左下|資訊/.test(q)) return deleteBottomLeft(scene);
  if (/qr|qrcode|報名/.test(q) || (/日期/.test(q) && /加|增|放/.test(q))) return addDateAndQr(scene);
  if (/留白|呼吸|疏朗|不要太滿|空一點/.test(q)) return moreWhitespace();
  if (/三個|3個|三版|不同排版|幾個版本|多個版本/.test(q)) return threeLayouts();
  return fallback(command, scene);
}

export function describeEdit(plan: EditPlan): string[] {
  if (!plan.actions.length) return plan.notes ?? [];
  return plan.actions.map(actionLabel);
}
