import { contrastRatio } from "./color.ts";
import { PAGE_ROLE_LABEL } from "./carousel.ts";
import { formatById } from "./formats.ts";
import type {
  Artboard,
  BrandKit,
  CopyDeck,
  ImageLayer,
  Layer,
  LogoLayer,
  QaCheckId,
  QaCheckSummary,
  QaIssue,
  QaReport,
  ShapeLayer,
  TextLayer,
} from "./types.ts";

export const QA_CHECK_LABEL: Record<QaCheckId, string> = {
  headline: "標題突出",
  hierarchy: "文字層級",
  "type-size": "字級大小",
  contrast: "對比度",
  crowding: "資訊密度",
  whitespace: "留白",
  align: "對齊",
  "image-stretch": "圖片比例",
  "logo-size": "Logo 尺寸",
  cta: "CTA 可見",
  safe: "安全區域",
  carousel: "輪播一致",
  overflow: "溢出遮擋",
};

const CHECK_ORDER: QaCheckId[] = [
  "headline",
  "hierarchy",
  "type-size",
  "contrast",
  "crowding",
  "whitespace",
  "align",
  "image-stretch",
  "logo-size",
  "cta",
  "safe",
  "carousel",
  "overflow",
];

function textOverflows(layer: TextLayer): boolean {
  const charsPerLine = Math.max(1, Math.floor(layer.w / (layer.fontSize * 0.92)));
  let lines = 0;
  for (const paragraph of layer.text.split("\n")) {
    lines += Math.max(1, Math.ceil([...paragraph].length / charsPerLine));
  }
  return lines * layer.fontSize * layer.lineHeight > layer.h + 4;
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapArea(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

export function bgBehindText(artboard: Artboard, layer: TextLayer): string {
  const ti = artboard.layers.indexOf(layer);
  const covering = [...artboard.layers]
    .slice(0, Math.max(0, ti))
    .reverse()
    .find(
      (item): item is ShapeLayer =>
        item.type === "shape" &&
        !item.hidden &&
        item.fill !== "transparent" &&
        item.opacity > 0.4 &&
        rectsOverlap(item, layer),
    );
  return covering?.fill ?? artboard.background.color;
}

export function brandInk(brand: BrandKit) {
  return brand.colors.find((c) => c.role === "ink")?.hex ?? "#1A1814";
}

export function brandPaper(brand: BrandKit) {
  return brand.colors.find((c) => c.role === "background")?.hex ?? "#F4E6D4";
}

export function brandAccent(brand: BrandKit) {
  return brand.colors.find((c) => c.role === "accent")?.hex ?? "#B85C38";
}

export function colorLabel(brand: BrandKit, hex: string) {
  const match = brand.colors.find((c) => c.hex.toUpperCase() === hex.toUpperCase());
  return match ? `品牌${match.label}` : hex.toUpperCase();
}

export function pickReadable(bg: string, brand: BrandKit): string {
  const ink = brandInk(brand);
  const paper = brandPaper(brand);
  const rInk = contrastRatio(ink, bg) ?? 0;
  const rPaper = contrastRatio(paper, bg) ?? 0;
  return rInk >= rPaper ? ink : paper;
}

function pageLabel(page: Artboard, index: number) {
  const role = page.role ? PAGE_ROLE_LABEL[page.role] : null;
  return role ? `第 ${index + 1} 頁 · ${role}` : `第 ${index + 1} 頁`;
}

function loc(page: Artboard, index: number, layer?: Layer) {
  return layer ? `${pageLabel(page, index)} · ${layer.name}` : pageLabel(page, index);
}

function textsOf(artboard: Artboard): TextLayer[] {
  return artboard.layers.filter((l): l is TextLayer => l.type === "text" && !l.hidden && l.opacity > 0.15);
}

function byRole(texts: TextLayer[], role: TextLayer["role"]) {
  return texts.find((t) => t.role === role);
}

function minType(role: TextLayer["role"], tall: boolean) {
  if (role === "headline") return tall ? 52 : 40;
  if (role === "subhead") return tall ? 28 : 24;
  if (role === "cta") return tall ? 22 : 20;
  return tall ? 22 : 18;
}

function inspectPage(artboard: Artboard, brand: BrandKit, pageIndex: number, copy: CopyDeck): QaIssue[] {
  const format = formatById(artboard.formatId);
  const tall = format.height >= 1600;
  const issues: QaIssue[] = [];
  const texts = textsOf(artboard);
  const headline = byRole(texts, "headline");
  const subhead = byRole(texts, "subhead");
  const body = byRole(texts, "body");
  const cta = byRole(texts, "cta");
  const here = (layer?: Layer) => loc(artboard, pageIndex, layer);

  if (!headline || !headline.text.trim()) {
    issues.push({
      id: `headline-missing-${pageIndex}`,
      check: "headline",
      severity: "fail",
      title: "沒有標題",
      location: pageLabel(artboard, pageIndex),
      detail: "這一頁找不到標題圖層，縮圖時會變成沒有主訊息的畫面。",
      suggestion: "補上一句最多兩行的標題，字級至少 40px，並放在安全區上半。",
      pageIndex,
      fix: { kind: "emphasize-headline", pageIndex, layerId: headline?.id ?? "", fontSize: minType("headline", tall) },
      fixLabel: "放大現有大字",
    });
  } else {
    const others = texts.filter((t) => t.id !== headline.id && t.role !== "custom");
    const nextLargest = others.reduce((m, t) => Math.max(m, t.fontSize), 0);
    if (nextLargest > 0 && headline.fontSize < nextLargest * 1.15) {
      const target = Math.round(Math.max(minType("headline", tall), nextLargest * 1.35));
      issues.push({
        id: `headline-weak-${headline.id}`,
        check: "headline",
        severity: "fail",
        title: "標題不夠突出",
        location: here(headline),
        detail: `標題 ${headline.fontSize}px，最大的其他文字卻有 ${nextLargest}px，縮圖時主訊息會被吃掉。`,
        suggestion: `把「${headline.name}」加大到 ${target}px，並維持品牌標題字型。`,
        layerId: headline.id,
        pageIndex,
        fix: { kind: "emphasize-headline", pageIndex, layerId: headline.id, fontSize: target },
        fixLabel: `標題改 ${target}px`,
      });
    } else if (
      headline.y > format.height * 0.62 &&
      artboard.templateId !== "offer" &&
      artboard.templateId !== "product"
    ) {
      issues.push({
        id: `headline-low-${headline.id}`,
        check: "headline",
        severity: "warn",
        title: "標題位置偏低",
        location: here(headline),
        detail: `標題目前在畫布 ${Math.round((headline.y / format.height) * 100)}% 處，Feed 縮圖上半截看不到主句。`,
        suggestion: "把標題移到安全區上半或中央，讓 1:1 縮圖也能讀到。",
        layerId: headline.id,
        pageIndex,
        fix: { kind: "move-safe", pageIndex, layerId: headline.id },
        fixLabel: "移入安全區上沿",
      });
    }
  }

  if (headline && subhead && subhead.fontSize >= headline.fontSize) {
    issues.push({
      id: `hier-sub-${subhead.id}`,
      check: "hierarchy",
      severity: "fail",
      title: "副標比標題還大",
      location: here(subhead),
      detail: `副標 ${subhead.fontSize}px ≥ 標題 ${headline.fontSize}px，層級反了。`,
      suggestion: `副標改成 ${Math.round(headline.fontSize * 0.45)}–${Math.round(headline.fontSize * 0.55)}px，標題保持最大。`,
      layerId: subhead.id,
      pageIndex,
      fix: { kind: "grow-type", pageIndex, layerId: headline.id, fontSize: Math.max(headline.fontSize, subhead.fontSize + 16) },
      fixLabel: "拉開標題層級",
    });
  } else if (headline && body && body.fontSize >= headline.fontSize * 0.7) {
    issues.push({
      id: `hier-body-${body.id}`,
      check: "hierarchy",
      severity: "warn",
      title: "內文與標題太接近",
      location: here(body),
      detail: `內文 ${body.fontSize}px、標題 ${headline.fontSize}px，遠看會糊成同一層。`,
      suggestion: `內文降到 ${Math.round(headline.fontSize * 0.4)}px 左右，讓標題先被讀到。`,
      layerId: body.id,
      pageIndex,
      fix: { kind: "grow-type", pageIndex, layerId: body.id, fontSize: Math.max(18, Math.round(headline.fontSize * 0.38)) },
      fixLabel: "縮小內文",
    });
  }

  for (const t of texts) {
    if (t.role === "custom" && t.fontSize >= 80) continue;
    const min = minType(t.role, tall);
    if (t.fontSize < min) {
      issues.push({
        id: `size-${t.id}`,
        check: "type-size",
        severity: t.role === "headline" || t.role === "cta" ? "fail" : "warn",
        title: `${t.name} 字級偏小`,
        location: here(t),
        detail: `目前 ${t.fontSize}px，在手機 Feed 上大約只有 ${Math.round(t.fontSize * 0.32)}px，偏難讀。`,
        suggestion: `將「${t.name}」加到至少 ${min}px（以 1080 寬為基準）。`,
        layerId: t.id,
        pageIndex,
        fix: { kind: "grow-type", pageIndex, layerId: t.id, fontSize: min },
        fixLabel: `改 ${min}px`,
      });
    }

    const bg = bgBehindText(artboard, t);
    const ratio = contrastRatio(t.color, bg);
    const large = t.fontSize >= 42 || t.fontWeight >= 600;
    const need = large ? 3 : 4.5;
    if (ratio !== null && ratio < need) {
      const next = pickReadable(bg, brand);
      const nextRatio = contrastRatio(next, bg) ?? 0;
      const useBacking = nextRatio < need;
      const backing = pickReadable(t.color, brand) === brandInk(brand) ? brandPaper(brand) : brandInk(brand);
      issues.push({
        id: `contrast-${t.id}`,
        check: "contrast",
        severity: ratio < 2.5 ? "fail" : "warn",
        title: `${t.name} 對比不足`,
        location: here(t),
        detail: `「${t.name}」與背景 ${bg.toUpperCase()} 的對比只有 ${ratio.toFixed(1)}:1，低於 ${need}:1。`,
        suggestion: useBacking
          ? `在「${t.name}」後方加一層${colorLabel(brand, backing)}半透明底板，或改用${colorLabel(brand, next)}。`
          : `把「${t.name}」改成${colorLabel(brand, next)}（對比可到 ${nextRatio.toFixed(1)}:1）。`,
        layerId: t.id,
        pageIndex,
        fix: useBacking
          ? { kind: "add-text-backing", pageIndex, layerId: t.id, fill: backing }
          : { kind: "set-text-color", pageIndex, layerId: t.id, color: next },
        fixLabel: useBacking ? "加底板" : `改${colorLabel(brand, next)}`,
      });
    }

    const pad = 8;
    const outside =
      t.x < format.safe.left - pad ||
      t.y < format.safe.top - pad ||
      t.x + t.w > format.width - format.safe.right + pad ||
      t.y + t.h > format.height - format.safe.bottom + pad;
    if (outside) {
      const story = artboard.formatId === "story" || artboard.formatId === "reels-cover";
      issues.push({
        id: `safe-${t.id}`,
        check: "safe",
        severity: story || t.role === "headline" || t.role === "cta" ? "fail" : "warn",
        title: `${t.name} 落在安全區外`,
        location: here(t),
        detail: story
          ? `限時動態上／下約 250px 會被頭像、回覆列擋住。「${t.name}」目前 y=${Math.round(t.y)}。`
          : `「${t.name}」超出 ${format.name} 安全框，邊緣可能被裁切或被 UI 擋住。`,
        suggestion: `把「${t.name}」移進安全區（上 ${format.safe.top}／下 ${format.safe.bottom}／左右 ${format.safe.left}）。`,
        layerId: t.id,
        pageIndex,
        fix: { kind: "move-safe", pageIndex, layerId: t.id },
        fixLabel: "移入安全區",
      });
    }

    if (t.x + t.w > format.width + 2 || t.y + t.h > format.height + 2 || t.x < -2 || t.y < -2) {
      issues.push({
        id: `canvas-${t.id}`,
        check: "overflow",
        severity: "fail",
        title: `${t.name} 超出畫布`,
        location: here(t),
        detail: "圖層有一部分在畫布外，匯出 PNG 時會被裁掉。",
        suggestion: `把「${t.name}」整塊移回 ${format.width}×${format.height} 範圍內。`,
        layerId: t.id,
        pageIndex,
        fix: { kind: "move-safe", pageIndex, layerId: t.id },
        fixLabel: "移回畫布",
      });
    }

    if (textOverflows(t)) {
      issues.push({
        id: `flow-${t.id}`,
        check: "overflow",
        severity: "fail",
        title: `${t.name} 文字溢出框`,
        location: here(t),
        detail: `「${t.text.replace(/\n/g, " ").slice(0, 18)}」塞不進 ${Math.round(t.w)}×${Math.round(t.h)} 的文字框，會被裁切或疊到別層。`,
        suggestion: "加高文字框，或把字級略降、改成兩行。",
        layerId: t.id,
        pageIndex,
        fix: { kind: "expand-textbox", pageIndex, layerId: t.id },
        fixLabel: "加高文字框",
      });
    }

    const ti = artboard.layers.indexOf(t);
    const onPhoto = artboard.layers.some(
      (item, i) => item.type === "image" && !item.hidden && i < ti && rectsOverlap(item, t),
    );
    const coveringShape = artboard.layers.some(
      (item, i) =>
        item.type === "shape" &&
        !item.hidden &&
        item.fill !== "transparent" &&
        item.opacity > 0.4 &&
        i < ti &&
        rectsOverlap(item, t),
    );
    if (onPhoto && !coveringShape) {
      const backing = brandPaper(brand);
      issues.push({
        id: `photo-type-${t.id}`,
        check: "contrast",
        severity: t.role === "headline" || t.role === "cta" ? "fail" : "warn",
        title: `${t.name} 叠在照片上`,
        location: here(t),
        detail: `「${t.name}」直接疊在圖片上，對比會隨照片亮暗改變，縮圖時可能讀不到。`,
        suggestion: `為「${t.name}」加${colorLabel(brand, backing)}半透明底板，或把文字移到純色區。`,
        layerId: t.id,
        pageIndex,
        fix: { kind: "add-text-backing", pageIndex, layerId: t.id, fill: backing },
        fixLabel: "加底板",
      });
    }
    const blocker = artboard.layers.slice(ti + 1).find((item) => {
      if (item.hidden || item.opacity < 0.25 || item.type === "text") return false;
      const area = t.w * t.h || 1;
      return overlapArea(item, t) / area > 0.28;
    });
    if (blocker) {
      issues.push({
        id: `cover-${t.id}`,
        check: "overflow",
        severity: "fail",
        title: `${t.name} 被「${blocker.name}」擋住`,
        location: here(t),
        detail: `上層的「${blocker.name}」蓋住標題／內文超過四分之一，匯出後會讀不到。`,
        suggestion: `把「${blocker.name}」移開，或把「${t.name}」提到最上層。`,
        layerId: t.id,
        pageIndex,
        fix: { kind: "move-safe", pageIndex, layerId: t.id },
        fixLabel: "移開文字",
      });
    }
  }

  const textArea = texts.reduce((sum, t) => sum + t.w * t.h, 0);
  const inner = (format.width - format.safe.left - format.safe.right) * (format.height - format.safe.top - format.safe.bottom);
  if (texts.length >= 6 && inner && textArea / inner > 0.48) {
    issues.push({
      id: `crowd-${pageIndex}`,
      check: "crowding",
      severity: "warn",
      title: "資訊過度擁擠",
      location: pageLabel(artboard, pageIndex),
      detail: `這一頁有 ${texts.length} 段文字，文字框約佔內容區 ${Math.round((textArea / inner) * 100)}%。遠看會像一張清單。`,
      suggestion: "每頁只留一個主句加一句補充。可隱藏帳號列或把內文移到下一頁。",
      pageIndex,
      fix: { kind: "nudge-whitespace", pageIndex },
      fixLabel: "拉開留白",
    });
  }

  const content = artboard.layers.filter((l) => {
    if (l.hidden || l.opacity <= 0.2 || l.type === "image") return false;
    if (l.type === "shape" && l.x <= 2 && l.w >= format.width * 0.85) return false;
    return true;
  });
  if (content.length) {
    const minX = Math.min(...content.map((l) => l.x));
    const minY = Math.min(...content.map((l) => l.y));
    const maxX = Math.max(...content.map((l) => l.x + l.w));
    const maxY = Math.max(...content.map((l) => l.y + l.h));
    const padX = Math.min(minX, format.width - maxX);
    const padY = Math.min(minY, format.height - maxY);
    if (padX < 28 || padY < 24) {
      issues.push({
        id: `space-${pageIndex}`,
        check: "whitespace",
        severity: "warn",
        title: "留白不足",
        location: pageLabel(artboard, pageIndex),
        detail: `內容離畫布邊緣只剩約 ${Math.round(Math.min(padX, padY))}px，畫面會顯得塞滿。`,
        suggestion: "把文字與 Logo 再往安全區內縮 24–40px，讓主視覺有呼吸。",
        pageIndex,
        fix: { kind: "nudge-whitespace", pageIndex },
        fixLabel: "內縮留白",
      });
    }
  }

  if (texts.length >= 3) {
    const xs = texts.map((t) => Math.round(t.x / 8) * 8);
    const uniqueX = new Set(xs);
    const centered = texts.filter((t) => t.align === "center").length;
    if (uniqueX.size >= 3 && centered !== texts.length) {
      issues.push({
        id: `align-${pageIndex}`,
        check: "align",
        severity: "warn",
        title: "元件沒有對齊",
        location: pageLabel(artboard, pageIndex),
        detail: `文字左緣落在 ${uniqueX.size} 條不同的垂直線上，看起來會鬆散。`,
        suggestion: `把文字統一對齊安全區左緣（x=${format.safe.left}）或全部置中。`,
        pageIndex,
        fix: { kind: "align-column", pageIndex },
        fixLabel: "齊左安全區",
      });
    }
  }

  for (const img of artboard.layers.filter((l): l is ImageLayer => l.type === "image" && !l.hidden)) {
    const ratio = img.w / Math.max(1, img.h);
    if (ratio > 4 || ratio < 0.22) {
      issues.push({
        id: `stretch-${img.id}`,
        check: "image-stretch",
        severity: "fail",
        title: `${img.name} 被拉成細長條`,
        location: here(img),
        detail: `圖片框比例 ${ratio.toFixed(2)}:1，看起來會像被拉伸而不是被裁切。`,
        suggestion: "改用 cover 裁切，並把框改回接近 4:5 或 1:1，不要單向拉長。",
        layerId: img.id,
        pageIndex,
        fix: { kind: "fit-image", pageIndex, layerId: img.id },
        fixLabel: "改 cover 並修正框",
      });
    } else if (img.objectFit !== "cover" && img.objectFit !== "contain") {
      issues.push({
        id: `fit-${img.id}`,
        check: "image-stretch",
        severity: "warn",
        title: `${img.name} 可能被變形`,
        location: here(img),
        detail: "圖片沒有指定 cover／contain，匯出時可能被硬 Stretch。",
        suggestion: "主視覺用 cover 裁切，商品完整展示才用 contain。",
        layerId: img.id,
        pageIndex,
        fix: { kind: "fit-image", pageIndex, layerId: img.id },
        fixLabel: "改為 cover",
      });
    }
  }

  const logos = artboard.layers.filter((l): l is LogoLayer => l.type === "logo" && !l.hidden);
  const minSide = Math.min(format.width, format.height);
  for (const logo of logos) {
    const size = Math.max(logo.w, logo.h);
    const pct = size / minSide;
    if (pct < 0.04 || size < 48) {
      issues.push({
        id: `logo-sm-${logo.id}`,
        check: "logo-size",
        severity: "warn",
        title: "Logo 太小",
        location: here(logo),
        detail: `Logo 邊長 ${Math.round(size)}px，只佔邊長 ${Math.round(pct * 100)}%，縮圖時會變成噪點。`,
        suggestion: "放大到約 72–96px（約畫布短邊的 7%），並離開主體 16px 以上。",
        layerId: logo.id,
        pageIndex,
        fix: { kind: "resize-logo", pageIndex, layerId: logo.id, size: Math.round(minSide * 0.075) },
        fixLabel: "放大 Logo",
      });
    } else if (pct > 0.18 || size > 220) {
      issues.push({
        id: `logo-lg-${logo.id}`,
        check: "logo-size",
        severity: "warn",
        title: "Logo 太大",
        location: here(logo),
        detail: `Logo 邊長 ${Math.round(size)}px，佔了短邊 ${Math.round(pct * 100)}%，會壓過標題。`,
        suggestion: "縮小到 72–120px，放角落，不要當成主視覺。",
        layerId: logo.id,
        pageIndex,
        fix: { kind: "resize-logo", pageIndex, layerId: logo.id, size: Math.round(minSide * 0.08) },
        fixLabel: "縮小 Logo",
      });
    }
  }
  if (!logos.length && brand.logoAssetId) {
    issues.push({
      id: `logo-miss-${pageIndex}`,
      check: "logo-size",
      severity: "warn",
      title: "這一頁沒有 Logo",
      location: pageLabel(artboard, pageIndex),
      detail: "品牌已設定標誌，但此頁沒有 Logo 圖層，輪播翻頁會覺得不是同一組。",
      suggestion: "在安全區角落放 72–96px 的品牌標誌，不要壓到標題。",
      pageIndex,
    });
  }

  if (!cta || !cta.text.trim()) {
    if (!(copy.cta || "").trim()) {
      issues.push({
        id: `cta-miss-${pageIndex}`,
        check: "cta",
        severity: pageIndex === 0 ? "warn" : "fail",
        title: "沒有行動呼籲",
        location: pageLabel(artboard, pageIndex),
        detail: "畫面沒有 CTA，看完不知道下一步。",
        suggestion: `加上品牌常用 CTA（例如「${brand.boilerplate.cta || "了解更多"}」），用對比色膠囊。`,
        pageIndex,
        fix: { kind: "boost-cta", pageIndex },
        fixLabel: "加上 CTA",
      });
    }
  } else {
    const ctaBg = bgBehindText(artboard, cta);
    const ctaRatio = contrastRatio(cta.color, ctaBg) ?? 99;
    const inStoryHole =
      (artboard.formatId === "story" || artboard.formatId === "reels-cover") &&
      cta.y + cta.h > format.height - format.safe.bottom + 8;
    if (cta.fontSize < minType("cta", tall) || ctaRatio < 3 || inStoryHole) {
      issues.push({
        id: `cta-weak-${cta.id}`,
        check: "cta",
        severity: "fail",
        title: "CTA 不容易被看見",
        location: here(cta),
        detail: inStoryHole
          ? `CTA 落在限時動態下緣操作列上，會被回覆欄擋住。`
          : `CTA ${cta.fontSize}px、對比 ${ctaRatio.toFixed(1)}:1，遠看會融進背景。`,
        suggestion: "用品牌主色做膠囊底、對比文字，放在安全區下沿內側，字級至少 20px。",
        layerId: cta.id,
        pageIndex,
        fix: { kind: "boost-cta", pageIndex, layerId: cta.id },
        fixLabel: "加強 CTA",
      });
    }
  }

  return issues;
}

function inspectCarousel(pages: Artboard[]): QaIssue[] {
  if (pages.length < 2) return [];
  const issues: QaIssue[] = [];
  const first = pages[0];
  const format = formatById(first.formatId);
  const h0 = textsOf(first).find((t) => t.role === "headline");
  const logo0 = first.layers.find((l): l is LogoLayer => l.type === "logo" && !l.hidden);
  const bg0 = first.background.color.toUpperCase();

  const fontMismatch = pages
    .map((page, i) => ({ page, i, h: textsOf(page).find((t) => t.role === "headline") }))
    .filter((row) => row.h && h0 && row.h.fontFamily !== h0.fontFamily);
  if (fontMismatch.length) {
    const sample = fontMismatch[0];
    issues.push({
      id: "carousel-font",
      check: "carousel",
      severity: "fail",
      title: "輪播標題字型不一致",
      location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
      detail: `第 1 頁標題用 ${h0?.fontFamily}，第 ${sample.i + 1} 頁卻用 ${sample.h?.fontFamily}，翻頁會覺得換了品牌。`,
      suggestion: `把所有頁的標題統一成第 1 頁的「${h0?.fontFamily}」，內文維持品牌內文字型。`,
      pageIndex: sample.i,
      layerId: sample.h?.id,
      fix: { kind: "unify-carousel" },
      fixLabel: "統一字型與 Logo",
    });
  }

  const bgMismatch = pages
    .map((page, i) => ({ page, i }))
    .filter((row) => row.page.background.color.toUpperCase() !== bg0);
  if (bgMismatch.length) {
    const sample = bgMismatch[0];
    issues.push({
      id: "carousel-bg",
      check: "carousel",
      severity: "warn",
      title: "輪播底色不一致",
      location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
      detail: `第 1 頁底色 ${bg0}，第 ${sample.i + 1} 頁是 ${sample.page.background.color.toUpperCase()}。`,
      suggestion: "整組使用同一品牌底色， variate 只放在主視覺照片，不要每頁換底。",
      pageIndex: sample.i,
      fix: { kind: "unify-carousel" },
      fixLabel: "統一底色",
    });
  }

  if (logo0) {
    const drifted = pages
      .map((page, i) => ({
        page,
        i,
        logo: page.layers.find((l): l is LogoLayer => l.type === "logo" && !l.hidden),
      }))
      .filter((row) => {
        if (!row.logo) return true;
        return Math.abs(row.logo.w - logo0.w) > 20 || Math.abs(row.logo.x - logo0.x) > 80;
      });
    if (drifted.length) {
      const sample = drifted[0];
      issues.push({
        id: "carousel-logo",
        check: "carousel",
        severity: "warn",
        title: "輪播 Logo 位置／大小不一致",
        location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
        detail: sample.logo
          ? `第 1 頁 Logo ${Math.round(logo0.w)}px、x=${Math.round(logo0.x)}；第 ${sample.i + 1} 頁是 ${Math.round(sample.logo.w)}px、x=${Math.round(sample.logo.x)}。`
          : `第 ${sample.i + 1} 頁缺少 Logo。`,
        suggestion: `各頁 Logo 都放同一角落、同一尺寸（建議 ${Math.round(logo0.w)}px），翻頁才會成套。`,
        pageIndex: sample.i,
        layerId: sample.logo?.id,
        fix: { kind: "unify-carousel" },
        fixLabel: "統一 Logo",
      });
    }
  }

  const align0 = h0?.align;
  if (align0) {
    const alignMismatch = pages
      .map((page, i) => ({ page, i, h: textsOf(page).find((t) => t.role === "headline") }))
      .filter((row) => row.h && row.h.align !== align0);
    if (alignMismatch.length >= Math.ceil(pages.length / 2)) {
      issues.push({
        id: "carousel-align",
        check: "carousel",
        severity: "warn",
        title: "輪播標題對齊不統一",
        location: pageLabel(first, 0),
        detail: `有的頁置${align0 === "center" ? "中" : "左"}、有的頁不同。偶爾可接受，但超過一半頁面不一致時會像拼貼。`,
        suggestion: "封面／案例可置左，引言頁可置中；同一角色的頁要相同。不要每頁換對齊。",
        pageIndex: 0,
      });
    }
  }

  void format;
  return issues;
}

function summarize(issues: QaIssue[]): QaReport {
  const checks: QaCheckSummary[] = CHECK_ORDER.map((id) => {
    const mine = issues.filter((item) => item.check === id);
    const fail = mine.some((item) => item.severity === "fail");
    const warn = mine.some((item) => item.severity === "warn");
    return {
      id,
      label: QA_CHECK_LABEL[id],
      status: fail ? "fail" : warn ? "warn" : "pass",
      count: mine.length,
    };
  });
  const fails = issues.filter((i) => i.severity === "fail").length;
  const warns = issues.filter((i) => i.severity === "warn").length;
  const score = Math.max(0, Math.min(100, 100 - fails * 12 - warns * 5));
  const fixable = issues.filter((i) => i.fix).length;
  let summary = "13 項檢查都通過。仍建議在手機實機看一次縮圖。";
  if (fails + warns > 0) {
    const top = issues.find((i) => i.severity === "fail") ?? issues[0];
    summary = `${fails ? `${fails} 件必須修` : ""}${fails && warns ? "、" : ""}${warns ? `${warns} 件建議` : ""}。優先：${top.location} — ${top.title}。`;
  }
  return { score, summary, checks, issues, fixable };
}

export function inspectProject(pages: Artboard[], brand: BrandKit, copy: CopyDeck): QaReport {
  if (!pages.length) {
    return summarize([
      {
        id: "empty",
        check: "headline",
        severity: "fail",
        title: "沒有畫布",
        location: "作品",
        detail: "這個尺寸還沒有頁面。",
        suggestion: "先產生一頁或套用企劃。",
        pageIndex: 0,
      },
    ]);
  }
  const issues = pages.flatMap((page, index) => inspectPage(page, brand, index, copy));
  issues.push(...inspectCarousel(pages));
  return summarize(issues);
}

export function inspectQuality(
  artboard: Artboard,
  brand: BrandKit,
  copy: CopyDeck,
): { score: number; issues: QaIssue[] } {
  const report = inspectProject([artboard], brand, copy);
  return { score: report.score, issues: report.issues };
}

export function layerById(layers: Layer[], id: string | undefined): Layer | undefined {
  if (!id) return undefined;
  return layers.find((l) => l.id === id);
}
