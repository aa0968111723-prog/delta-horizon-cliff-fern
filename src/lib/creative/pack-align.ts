import type { CampaignPlan, CopyTone, CreativeDirection, ReelsBeat, StoryFrame } from "../studio/types.ts";

export type AlignablePack = {
  plan: CampaignPlan;
  directions: CreativeDirection[];
  copyVariants: Array<{ tone: CopyTone; hook: string; body: string; cta: string; hashtags: string[] }>;
  conversions: {
    carousel: CampaignPlan["carouselPages"];
    story: StoryFrame[];
    threads: string;
    line: string;
    reels: ReelsBeat[];
  };
};

export function chosenDirection(directions: CreativeDirection[], chosenId?: string | null) {
  return directions.find((item) => item.id === chosenId) ?? directions[0];
}

function swapHook(text: string, from: string, to: string) {
  if (!from || !to || from === to) return text;
  return text.split(from).join(to);
}

function hookOf(dir: CreativeDirection) {
  return dir.headline.replace(/\n/g, "").trim();
}

/** 使用者選了方向 B 之後，整套文案／Carousel／Threads 跟著走，不要跳回方向 A。 */
export function alignPackToDirection<T extends AlignablePack>(
  pack: T,
  chosenId?: string | null,
  existing?: CreativeDirection[],
): T {
  const directions = existing?.length ? existing : pack.directions;
  if (!chosenId) return existing?.length ? { ...pack, directions } : pack;
  const chosen = chosenDirection(directions, chosenId);
  if (!chosen) return { ...pack, directions };
  const from = pack.plan.hook;
  const hook = hookOf(chosen) || from;
  const carousel = (pack.plan.carouselPages ?? []).map((page, index) =>
    index === 0
      ? { ...page, headline: chosen.headline, body: hook, visualNote: chosen.composition }
      : { ...page, body: swapHook(page.body, from, hook) },
  );
  return {
    ...pack,
    directions,
    plan: {
      ...pack.plan,
      hook,
      headline: chosen.headline,
      visualTheme: chosen.palette,
      visualDirection: `${chosen.composition}。${chosen.concept}`,
      colorMood: chosen.palette,
      directions,
      carouselPages: carousel,
      threadsPost: swapHook(pack.plan.threadsPost || pack.conversions.threads, from, hook),
      lineCopy: swapHook(pack.plan.lineCopy || pack.conversions.line, from, hook),
    },
    copyVariants: pack.copyVariants.map((item) => ({
      ...item,
      hook,
      body: swapHook(item.body, from, hook),
    })),
    conversions: {
      ...pack.conversions,
      carousel,
      threads: swapHook(pack.conversions.threads, from, hook),
      line: swapHook(pack.conversions.line, from, hook),
      story: pack.conversions.story.map((frame, index) => (index === 0 ? { ...frame, headline: hook } : frame)),
    },
  };
}
