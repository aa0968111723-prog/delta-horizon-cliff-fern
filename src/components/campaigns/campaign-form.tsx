import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { AUDIENCE_SEGMENTS } from "@/lib/zen/audience";
import { EVENT_KINDS } from "@/lib/zen/club";

const TEXTAREA =
  "w-full min-h-20 rounded-xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring";

/**
 * 活動欄位。刻意沒有負責人與審核人——這個產品假設一個人做完整套網宣。
 */
export function CampaignForm({
  value,
  onChange,
  onDone,
  doneLabel = "儲存",
}: {
  value: Campaign;
  onChange: (patch: Partial<Campaign>) => void;
  onDone?: () => void;
  doneLabel?: string;
}) {
  function toggleAudience(id: string) {
    const next = value.audienceIds.includes(id)
      ? value.audienceIds.filter((a) => a !== id)
      : [...value.audienceIds, id];
    onChange({ audienceIds: next });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-name">活動名稱</Label>
          <Input
            id="c-name"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="浮游禪光"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="c-kind">活動類型</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EVENT_KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.hint}
                onClick={() => onChange({ kind: item.id })}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  value.kind === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="c-date">活動日期</Label>
          <Input
            id="c-date"
            type="date"
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="c-time">時間</Label>
          <Input
            id="c-time"
            value={value.time}
            onChange={(e) => onChange({ time: e.target.value })}
            placeholder="19:00"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="c-loc">地點</Label>
          <Input
            id="c-loc"
            value={value.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="淡江大學 商管大樓 B302"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="c-one">一句活動介紹</Label>
        <Input
          id="c-one"
          value={value.oneLiner}
          onChange={(e) => onChange({ oneLiner: e.target.value })}
          placeholder="一小時的空白，讓開學後的自己喘一口氣。"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="c-intro">完整介紹</Label>
        <textarea
          id="c-intro"
          value={value.intro}
          onChange={(e) => onChange({ intro: e.target.value })}
          placeholder="當天會發生什麼、流程多長、需不需要準備東西。"
          className={cn(TEXTAREA, "mt-1.5")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-theme">活動主題</Label>
          <Input
            id="c-theme"
            value={value.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            placeholder="在忙起來之前，先幫自己留一小時。"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="c-pain">學生痛點</Label>
          <Input
            id="c-pain"
            value={value.painPoint}
            onChange={(e) => onChange({ painPoint: e.target.value })}
            placeholder="行程被塞滿，卻沒有一段時間是自己的"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="c-cta">主要 CTA</Label>
          <Input
            id="c-cta"
            value={value.cta}
            onChange={(e) => onChange({ cta: e.target.value })}
            placeholder="來坐一下"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="c-signup">報名連結</Label>
          <Input
            id="c-signup"
            value={value.signupUrl}
            onChange={(e) => onChange({ signupUrl: e.target.value })}
            placeholder="沒有就留空，文案會寫「直接來就好」"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">這場想打到誰</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AUDIENCE_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              title={seg.pain}
              onClick={() => toggleAudience(seg.id)}
              className={cn(
                "min-h-9 rounded-full px-3 text-xs transition-colors",
                value.audienceIds.includes(seg.id)
                  ? "bg-[color-mix(in_oklab,var(--color-warm)_24%,transparent)] text-fg"
                  : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {onDone ? (
        <div className="flex justify-end pt-1">
          <Button onClick={onDone}>{doneLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
