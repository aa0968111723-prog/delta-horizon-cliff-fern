import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { analyzeStudioImage, generateStudioImage, proposeStudioDirections } from "@/lib/ai/image";
import {
  applyImageTweak,
  IMAGE_TWEAKS,
  promptFromVisionAction,
  proposeVisualDirections,
  VISION_ACTIONS,
  type ImageAspect,
  type ImageTweakId,
  type VisionActionId,
} from "@/lib/ai/image-directions";
import { generateCopyPack } from "@/lib/ai/copy";
import { generateCreativePack } from "@/lib/ai/pack";
import { toBriefInput } from "@/lib/ai/payload";
import { migrateBrief } from "@/lib/studio/brief";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { uid } from "@/lib/studio/ids";
import type { VisualDirection } from "@/lib/studio/types";
import type { VisionAnalysis } from "@/lib/ai/image";
import { igDnaBlock } from "@/lib/zen/insights";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

const ASPECTS: { id: ImageAspect; label: string }[] = [
  { id: "4:5", label: "IG 4:5" },
  { id: "1:1", label: "IG 1:1 / Threads / LINE" },
  { id: "9:16", label: "Story / Reels Cover" },
];

export function ImageStudio() {
  const navigate = useNavigate();
  const addAsset = useStudio((s) => s.addAsset);
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const setLastPack = useCreative((s) => s.setLastPack);
  const igPosts = useCreative((s) => s.igPosts);
  const [prompt, setPrompt] = useState("我要宣傳茶會");
  const [aspect, setAspect] = useState<ImageAspect>("4:5");
  const [busy, setBusy] = useState<string | null>(null);
  const [directions, setDirections] = useState<VisualDirection[]>(() => proposeVisualDirections("我要宣傳茶會", "4:5"));
  const [picked, setPicked] = useState<string>("dir_a");
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);

  const current = directions.find((d) => d.id === picked) ?? directions[0];

  async function thinkDirections() {
    setBusy("dir");
    setAnalysis(null);
    try {
      setDirections(proposeVisualDirections(prompt, aspect));
      const result = await proposeStudioDirections({ data: { prompt, aspect } });
      if (result.ok && result.directions.length === 3) {
        setDirections(result.directions);
        setPicked(result.directions[0]?.id ?? "dir_a");
      }
    } finally {
      setBusy(null);
    }
  }

  async function generate(fromPrompt?: string, nextAspect?: ImageAspect) {
    const useAspect = nextAspect ?? aspect;
    if (nextAspect) setAspect(nextAspect);
    const imagePrompt = fromPrompt ?? current?.imagePrompt ?? prompt;
    setBusy("gen");
    setAnalysis(null);
    try {
      const result = await generateStudioImage({
        data: {
          prompt: imagePrompt,
          aspect: useAspect,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const url = `data:${result.mime};base64,${result.b64}`;
      setPreview(url);
      const res = await fetch(url);
      const blob = await res.blob();
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      addAsset({
        id,
        name: (current?.headline.replace(/\n/g, " ") || prompt).slice(0, 24) || "AI 圖像",
        kind: "image",
        category: useAspect === "9:16" ? "story" : "generated",
        mime: result.mime,
        width: 1080,
        height: useAspect === "9:16" ? 1920 : useAspect === "4:5" ? 1350 : 1080,
        tags: ["AI 生成", prompt, current?.title ?? "方向"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "AI 生成，可再進畫布或 Canva。",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 1,
      });
      toast.success("已存進素材庫");
    } finally {
      setBusy(null);
    }
  }

  async function tweak(id: ImageTweakId) {
    if (!current) return;
    const next = applyImageTweak(current.imagePrompt, id);
    await generate(next);
  }

  async function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? "");
      setPreview(dataUrl);
      setBusy("vision");
      try {
        const result = await analyzeStudioImage({
          data: { imageDataUrl: dataUrl, question: "這張適不適合淡江學生 IG？" },
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setAnalysis(result.analysis);
      } finally {
        setBusy(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function runVisionAction(action: VisionActionId) {
    if (!analysis) return;
    if (action === "story" || action === "carousel") {
      const brand = brands[0];
      if (!brand) return;
      setBusy("pack");
      try {
        const brief = migrateBrief({
          eventName: prompt.slice(0, 40),
          product: analysis.content,
          audience: "淡江大學學生",
          location: "淡江大學淡水校園",
          notes: `${analysis.content}\n${analysis.student}`,
          deliverables: {
            post: true,
            story: action === "story",
            carousel: action === "carousel",
            reels: false,
            threads: true,
            line: true,
          },
        });
        const result = await generateCreativePack({
          data: toBriefInput(brief, brand, { dnaNotes: igDnaBlock(igPosts) }),
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setLastPack(result.pack);
        toast.success(action === "story" ? "已做成限動節奏" : "已做成 Carousel");
        void navigate({ to: "/create" });
      } finally {
        setBusy(null);
      }
      return;
    }
    const nextAspect: ImageAspect = action === "reels-cover" ? "9:16" : aspect;
    await generate(promptFromVisionAction(action, analysis), nextAspect);
  }

  async function extendCopy() {
    setBusy("copy");
    try {
      const result = await generateCopyPack({
        data: { idea: prompt, kind: "event", dnaNotes: igDnaBlock(igPosts) },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.pack.hook);
    } finally {
      setBusy(null);
    }
  }

  function openCanvas() {
    const brand = brands[0];
    if (!brand || !current) return;
    const brief = migrateBrief({
      eventName: prompt.slice(0, 40),
      audience: "淡江大學學生",
      location: "淡江大學淡水校園",
      deliverables: { post: true, story: false, carousel: false, reels: false, threads: false, line: false },
    });
    const project = createProject({
      name: current.headline.replace(/\n/g, " "),
      brandId: brand.id,
      formatId: aspect === "9:16" ? "story" : aspect === "1:1" ? "feed-square" : "feed-portrait",
      brief,
      templateId: "quote",
    });
    applyCampaignPlan(
      project.id,
      {
        campaignName: prompt,
        concept: current.concept,
        insight: current.concept,
        hook: current.headline.replace(/\n/g, " "),
        visualTheme: current.palette,
        visualDirection: current.composition,
        templateId: "quote",
        colorMood: current.palette,
        eyebrow: "EVENT",
        headline: current.headline,
        subhead: current.subhead,
        body: current.concept,
        cta: "晚上見",
        captions: [],
        hashtags: ["#淡江禪學社", "#淡江"],
        storyBeats: [],
        carouselPages: [],
        assetNeeds: [],
        checklist: [],
        altText: "",
        qaNotes: [],
        generatedAt: Date.now(),
        source: "mock",
      },
      brief,
    );
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Image Studio"
        title="先想學生，再生成圖"
        description="輸入「我要宣傳茶會」時，不會只吐禪風海報。會先給三個視覺方向：概念、配色、構圖、字體、Prompt、主副文案。"
      />
      <div className="mt-6 space-y-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)] md:p-6">
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAspect(item.id)}
              className={`min-h-11 rounded-full px-3 py-2 text-xs ${aspect === item.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy !== null} onClick={() => void thinkDirections()}>
            {busy === "dir" ? "正在想方向…" : "想三種方向"}
          </Button>
          <Button variant="secondary" disabled={busy !== null || !current} onClick={() => void generate()}>
            {busy === "gen" ? "生成中…" : "生成這個方向"}
          </Button>
          <label className="inline-flex h-11 items-center rounded-md bg-bg px-4 text-sm">
            丟入照片／舊海報／Canva
            <Input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {directions.map((dir) => (
          <button
            key={dir.id}
            type="button"
            onClick={() => setPicked(dir.id)}
            className={`rounded-[1.5rem] p-4 text-left shadow-[var(--shadow-border)] ${picked === dir.id ? "bg-accent text-accent-fg" : "bg-surface"}`}
          >
            <p className={`text-xs tracking-wide ${picked === dir.id ? "text-accent-fg/80" : "text-muted"}`}>方向 {dir.id.slice(-1).toUpperCase()}</p>
            <p className="mt-1 font-display text-xl">{dir.title}</p>
            <p className="mt-2 text-sm leading-relaxed">{dir.concept}</p>
            <p className={`mt-3 text-xs ${picked === dir.id ? "text-accent-fg/80" : "text-muted"}`}>
              {dir.palette} · {dir.composition}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium">{dir.headline}</p>
            <p className={`mt-1 text-xs ${picked === dir.id ? "text-accent-fg/80" : "text-muted"}`}>{dir.subhead}</p>
            <p className={`mt-2 text-xs ${picked === dir.id ? "text-accent-fg/70" : "text-subtle"}`}>{dir.typeDirection}</p>
          </button>
        ))}
      </div>

      {preview ? (
        <img src={preview} alt="生成預覽" className="mt-6 w-full rounded-[1.5rem] shadow-[var(--shadow-artboard)]" />
      ) : null}

      {preview || current ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {IMAGE_TWEAKS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void tweak(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => void extendCopy()}>
            配一文案
          </Button>
          <Button size="sm" variant="ghost" onClick={openCanvas}>
            放到畫布
          </Button>
        </div>
      ) : null}

      {analysis ? (
        <section className="mt-6 rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">圖片理解</p>
          <p className="mt-2 text-sm leading-relaxed">{analysis.content}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <Pair label="人物" value={analysis.people} />
            <Pair label="色彩" value={analysis.color} />
            <Pair label="光線" value={analysis.light} />
            <Pair label="構圖" value={analysis.composition} />
            <Pair label="文字比例" value={analysis.typeRatio} />
            <Pair label="品牌感" value={analysis.brand} />
            <Pair label="學生感" value={analysis.student} />
            <Pair label="停留感" value={analysis.stay} />
            <Pair label="太宗教？" value={analysis.tooReligious} />
            <Pair label="太老氣？" value={analysis.tooOld} />
            <Pair label="太 AI？" value={analysis.tooAi} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {VISION_ACTIONS.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void runVisionAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
