import { Plus, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StorageNotice } from "@/components/shared/storage-notice";
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
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { AssetUploadError, decodeAssetImage } from "@/lib/studio/asset-upload";
import { LOGO_USAGE, logoUsageLabel } from "@/lib/studio/brand";
import { STUDIO_FONTS } from "@/lib/studio/fonts";
import { uid } from "@/lib/studio/ids";
import type { BrandColor, BrandKit, ColorRole, LogoUsage, LogoVariant } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { SwatchBook } from "lucide-react";

const ROLES: { id: ColorRole; label: string }[] = [
  { id: "primary", label: "主色" },
  { id: "secondary", label: "輔助色" },
  { id: "background", label: "背景色" },
  { id: "accent", label: "強調" },
  { id: "ink", label: "文字" },
];

const SECTIONS = [
  { id: "identity", label: "識別" },
  { id: "logo", label: "Logo" },
  { id: "colors", label: "色彩" },
  { id: "fonts", label: "字體" },
  { id: "copy", label: "標語與 CTA" },
  { id: "style", label: "圖片風格" },
  { id: "rules", label: "禁用規則" },
] as const;

export function BrandEditor() {
  const brands = useStudio((s) => s.brands);
  const updateBrand = useStudio((s) => s.updateBrand);
  const createBrand = useStudio((s) => s.createBrand);
  const deleteBrand = useStudio((s) => s.deleteBrand);
  const addAsset = useStudio((s) => s.addAsset);
  const [activeId, setActiveId] = useState(brands[0]?.id ?? "");
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("identity");
  const brand = brands.find((b) => b.id === activeId) ?? brands[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const logoIds = (brand?.logos ?? []).map((item) => item.assetId);
  if (brand?.logoAssetId) logoIds.push(brand.logoAssetId);
  const urls = useAssetUrls(logoIds);

  if (!brand) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={SwatchBook}
          title="尚無品牌"
          description="建立品牌規範後，排版與 AI 企劃都會跟著走。"
          action={<Button onClick={() => setActiveId(createBrand("新品牌").id)}>建立品牌</Button>}
        />
      </main>
    );
  }

  function patch<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    updateBrand(brand.id, { [key]: value });
  }

  async function onLogo(file: File) {
    setUploading(true);
    try {
      const { blob, width, height, mime } = await decodeAssetImage(file);
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      addAsset({
        id,
        name: file.name.replace(/\.[^.]+$/, "") || "Logo",
        kind: "logo",
        category: "logo",
        mime,
        width,
        height,
        tags: ["logo", "品牌"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "upload",
        licenseNotes: "品牌自有標誌",
        licenseOwner: brand.name,
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      });
      const variant: LogoVariant = {
        id: uid("logo"),
        name: brand.logos.length === 0 ? "主標誌" : file.name.replace(/\.[^.]+$/, "") || "Logo 變體",
        assetId: id,
        usage: brand.logos.length === 0 ? "primary" : "mark",
      };
      const logos = [...brand.logos, variant];
      updateBrand(brand.id, {
        logos,
        logoAssetId: brand.logoAssetId ?? id,
      });
      toast.success("已加入 Logo 版本（僅存此裝置）");
    } catch (err) {
      const message =
        err instanceof AssetUploadError ? err.message : err instanceof Error ? err.message : "上傳失敗";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  const primary = brand.colors.find((c) => c.role === "primary");
  const bg = brand.colors.find((c) => c.role === "background");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="品牌中心"
        title="品牌規範"
        description="名稱、Logo 版本、色彩、字體、標語、CTA、圖片風格與禁用規則會套進排版、AI 企劃與品質檢查。"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BrandSubnav current="brand" />
            <Button variant="secondary" onClick={() => setActiveId(createBrand("新品牌").id)}>
              <Plus className="size-4" />
              新增品牌
            </Button>
            {brands.length > 1 && (
              <Button variant="outline" onClick={() => deleteBrand(brand.id)}>
                <Trash2 className="size-4" />
                刪除
              </Button>
            )}
          </div>
        }
      />

      <StorageNotice />

      {brands.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <Button
              key={b.id}
              size="sm"
              variant={b.id === brand.id ? "default" : "secondary"}
              onClick={() => setActiveId(b.id)}
            >
              {b.name}
            </Button>
          ))}
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-border)]"
        style={{ background: bg?.hex ?? "#F4E6D4", color: primary?.hex ?? "#1A1814" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-surface/80">
            {brand.logoAssetId && urls[brand.logoAssetId] ? (
              <img src={urls[brand.logoAssetId]} alt="" className="size-full object-contain p-1" />
            ) : (
              <span className="text-xs">無 Logo</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl tracking-tight" style={{ fontFamily: brand.fontDisplay }}>
              {brand.name}
            </p>
            <p className="text-sm opacity-70" style={{ fontFamily: brand.fontBody }}>
              {brand.handle || "尚未設定帳號"} · {brand.slogans[0] || "尚未設定標語"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {brand.colors.slice(0, 5).map((color) => (
            <span
              key={color.id}
              className="size-7 rounded-full border border-border"
              style={{ background: color.hex }}
              title={`${color.label} ${color.hex}`}
            />
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        {SECTIONS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={section === item.id ? "default" : "secondary"}
            onClick={() => {
              setSection(item.id);
              document.getElementById(`brand-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <section id="brand-identity" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">品牌識別</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="品牌名稱">
            <Input value={brand.name} onChange={(e) => patch("name", e.target.value)} />
          </Field>
          <Field label="IG 帳號">
            <Input value={brand.handle} onChange={(e) => patch("handle", e.target.value)} placeholder="@brand" />
          </Field>
          <Field label="網站" className="sm:col-span-2">
            <Input value={brand.website} onChange={(e) => patch("website", e.target.value)} />
          </Field>
        </div>
        <Field label="品牌聲音">
          <Textarea value={brand.voice} onChange={(e) => patch("voice", e.target.value)} placeholder="語氣、節奏、像誰在說話" />
        </Field>
      </section>

      <section id="brand-logo" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Logo 與版本</h2>
            <p className="mt-0.5 text-xs text-muted">主標誌、反白、圖標與橫式可分開管理，畫布會優先使用主標誌。</p>
          </div>
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            {uploading ? "處理中…" : "上傳版本"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onLogo(file);
              e.target.value = "";
            }}
          />
        </div>
        {brand.logos.length === 0 ? (
          <p className="rounded-xl bg-bg px-4 py-8 text-center text-sm text-muted">尚未上傳 Logo。建議正方形、透明底 SVG 或 PNG。</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {brand.logos.map((logo) => {
              const isPrimary = brand.logoAssetId === logo.assetId && logo.usage === "primary"
                ? true
                : brand.logoAssetId === logo.assetId && !brand.logos.some((item) => item.usage === "primary");
              return (
                <li key={logo.id} className="rounded-xl bg-bg p-3">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface">
                    {urls[logo.assetId] ? (
                      <img src={urls[logo.assetId]} alt={logo.name} className="size-full object-contain p-3" />
                    ) : (
                      <span className="text-xs text-muted">載入中</span>
                    )}
                  </div>
                  <Input
                    className="mt-2 h-9"
                    value={logo.name}
                    onChange={(e) =>
                      patch(
                        "logos",
                        brand.logos.map((item) => (item.id === logo.id ? { ...item, name: e.target.value } : item)),
                      )
                    }
                  />
                  <Select
                    value={logo.usage}
                    onValueChange={(v) => {
                      const usage = v as LogoUsage;
                      const logos = brand.logos.map((item) => (item.id === logo.id ? { ...item, usage } : item));
                      patch("logos", logos);
                      if (usage === "primary") patch("logoAssetId", logo.assetId);
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGO_USAGE.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant={brand.logoAssetId === logo.assetId ? "default" : "ghost"}
                      onClick={() => patch("logoAssetId", logo.assetId)}
                    >
                      {brand.logoAssetId === logo.assetId ? "主標誌" : "設為主標誌"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`移除 ${logo.name}`}
                      onClick={() => {
                        const logos = brand.logos.filter((item) => item.id !== logo.id);
                        patch("logos", logos);
                        if (brand.logoAssetId === logo.assetId) {
                          patch("logoAssetId", logos[0]?.assetId ?? null);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {isPrimary ? <p className="mt-1 text-xs text-muted">{logoUsageLabel(logo.usage)}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="brand-colors" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">色彩</h2>
        <p className="text-xs text-muted">主色、輔助色與背景色會進自動排版；強調色用於 CTA 與線條。</p>
        <ul className="space-y-3">
          {brand.colors.map((color) => (
            <li key={color.id} className="grid grid-cols-[2.5rem_1fr_1fr_auto] items-center gap-2">
              <input
                type="color"
                value={color.hex}
                onChange={(e) =>
                  patch(
                    "colors",
                    brand.colors.map((c) => (c.id === color.id ? { ...c, hex: e.target.value.toUpperCase() } : c)),
                  )
                }
                className="size-10 cursor-pointer rounded-md border border-border bg-transparent"
                aria-label={color.label}
              />
              <Input
                value={color.hex}
                onChange={(e) =>
                  patch(
                    "colors",
                    brand.colors.map((c) => (c.id === color.id ? { ...c, hex: e.target.value } : c)),
                  )
                }
              />
              <Select
                value={color.role}
                onValueChange={(v) =>
                  patch(
                    "colors",
                    brand.colors.map((c) => (c.id === color.id ? { ...c, role: v as ColorRole } : c)),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="移除色票"
                onClick={() => patch("colors", brand.colors.filter((c) => c.id !== color.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const next: BrandColor = { id: uid("c"), hex: "#1A1814", role: "accent", label: "新色" };
            patch("colors", [...brand.colors, next]);
          }}
        >
          新增色票
        </Button>
      </section>

      <section id="brand-fonts" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">字體</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="標題字體">
            <Select value={brand.fontDisplay} onValueChange={(v) => patch("fontDisplay", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDIO_FONTS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="內文字體">
            <Select value={brand.fontBody} onValueChange={(v) => patch("fontBody", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDIO_FONTS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="rounded-lg bg-bg px-4 py-5">
          <p className="font-display text-2xl tracking-tight" style={{ fontFamily: brand.fontDisplay }}>
            {brand.slogans[0] || brand.name}
          </p>
          <p className="mt-2 text-sm text-muted" style={{ fontFamily: brand.fontBody }}>
            標題用 {brand.fontDisplay}，內文用 {brand.fontBody}。品質檢查會限制畫布不超過兩種字型。
          </p>
        </div>
      </section>

      <section id="brand-copy" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">固定標語與常用 CTA</h2>
        <ChipList
          label="固定標語"
          hint="主標語會出現在品牌預覽，AI 企劃會參考。"
          values={brand.slogans}
          placeholder="例如：這個月只烘一個產地。"
          onChange={(slogans) => patch("slogans", slogans)}
        />
        <ChipList
          label="常用 CTA"
          hint="第一則會作為新專案預設按鈕文案。"
          values={brand.ctas}
          placeholder="例如：查看風味"
          onChange={(ctas) => {
            patch("ctas", ctas);
            patch("boilerplate", { ...brand.boilerplate, cta: ctas[0] || brand.boilerplate.cta });
          }}
        />
        <Field label="貼文結尾句">
          <Textarea
            value={brand.boilerplate.captionClose}
            onChange={(e) => patch("boilerplate", { ...brand.boilerplate, captionClose: e.target.value })}
            placeholder="例如：歡迎到店，或私訊詢問。"
          />
        </Field>
        <Field label="固定標籤（逗號分隔）">
          <Input
            value={brand.boilerplate.hashtags.join("，")}
            onChange={(e) =>
              patch("boilerplate", {
                ...brand.boilerplate,
                hashtags: e.target.value
                  .split(/[,，\s]+/)
                  .map((w) => w.trim())
                  .filter(Boolean)
                  .map((w) => (w.startsWith("#") ? w : `#${w}`)),
              })
            }
          />
        </Field>
        <Field label="免責／備註">
          <Input
            value={brand.boilerplate.disclaimer}
            onChange={(e) => patch("boilerplate", { ...brand.boilerplate, disclaimer: e.target.value })}
          />
        </Field>
      </section>

      <section id="brand-style" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">圖片風格</h2>
        <p className="text-xs text-muted">給攝影師與 AI 企劃看的視覺方向，不會自動套濾鏡。</p>
        <Field label="畫面情緒">
          <Input
            value={brand.imageStyle.mood}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, mood: e.target.value })}
            placeholder="沉靜、暖光、留白"
          />
        </Field>
        <Field label="光線">
          <Input
            value={brand.imageStyle.lighting}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, lighting: e.target.value })}
            placeholder="窗邊自然光，避免硬閃"
          />
        </Field>
        <Field label="色調">
          <Input
            value={brand.imageStyle.paletteHint}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, paletteHint: e.target.value })}
            placeholder="亞麻、深焙、赤陶"
          />
        </Field>
        <Field label="構圖">
          <Input
            value={brand.imageStyle.composition}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, composition: e.target.value })}
            placeholder="商品置中或上半，下半留白給標題"
          />
        </Field>
        <Field label="應該拍／用">
          <Textarea
            value={brand.imageStyle.do}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, do: e.target.value })}
          />
        </Field>
        <Field label="不要拍／用">
          <Textarea
            value={brand.imageStyle.dont}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, dont: e.target.value })}
          />
        </Field>
      </section>

      <section id="brand-rules" className="space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">品牌禁用規則</h2>
        <Field label="可以說">
          <Input value={brand.doSay} onChange={(e) => patch("doSay", e.target.value)} />
        </Field>
        <Field label="不要說">
          <Input value={brand.dontSay} onChange={(e) => patch("dontSay", e.target.value)} />
        </Field>
        <Field label="禁用詞（逗號分隔）">
          <Input
            value={brand.forbiddenWords.join("，")}
            onChange={(e) =>
              patch(
                "forbiddenWords",
                e.target.value
                  .split(/[,，]/)
                  .map((w) => w.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        {brand.forbiddenWords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {brand.forbiddenWords.map((word) => (
              <Badge key={word} variant="danger">
                {word}
              </Badge>
            ))}
          </div>
        ) : null}
        <ToggleRow
          label="禁止競品標誌"
          hint="畫布與素材不得出現其他品牌 Logo。"
          checked={brand.rules.noCompetitorMarks}
          onChange={(noCompetitorMarks) => patch("rules", { ...brand.rules, noCompetitorMarks })}
        />
        <ToggleRow
          label="禁止浮水印"
          hint="不使用帶浮水印的圖庫或截圖。"
          checked={brand.rules.noWatermark}
          onChange={(noWatermark) => patch("rules", { ...brand.rules, noWatermark })}
        />
        <ToggleRow
          label="禁止低解析素材"
          hint="品質檢查會把過小的圖片標為錯誤。"
          checked={brand.rules.noLowRes}
          onChange={(noLowRes) => patch("rules", { ...brand.rules, noLowRes })}
        />
        <Field label="其他規則">
          <Textarea
            value={brand.rules.notes}
            onChange={(e) => patch("rules", { ...brand.rules, notes: e.target.value })}
            placeholder="例如：Logo 不壓在杯緣；價格不進主畫面。"
          />
        </Field>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-3">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ChipList({
  label,
  hint,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const text = draft.trim();
    if (!text) return;
    if (values.includes(text)) {
      toast.error("已經有這句了");
      return;
    }
    onChange([...values, text]);
    setDraft("");
  }
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <p className="mb-2 text-xs text-muted">{hint}</p>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          加入
        </Button>
      </div>
      {values.length === 0 ? (
        <p className="mt-2 text-xs text-muted">尚未新增。</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {values.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2">
              {index === 0 ? <Star className="size-3.5 text-warn" /> : <span className="size-3.5" />}
              <Input
                className="h-9"
                value={item}
                onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="移除"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
