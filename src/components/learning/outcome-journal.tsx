import { NotebookPen, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { applyOutcomeToPatterns, stripOutcomeLessons } from "@/lib/creative/learning";
import type { PostOutcome } from "@/lib/creative/types";
import { emptyBrandMemory } from "@/lib/studio/brand";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function OutcomeJournal({
  presetContentId = null,
  compact = false,
}: {
  presetContentId?: string | null;
  compact?: boolean;
}) {
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const outcomes = useCreative((state) => state.outcomes);
  const addOutcome = useCreative((state) => state.addOutcome);
  const removeOutcome = useCreative((state) => state.removeOutcome);
  const setContentStatus = useCreative((state) => state.setContentStatus);
  const brand = useStudio((state) => state.brands[0]);
  const updateBrand = useStudio((state) => state.updateBrand);
  const [contentId, setContentId] = useState(presetContentId ?? "none");
  const [whoShowedUp, setWhoShowedUp] = useState("");
  const [hookThatFeltTamkang, setHookThatFeltTamkang] = useState("");
  const [remember, setRemember] = useState("");
  const [markPublished, setMarkPublished] = useState(false);

  useEffect(() => {
    if (presetContentId) setContentId(presetContentId);
  }, [presetContentId]);

  const selected = contentItems.find((item) => item.id === contentId);
  const campaign = campaigns.find((item) => item.id === (selected?.campaignId ?? campaigns[0]?.id));
  const recent = useMemo(() => outcomes.slice(0, compact ? 3 : 8), [compact, outcomes]);

  function reset() {
    setWhoShowedUp("");
    setHookThatFeltTamkang("");
    setRemember("");
    setMarkPublished(false);
  }

  function save() {
    if (!whoShowedUp.trim() && !hookThatFeltTamkang.trim() && !remember.trim()) {
      toast.error("至少記下誰來了、哪句像淡江，或下次要記得的事");
      return;
    }
    if (!brand) {
      toast.error("先有 Brand Memory，才能把現場筆記寫進去");
      return;
    }
    const title = selected?.title || campaign?.name || "這則網宣";
    const outcome = addOutcome({
      contentItemId: selected?.id ?? null,
      campaignId: selected?.campaignId ?? campaign?.id ?? null,
      title,
      whoShowedUp: whoShowedUp.trim(),
      hookThatFeltTamkang: hookThatFeltTamkang.trim(),
      remember: remember.trim(),
    });
    const memory = brand.memory ?? emptyBrandMemory();
    updateBrand(brand.id, {
      memory: {
        ...memory,
        learnedPatterns: applyOutcomeToPatterns(memory.learnedPatterns, outcome),
        updatedAt: Date.now(),
      },
    });
    if (markPublished && selected) setContentStatus(selected.id, "published");
    reset();
    toast.success("已寫入 Brand Memory。這是你記下的現場，不是 Instagram 數字。");
  }

  return (
    <section
      id="outcome-journal"
      className={cn("min-w-0 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]", compact ? "" : "sm:p-5")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium">
            <NotebookPen className="size-4 shrink-0 text-accent" />
            現場筆記
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            貼出去或活動結束後，記下誰來了、哪句 Hook 真的像淡江、下次要記得什麼。會寫進 Brand Memory 已學到的規律。這裡沒有讚數、觸及或觀看次數。
          </p>
        </div>
        <Badge variant="default">本機</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div className="min-w-0">
          <Label className="mb-1.5 block">對應哪一則</Label>
          <Select value={contentId} onValueChange={setContentId}>
            <SelectTrigger className="min-h-11 w-full min-w-0">
              <SelectValue placeholder="選一則節奏，或只寫這場活動" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">這場活動整體</SelectItem>
              {contentItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}｜{item.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="誰來了／誰有反應" htmlFor="outcome-who">
          <Textarea
            id="outcome-who"
            value={whoShowedUp}
            onChange={(event) => setWhoShowedUp(event.target.value)}
            placeholder="例如：住宿生比較多，有兩個新生問要不要帶坐墊。不知道就留空，不要填假人數。"
            className="min-h-20"
          />
        </Field>
        <Field label="哪句 Hook 真的像淡江" htmlFor="outcome-hook">
          <Input
            id="outcome-hook"
            value={hookThatFeltTamkang}
            onChange={(event) => setHookThatFeltTamkang(event.target.value)}
            placeholder="貼出去之後，同學真的會停下來的那句"
            className="min-h-11"
          />
        </Field>
        <Field label="下次要記得" htmlFor="outcome-remember">
          <Textarea
            id="outcome-remember"
            value={remember}
            onChange={(event) => setRemember(event.target.value)}
            placeholder="例如：時間放 Caption 最上面，宿舍同學才找得到"
            className="min-h-20"
          />
        </Field>
        {selected ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm">這則已經貼出去或活動已結束</p>
              <p className="text-xs text-muted">只改本機節奏狀態，不會發到 Instagram。</p>
            </div>
            <Switch checked={markPublished} onCheckedChange={setMarkPublished} />
          </div>
        ) : null}
        <Button type="button" className="min-h-11 w-full" onClick={save}>
          寫入 Brand Memory
        </Button>
      </div>

      {recent.length ? (
        <ul className="mt-5 space-y-2">
          {recent.map((item) => (
            <OutcomeCard
              key={item.id}
              outcome={item}
              onRemove={(outcome) => {
                removeOutcome(outcome.id);
                if (!brand) return;
                const memory = brand.memory ?? emptyBrandMemory();
                updateBrand(brand.id, {
                  memory: {
                    ...memory,
                    learnedPatterns: stripOutcomeLessons(memory.learnedPatterns, outcome),
                    updatedAt: Date.now(),
                  },
                });
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted">還沒有現場筆記。官方 Insights 沒開通時，就從這裡學下次怎麼寫。</p>
      )}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function OutcomeCard({
  outcome,
  onRemove,
}: {
  outcome: PostOutcome;
  onRemove: (outcome: PostOutcome) => void;
}) {
  return (
    <li className="rounded-xl bg-bg p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium">{outcome.title}</p>
        <Button type="button" size="icon" variant="ghost" className="min-h-11 min-w-11 shrink-0" aria-label={`移除 ${outcome.title}`} onClick={() => onRemove(outcome)}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      {outcome.hookThatFeltTamkang ? (
        <p className="mt-1 text-xs leading-5 text-muted">像淡江：{outcome.hookThatFeltTamkang}</p>
      ) : null}
      {outcome.whoShowedUp ? (
        <p className="mt-1 text-xs leading-5 text-muted">現場：{outcome.whoShowedUp}</p>
      ) : null}
      {outcome.remember ? (
        <p className="mt-1 text-xs leading-5 text-muted">下次：{outcome.remember}</p>
      ) : null}
    </li>
  );
}
