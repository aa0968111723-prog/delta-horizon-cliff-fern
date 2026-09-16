import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { CampaignInput, CampaignType } from "@/lib/creative/types";
import { useCreative } from "@/stores/creative-store";

const CAMPAIGN_TYPES: CampaignType[] = [
  "茶會",
  "社課",
  "招生",
  "講座",
  "工作坊",
  "社員活動",
  "其他",
];

function emptyCampaign(): CampaignInput {
  return {
    name: "",
    type: "社課",
    eventDate: "",
    eventTime: "",
    location: "",
    oneLiner: "",
    description: "",
    theme: "",
    studentPain: "",
    cta: "看看活動",
    registrationUrl: "",
  };
}

export function NewCampaignDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const createCampaign = useCreative((state) => state.createCampaign);
  const [form, setForm] = useState<CampaignInput>(emptyCampaign);
  const [error, setError] = useState("");

  function patch(patch: Partial<CampaignInput>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.eventDate || !form.location.trim()) {
      setError("請至少填活動名稱、日期與地點。");
      return;
    }
    const campaign = createCampaign({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      oneLiner: form.oneLiner.trim(),
      studentPain:
        form.studentPain.trim() ||
        "淡江學生最近正在面對課表、通勤、宿舍、人際或未來方向帶來的壓力。",
    });
    setForm(emptyCampaign());
    setError("");
    onOpenChange(false);
    onCreated(campaign.id);
    toast.success("活動與宣傳節奏已建立，可到排程改期");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>建立活動 Campaign</DialogTitle>
          <DialogDescription>
            寫下活動與學生情境，系統會先安排一版可調整的宣傳節奏。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <Field label="活動名稱">
              <Input
                value={form.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder="例如：秋夜茶會"
              />
            </Field>
            <Field label="活動類型">
              <Select value={form.type} onValueChange={(value) => patch({ type: value as CampaignType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="日期">
              <Input
                type="date"
                value={form.eventDate}
                onChange={(event) => patch({ eventDate: event.target.value })}
              />
            </Field>
            <Field label="時間">
              <Input
                value={form.eventTime}
                onChange={(event) => patch({ eventTime: event.target.value })}
                placeholder="19:00–21:00"
              />
            </Field>
            <Field label="地點">
              <Input
                value={form.location}
                onChange={(event) => patch({ location: event.target.value })}
                placeholder="淡江大學校園"
              />
            </Field>
          </div>

          <Field label="一句活動介紹">
            <Input
              value={form.oneLiner}
              onChange={(event) => patch({ oneLiner: event.target.value })}
              placeholder="學生看一眼就知道這個晚上能得到什麼"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="活動主題">
              <Input
                value={form.theme}
                onChange={(event) => patch({ theme: event.target.value })}
                placeholder="例如：在忙亂裡留一點空間"
              />
            </Field>
            <Field label="主要 CTA">
              <Input
                value={form.cta}
                onChange={(event) => patch({ cta: event.target.value })}
                placeholder="找朋友一起來"
              />
            </Field>
          </div>

          <Field label="淡江學生最近的真實情境">
            <Textarea
              value={form.studentPain}
              onChange={(event) => patch({ studentPain: event.target.value })}
              placeholder="課表、通勤、宿舍、人際、期中壓力，哪一個最接近這次活動？"
            />
          </Field>

          <Field label="完整介紹">
            <Textarea
              value={form.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="活動會做什麼、適合誰、參加前需要知道什麼"
            />
          </Field>

          <Field label="報名連結（選填）">
            <Input
              type="url"
              value={form.registrationUrl}
              onChange={(event) => patch({ registrationUrl: event.target.value })}
              placeholder="https://"
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit">建立 Campaign</Button>
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
