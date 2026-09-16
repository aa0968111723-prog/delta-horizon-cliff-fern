import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAMPAIGN_TYPE_LABELS, STUDENT_PAIN_PRESETS, type Campaign } from "@/lib/studio/campaign-types";
import { useCampaignStore } from "@/lib/studio/campaign-store";

type Draft = Omit<Campaign, "id" | "createdAt" | "updatedAt" | "relatedAssetIds" | "coverImage">;

const EMPTY: Draft = {
  name: "",
  type: "tea-party",
  date: "2026-09-24",
  time: "18:30 - 20:30",
  location: "淡江大學活動中心",
  oneLiner: "",
  description: "",
  theme: "放鬆・陪伴・安頓",
  studentPain: STUDENT_PAIN_PRESETS[0].hint,
  mainCta: "主頁連結預約席位",
  signupUrl: "https://instagram.com/tku_zenclub",
  status: "upcoming",
};

export function CampaignEditorDialog({
  open,
  onOpenChange,
  campaignId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string | null;
  onSaved?: (campaign: Campaign, generate: boolean) => void;
}) {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const addCampaign = useCampaignStore((s) => s.addCampaign);
  const updateCampaign = useCampaignStore((s) => s.updateCampaign);
  const existing = campaignId ? campaigns.find((c) => c.id === campaignId) : undefined;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      const { id: _id, createdAt: _c, updatedAt: _u, relatedAssetIds: _r, coverImage: _cover, ...rest } = existing;
      setDraft(rest);
    } else {
      setDraft(EMPTY);
    }
    setError(null);
  }, [open, existing]);

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save(generate: boolean) {
    if (!draft.name.trim()) {
      setError("請先寫活動名稱。");
      return;
    }
    if (!draft.date.trim() || !draft.location.trim()) {
      setError("請填日期與地點，學生才知道要去哪。");
      return;
    }
    const payload = {
      ...draft,
      name: draft.name.trim(),
      oneLiner: draft.oneLiner.trim() || draft.theme,
      relatedAssetIds: existing?.relatedAssetIds ?? [],
      coverImage: existing?.coverImage,
    };
    const campaign = existing
      ? (updateCampaign(existing.id, payload), { ...existing, ...payload, updatedAt: Date.now() })
      : addCampaign(payload);
    toast.success(existing ? "活動已更新" : "活動已建立");
    onOpenChange(false);
    onSaved?.(campaign, generate);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    save(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-surface text-fg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "編輯活動" : "建立社團活動"}</DialogTitle>
          <DialogDescription>一人網宣用：名稱、類型、時間地點、主題、學生痛點與 CTA。</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={submit} data-testid="campaign-form">
          <Field label="活動名稱">
            <Input
              data-testid="campaign-name"
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="例如：09/24 浮游禪光"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="類型">
              <Select value={draft.type} onValueChange={(v) => patch("type", v as Campaign["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CAMPAIGN_TYPE_LABELS) as Campaign["type"][]).map((id) => (
                    <SelectItem key={id} value={id}>
                      {CAMPAIGN_TYPE_LABELS[id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="日期">
              <Input type="date" value={draft.date} onChange={(e) => patch("date", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="時間">
              <Input value={draft.time} onChange={(e) => patch("time", e.target.value)} placeholder="18:30 - 20:30" />
            </Field>
            <Field label="地點">
              <Input
                data-testid="campaign-location"
                value={draft.location}
                onChange={(e) => patch("location", e.target.value)}
                placeholder="活動中心或覺軒花園"
              />
            </Field>
          </div>
          <Field label="主題一句話">
            <Input value={draft.theme} onChange={(e) => patch("theme", e.target.value)} placeholder="放鬆・光影・呼吸" />
          </Field>
          <Field label="學生痛點">
            <Select
              value={STUDENT_PAIN_PRESETS.find((p) => p.hint === draft.studentPain)?.id ?? "custom"}
              onValueChange={(id) => {
                const preset = STUDENT_PAIN_PRESETS.find((p) => p.id === id);
                if (preset) patch("studentPain", preset.hint);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇常見痛點" />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_PAIN_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              className="mt-2"
              value={draft.studentPain}
              onChange={(e) => patch("studentPain", e.target.value)}
              placeholder="用學生的話寫，不要公文腔"
            />
          </Field>
          <Field label="CTA">
            <Input value={draft.mainCta} onChange={(e) => patch("mainCta", e.target.value)} />
          </Field>
          <Field label="報名／主頁連結">
            <Input value={draft.signupUrl} onChange={(e) => patch("signupUrl", e.target.value)} />
          </Field>
          <Field label="一句介紹（選填）">
            <Textarea value={draft.oneLiner} onChange={(e) => patch("oneLiner", e.target.value)} />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button type="submit" variant="secondary" className="flex-1" data-testid="campaign-save">
              {existing ? "儲存活動" : "建立活動"}
            </Button>
            <Button
              type="button"
              className="flex-1"
              data-testid="campaign-save-generate"
              onClick={() => save(true)}
            >
              儲存並生成宣傳波段
            </Button>
          </div>
        </form>
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
