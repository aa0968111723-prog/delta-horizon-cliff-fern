import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { ConvertPanel } from "@/components/create/convert-panel";
import { PackResult } from "@/components/create/pack-result";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { generateCopyPack } from "@/lib/ai/copy";
import { generateCreativePack } from "@/lib/ai/pack";
import { toBriefInput } from "@/lib/ai/payload";
import { migrateBrief } from "@/lib/studio/brief";
import type { CopyPack } from "@/lib/zen/types";
import { igDnaBlock } from "@/lib/zen/insights";
import { applyStudentRewrite } from "@/lib/zen/review";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function CreateHub() {
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const lastPack = useCreative((s) => s.lastPack);
  const setLastPack = useCreative((s) => s.setLastPack);
  const memory = useCreative((s) => s.memory);
  const igPosts = useCreative((s) => s.igPosts);
  const [idea, setIdea] = useState("下週有一場茶會");
  const [busy, setBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyPack, setCopyPack] = useState<CopyPack | null>(null);
  const [copyStyle, setCopyStyle] = useState("一般版");
  const brand = brands[0];

  async function runPack() {
    if (!brand) return;
    setBusy(true);
    try {
      const brief = migrateBrief({
        eventName: idea.slice(0, 40),
        product: idea,
        audience: "淡江大學學生",
        location: "淡江大學淡水校園",
        goal: "awareness",
        notes: idea,
        deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
      });
      const result = await generateCreativePack({
        data: {
          ...toBriefInput(brief, brand, { dnaNotes: igDnaBlock(igPosts) }),
          memoryNotes: memory.map((m) => m.subtitle).join("\n"),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setLastPack(result.pack);
      toast.success("已生成 3 個方向與完整宣傳");
    } finally {
      setBusy(false);
    }
  }

  async function runCopy() {
    setCopyBusy(true);
    try {
      const result = await generateCopyPack({
        data: { idea, kind: "event", dnaNotes: igDnaBlock(igPosts) },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCopyPack(result.pack);
      setCopyStyle(result.pack.variants[0]?.style ?? "一般版");
    } finally {
      setCopyBusy(false);
    }
  }

  function applyDirection(directionId?: string) {
    if (!lastPack || !brand) return;
    const dir = lastPack.directions?.find((d) => d.id === directionId);
    const plan = dir
      ? { ...lastPack.plan, headline: dir.headline || lastPack.plan.headline, visualDirection: dir.concept }
      : lastPack.plan;
    const brief = migrateBrief({
      eventName: lastPack.campaignName,
      audience: "淡江大學學生",
      location: "淡江大學淡水校園",
      deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
    });
    const project = createProject({
      name: lastPack.campaignName,
      brandId: brand.id,
      formatId: "feed-portrait",
      brief,
      templateId: plan.templateId,
    });
    applyCampaignPlan(project.id, plan, brief);
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 創作"
        title="從一句話開始"
        description="前台只顯示找到什麼、生成什麼、下一步。不會出現 Agent 管理器。"
      />
      <div className="mt-6 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)] md:p-6">
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="下週有一場茶會" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void runPack()}>
            {busy ? "正在找素材、想方向…" : "AI 生成完整宣傳"}
          </Button>
          <Button variant="secondary" disabled={copyBusy} onClick={() => void runCopy()}>
            只寫文案
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/create/image">打開 Image Studio</Link>
          </Button>
        </div>
      </div>

      {lastPack ? (
        <section className="mt-8">
          <PackResult pack={lastPack} onApply={applyDirection} />
          <ConvertPanel pack={lastPack} />
        </section>
      ) : null}

      {copyPack ? (
        <section className="mt-8 rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">IG Copy AI</p>
          <h2 className="mt-2 font-display text-2xl">{copyPack.hook}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {copyPack.variants.find((v) => v.style === copyStyle)?.text ?? copyPack.body}
          </p>
          <p className="mt-3 text-xs text-muted">{copyPack.cta} · {copyPack.hashtags.join(" ")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {copyPack.variants.map((v) => (
              <button
                key={v.style}
                type="button"
                onClick={() => setCopyStyle(v.style)}
                className={`rounded-full px-3 py-2 text-xs ${copyStyle === v.style ? "bg-accent text-accent-fg" : "bg-bg"}`}
              >
                {v.style}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            學生視角：停下？{copyPack.studentReview.wouldStop} 宗教？{copyPack.studentReview.tooReligious} AI？
            {copyPack.studentReview.tooAi}
          </p>
          {copyPack.studentReview.rewriteHook && copyPack.studentReview.rewriteHook !== copyPack.hook ? (
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() =>
                setCopyPack((current) => (current ? applyStudentRewrite(current) : current))
              }
            >
              用學生視角改第一句
            </Button>
          ) : Array.isArray(copyPack.studentReview.notes) &&
            copyPack.studentReview.notes.some((line) => line.startsWith("原第一句")) ? (
            <p className="mt-3 text-xs text-muted">已自動改成學生第一句</p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium">活動需求 → 畫布</h2>
        <div className="rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)] md:p-6">
          <AssistantForm variant="page" />
        </div>
      </section>
    </main>
  );
}
