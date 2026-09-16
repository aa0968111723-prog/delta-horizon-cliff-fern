import { actionLabel, type EditPlan, type EditorAction } from "@/lib/ai/actions";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { sourceFromAsset } from "@/lib/studio/sources";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import {
  createImageLayer,
  createTextLayer,
  pagesOf,
} from "@/lib/studio/layers";
import { renderQrSvg } from "@/lib/studio/qr";
import type { Artboard, ImageLayer, Layer, TextLayer } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export type ExecuteResult = {
  changed: boolean;
  notes: string[];
  beforeId: string | null;
  afterId: string | null;
};

function currentBoard(projectId: string): Artboard | undefined {
  const project = useStudio.getState().projects.find((p) => p.id === projectId);
  if (!project) return undefined;
  return pagesOf(project)[project.slideIndex ?? 0];
}

function signature(projectId: string) {
  const project = useStudio.getState().projects.find((p) => p.id === projectId);
  if (!project) return "";
  const board = pagesOf(project)[project.slideIndex ?? 0];
  return JSON.stringify({
    f: project.activeFormatId,
    i: project.slideIndex,
    t: project.templateId,
    c: project.copy,
    bg: board?.background,
    layers: board?.layers.map((l) => ({
      id: l.id,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      hidden: l.hidden,
      text: l.type === "text" ? l.text : undefined,
      fontSize: l.type === "text" ? l.fontSize : undefined,
      assetId: l.type === "image" || l.type === "logo" ? l.assetId : undefined,
      filter: l.type === "image" ? l.filter : undefined,
    })),
  });
}

function applyWhitespace(projectId: string, amount: "more" | "less"): string[] {
  const store = useStudio.getState();
  const project = store.projects.find((p) => p.id === projectId);
  const board = currentBoard(projectId);
  if (!project || !board) return [];
  const format = formatById(project.activeFormatId);
  const notes: string[] = [];
  const factor = amount === "more" ? 0.86 : 1.08;
  store.patchArtboard(projectId, (art) => {
    const layers = art.layers.map((layer) => {
      if (layer.locked) return layer;
      if (layer.type === "image" && layer.h > format.height * 0.4) {
        notes.push("縮小主視覺");
        return { ...layer, h: Math.round(layer.h * factor) };
      }
      if (layer.type === "text" && layer.role === "body" && amount === "more") {
        notes.push("隱藏內文以增加留白");
        return { ...layer, hidden: true };
      }
      if (layer.type !== "image") {
        const pad = amount === "more" ? 24 : -12;
        const x = Math.max(format.safe.left, Math.min(layer.x + (layer.x < format.width / 2 ? pad : 0), format.width - layer.w - format.safe.right));
        const y = layer.y < format.height * 0.45 ? layer.y + (amount === "more" ? 10 : -8) : layer.y;
        return { ...layer, x, y };
      }
      return layer;
    });
    return { ...art, layers };
  });
  if (!notes.length) notes.push(amount === "more" ? "圖層已往內收" : "圖層已展開");
  return notes;
}

function applyReplaceImage(projectId: string, action: Extract<EditorAction, { type: "replace-image" }>): string[] {
  const store = useStudio.getState();
  const project = store.projects.find((p) => p.id === projectId);
  const board = currentBoard(projectId);
  if (!project || !board) return [];
  const selectedId = store.editor.selectedId;
  const target =
    board.layers.find((l) => l.id === action.layerId && l.type === "image") ??
    board.layers.find((l) => l.id === selectedId && l.type === "image") ??
    board.layers.find((l) => l.type === "image" && !l.hidden);
  if (!target || target.type !== "image") return ["這頁沒有照片可換。"];
  const current = target as ImageLayer;
  const nextMeta =
    store.assets.find((a) => a.id === action.assetId && a.category !== "icon" && a.kind !== "logo") ??
    store.assets.find(
      (a) =>
        a.id !== current.assetId &&
        a.kind !== "logo" &&
        a.category !== "icon" &&
        a.category !== "logo" &&
        (action.prefer === "people"
          ? a.category === "people"
          : action.prefer === "background"
            ? a.category === "background"
            : a.category === "photo" || a.category === "background" || a.kind === "image"),
    );
  const brightness = Math.min(1.35, (current.filter.brightness || 1) * 1.14);
  const contrast = Math.min(1.2, (current.filter.contrast || 1) * 1.06);
  store.updateLayer(projectId, current.id, {
    assetId: nextMeta?.id ?? current.assetId,
    filter: { ...current.filter, brightness, contrast, saturate: Math.max(current.filter.saturate, 1.05) },
  } as Partial<Layer>);
  if (nextMeta) store.markAssetUsed(nextMeta.id);
  store.select(current.id);
  return [nextMeta ? `已換成「${nextMeta.name}」並提高亮度` : "已提高目前照片亮度"];
}

