import type { BrandBoilerplate } from "./types";

export function emptyBoilerplate(): BrandBoilerplate {
  return {
    cta: "了解更多",
    disclaimer: "",
    hashtags: [],
    captionClose: "",
  };
}
