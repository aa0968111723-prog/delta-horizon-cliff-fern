import { AlertCircle, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateCopyPack, describeCopyAdapter, getCopyAiStatus } from "@/lib/ai/copy";
import type { AiStatus } from "@/lib/ai/campaign";
import { CaptionMeter } from "@/components/assistant/caption-meter";
import { IgSurfaceConvert } from "@/components/assistant/ig-surface-convert";
import { reviewStudentCaption } from "@/lib/studio/ig-surfaces";
import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { hashtagsFromOutcomes, lessonsFromLocalWork, mergeHashtagMemory } from "@/lib/creative/learning";
import { buildCreativeMemoryContext, memoryInjectionHints } from "@/lib/creative/memory";
import { CreationLoop } from "@/components/shared/creation-loop";
import { emptyBrandMemory } from "@/lib/studio/brand";
import type { CopyTone } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function CopyStudio({ projectId }: { projectId: string }) {
  const project = useStudio((state) => state.projects.find((item) => item.id === projectId));
  const brand = useStudio((state) => state.brands.find((item) => item.id === project?.brandId));
  const patchPlan = useStudio((state) => state.patchPlan);
  const setCopy = useStudio((state) => state.setCopy);
  const updateBrand = useStudio((state) => state.updateBrand);
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const outcomes = useCreative((state) => state.outcomes);
  const assets = useStudio((state) => state.assets);
  const instagramItems = useConnectionStore((state) => state.instagramItems);
  const styleReferences = useConnectionStore((state) => state.styleReferences);
  const outcomeHashtags = hashtagsFromOutcomes(outcomes);
  const memoryHashtags = mergeHashtagMemory(outcomeHashtags, hashtagsFromInstagramMemory(instagramItems));
  const memoryHints = brand
    ? memoryInjectionHints({
        brand,
        assets,
        campaigns,
        styleReferences,
        instagramHashtags: memoryHashtags,
        outcomeHashtags,
      })
    : [];
  const [busy, setBusy] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [activeTone, setActiveTone] = useState<CopyTone>("學生版");
  const pack = project?.plan?.copyPack;

  useEffect(() => {
    let alive = true;
    getCopyAiStatus()
      .then((next) => {
        if (alive) setStatus(next);
      })
      .catch(() => {
        if (alive) setStatus(describeCopyAdapter(false));
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!project || !project.plan || !brand) return null;

  async function generate(forceMock = false) {
    if (!project || !project.plan || !brand) return;
    setBusy(true);
    try {
      const registrationUrl = project.brief.notes.match(/https?:\/\/\S+/)?.[0] ?? "";
      const result = await generateCopyPack({
        data: {
          campaignName: project.plan.campaignName || project.name,
          hook: project.plan.hook,
          concept: project.plan.concept,
          schedule: project.brief.schedule,
          location: project.brief.location,
          audience: project.brief.audience,
          studentPain: project.plan.insight || project.brief.features,
          cta: project.plan.cta,
          registrationUrl,
          brandVoice: brand.voice,
          brandMemory: buildCreativeMemoryContext({
            brand,
            assets,
            campaigns,
            styleReferences,
            instagramHashtags: memoryHashtags,
            outcomeHashtags,
          }),
          hashtags: [...new Set([...(project.plan.hashtags ?? []), ...memoryHashtags])].slice(0, 20),
          forceMock,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        setLiveFailed(true);
        return;
      }
      setLiveFailed(false);
      patchPlan(projectId, { copyPack: result.pack });
      const student = result.pack.variants.find((item) => item.tone === "學生版") ?? result.pack.variants[0];
      if (student) {
        setCopy(projectId, {
          headline: student.hook,
          body: student.body,
          cta: student.cta,
          caption: `${student.body}\n\n${student.cta}\n\n${student.hashtags.join(" ")}`,
          hashtags: student.hashtags,
        });
      }
      setActiveTone("學生版");
      toast.success(result.pack.source === "live" ? "文案包已生成" : "本機文案草案已生成，不是 Grok 寫的");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "文案生成失敗");
    } finally {
      setBusy(false);
    }
  }

  function applyTone(tone: CopyTone) {
    if (!pack) return;
    const variant = pack.variants.find((item) => item.tone === tone);
    if (!variant) return;
    patchPlan(projectId, {
      hook: variant.hook,
      headline: variant.hook,
      body: variant.body,
      cta: variant.cta,
      hashtags: variant.hashtags,
      captions: [
        { style: variant.tone, text: `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}` },
        ...pack.variants
          .filter((item) => item.tone !== tone)
          .slice(0, 3)
          .map((item) => ({ style: item.tone, text: item.body })),
      ],
    });
    setCopy(projectId, {
      headline: variant.hook,
      body: variant.body,
      cta: variant.cta,
      caption: `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`,
      hashtags: variant.hashtags,
    });
    setActiveTone(tone);
    toast.success(`已套用${tone}`);
  }

  const variant = pack?.variants.find((item) => item.tone === activeTone) ?? pack?.variants[0];
  const liveCaption = variant
    ? `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`
    : project.copy.caption;
  const liveReview = variant
    ? reviewStudentCaption({
        caption: liveCaption,
        hook: variant.hook,
        cta: variant.cta,
        schedule: project.brief.schedule,
        location: project.brief.location,
        registrationUrl: project.brief.notes.match(/https?:\/\/\S+/)?.[0] ?? "",
        hashtags: variant.hashtags,
      })
    : pack?.studentReview ?? [];
  const formats = pack
    ? [
        { label: "Threads", text: pack.threads },
        { label: "LINE", text: pack.line },
      ]
    : [];

  const mockMode = status ? !status.available || liveFailed : false;
  const banner = status ?? describeCopyAdapter(false);

  return (
    <section className="rounded-xl bg-bg p-4" data-testid="copy-studio">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg">寫這則網宣文案</h3>
            {pack ? <Badge variant={pack.source === "live" ? "success" : "warn"}>{pack.source === "live" ? "AI" : "本機草案"}</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            {status
              ? banner.detail
              : "先確認有沒有連到 AI 文案，不會假裝 Grok 已寫好。"}
            {memoryHints.length ? ` 本次會帶入跨來源記憶：${memoryHints.join("、")}。` : " Brand Memory 尚未寫入校園情境時，會用預設的淡江生活場景。"}
            {memoryHashtags.length ? ` 已帶入現場／IG hashtag：${memoryHashtags.slice(0, 5).join(" ")}` : ""}
          </p>
        </div>
        <div className="flex min-h-11 flex-wrap gap-2">
          {liveFailed ? (
            <Button size="sm" className="min-h-11" variant="secondary" disabled={busy} onClick={() => void generate(true)}>
              改用本機草案
            </Button>
          ) : null}
          <Button size="sm" className="min-h-11" disabled={busy || !status} onClick={() => void generate(mockMode)}>
            <Sparkles className="size-4" />
            {busy ? "生成中…" : mockMode ? (pack ? "重新生成本機草案" : "生成本機草案") : pack ? "重新生成" : "生成文案包"}
          </Button>
        </div>
      </div>

      {pack && variant ? (
        <div className="mt-4 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pack.variants.map((item) => (
              <button
                key={item.tone}
                type="button"
                onClick={() => applyTone(item.tone)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-3 text-xs",
                  item.tone === activeTone ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                )}
              >
                {item.tone}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">開頭句</p>
            <p className="mt-2 font-display text-xl leading-snug">{variant.hook}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{variant.body}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-accent">{variant.cta}</p>
              <Button
                size="sm"
                variant="secondary"
                className="min-h-11"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`);
                  toast.success("已複製這個版本");
                }}
              >
                <Copy className="size-4" />複製
              </Button>
            </div>
            <div className="mt-3">
              <CaptionMeter
                caption={`${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`}
                hashtags={variant.hashtags}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium">淡江學生視角</p>
            <ul className="mt-2 space-y-2">
              {liveReview.map((item) => (
                <li key={item.question} className="flex gap-2 rounded-lg bg-surface px-3 py-3">
                  {item.pass ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-warn" />}
                  <div>
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{item.feedback}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => {
                if (!brand || !pack) return;
                const memory = brand.memory ?? emptyBrandMemory();
                updateBrand(brand.id, {
                  memory: {
                    ...memory,
                    learnedPatterns: lessonsFromLocalWork({
                      brand,
                      assets: [],
                      campaigns,
                      contentItems,
                      copyPacks: [pack],
                      outcomes,
                    }),
                    updatedAt: Date.now(),
                  },
                });
                toast.success("學生視角檢查已寫入 Brand Memory");
              }}
            >
              寫入 Brand Memory
            </Button>
          </div>

          {memoryHashtags.length ? (
            <div>
              <p className="text-xs font-medium">現場與 IG 記得的 hashtag</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {memoryHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="min-h-11 rounded-full bg-surface px-3 text-xs shadow-[var(--shadow-border)]"
                    onClick={() => {
                      const next = [...new Set([...(project.plan?.hashtags ?? []), tag])];
                      patchPlan(projectId, {
                        hashtags: next,
                        copyPack: pack
                          ? {
                              ...pack,
                              variants: pack.variants.map((item) =>
                                item.tone === activeTone
                                  ? { ...item, hashtags: [...new Set([...item.hashtags, tag])] }
                                  : item,
                              ),
                            }
                          : pack,
                      });
                      setCopy(projectId, { hashtags: next });
                      toast.success(`已加入 ${tag}，下次文案會優先用現場有用的 tag`);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <IgSurfaceConvert projectId={projectId} />

          {formats.length ? (
          <div>
            <p className="text-xs font-medium">複製到 Threads／LINE</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {formats.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.text);
                    toast.success(`已複製 ${item.label}`);
                  }}
                  className="min-h-20 rounded-xl bg-surface p-3 text-left shadow-[var(--shadow-border)] hover:bg-surface-2"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="mt-1 line-clamp-2 block whitespace-pre-line text-xs leading-5 text-muted">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
          ) : null}
          <Button asChild variant="ghost" className="mt-3 min-h-11">
            <Link to="/instagram" hash="preview">打開 Reels 腳本與 IG 預覽</Link>
          </Button>
          <CreationLoop current="copy" compact />
        </div>
      ) : null}
    </section>
  );
}