async function applyQr(projectId: string, action: Extract<EditorAction, { type: "add-qr" }>): Promise<string[]> {
  const store = useStudio.getState();
  const project = store.projects.find((p) => p.id === projectId);
  const brand = store.brands.find((b) => b.id === project?.brandId) ?? store.brands[0];
  if (!project || !brand) return ["找不到專案。"];
  const format = formatById(project.activeFormatId);
  const size = action.size ?? 196;
  const x = action.x ?? format.width - format.safe.right - size;
  const y = action.y ?? format.height - format.safe.bottom - size - 40;
  const svg = renderQrSvg(action.payload, brand.colors.find((c) => c.role === "ink")?.hex);
  const assetId = uid("asset");
  await getAssetStorage().put(assetId, new Blob([svg], { type: "image/svg+xml" }));
  const meta = createGeneratedAsset({
    id: assetId,
    name: action.caption || "報名 QR",
    mime: "image/svg+xml",
    width: 232,
    height: 232,
    category: "icon",
  });
  store.addAsset(meta);
  store.addSources(projectId, [sourceFromAsset(meta, "報名 QR")]);
  store.addLayer(
    projectId,
    createImageLayer(assetId, action.caption || "報名 QR", { x, y, w: size, h: size, objectFit: "contain" }),
  );
  if (action.caption) {
    store.addLayer(
      projectId,
      createTextLayer(brand, {
        name: "QR 說明",
        role: "custom",
        text: action.caption,
        x,
        y: y + size + 8,
        w: size,
        h: 36,
        fontSize: 22,
        align: "center",
      }),
    );
  }
  store.markAssetUsed(assetId);
  return [`已放上「${action.caption || "報名 QR"}」`];
}

function applyLayoutVersions(projectId: string, count: number): string[] {
  const store = useStudio.getState();
  const templates = ["editorial", "product", "quote"] as const;
  const names = ["排版 A · 編輯封面", "排版 B · 商品主圖", "排版 C · 引言卡片"];
  const n = Math.min(3, Math.max(2, count));
  let firstId: string | null = null;
  for (let i = 0; i < n; i++) {
    store.reflow(projectId, templates[i]);
    const id = store.captureSnapshot(projectId, names[i]);
    if (i === 0) firstId = id;
  }
  if (firstId) store.restoreSnapshot(projectId, firstId);
  return [`已存 ${names.slice(0, n).join("、")}，可在版本面板比較`];
}

