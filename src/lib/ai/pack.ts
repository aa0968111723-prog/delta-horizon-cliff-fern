import { createServerFn } from "@tanstack/react-start";
import type { CitedSource } from "@/lib/studio/types";
import { applyStudentRewrite } from "@/lib/zen/review";
import { composeMemoryNotes, mergeCitedSources, sourcesFromMemoryNotes } from "@/lib/zen/ingest";
import type { CreativePack } from "@/lib/zen/types";
import { generateCampaignPlan } from "./campaign";
import { BriefInputSchema } from "./schema";
import { buildMockPlan } from "./mock";

const PackInput = BriefInputSchema;

export const generateCreativePack = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (input && typeof input === "object" && "data" in input) {
      return PackInput.parse((input as { data: unknown }).data);
    }
    return PackInput.parse(input);
  })
  .handler(async ({ data }): Promise<
    | { ok: true; pack: CreativePack; adapter: "live" | "mock" }
    | { ok: false; error: string; adapter: "live" | "mock" }
  > => {
    const { collectLiveKnowledge } = await import("./sources.server");
    const live = await collectLiveKnowledge(data.eventName);
    const memoryNotes = composeMemoryNotes([data.memoryNotes, live.notes]);
    const result = await generateCampaignPlan({ data: { ...data, memoryNotes } });
    if (!result.ok) return result;
    const plan = result.plan.visualDirections?.length ? result.plan : { ...result.plan, ...enrich(data.eventName) };
    const sources: CitedSource[] = mergeCitedSources(
      live.sources,
      sourcesFromMemoryNotes(memoryNotes),
      plan.citedSources ?? [],
      defaultSources(memoryNotes),
    );
    const pack: CreativePack = {
      campaignName: plan.campaignName,
      insight: plan.insight,
      studentContext: data.audience,
      foundCount: Math.max(sources.length, live.sources.length),
      citedSources: sources,
      directions: plan.visualDirections,
      plan,
      copy: applyStudentRewrite({
        hook: plan.hook,
        body: plan.captions[0]?.text ?? plan.insight,
        cta: plan.cta,
        hashtags: plan.hashtags,
        variants: plan.captions,
        studentReview: plan.studentReview ?? {
          wouldStop: "請再看一次第一句。",
          understandable: "",
          tooReligious: "",
          tooSerious: "",
          tooLiterary: "",
          tooAi: "",
          tooLong: "",
          knowsWhat: "",
          knowsWhenWhere: "",
          wouldBringFriend: "",
          knowsSignup: "",
          notes: [],
          rewriteHook: "",
        },
      }),
    };
    return { ok: true, pack, adapter: result.adapter };
  });

function defaultSources(notes?: string): CitedSource[] {
  const extra = notes
    ? notes
        .split("\n")
        .filter(Boolean)
        .slice(0, 4)
        .map((line) => {
          const source = line.includes("Canva")
            ? "canva"
            : line.includes("Instagram")
              ? "instagram"
              : line.includes("Drive")
                ? "drive"
                : "brand";
          return { source: source as CitedSource["source"], label: line.slice(0, 40), detail: line };
        })
    : [];
  return [
    { source: "brand", label: "龜龜、三色光、語氣", detail: "Brand Memory" },
    { source: "instagram", label: "歷史貼文", detail: "高收藏 Hook 句型" },
    ...extra,
  ];
}

function enrich(name: string) {
  return buildMockPlan({
    eventName: name,
    schedule: "",
    location: "淡江大學淡水校園",
    product: name,
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "",
    style: "",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
  });
}
