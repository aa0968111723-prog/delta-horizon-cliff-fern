import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BriefFields } from "@/components/assistant/brief-fields";
import { EditorAgent } from "@/components/assistant/editor-agent";
import { PlanResult } from "@/components/assistant/plan-result";
import { Button } from "@/components/ui/button";
import { describeAdapter, generateCampaignPlan, getCampaignAiStatus, type AiStatus } from "@/lib/ai/campaign";
import { toBriefInput } from "@/lib/ai/payload";
import { lessonPrompt } from "@/lib/club/insights";
import { migrateBrief } from "@/lib/studio/brief";
import type { BrandKit, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useCreative } from "@/stores/creative-store";

export function PlannerPanel({ project, brand }: { project: Project; brand: BrandKit }) {
  const updateProject = useStudio((s) => s.updateProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const igPosts = useCreative((s) => s.igPosts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);
  const brief = migrateBrief(project.brief);

  useEffect(() => {
    let alive = true;
    getCampaignAiStatus()
      .then((next) => {
        if (alive) setStatus(next);
      })
      .catch(() => {
        if (alive) setStatus(describeAdapter(false));
      });
    return () => {
      alive = false;
    };
  }, []);

  async function generate(forceMock = false) {
    if (!brief.eventName.trim() && !brief.product.trim()) {
      setError("請先填活動名稱。");
      return;
    }
    if (!brief.audience.trim()) {
      setError("請先填受眾。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const connected = status?.available ?? false;
      const result = await generateCampaignPlan({
        data: toBriefInput(brief, brand, {
          forceMock: forceMock || !connected,
          igLessons: lessonPrompt(igPosts),
        }),
      });
      if (!result.ok) {
        setError(result.error);
        setLiveFailed(result.adapter === "live");
        toast.error(result.error);
        return;
      }
      setLiveFailed(false);
      applyCampaignPlan(project.id, result.plan, brief);
      toast.success(result.adapter === "mock" ? "本機草案已套用到畫布" : "企劃已套用到畫布");
    } catch (err) {
      const message = err instanceof Error ? err.message : "企劃失敗";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const mockMode = status ? !status.available || liveFailed : false;

  return (
    <div className="space-y-6 p-4 pb-8">
      <EditorAgent projectId={project.id} compact />
      <div className="border-t border-border pt-5">
        <h2 className="text-sm font-medium">宣傳企劃</h2>
        <p className="mt-1 text-xs text-muted">給代理的活動條件。生成後會變成頁面與畫布。</p>
      </div>
      <div
        data-testid="ai-adapter-banner"
        className={cn("rounded-lg px-3 py-3", !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15")}
      >
        <p className="text-sm font-medium">{status ? status.label : "正在確認企劃服務"}</p>
        <p className="mt-1 text-xs text-muted">
          {status ? status.detail : "先確認有沒有連到 AI，不會假裝已經連線。"}
        </p>
      </div>
      <BriefFields
        brief={brief}
        compact
        onChange={(patch) => updateProject(project.id, { brief: { ...brief, ...patch } })}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {liveFailed ? (
        <Button className="w-full" variant="secondary" disabled={busy} onClick={() => void generate(true)}>
          改用本機草案
        </Button>
      ) : null}
      <Button className="w-full" data-testid="ai-generate" disabled={busy || !status} onClick={() => void generate(mockMode)}>
        {busy
          ? status?.available && !mockMode
            ? "企劃生成中…"
            : "草案撰寫中…"
          : !status
            ? "確認服務中…"
          : project.plan
            ? mockMode
              ? "重新生成本機草案"
              : "重新生成並排版"
            : mockMode
              ? "生成本機草案並排版"
              : "生成企劃並排版"}
      </Button>
      {project.plan ? <PlanResult projectId={project.id} /> : null}
    </div>
  );
}
