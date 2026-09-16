export type PosterVariation = "composition" | "mood" | "background" | "style" | "text";

export type PosterInput = {
  headline: string;
  subhead?: string;
  concept?: string;
  palette?: string;
  name?: string;
  width: number;
  height: number;
  variation?: PosterVariation;
  /** 9:16 Reels still: orbs + 龜龜, no burned headline. Captions belong on the film overlay. */
  atmosphere?: boolean;
  /** Drive / Canva / IG still to continue — SVG markup or a data: URI. Never copy the old poster. */
  photoEmbed?: string;
  sourceCredit?: string;
};

/** Quiet 9:16 still for Reels encode / cover. Spec §8: almost no text on the cover. */
export function reelsAtmosphereInput(palette?: string): PosterInput {
  return {
    headline: "",
    atmosphere: true,
    palette: palette || "靜水、琥珀點",
    width: 1080,
    height: 1920,
    variation: "mood",
  };
}

export function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function wrapCjk(text: string, max = 10): string[] {
  const chars = [...text.trim()];
  if (!chars.length) return [];
  const lines: string[] = [];
  for (let i = 0; i < chars.length; i += max) lines.push(chars.slice(i, i + max).join(""));
  return lines.slice(0, 3);
}

function paperFromPalette(palette: string, variation?: PosterVariation) {
  const night = variation === "mood" || /靜水|夜|深夜/.test(palette);
  if (/琥珀/.test(palette) && !night) {
    return { bg: "#efe4d4", paper: "#fffaf4", ink: "#1c2422", muted: "#8a7468" };
  }
  return {
    bg: night ? "#c9d6dc" : "#eef2ec",
    paper: "#fffaf4",
    ink: "#1c2422",
    muted: night ? "#3d5a73" : "#5f6b66",
  };
}

/** Nest a club photo into the poster so tea-party 主視覺 is not a blank orb sheet. */
export function sourcePhotoMarkup(
  embed: string | undefined,
  width: number,
  height: number,
  variation?: PosterVariation,
): string {
  const trimmed = embed?.trim();
  if (!trimmed) return "";
  const shift = variation === "composition" ? -width * 0.1 : variation === "background" ? width * 0.05 : 0;
  const opacity = variation === "mood" ? 0.7 : variation === "background" ? 0.48 : 0.9;
  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    const view = trimmed.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${width} ${height}`;
    const parts = view.split(/[\s,]+/).map(Number);
    const vw = parts[2] || width;
    const vh = parts[3] || height;
    const scale = Math.max(width / vw, height / vh);
    const ox = shift + (width - vw * scale) / 2;
    const oy = (height - vh * scale) / 2;
    const inner = trimmed.replace(/<\?xml[^>]*>/, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    return `<g data-source-photo="1" opacity="${opacity}" transform="translate(${ox} ${oy}) scale(${scale})">${inner}</g>`;
  }
  if (trimmed.startsWith("data:")) {
    return `<image href="${xmlEscape(trimmed)}" x="${shift}" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}" data-source-photo="1"/>`;
  }
  return "";
}

function posterSceneMarkup(
  width: number,
  height: number,
  input: PosterInput,
  palette: string,
  headline: string,
  subhead: string,
) {
  const atmosphere = Boolean(input.atmosphere);
  const orbShift = input.variation === "composition" ? 0.08 : input.variation === "background" ? 0.12 : atmosphere ? 0.04 : 0;
  const river =
    atmosphere || input.variation === "background" || /夜|淡水/.test(`${palette}${subhead}${headline}`);
  const grain = input.variation === "style";
  const turtleX = width * (atmosphere ? 0.78 : 0.82);
  const turtleY = height * (atmosphere ? 0.88 : 0.86);
  const orbScale = atmosphere ? 1.18 : 1;
  const orbs = [
    { cx: width * (0.28 + orbShift), cy: height * (atmosphere ? 0.28 : 0.24), r: width * 0.2 * orbScale, fill: "#d4a574", opacity: 0.78 },
    { cx: width * (0.64 - orbShift * 0.5), cy: height * (atmosphere ? 0.2 : 0.18), r: width * 0.16 * orbScale, fill: "#2f6f6a", opacity: 0.62 },
    { cx: width * 0.48, cy: height * (0.34 + orbShift), r: width * 0.13 * orbScale, fill: "#8b7bb3", opacity: 0.58 },
  ];
  return {
    river,
    grain,
    turtleX,
    turtleY,
    orbs,
  };
}

