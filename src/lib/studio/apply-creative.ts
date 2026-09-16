import { useStudio } from "@/stores/studio-store";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import type { Campaign, ContentType } from "@/lib/studio/campaign-types";
import { briefFromCampaign, briefFromTopic, planFromCreativeWave, suggestedScheduleSlots } from "@/lib/studio/creative-plan";
import type { MultimodalConversionResult, ZenVisualDirection } from "@/lib/studio/zen-prompt-engine";

export type ApplyCreativeInput = {
  topic: string;
  direction: ZenVisualDirection;
  conversion: MultimodalConversionResult;
  source: "live" | "mock";
  campaign?: Campaign | null;
  schedule?: boolean;
};

export function applyCreativeToStudio(input: ApplyCreativeInput): { projectId: string } {
  const studio = useStudio.getState();
  const brand = studio.brands[0];
  if (!brand) throw new Error("找不到品牌記憶，無法套用到畫布。");

  const brief = input.campaign
    ? briefFromCampaign(input.campaign)
    : briefFromTopic(input.topic, input.direction, {
        cta: input.conversion.igPost.cta,
      });
  const plan = planFromCreativeWave(input);
  const project = studio.createProject({
    name: plan.campaignName,
    brandId: brand.id,
    formatId: "feed-portrait",
    brief,
    templateId: plan.templateId,
  });
  studio.applyCampaignPlan(project.id, plan, brief);
  studio.setLastProjectId(project.id);

  if (input.schedule !== false) {
    scheduleCreativeWave({
      topic: input.topic,
      direction: input.direction,
      conversion: input.conversion,
      campaignId: input.campaign?.id,
      projectId: project.id,
      eventDate: input.campaign?.date,
    });
  }

  return { projectId: project.id };
}

export function scheduleCreativeWave(input: {
  topic: string;
  direction: ZenVisualDirection;
  conversion: MultimodalConversionResult;
  campaignId?: string;
  projectId?: string;
  eventDate?: string;
  contentTypes?: ContentType[];
}) {
  const store = useCampaignStore.getState();
  const slots = suggestedScheduleSlots(input.eventDate);
  const wanted = input.contentTypes;
  const items: { title: string; contentType: ContentType; scheduledAt: string; caption: string; hook: string }[] = [
    {
      title: `${input.topic} · 情緒共鳴 Carousel`,
      contentType: "carousel",
      scheduledAt: slots.carousel,
      caption: input.conversion.igPost.caption,
      hook: input.direction.headline.replace(/\n/g, " "),
    },
    {
      title: `${input.topic} · Story 互動`,
      contentType: "story",
      scheduledAt: slots.story,
      caption: input.conversion.story.cards.map((c) => c.copy).join("\n"),
      hook: input.conversion.story.cards[0]?.copy.split("\n")[0] ?? input.direction.headline,
    },
    {
      title: `${input.topic} · 主視覺單張`,
      contentType: "ig-post",
      scheduledAt: slots.post,
      caption: input.conversion.igPost.caption,
      hook: input.conversion.igPost.headline,
    },
    {
      title: `${input.topic} · Reels 20s`,
      contentType: "reels",
      scheduledAt: slots.reels,
      caption: input.conversion.reelsScript.scenes.map((s) => s.subtitle).join(" / "),
      hook: input.conversion.reelsScript.scenes[0]?.subtitle ?? input.direction.headline,
    },
  ].filter((item) => !wanted || wanted.includes(item.contentType));
  for (const item of items) {
    store.addScheduledPost({
      campaignId: input.campaignId,
      projectId: input.projectId,
      title: item.title,
      contentType: item.contentType,
      status: "scheduled",
      scheduledAt: item.scheduledAt,
      caption: item.caption,
      hashtags: input.conversion.igPost.hashtags,
      hook: item.hook.replace(/\n/g, " "),
      cta: input.conversion.igPost.cta,
      visualDirection: input.direction.concept,
      slidesCount: item.contentType === "carousel" ? input.conversion.carousel.pages.length : 1,
      sourceKind: "ai-generated",
      sourceRef: `AI Creative Studio / ${input.direction.name}`,
    });
  }
  store.addCreativeSource({
    source: "ai-generated",
    title: `${input.topic} · ${input.direction.name}`,
    subtitle: `AI 視覺方向 / ${input.direction.atmosphere}`,
    thumbnailUrl: "/seed/cup.jpg",
    category: "AI 生成",
    tags: ["AI", "禪學社", ...input.direction.colorPalette.map((c) => c.name)],
    date: new Date().toISOString().slice(0, 10),
    meta: { imagePrompt: input.direction.imagePrompt, headline: input.direction.headline },
  });
}
