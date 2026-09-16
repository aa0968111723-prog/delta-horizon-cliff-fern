import { AlertCircle, CheckCircle2, Copy, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateCopyPack } from "@/lib/ai/copy";
import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { buildBrandMemoryPrompt } from "@/lib/creative/memory";
import type { CopyTone } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";

export function CopyStudio({ projectId }: { projectId: string }) {
  const project = useStudio((state) => state.projects.find((item) => item.id === projectId));
  const brand = useStudio((state) => state.brands.find((item) => item.id === project?.brandId));
  const patchPlan = useStudio((state) => state.patchPlan);
  const instagramItems = useConnectionStore((state) => state.instagramItems);
  const styleReferences = useConnectionStore((state) => state.styleReferences);
  const memoryHashtags = hashtagsFromInstagramMemory(instagramItems);
  const [busy, setBusy] = useState(false);
  const [activeTone, setActiveTone] = useState<CopyTone>("學生版");
  const pack = project?.plan?.copyPack;

  if (!project || !project.plan || !brand) return null;

  async function generate() {
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
          brandMemory: `${buildBrandMemoryPrompt(brand, styleReferences)}${memoryHashtags.length ? `\nIG 內容記憶 hashtags：${memoryHashtags.join(" ")}` : ""}`,
          hashtags: [...new Set([...(project.plan.hashtags ?? []), ...memoryHashtags])].slice(0, 20),
          forceMock: false,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      patchPlan(projectId, { copyPack: result.pack });
      setActiveTone("學生版");
      toast.success(result.pack.source === "live" ? "AI Copy Pack 已生成" : "本機 Copy Pack 草案已生成");
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
    setActiveTone(tone);
    toast.success(`已套用${tone}`);
  }

  const variant = pack?.variants.find((item) => item.tone === activeTone) ?? pack?.variants[0];
  const formats = pack
    ? [
        { label: "Threads", text: pack.threads },
        { label: "LINE", text: pack.line },
        { label: "Story", text: pack.storyFrames.map((item, index) => `${index + 1}. ${item}`).join("\n\n") },
        { label: "Carousel", text: pack.carouselPages.map((item, index) => `Page ${index + 1}\n${item}`).join("\n\n") },
        { label: "Reels Script", text: pack.reelsScript.map((item) => `${item.timing}\n畫面：${item.visual}\n字幕：${item.subtitle}\n旁白：${item.voiceover}\n轉場：${item.transition}\n素材：${item.assetSuggestion}`).join("\n\n") },
      ]
    : [];

  return (
    <section className="rounded-xl bg-bg p-4" data-testid="copy-studio">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg">IG Copy Studio</h3>
            {pack ? <Badge variant={pack.source === "live" ? "success" : "warn"}>{pack.source === "live" ? "AI" : "本機草案"}</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            一次產生六種語氣、學生視角檢查與跨平台版本。只有按下按鈕才會呼叫 AI。
            {memoryHashtags.length ? ` 已帶入 IG 內容記憶 hashtags：${memoryHashtags.slice(0, 5).join(" ")}` : ""}
          </p>
        </div>
        <Button size="sm" disabled={busy} onClick={() => void generate()}>
          <Sparkles className="size-4" />
          {busy ? "生成中…" : pack ? "重新生成" : "生成 Copy Pack"}
        </Button>
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
                  "min-h-10 shrink-0 rounded-full px-3 text-xs",
                  item.tone === activeTone ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                )}
              >
                {item.tone}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">HOOK</p>
            <p className="mt-2 font-display text-xl leading-snug">{variant.hook}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{variant.body}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-accent">{variant.cta}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`);
                  toast.success("已複製這個版本");
                }}
              >
                <Copy className="size-4" />複製
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium">淡江學生視角</p>
            <ul className="mt-2 space-y-2">
              {pack.studentReview.map((item) => (
                <li key={item.question} className="flex gap-2 rounded-lg bg-surface px-3 py-3">
                  {item.pass ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-warn" />}
                  <div>
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{item.feedback}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {memoryHashtags.length ? (
            <div>
              <p className="text-xs font-medium">從 IG 內容記憶建議</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {memoryHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="min-h-10 rounded-full bg-surface px-3 text-xs shadow-[var(--shadow-border)]"
                    onClick={() => {
                      const next = [...new Set([...(project.plan?.hashtags ?? []), tag])];
                      patchPlan(projectId, { hashtags: next });
                      toast.success(`已加入 ${tag}`);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium">一鍵轉換</p>
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
          <Button asChild variant="ghost" className="mt-3">
            <Link to="/instagram">打開 Reels 工作流與 IG 預覽</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