/** IG-sized poster when live image gen is unavailable. Not a temple / 禪風海報. */
export function directionPosterSvg(input: PosterInput): string {
  const width = Math.max(320, Math.round(input.width));
  const height = Math.max(320, Math.round(input.height));
  const palette = input.palette || "霧園、靜水、琥珀點";
  const colors = paperFromPalette(palette, input.variation);
  const atmosphere = Boolean(input.atmosphere);
  const headline = atmosphere ? "" : input.headline.trim() || "最近是不是很久沒坐好";
  const subhead = atmosphere ? "" : (input.subhead || input.concept || "").trim();
  const name = atmosphere ? "" : input.name?.trim() || "禪光";
  const lines = atmosphere ? [] : wrapCjk(headline, width >= 900 ? 12 : 8);
  const fontSize = Math.round(Math.min(width, height) * (input.variation === "text" ? 0.046 : 0.058));
  const subSize = Math.round(fontSize * 0.38);
  const headlineY =
    input.variation === "composition" || input.variation === "text"
      ? height * 0.7
      : height * 0.6;
  const scene = posterSceneMarkup(width, height, input, palette, headline, subhead);
  const photo = sourcePhotoMarkup(input.photoEmbed, width, height, input.variation);
  const wash = photo ? `<rect width="${width}" height="${height}" fill="${colors.paper}" opacity="${input.variation === "mood" ? 0.42 : 0.22}"/>` : "";
  const credit = atmosphere ? "" : (input.sourceCredit || "").trim();
  const tspans = lines
    .map((line, i) => `<tspan x="${width * 0.1}" dy="${i === 0 ? 0 : fontSize * 1.18}">${xmlEscape(line)}</tspan>`)
    .join("");
  const label = atmosphere ? "氣氛畫面" : `主視覺：${headline}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xmlEscape(label)}">
  <title>${xmlEscape(label)}</title>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.paper}"/>
      <stop offset="1" stop-color="${colors.bg}"/>
    </linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${Math.round(width * 0.028)}"/>
    </filter>
    ${scene.grain ? `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.14  0 0 0 0 0.12  0 0 0 0.18 0"/></filter>` : ""}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  ${photo}
  ${wash}
  ${scene.river && !photo ? `<rect x="0" y="${height * 0.58}" width="${width}" height="${height * 0.42}" fill="#3d5a73" opacity="0.18"/>` : ""}
  ${scene.orbs.map((orb) => `<circle cx="${orb.cx}" cy="${orb.cy}" r="${orb.r}" fill="${orb.fill}" opacity="${orb.opacity}" filter="url(#soft)"/>`).join("\n  ")}
  ${scene.grain ? `<rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.35"/>` : ""}
  <g data-turtle="龜龜" transform="translate(${scene.turtleX} ${scene.turtleY}) scale(${Math.max(width, height) / 1080})">
    <ellipse cx="0" cy="8" rx="28" ry="18" fill="#2f6f6a"/>
    <circle cx="0" cy="-10" r="12" fill="#2f6f6a"/>
    <circle cx="-22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="-5" cy="-12" r="2.2" fill="#fffaf4"/>
    <circle cx="-14" cy="-22" r="5" fill="#d4a574"/>
    <circle cx="0" cy="-30" r="4" fill="#7eb8b2"/>
    <circle cx="12" cy="-22" r="5" fill="#8b7bb3"/>
  </g>
  ${
    atmosphere
      ? ""
      : `<rect x="${width * 0.07}" y="${headlineY - fontSize * 1.15}" width="${width * 0.86}" height="${fontSize * lines.length * 1.25 + subSize * 3}" rx="${Math.round(width * 0.03)}" fill="#fffaf4" opacity="0.88"/>
  <text x="${width * 0.1}" y="${headlineY}" fill="${colors.ink}" font-family="Noto Serif TC, Source Han Serif TC, serif" font-size="${fontSize}" font-weight="600">${tspans}</text>
  ${subhead ? `<text x="${width * 0.1}" y="${headlineY + fontSize * lines.length * 1.2 + subSize}" fill="${colors.muted}" font-family="Noto Sans TC, PingFang TC, sans-serif" font-size="${subSize}">${xmlEscape(subhead.slice(0, 28))}</text>` : ""}
  <text x="${width * 0.1}" y="${height * 0.94}" fill="${colors.muted}" font-family="Noto Sans TC, sans-serif" font-size="${Math.round(subSize * 0.85)}">${xmlEscape(credit || `${name} · 淡江禪學社`)}</text>`
  }
</svg>`;
}

export function atmospherePosterSvg(input: Omit<PosterInput, "atmosphere">): string {
  return directionPosterSvg({ ...input, atmosphere: true });
}

/** UTF-8 → base64 without relying on Node `Buffer` (works in the browser too). */
export function encodeUtf8Base64(text: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(text, "utf8").toString("base64");
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function mockPosterImage(input: PosterInput & { prompt: string }): {
  imageBase64: string;
  mime: "image/svg+xml";
  prompt: string;
} {
  return {
    imageBase64: encodeUtf8Base64(directionPosterSvg(input)),
    mime: "image/svg+xml",
    prompt: input.prompt,
  };
}
