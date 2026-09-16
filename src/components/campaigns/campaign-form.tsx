import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import type { Campaign, CampaignPainPoint, CampaignType } from "@/lib/studio/types";
import { todayIso } from "@/lib/zen/context";
import { CAMPAIGN_TYPES, PAIN_POINTS } from "@/lib/zen/labels";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type Draft = Omit<Campaign, "id" | "createdAt" | "updatedAt" | "strategy">;

function emptyDraft(): Draft {
  return {
    name: "",
    type: "tea",
    date: todayIso(),
    time: "19:00",
    location: "",
    oneLiner: "",
    description: "",
    theme: "",
    painPoints: ["belonging"],
    cta: "直接來就好",
    signupUrl: "",
    coverAssetId: null,
    assetIds: [],
  };
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  onSaved?: (campaign: Campaign) => void;
}) {
  const createCampaign = useStudio((s) => s.createCampaign);
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const campaigns = useStudio((s) => s.campaigns);
  const assets = useStudio((s) => s.assets);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const images = assets.filter((a) => a.kind !== "logo" && a.category !== "icon").slice(0, 24);
  const urls = useAssetUrls(images.map((a) => a.id));

  useEffect(() => {
    if (!open) return;
    if (campaign) {
      const { id: _id, createdAt: _c, updatedAt: _u, strategy: _s, ...rest } = campaign;
      setDraft(rest);
    } else {
      setDraft(emptyDraft());
    }
  }, [open, campaign]);

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function togglePain(id: CampaignPainPoint) {
    setDraft((d) => ({
      ...d,
      painPoints: d.painPoints.includes(id) ? d.painPoints.filter((p) => p !== id) : [...d.painPoints, id].slice(0, 4),
    }));
  }

  function save() {
    if (!draft.name.trim()) return;
    if (campaign) {
      updateCampaign(campaign.id, draft);
      const next = campaigns.find((c) => c.id === campaign.id);
      onSaved?.({ ...(next ?? campaign), ...draft });
    } else {
      const created = createCampaign(draft);
      onSaved?.(created);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{campaign ? "編輯活動" : "建立活動"}</DialogTitle>
          <DialogDescription>只要填活動本身。誰負責、誰審核都不需要，你就是整個團隊。</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label="活動名稱">
            <Input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder="例：浮游禪光" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="活動類型">
              <Select value={draft.type} onValueChange={(v) => patch("type", v as CampaignType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} · {t.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="日期">
              <Input type="date" value={draft.date} onChange={(e) => patch("date", e.target.value)} />
            </Field>
            <Field label="時間">
              <Input value={draft.time} onChange={(e) => patch("time", e.target.value)} placeholder="19:00–21:00" />
            </Field>
            <Field label="地點">
              <Input value={draft.location} onChange={(e) => patch("location", e.target.value)} placeholder="B302 教室 / 社辦" />
            </Field>
          </div>
          <Field label="一句活動介紹">
            <Input value={draft.oneLiner} onChange={(e) => patch("oneLiner", e.target.value)} placeholder="一個晚上，一杯茶，什麼都不用做。" />
          </Field>
          <Field label="完整介紹（選填）">
            <Textarea rows={3} value={draft.description} onChange={(e) => patch("description", e.target.value)} placeholder="流程、有什麼、第一次來會怎樣…" />
          </Field>
          <Field label="活動主題（選填）">
            <Input value={draft.theme} onChange={(e) => patch("theme", e.target.value)} placeholder="在新學期的浮動裡，找一個可以停下來的晚上" />
          </Field>
          <Field label="這篇要接住誰（學生痛點，最多 4 個）">
            <div className="flex flex-wrap gap-2">
              {PAIN_POINTS.map((p) => {
                const on = draft.painPoints.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePain(p.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm transition-colors",
                      on ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg hover:bg-border",
                    )}
                    title={p.line}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="主要 CTA">
              <Input value={draft.cta} onChange={(e) => patch("cta", e.target.value)} placeholder="直接來就好" />
            </Field>
            <Field label="報名連結（選填）">
              <Input value={draft.signupUrl} onChange={(e) => patch("signupUrl", e.target.value)} placeholder="https://forms…" />
            </Field>
          </div>
          {images.length ? (
            <Field label="封面素材（選填）">
              <ul className="grid grid-cols-6 gap-2">
                {images.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => patch("coverAssetId", draft.coverAssetId === a.id ? null : a.id)}
                      className={cn(
                        "block aspect-square w-full overflow-hidden rounded-lg bg-glow-card ring-2 ring-transparent",
                        draft.coverAssetId === a.id && "ring-accent",
                      )}
                      aria-label={a.name}
                    >
                      {urls[a.id] ? <img src={urls[a.id]} alt="" className="size-full object-cover" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </Field>
          ) : null}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={save} disabled={!draft.name.trim()}>
            {campaign ? "儲存" : "建立活動"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
