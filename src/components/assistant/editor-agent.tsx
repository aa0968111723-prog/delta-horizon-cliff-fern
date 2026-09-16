import { useEffect, useState } from "react";
import { toast } from "sonner";
import { actionLabel, riskOf, type EditPlan } from "@/lib/ai/actions";
import { describeEditAdapter, interpretEditorCommand } from "@/lib/ai/edit";
import { interpretMock, isRecognizedPlan } from "@/lib/ai/edit-mock";
import { executeEditPlan } from "@/lib/ai/execute";
import { buildScene } from "@/lib/ai/scene";
import { describeAdapter, getCampaignAiStatus, type AiStatus } from "@/lib/ai/campaign";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

const EXAMPLES = [
  "把標題放大並移到上方中央",
  "將這張圖換成比較明亮的照片",
  "把整體改成淡江學生喜歡的活潑風格",
  "轉成限時動態尺寸",
  "刪除左下角資訊",
  "增加活動日期與報名 QR Code",
  "讓畫面更有留白",
  "產生三個不同排版版本",
];

type Props = {
  projectId: string;
  compact?: boolean;
};

type LastEdit = {
  summary: string;
  notes: string[];
  beforeId: string | null;
  afterId: string | null;
  changed: boolean;
};

export function EditorAgent({ projectId, compact }: Props) {
  const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const selectedId = useStudio((s) => s.editor.selectedId);
  const restoreSnapshot = useStudio((s) => s.restoreSnapshot);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);
  const [pending, setPending] = useState<EditPlan | null>(null);
  const [last, setLast] = useState<LastEdit | null>(null);
  const [compare, setCompare] = useState<"before" | "after">("after");

  const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : undefined;
  const scene = project && brand ? buildScene({ project, brand, assets, selectedId }) : null;

  useEffect(() => {
    let alive = true;
    getCampaignAiStatus()
      .then((next) => {
        if (alive) setStatus(describeEditAdapter(next.available));
      })
      .catch(() => {
        if (alive) setStatus(describeEditAdapter(false));
      });
    return () => {
      alive = false;
    };
  }, []);

  async function interpret(forceMock = false) {
    const text = command.trim();
    if (!text) {
      setError("請先寫要對目前畫面做的事。");
      return;
    }
    const state = useStudio.getState();
    const current = state.projects.find((p) => p.id === projectId);
    const currentBrand = current
      ? (state.brands.find((b) => b.id === current.brandId) ?? state.brands[0])
      : undefined;
    if (!current || !currentBrand) {
      setError("找不到專案，無法讀畫布。");
      return;
    }
    setBusy(true);
    setError(null);
    setPending(null);
    try {
      const nextScene = buildScene({
        project: current,
        brand: currentBrand,
        assets: state.assets,
        selectedId: state.editor.selectedId,
      });
      const local = interpretMock(text, nextScene);
      if (local.actions.length) {
        setLiveFailed(false);
        const plan = { ...local, risk: local.risk ?? riskOf(local.actions) };
        if (plan.risk === "large") {
          setPending(plan);
          return;
        }
        await apply(plan);
        return;
      }
      if (isRecognizedPlan(local)) {
        setLast({
          summary: local.summary,
          notes: local.notes ?? ["畫布已是目標狀態，沒有改動。"],
          beforeId: null,
          afterId: null,
          changed: false,
        });
        toast.message(local.summary);
        return;
      }
      const connected = status?.available ?? false;
      if (!connected || forceMock) {
        setLast({
          summary: local.summary,
          notes: local.notes ?? ["沒有可執行的畫布動作。"],
          beforeId: null,
          afterId: null,
          changed: false,
        });
        toast.message(local.summary);
        return;
      }
      const result = await interpretEditorCommand({
        data: { command: text, scene: nextScene, forceMock: false },
      });
      if (!result.ok) {
        setError(result.error);
        setLiveFailed(result.adapter === "live");
        toast.error(result.error);
        return;
      }
      setLiveFailed(false);
      const plan = { ...result.plan, risk: result.plan.risk ?? riskOf(result.plan.actions) };
      if (!plan.actions.length) {
        setLast({
          summary: plan.summary,
          notes: plan.notes ?? ["沒有可執行的畫布動作。"],
          beforeId: null,
          afterId: null,
          changed: false,
        });
        toast.message(plan.summary);
        return;
      }
      if (plan.risk === "large") {
        setPending(plan);
        return;
      }
      await apply(plan);
    } catch (err) {
      const message = err instanceof Error ? err.message : "操作失敗";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function apply(plan: EditPlan) {
    setBusy(true);
    setError(null);
    try {
      const result = await executeEditPlan(projectId, plan, command);
      setPending(null);
      setCompare("after");
      setLast({
        summary: plan.summary,
        notes: result.notes,
        beforeId: result.beforeId,
        afterId: result.afterId,
        changed: result.changed,
      });
      if (!result.changed) {
        toast.message(result.notes[0] ?? "畫布沒有改動");
        return;
      }
      toast.success(plan.summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "無法套用到畫布";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (!project || !brand || !scene) {
    return (
      <div className="rounded-lg bg-surface-2 px-3 py-3 text-sm text-muted">
        先開啟一個專案，才能讀畫布、圖層與品牌。
      </div>
    );
  }

  const mockMode = status ? !status.available || liveFailed : false;
  const banner = status ?? describeAdapter(false);
  const selected = scene.layers.find((l) => l.id === scene.selectedId);

  return (
    <div className="space-y-3" data-testid="editor-agent">
      <div>
        <h2 className="text-sm font-medium">操作畫布</h2>
        <p className="mt-1 text-xs text-muted">
          先讀目前頁面、圖層、品牌與選取物件，再執行。小改直接套用；刪多層或大改會先預覽。
        </p>
      </div>
      <div
        className={cn(
          "rounded-lg px-3 py-3",
          !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15",
        )}
      >
        <p className="text-sm font-medium">{status ? banner.label : "正在確認畫布指令"}</p>
        <p className="mt-1 text-xs text-muted">
          {status ? banner.detail : "先確認有沒有連到 AI，不會假裝已經改好畫布。"}
        </p>
      </div>
      <p className="text-xs text-muted" data-testid="editor-scene">
        目前：{scene.formatName} · 第 {scene.slideIndex + 1}／{scene.slideCount} 頁 · {scene.layers.length}{" "}
        個圖層 · {selected ? `已選「${selected.name}」` : "未選取"} · {scene.brand.name}
      </p>
      <Textarea
        data-testid="editor-command"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="例如：把標題放大並移到上方中央"
        className={compact ? "min-h-20" : "min-h-24"}
        disabled={busy}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void interpret(mockMode);
        }}
      />
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((item, index) => (
          <button
            key={item}
            type="button"
            data-testid={`editor-chip-${index}`}
            className="min-h-11 rounded-full bg-surface px-3 text-left text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg disabled:opacity-50"
            disabled={busy}
            onClick={() => setCommand(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {liveFailed ? (
        <Button className="w-full" variant="secondary" disabled={busy} onClick={() => void interpret(true)}>
          改用本機規則
        </Button>
      ) : null}
      <Button
        className="w-full"
        data-testid="editor-run"
        disabled={busy || !status}
        onClick={() => void interpret(mockMode)}
      >
        {busy ? "讀畫布並執行中…" : !status ? "確認服務中…" : mockMode ? "用本機規則改畫布" : "讀畫布並執行"}
      </Button>

      {pending ? (
        <div className="space-y-3 rounded-lg bg-warn/15 p-3" data-testid="editor-preview">
          <p className="text-sm font-medium">大幅修改預覽</p>
          <p className="text-sm">{pending.summary}</p>
          <ul className="space-y-1 text-sm text-muted">
            {pending.actions.map((action, i) => (
              <li key={`${action.type}-${i}`}>· {actionLabel(action)}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button className="flex-1" data-testid="editor-apply-preview" disabled={busy} onClick={() => void apply(pending)}>
              套用到畫布
            </Button>
            <Button className="flex-1" variant="secondary" disabled={busy} onClick={() => setPending(null)}>
              取消
            </Button>
          </div>
        </div>
      ) : null}

      {last ? (
        <div className="space-y-2 rounded-lg bg-bg p-3" data-testid="editor-last">
          <p className="text-sm font-medium">{last.changed ? last.summary : "沒有改動畫布"}</p>
          <ul className="space-y-1 text-xs text-muted">
            {last.notes.map((note, i) => (
              <li key={`${i}-${note}`}>· {note}</li>
            ))}
          </ul>
          {last.changed ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={compare === "before" ? "default" : "secondary"}
                data-testid="editor-compare-before"
                onClick={() => {
                  if (last.beforeId) restoreSnapshot(project.id, last.beforeId);
                  else undo(project.id);
                  setCompare("before");
                }}
              >
                看操作前
              </Button>
              <Button
                size="sm"
                variant={compare === "after" ? "default" : "secondary"}
                data-testid="editor-compare-after"
                onClick={() => {
                  if (last.afterId) restoreSnapshot(project.id, last.afterId);
                  else redo(project.id);
                  setCompare("after");
                }}
              >
                看 AI 結果
              </Button>
              <Button
                size="sm"
                variant="secondary"
                data-testid="editor-undo"
                onClick={() => {
                  if (last.beforeId) restoreSnapshot(project.id, last.beforeId);
                  else undo(project.id);
                  setCompare("before");
                  toast.message("已撤銷此次 AI 操作");
                }}
              >
                撤銷此次
              </Button>
              <Button
                size="sm"
                variant="secondary"
                data-testid="editor-redo"
                onClick={() => {
                  if (last.afterId) restoreSnapshot(project.id, last.afterId);
                  else redo(project.id);
                  setCompare("after");
                  toast.message("已重做此次 AI 操作");
                }}
              >
                重做此次
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