async function runAction(projectId: string, action: EditorAction): Promise<string[]> {
  const store = useStudio.getState();
  const project = store.projects.find((p) => p.id === projectId);
  const brand = store.brands.find((b) => b.id === project?.brandId) ?? store.brands[0];
  if (!project || !brand) return ["找不到專案。"];
  switch (action.type) {
    case "update-layer": {
      const board = currentBoard(projectId);
      const layer = board?.layers.find((l) => l.id === action.layerId);
      if (!layer) return [`找不到圖層，略過「${actionLabel(action)}」`];
      const { brightness, contrast, saturate, ...rest } = action.patch;
      const patch: Partial<Layer> = { ...rest };
      if (layer.type === "image" && (brightness != null || contrast != null || saturate != null)) {
        const image = layer as ImageLayer;
        (patch as Partial<ImageLayer>).filter = {
          ...image.filter,
          brightness: brightness ?? image.filter.brightness,
          contrast: contrast ?? image.filter.contrast,
          saturate: saturate ?? image.filter.saturate,
        };
      }
      if (layer.type === "text" && action.patch.fontSize) {
        const text = layer as TextLayer;
        const lines = Math.max(1, text.text.split("\n").length);
        (patch as Partial<TextLayer>).h = action.patch.h ?? Math.round(action.patch.fontSize * text.lineHeight * lines + 16);
      }
      store.updateLayer(projectId, action.layerId, patch);
      return [actionLabel(action)];
    }
    case "align-layer":
      store.alignLayer(projectId, action.layerId, action.mode);
      return [actionLabel(action)];
    case "delete-layer":
      store.removeLayer(projectId, action.layerId);
      return [actionLabel(action)];
    case "add-text": {
      const format = formatById(project.activeFormatId);
      const layer = createTextLayer(brand, {
        name: action.name ?? "文字",
        role: action.role ?? "custom",
        text: action.text,
        x: action.x ?? format.safe.left,
        y: action.y ?? format.height - format.safe.bottom - 80,
        w: action.w ?? 640,
        h: action.h ?? 72,
        fontSize: action.fontSize ?? 28,
        align: action.align ?? "left",
        color: action.color,
      });
      store.addLayer(projectId, layer);
      return [actionLabel(action)];
    }
    case "add-qr":
      return applyQr(projectId, action);
    case "replace-image":
      return applyReplaceImage(projectId, action);
    case "set-background":
      store.patchArtboard(projectId, (art) => ({
        ...art,
        background: {
          ...art.background,
          type: action.color2 ? "gradient" : art.background.type,
          color: action.color ?? art.background.color,
          color2: action.color2 ?? art.background.color2,
          angle: action.color2 ? 168 : art.background.angle,
        },
      }));
      return [actionLabel(action)];
    case "set-format":
      if (project.activeFormatId === action.formatId) return ["已經是這個尺寸"];
      store.setActiveFormat(projectId, action.formatId);
      return [actionLabel(action)];
    case "apply-template":
      store.reflow(projectId, action.templateId);
      return [actionLabel(action)];
    case "set-copy":
      store.setCopy(projectId, action.patch);
      return [actionLabel(action)];
    case "whitespace":
      return applyWhitespace(projectId, action.amount);
    case "layout-versions":
      return applyLayoutVersions(projectId, action.count ?? 3);
    case "select":
      store.select(action.layerId);
      return [];
  }
}

export async function executeEditPlan(projectId: string, plan: EditPlan, command: string): Promise<ExecuteResult> {
  const store = useStudio.getState();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return { changed: false, notes: ["找不到專案。"], beforeId: null, afterId: null };
  if (!plan.actions.length) {
    return { changed: false, notes: plan.notes?.length ? plan.notes : ["沒有可執行的畫布動作。"], beforeId: null, afterId: null };
  }
  const short = command.trim().slice(0, 18) || plan.summary.slice(0, 18);
  const beforeSig = signature(projectId);
  const beforeId = store.captureSnapshot(projectId, `操作前 · ${short}`);
  const notes: string[] = [];
  await store.applyAiEdit(projectId, `AI · ${short}`, async () => {
    for (const action of plan.actions) {
      const lines = await runAction(projectId, action);
      notes.push(...lines);
    }
  });
  const afterId = store.captureSnapshot(projectId, `AI · ${short}`);
  const afterSig = signature(projectId);
  const versioned = plan.actions.some((a) => a.type === "layout-versions");
  const changed = versioned || beforeSig !== afterSig;
  if (!changed) {
    return {
      changed: false,
      notes: notes.length ? notes : ["畫布已是目標狀態，沒有改動。"],
      beforeId,
      afterId,
    };
  }
  return { changed: true, notes: notes.length ? notes : [plan.summary], beforeId, afterId };
}
