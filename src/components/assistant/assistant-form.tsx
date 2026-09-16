import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BriefFields } from "@/components/assistant/brief-fields";
import { BrandMemoryStrip } from "@/components/assistant/brand-memory-strip";
import { CanvasEditor } from "@/components/assistant/canvas-editor";
import { CopyStudio } from "@/components/assistant/copy-studio";
import { IgSurfaceConvert } from "@/components/assistant/ig-surface-convert";
import { PlanResult } from "@/components/assistant/plan-result";
import { ErrorState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreationLoop } from "@/components/shared/creation-loop";
import { describeAdapter, generateCampaignPlan, getCampaignAiStatus, type AiStatus } from "@/lib/ai/campaign";
import { campaignToBrief } from "@/lib/creative/brief-from-campaign";
import { memoryInjectionHints } from "@/lib/creative/memory";
import { hashtagsFromOutcomes, mergeHashtagMemory } from "@/lib/creative/learning";
import { toBriefInput } from "@/lib/ai/payload";
import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { emptyBrief, formatsFromBrief, migrateBrief } from "@/lib/studio/brief";
import { FORMATS } from "@/lib/studio/formats";
import type { Brief, FormatId, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

type Props = {
  variant?: "page" | "sheet";
  projectId?: string | null;
};

export function AssistantForm({ variant = "page", projectId }: Props) {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const setLastProjectId = useStudio((s) => s.setLastProjectId);
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const creativePreset = useUi((s) => s.creativePreset);
  const contentLinkId = useUi((s) => s.contentLinkId);
  const creationDesk = useUi((s) => s.creationDesk);
  const setCreationDesk = useUi((s) => s.setCreationDesk);
  const clearCreativePreset = useUi((s) => s.clearCreativePreset);
  const clearContentLink = useUi((s) => s.clearContentLink);
  const linkProject = useCreative((s) => s.linkProject);
  const campaigns = useCreative((s) => s.campaigns);
  const activeCampaignId = useCreative((s) => s.activeCampaignId);
  const outcomes = useCreative((s) => s.outcomes);
  const assets = useStudio((s) => s.assets);
  const styleReferences = useConnectionStore((s) => s.styleReferences);
  const instagramHashtags = mergeHashtagMemory(
    hashtagsFromOutcomes(outcomes),
    hashtagsFromInstagramMemory(useConnectionStore((s) => s.instagramItems)),
  );

  const existing = projectId ? projects.find((p) => p.id === projectId) : undefined;
  const [targetId, setTargetId] = useState<string>(() => (useUi.getState().creativePreset ? "new" : (existing?.id ?? "new")));
  const [brandId, setBrandId] = useState(existing?.brandId ?? brands[0]?.id ?? "");
  const [formatId, setFormatId] = useState<FormatId>(existing?.activeFormatId ?? "feed-portrait");
  const [name, setName] = useState(() => useUi.getState().creativePreset?.eventName || existing?.name || "");
  const [brief, setBrief] = useState<Brief>(() => {
    const preset = useUi.getState().creativePreset;
    if (preset) return migrateBrief({ ...emptyBrief(), ...preset });
    if (existing) return migrateBrief(existing.brief);
    return emptyBrief();
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(() => (useUi.getState().creativePreset ? null : (existing?.plan ? existing.id : null)));
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);

  const brand = brands.find((b) => b.id === brandId) ?? brands[0];
  const resultProject: Project | undefined = doneId
    ? projects.find((p) => p.id === doneId)
    : targetId !== "new"
      ? projects.find((p) => p.id === targetId)
      : undefined;

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

  useEffect(() => {
    if (!creativePreset) return;
    const preset = migrateBrief({ ...emptyBrief(), ...creativePreset });
    setTargetId("new");
    setDoneId(null);
    setBrief(preset);
    setName(preset.eventName);
    clearCreativePreset();
  }, [creativePreset, clearCreativePreset]);

  useEffect(() => {
    if (useUi.getState().creativePreset) return;
    if (projectId) return;
    if (brief.eventName.trim() || brief.product.trim()) return;
    const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];
    if (!campaign) return;
    const preset = migrateBrief({ ...emptyBrief(), ...campaignToBrief(campaign) });
    setTargetId("new");
    setDoneId(null);
    setBrief(preset);
    setName(preset.eventName);
    // Only fill an empty form once — do not overwrite a student who clears the name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (useUi.getState().creativePreset) return;
    if (!projectId) return;
    const project = useStudio.getState().projects.find((item) => item.id === projectId);
    if (!project) return;
    setTargetId(project.id);
    setDoneId(project.plan ? project.id : null);
    setBrief(migrateBrief(project.brief));
    setBrandId(project.brandId);
    setFormatId(project.activeFormatId);
    setName(project.name);
  }, [projectId]);

  function patchBrief(patch: Partial<Brief>) {
    setBrief((b) => ({ ...b, ...patch, deliverables: patch.deliverables ?? b.deliverables }));
  }

  function onTargetChange(id: string) {
    setTargetId(id);
    setDoneId(id === "new" ? null : id);
    if (id === "new") return;
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setBrief(migrateBrief(project.brief));
    setBrandId(project.brandId);
    setFormatId(project.activeFormatId);
    setName(project.name);
  }

  async function generate(forceMock = false) {
    if (!brand) {
      setError("請先在品牌中心建立品牌。");
      return;
    }
    if (!brief.eventName.trim() && !brief.product.trim()) {
      setError("請先填活動名稱，創作才有依據。");
      return;
    }
    if (!brief.audience.trim()) {
      setError("請先填受眾，創作才有依據。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const connected = status?.available ?? false;
      const payload = toBriefInput(brief, brand, {
        forceMock: forceMock || !connected,
        assets,
        campaigns,
        styleReferences,
        instagramHashtags,
        outcomeHashtags: hashtagsFromOutcomes(outcomes),
      });
      const result = await generateCampaignPlan({ data: payload });
      if (!result.ok) {
        setError(result.error);
        setLiveFailed(result.adapter === "live");
        toast.error(result.error);
        return;
      }
      setLiveFailed(false);
      const nextBrief = {
        ...brief,
        eventName: brief.eventName.trim() || result.plan.campaignName,
        product: brief.product.trim() || result.plan.campaignName,
      };
      const nextFormat = formatsFromBrief(nextBrief, formatId)[0] ?? formatId;
      let project: Project;
      if (targetId === "new") {
        project = createProject({
          name: name.trim() || result.plan.campaignName,
          brandId: brand.id,
          formatId: nextFormat,
          brief: nextBrief,
          templateId: result.plan.templateId,
        });
      } else {
        const current = projects.find((p) => p.id === targetId);
        if (!current) throw new Error("找不到這則網宣");
        project = current;
      }
      applyCampaignPlan(project.id, result.plan, nextBrief);
      if (contentLinkId) {
        linkProject(contentLinkId, project.id);
        clearContentLink();
      }
      setLastProjectId(project.id);
      setDoneId(project.id);
      setTargetId(project.id);
      setBrief(nextBrief);
      setCreationDesk("copy");
      toast.success(result.adapter === "mock" ? "本機草案已套用到畫布，接著寫文案" : "企劃已套用到畫布，接著寫文案");
    } catch (err) {
      const message = err instanceof Error ? err.message : "企劃失敗";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  function openEditor(id: string) {
    setAssistantOpen(false);
    void navigate({ to: "/studio/$projectId", params: { projectId: id } });
  }

  const mockMode = status ? !status.available || liveFailed : false;
  const statusLabel = status ?? describeAdapter(false);

  const desks = [
    { id: "plan" as const, label: "企劃", hint: "活動與概念" },
    { id: "copy" as const, label: "文案", hint: "Hook 與貼文" },
    { id: "art" as const, label: "畫面", hint: "尺寸與改圖" },
  ];

  return (
    <div className={cn("min-w-0 space-y-5", variant === "page" && "pb-8")}>
      <BrandMemoryStrip compact={variant === "sheet"} />

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1" data-testid="creation-desks">
        {desks.map((desk) => (
          <button
            key={desk.id}
            type="button"
            onClick={() => setCreationDesk(desk.id)}
            className={cn(
              "min-h-14 min-w-24 shrink-0 rounded-xl px-3 py-2 text-left",
              creationDesk === desk.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
            )}
          >
            <span className="block text-sm font-medium">{desk.label}</span>
            <span className={cn("mt-0.5 block text-xs", creationDesk === desk.id ? "text-accent-fg/80" : "text-subtle")}>
              {desk.hint}
            </span>
          </button>
        ))}
      </div>

      {creationDesk === "plan" ? (
        <>
          <div
            data-testid="ai-adapter-banner"
            className={cn("rounded-lg px-3 py-3", !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15")}
          >
            <p className="text-sm font-medium">{status ? statusLabel.label : "正在確認企劃服務"}</p>
            <p className="mt-1 break-words text-xs leading-5 text-muted">
              {status ? statusLabel.detail : "先確認有沒有連到 AI，不會假裝已經連線。"}
              {brand
                ? ` 已帶入：${memoryInjectionHints({
                    brand,
                    assets,
                    campaigns,
                    styleReferences,
                    instagramHashtags,
                    outcomeHashtags: hashtagsFromOutcomes(outcomes),
                  }).join("、") || "Brand Memory 預設校園情境"}。`
                : ""}
            </p>
          </div>

          <div className={variant === "page" ? "hidden" : undefined}>
            <h2 className="text-sm font-medium">這則網宣要說什麼</h2>
            <p className="text-sm text-muted">寫清楚活動、對象與要產出的尺寸，再生成可編輯的企劃。</p>
          </div>

          <BriefFields brief={brief} onChange={patchBrief} compact={variant === "sheet"} />

          <div className={cn("grid gap-3", brands.length > 1 ? "sm:grid-cols-2" : "")}>
            {brands.length > 1 ? (
              <Field label="品牌記憶">
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder="淡江大學禪學社" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Field label="主尺寸">
              <Select value={formatId} onValueChange={(v) => setFormatId(v as FormatId)}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} · {f.short}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="套用到哪一則">
            <Select value={targetId} onValueChange={onTargetChange}>
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">建立新的一則網宣</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {targetId === "new" ? (
            <Field label="這則名稱（選填）">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="空白則用活動名稱" className="min-h-11" />
            </Field>
          ) : null}

          {error ? (
            <ErrorState
              message={error}
              onRetry={() => void generate(false)}
            />
          ) : null}

          {liveFailed ? (
            <Button className="w-full min-h-11" variant="secondary" disabled={busy} onClick={() => void generate(true)}>
              改用本機草案
            </Button>
          ) : null}

          <Button className="w-full min-h-11" data-testid="ai-generate" disabled={busy || !status} onClick={() => void generate(mockMode)}>
            {busy
              ? status?.available && !mockMode
                ? "企劃生成中…"
                : "草案撰寫中…"
              : !status
                ? "確認服務中…"
              : resultProject?.plan
                ? mockMode
                  ? "重新生成本機草案"
                  : "重新生成並套用"
                : mockMode
                  ? "生成本機草案並排版"
                  : "生成企劃並排版"}
          </Button>

          {busy ? (
            <p className="text-center text-xs text-muted">
              {status?.available && !mockMode
                ? "正在依 Brand Memory 寫概念、文案與頁面，並套進畫布。"
                : "用本機規則寫一版可編輯草案，不是線上模型回覆。"}
            </p>
          ) : null}

          {resultProject?.plan ? (
            <>
              <CreationLoop current="copy" />
              <PlanResult
                projectId={resultProject.id}
                onOpenEditor={openEditor}
                onWriteCopy={() => setCreationDesk("copy")}
                onEditArt={() => setCreationDesk("art")}
              />
            </>
          ) : (
            <CreationLoop current="campaign" />
          )}
        </>
      ) : null}

      {creationDesk === "copy" ? (
        resultProject?.plan ? (
          <CopyStudio projectId={resultProject.id} />
        ) : (
          <EmptyDesk
            title="還不能寫文案"
            detail="先在企劃填活動與受眾，生成一版概念。Brand Memory 已經在上面，不用再開一個聊天視窗。"
            actionLabel="回企劃"
            onAction={() => setCreationDesk("plan")}
          />
        )
      ) : null}

      {creationDesk === "art" ? (
        resultProject ? (
          <div className="space-y-5">
            <IgSurfaceConvert projectId={resultProject.id} />
            <CanvasEditor projectId={resultProject.id} compact={variant === "sheet"} />
            <Button className="w-full min-h-11" variant="secondary" onClick={() => openEditor(resultProject.id)}>
              打開 Studio 細修
            </Button>
          </div>
        ) : (
          <EmptyDesk
            title="還沒有可改的畫面"
            detail="先生成企劃，畫布才有這則網宣。這裡是改畫面，不是對話機器人。"
            actionLabel="回企劃"
            onAction={() => setCreationDesk("plan")}
          />
        )
      ) : null}
    </div>
  );
}

function EmptyDesk({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
      <Button className="mt-4 min-h-11 w-full" variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
