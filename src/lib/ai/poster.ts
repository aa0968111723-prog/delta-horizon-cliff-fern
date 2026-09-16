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
  if (variation === "mood" || /靜水|夜/.test(palette)) {
    return { bg: "#d5e0e4", paper: "#e8eef0", ink: "#1c2422", muted: "#3d5a73" };
  }
  if (/琥珀/.test(palette)) {
    return { bg: "#efe4d4", paper: "#fff6ea", ink: "#1c2422", muted: "#8a7468" };
  }
  return { bg: "#eef2ec", paper: "#fffaf4", ink: "#1c2422", muted: "#5f6b66" };
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
  const lines = wrapCjk(headline, width >= 1000 ? 9 : 8);
  const fontSize = Math.round(Math.min(width, height) * (input.variation === "text" ? 0.042 : 0.052));
  const subSize = Math.round(fontSize * 0.42);
  const headlineY =
    input.variation === "composition" || input.variation === "text"
      ? height * 0.78
      : height * 0.7;
  const orbShift = input.variation === "composition" ? 0.08 : input.variation === "background" ? 0.12 : 0;
  const river = input.variation === "background" || /夜|淡水/.test(`${palette}${subhead}${headline}`);
  const grain = input.variation === "style";
  const turtleX = width * 0.82;
  const turtleY = height * 0.86;
  const orbs = [
    { cx: width * (0.28 + orbShift), cy: height * 0.26, r: width * 0.18, fill: "#d4a574", opacity: 0.55 },
    { cx: width * (0.62 - orbShift * 0.5), cy: height * 0.2, r: width * 0.14, fill: "#7eb8b2", opacity: 0.5 },
    { cx: width * 0.48, cy: height * (0.36 + orbShift), r: width * 0.11, fill: "#8b7bb3", opacity: 0.42 },
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
      <feGaussianBlur stdDeviation="${Math.round(width * 0.04)}"/>
    </filter>
    ${grain ? `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.14  0 0 0 0 0.12  0 0 0 0.18 0"/></filter>` : ""}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  ${river ? `<rect x="0" y="${height * 0.58}" width="${width}" height="${height * 0.42}" fill="#3d5a73" opacity="0.18"/>` : ""}
  ${orbs.map((orb) => `<circle cx="${orb.cx}" cy="${orb.cy}" r="${orb.r}" fill="${orb.fill}" opacity="${orb.opacity}" filter="url(#soft)"/>`).join("\n  ")}
  ${grain ? `<rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.35"/>` : ""}
  <g data-turtle="龜龜" transform="translate(${turtleX} ${turtleY})">
    <ellipse cx="0" cy="8" rx="28" ry="18" fill="#2f6f6a"/>
    <circle cx="0" cy="-10" r="12" fill="#2f6f6a"/>
    <circle cx="-22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="22" cy="8" r="7" fill="#2f6f6a"/>
    <circle cx="-5" cy="-12" r="2" fill="#fffaf4"/>
    <circle cx="-14" cy="-22" r="4" fill="#d4a574"/>
    <circle cx="0" cy="-30" r="3.5" fill="#7eb8b2"/>
    <circle cx="12" cy="-22" r="4" fill="#8b7bb3"/>
  </g>
  <text x="${width * 0.1}" y="${headlineY}" fill="${colors.ink}" font-family="Noto Serif TC, Source Han Serif TC, serif" font-size="${fontSize}" font-weight="600">${tspans}</text>
  ${subhead ? `<text x="${width * 0.1}" y="${headlineY + fontSize * lines.length * 1.2 + subSize}" fill="${colors.muted}" font-family="Noto Sans TC, PingFang TC, sans-serif" font-size="${subSize}">${xmlEscape(subhead.slice(0, 28))}</text>` : ""}
  <text x="${width * 0.1}" y="${height * 0.94}" fill="${colors.muted}" font-family="Noto Sans TC, sans-serif" font-size="${Math.round(subSize * 0.85)}">${xmlEscape(name)} · 淡江禪學社</text>
</svg>`;
}

export function mockPosterImage(input: PosterInput & { prompt: string }): {
  imageBase64: string;
  mime: "image/svg+xml";
  prompt: string;
} {
  const svg = directionPosterSvg(input);
  return {
    imageBase64: Buffer.from(svg, "utf8").toString("base64"),
    mime: "image/svg+xml",
    prompt: input.prompt,
  };
}
