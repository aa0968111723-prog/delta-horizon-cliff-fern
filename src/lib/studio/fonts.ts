export const STUDIO_FONTS = [
  { id: "Noto Sans TC", label: "Noto Sans TC 黑體", category: "sans" },
  { id: "Noto Serif TC", label: "Noto Serif TC 宋體", category: "serif" },
] as const;

export type StudioFontId = (typeof STUDIO_FONTS)[number]["id"];

export const FONT_WEIGHTS = [400, 500, 600, 700] as const;
