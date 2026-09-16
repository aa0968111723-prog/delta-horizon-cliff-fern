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
};

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

/** IG-sized poster when live image gen is unavailable. Not a temple / 禪風海報. */
export function directionPosterSvg(input: PosterInput): string {
  const width = Math.max(320, Math.round(input.width));
  const height = Math.max(320, Math.round(input.height));
  const palette = input.palette || "霧園、靜水、琥珀點";
  const colors = paperFromPalette(palette, input.variation);
  const headline = input.headline.trim() || "最近是不是很久沒坐好";
  const subhead = (input.subhead || input.concept || "").trim();
  const name = input.name?.trim() || "禪光";
  const lines = wrapCjk(headline, width >= 900 ? 12 : 8);
  const fontSize = Math.round(Math.min(width, height) * (input.variation === "text" ? 0.046 : 0.058));
  const subSize = Math.round(fontSize * 0.38);
  const headlineY =
    input.variation === "composition" || input.variation === "text"
      ? height * 0.7
      : height * 0.6;
  const orbShift = input.variation === "composition" ? 0.08 : input.variation === "background" ? 0.12 : 0;
  const river = input.variation === "background" || /夜|淡水/.test(`${palette}${subhead}${headline}`);
  const grain = input.variation === "style";
  const turtleX = width * 0.82;
  const turtleY = height * 0.86;
  const orbs = [
    { cx: width * (0.28 + orbShift), cy: height * 0.24, r: width * 0.2, fill: "#d4a574", opacity: 0.78 },
    { cx: width * (0.64 - orbShift * 0.5), cy: height * 0.18, r: width * 0.16, fill: "#2f6f6a", opacity: 0.62 },
    { cx: width * 0.48, cy: height * (0.34 + orbShift), r: width * 0.13, fill: "#8b7bb3", opacity: 0.58 },
  ];
  const tspans = lines
    .map((line, i) => `<tspan x="${width * 0.1}" dy="${i === 0 ? 0 : fontSize * 1.18}">${xmlEscape(line)}</tspan>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xmlEscape(`主視覺：${headline}`)}">
  <title>${xmlEscape(`主視覺：${headline}`)}</title>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.paper}"/>
      <stop offset="1" stop-color="${colors.bg}"/>
    </linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${Math.round(width * 0.028)}"/>
    </filter>
    ${grain ? `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.14  0 0 0 0 0.12  0 0 0 0.18 0"/></filter>` : ""}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  ${river ? `<rect x="0" y="${height * 0.58}" width="${width}" height="${height * 0.42}" fill="#3d5a73" opacity="0.18"/>` : ""}
  ${orbs.map((orb) => `<circle cx="${orb.cx}" cy="${orb.cy}" r="${orb.r}" fill="${orb.fill}" opacity="${orb.opacity}" filter="url(#soft)"/>`).join("\n  ")}
  ${grain ? `<rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.35"/>` : ""}
  <g data-turtle="龜龜" transform="translate(${turtleX} ${turtleY}) scale(${Math.max(width, height) / 1080})">
    <ellipse cx="0" cy="8" rx="28" ry="18" fill="#2f6f6a"/>
    <circle cx="0" cy="-10" r="12" fill="#2f6f6a"/>
    <circle cx="-22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="-5" cy="-12" r="2.2" fill="#fffaf4"/>
    <circle cx="-14" cy="-22" r="5" fill="#d4a574"/>
    <circle cx="0" cy="-30" r="4" fill="#7eb8b2"/>
    <circle cx="12" cy="-22" r="5" fill="#8b7bb3"/>
  </g>
  <rect x="${width * 0.07}" y="${headlineY - fontSize * 1.15}" width="${width * 0.86}" height="${fontSize * lines.length * 1.25 + subSize * 3}" rx="${Math.round(width * 0.03)}" fill="#fffaf4" opacity="0.88"/>
  <text x="${width * 0.1}" y="${headlineY}" fill="${colors.ink}" font-family="Noto Serif TC, Source Han Serif TC, serif" font-size="${fontSize}" font-weight="600">${tspans}</text>
  ${subhead ? `<text x="${width * 0.1}" y="${headlineY + fontSize * lines.length * 1.2 + subSize}" fill="${colors.muted}" font-family="Noto Sans TC, PingFang TC, sans-serif" font-size="${subSize}">${xmlEscape(subhead.slice(0, 28))}</text>` : ""}
  <text x="${width * 0.1}" y="${height * 0.94}" fill="${colors.muted}" font-family="Noto Sans TC, sans-serif" font-size="${Math.round(subSize * 0.85)}">${xmlEscape(name)} · 淡江禪學社</text>
</svg>`;
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
