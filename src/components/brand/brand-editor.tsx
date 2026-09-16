import { Check, Plus, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { StyleMemoryPanel } from "@/components/brand/style-memory";
import { OutcomeJournal } from "@/components/learning/outcome-journal";
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
import { assetPreviewFitClass } from "@/lib/studio/assets";
import { LOGO_USAGE, logoUsageLabel, toggleLegacyAssetId } from "@/lib/studio/brand";
import { STUDIO_FONTS } from "@/lib/studio/fonts";
import { uid } from "@/lib/studio/ids";
import type { AssetMeta, BrandColor, BrandKit, BrandMemory, ColorRole, LogoUsage, LogoVariant } from "@/lib/studio/types";
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
  { id: "memory", label: "品牌記憶" },
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
  const addAsset = useStudio((s) => s.addAsset);
  const assets = useStudio((s) => s.assets);
  const [activeId, setActiveId] = useState(brands[0]?.id ?? "");
  const locationHash = useRouterState({ select: (state) => state.location.hash });
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("identity");
  const brand = brands.find((b) => b.id === activeId) ?? brands[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const logoIds = (brand?.logos ?? []).map((item) => item.assetId);
  if (brand?.logoAssetId) logoIds.push(brand.logoAssetId);
  const urls = useAssetUrls(logoIds);
  const memory = brand?.memory ?? emptyBrandMemory();

  useEffect(() => {
    function applyHash() {
      const hash = window.location.hash.replace("#", "");
      if (SECTIONS.some((item) => item.id === hash)) {
        setSection(hash as (typeof SECTIONS)[number]["id"]);
      }
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [locationHash]);

  if (!brand) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={SwatchBook}
          title="尚無 Brand Memory"
          description="建立淡江大學禪學社的識別後，AI 創作與畫布都會跟著走。這裡不是多品牌後台。"
          action={<Button onClick={() => setActiveId(createBrand("淡江大學禪學社").id)}>建立禪學社品牌</Button>}
        />
      </main>
    );
  }

  function patch<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    updateBrand(brand.id, { [key]: value });
  }

  function patchMemory<K extends keyof BrandMemory>(key: K, value: BrandMemory[K]) {
    updateBrand(brand.id, { memory: { ...brand.memory, [key]: value } });
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
        kicker="淡江大學禪學社 Brand Brain"
        title="社團品牌記憶與規範"
        description="社團定位、三色光識別、生活感色盤、字體層級、學生生活語調與避開宗教說教規則。所有 AI 創作與品質檢查將直接讀取此品牌大腦。"
        actions={
          <BrandSubnav current="brand" />
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            data-testid="apply-brand-current"
            className="min-h-11"
            variant="secondary"
            onClick={() => {
              const targetId = lastProjectId && projects.some((item) => item.id === lastProjectId)
                ? lastProjectId
                : projects[0]?.id;
              if (!targetId) {
                toast.error("還沒有網宣可套用。先到 Studio 打開一則。");
                return;
              }
              applyBrandKit(targetId);
              const name = projects.find((item) => item.id === targetId)?.name ?? "目前網宣";
              toast.success(`已把色彩、字體與標誌套到「${name}」`);
            }}
          >
            套用到目前網宣
          </Button>
          <p className="text-xs leading-5 opacity-70">
            改色票會自動跟上還在用品牌色的畫面。自訂過的色塊按這顆才會整張重套。
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        {SECTIONS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            className="min-h-11 shrink-0"
            variant={section === item.id ? "default" : "secondary"}
            onClick={() => {
              setSection(item.id);
              history.replaceState(null, "", `#${item.id}`);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <section id="brand-identity" className="space-y-3 rounded-2xl surface-card p-5">
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
        <Field label="社團理念">
          <Textarea value={brand.clubIntro} onChange={(e) => patch("clubIntro", e.target.value)} placeholder="給學生一個可以慢下來的地方" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="吉祥物">
            <Input value={brand.mascot} onChange={(e) => patch("mascot", e.target.value)} />
          </Field>
          <Field label="招牌視覺">
            <Input value={brand.signatureLights} onChange={(e) => patch("signatureLights", e.target.value)} />
          </Field>
        </div>
      </section>

      <section id="brand-memory" className="space-y-3 rounded-2xl surface-card p-5">
        <div>
          <h2 className="text-sm font-medium">品牌記憶</h2>
          <p className="mt-0.5 text-xs text-muted">
            這不是規範文件。是社團自己的東西：為什麼存在、龜龜是誰、三色光是什麼意思、喜歡與不喜歡的畫面。
          </p>
        </div>
        <Field label="理念">
          <Textarea
            value={brand.memory.mission}
            onChange={(e) => patchMemory("mission", e.target.value)}
            placeholder="給淡江學生一個可以坐下來的地方。"
          />
        </Field>
        <Field label="固定短介紹">
          <Textarea
            value={brand.memory.introShort}
            onChange={(e) => patchMemory("introShort", e.target.value)}
          />
        </Field>
        <Field label="固定長介紹">
          <Textarea
            value={brand.memory.introLong}
            onChange={(e) => patchMemory("introLong", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="吉祥物名字">
            <Input value={brand.memory.mascotName} onChange={(e) => patchMemory("mascotName", e.target.value)} />
          </Field>
          <Field label="怎麼用">
            <Input value={brand.memory.mascotUsage} onChange={(e) => patchMemory("mascotUsage", e.target.value)} />
          </Field>
        </div>
        <Field label="長什麼樣子">
          <Textarea value={brand.memory.mascotLook} onChange={(e) => patchMemory("mascotLook", e.target.value)} />
        </Field>
        <Field label="個性">
          <Textarea
            value={brand.memory.mascotPersonality}
            onChange={(e) => patchMemory("mascotPersonality", e.target.value)}
          />
        </Field>
        <div>
          <p className="mb-2 text-sm">三色光</p>
          <ul className="space-y-3">
            {brand.memory.lights.map((light, index) => (
              <li key={`${light.label}-${index}`} className="grid gap-2 sm:grid-cols-[5.5rem_1fr]">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={light.hex}
                    onChange={(e) =>
                      patchMemory(
                        "lights",
                        brand.memory.lights.map((item, i) =>
                          i === index ? { ...item, hex: e.target.value.toUpperCase() } : item,
                        ),
                      )
                    }
                    className="size-10 cursor-pointer rounded-md border border-border bg-transparent"
                    aria-label={light.label}
                  />
                  <Input
                    value={light.label}
                    onChange={(e) =>
                      patchMemory(
                        "lights",
                        brand.memory.lights.map((item, i) => (i === index ? { ...item, label: e.target.value } : item)),
                      )
                    }
                  />
                </div>
                <Input
                  value={light.meaning}
                  onChange={(e) =>
                    patchMemory(
                      "lights",
                      brand.memory.lights.map((item, i) => (i === index ? { ...item, meaning: e.target.value } : item)),
                    )
                  }
                  placeholder="這道光用在什麼時候"
                />
              </li>
            ))}
          </ul>
        </div>
        <Field label="喜歡的風格">
          <Textarea
            value={brand.memory.likedStyles}
            onChange={(e) => patchMemory("likedStyles", e.target.value)}
          />
        </Field>
        <Field label="不要的風格">
          <Textarea
            value={brand.memory.dislikedStyles}
            onChange={(e) => patchMemory("dislikedStyles", e.target.value)}
          />
        </Field>
        <p className="text-xs text-muted">點選素材，讓 AI 生成時把這些畫面當成社團自己的視覺記憶。</p>
        <LegacyAssetPicker
          selectedIds={brand.memory.legacyAssetIds}
          assets={assets}
          onToggle={(id) => patchMemory("legacyAssetIds", toggleLegacyAssetId(brand.memory.legacyAssetIds, id))}
        />
      </section>

      <section id="brand-logo" className="space-y-3 rounded-2xl surface-card p-5">
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

      <section id="brand-colors" className="space-y-3 rounded-2xl surface-card p-5">
        <h2 className="text-sm font-medium">色彩</h2>
        <p className="text-xs text-muted">主色、輔助色與背景色會進自動排版；強調色用於 CTA 與線條。</p>
        <ul className="space-y-3">
          {brand.colors.map((color) => (
            <li
              key={color.id}
              className="flex flex-col gap-2 rounded-xl bg-bg p-3 sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,8rem)_auto] sm:items-center sm:gap-2 sm:bg-transparent sm:p-0"
            >
              <input
                type="color"
                value={color.hex}
                onChange={(e) =>
                  patch(
                    "colors",
                    brand.colors.map((c) => (c.id === color.id ? { ...c, hex: e.target.value.toUpperCase() } : c)),
                  )
                }
                className="size-11 cursor-pointer rounded-md border border-border bg-transparent"
                aria-label={color.label}
              />
              <Input
                value={color.hex}
                className="min-h-11 min-w-0"
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
                <SelectTrigger className="min-h-11">
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
                className="min-h-11 min-w-11 self-end sm:self-auto"
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

      <section id="brand-fonts" className="space-y-3 rounded-2xl surface-card p-5">
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

      <section id="brand-copy" className="space-y-3 rounded-2xl surface-card p-5">
        <h2 className="text-sm font-medium">固定標語與常用 CTA</h2>
        <ChipList
          label="固定標語"
          hint="主標語會出現在品牌預覽，AI 企劃會參考。"
          values={brand.slogans}
          placeholder="例如：在忙亂裡，留一點空間給自己。"
          onChange={(slogans) => patch("slogans", slogans)}
        />
        <ChipList
          label="常用 CTA"
          hint="第一則會作為新專案預設按鈕文案。"
          values={brand.ctas}
          placeholder="例如：看看活動"
          onChange={(ctas) => {
            patch("ctas", ctas);
            patch("boilerplate", { ...brand.boilerplate, cta: ctas[0] || brand.boilerplate.cta });
          }}
        />
        <Field label="貼文結尾句">
          <Textarea
            value={brand.boilerplate.captionClose}
            onChange={(e) => patch("boilerplate", { ...brand.boilerplate, captionClose: e.target.value })}
            placeholder="例如：如果你也想喘口氣，可以找朋友一起來。"
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

      <section id="brand-style" className="space-y-3 rounded-2xl surface-card p-5">
        <h2 className="text-sm font-medium">圖片風格</h2>
        <p className="text-xs text-muted">給攝影師與 AI 企劃看的視覺方向，不會自動套濾鏡。</p>
        <Field label="畫面情緒">
          <Input
            value={brand.imageStyle.mood}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, mood: e.target.value })}
            placeholder="沉靜、暖光、有空氣感"
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
            placeholder="霧白、淡水深綠、禪光金"
          />
        </Field>
        <Field label="構圖">
          <Input
            value={brand.imageStyle.composition}
            onChange={(e) => patch("imageStyle", { ...brand.imageStyle, composition: e.target.value })}
            placeholder="人物或校園情境保留呼吸感，標題區清楚"
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

      <section id="brand-rules" className="space-y-3 rounded-2xl surface-card p-5">
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
          label="禁止其他品牌標誌"
          hint="畫布與素材不要出現其他社團或品牌 Logo。"
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
            placeholder="例如：Logo 不壓過人物臉部；時間地點不可藏起來。"
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

function LegacyAssetPicker({
  selectedIds,
  assets,
  onToggle,
}: {
  selectedIds: string[];
  assets: AssetMeta[];
  onToggle: (id: string) => void;
}) {
  const selected = selectedIds
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is AssetMeta => Boolean(asset));
  const rest = assets.filter((asset) => !selectedIds.includes(asset.id)).slice(0, 16);
  const visible = [...selected, ...rest];
  const urls = useAssetUrls(visible.map((asset) => asset.id));

  if (!assets.length) {
    return <p className="text-xs text-subtle">素材庫還沒有圖。上傳一張海報或活動照片之後就可以標成歷屆文宣。</p>;
  }

  return (
    <div>
      <p className="mb-2 text-sm">歷屆文宣</p>
      <p className="mb-2 text-xs text-subtle">
        已選 {selected.length} 張。生成時會讀這些名字與分類，延續社團自己的畫面。
      </p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {visible.map((asset) => {
          const on = selectedIds.includes(asset.id);
          const src = asset.seedSrc || urls[asset.id];
          return (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onToggle(asset.id)}
                aria-pressed={on}
                aria-label={on ? `移出歷屆文宣 ${asset.name}` : `加入歷屆文宣 ${asset.name}`}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl bg-bg text-left shadow-[var(--shadow-border)]",
                  on ? "ring-2 ring-accent" : "",
                )}
              >
                <span className="block aspect-square">
                  {src ? (
                    <img src={src} alt="" className={cn("size-full", assetPreviewFitClass(asset, src))} />
                  ) : (
                    <span className="flex size-full items-center justify-center px-2 text-center text-xs text-muted">
                      {asset.name}
                    </span>
                  )}
                </span>
                {on ? (
                  <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-accent-fg">
                    <Check className="size-3.5" />
                  </span>
                ) : null}
                <span className="block truncate px-2 py-1.5 text-xs">{asset.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
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
      <div className="flex min-w-0 gap-2">
        <Input
          className="min-h-11 min-w-0 flex-1"
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
        <Button type="button" variant="secondary" className="min-h-11 shrink-0" onClick={add}>
          加入
        </Button>
      </div>
      {values.length === 0 ? (
        <p className="mt-2 text-xs text-muted">尚未新增。</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {values.map((item, index) => (
            <li key={`${item}-${index}`} className="flex min-h-11 max-w-full items-center gap-1 rounded-full bg-bg pl-3 pr-1">
              {index === 0 ? <Star className="size-3.5 shrink-0 text-warn" /> : null}
              <span className="max-w-64 truncate text-sm leading-5">{item}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`移除 ${item}`}
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
