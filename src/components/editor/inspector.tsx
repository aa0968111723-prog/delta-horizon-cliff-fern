import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { logoUsageLabel } from "@/lib/studio/brand";
import { FONT_WEIGHTS, STUDIO_FONTS } from "@/lib/studio/fonts";
import { textOverflows } from "@/lib/studio/layers";
import type {
  Align,
  AlignMode,
  Artboard,
  AssetMeta,
  BrandKit,
  ImageFilter,
  Layer,
  TextLayer,
} from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

const CANVAS_ALIGN: { mode: AlignMode; label: string }[] = [
  { mode: "left", label: "左" },
  { mode: "center", label: "中" },
  { mode: "right", label: "右" },
  { mode: "top", label: "上" },
  { mode: "middle", label: "直中" },
  { mode: "bottom", label: "下" },
];

const SAFE_ALIGN: { mode: AlignMode; label: string }[] = [
  { mode: "safe-left", label: "安全左" },
  { mode: "safe-center", label: "安全中" },
  { mode: "safe-right", label: "安全右" },
  { mode: "safe-top", label: "安全上" },
  { mode: "safe-bottom", label: "安全下" },
];

export function Inspector({
  projectId,
  artboard,
  brand,
}: {
  projectId: string;
  artboard: Artboard;
  brand: BrandKit;
}) {
  const selectedId = useStudio((s) => s.editor.selectedId);
  const updateLayer = useStudio((s) => s.updateLayer);
  const patchArtboard = useStudio((s) => s.patchArtboard);
  const alignLayer = useStudio((s) => s.alignLayer);
  const duplicateLayer = useStudio((s) => s.duplicateLayer);
  const removeLayer = useStudio((s) => s.removeLayer);
  const assets = useStudio((s) => s.assets);
  const layer = artboard.layers.find((l) => l.id === selectedId);

  if (!layer) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm font-medium">畫布</p>
        <Field label="背景類型">
          <Select
            value={artboard.background.type}
            onValueChange={(v) =>
              patchArtboard(projectId, (a) => ({
                ...a,
                background: {
                  ...a.background,
                  type: v as "solid" | "gradient" | "image",
                  color2: a.background.color2 ?? a.background.color,
                },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">單色</SelectItem>
              <SelectItem value="gradient">漸層</SelectItem>
              <SelectItem value="image">圖片</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="底色">
          <ColorRow
            value={artboard.background.color}
            brand={brand}
            onChange={(hex) =>
              patchArtboard(projectId, (a) => ({
                ...a,
                background: { ...a.background, color: hex },
              }))
            }
          />
        </Field>
        {artboard.background.type === "gradient" && (
          <>
            <Field label="漸層終點">
              <ColorRow
                value={artboard.background.color2 ?? artboard.background.color}
                brand={brand}
                onChange={(hex) =>
                  patchArtboard(projectId, (a) => ({
                    ...a,
                    background: { ...a.background, color2: hex, type: "gradient" },
                  }))
                }
              />
            </Field>
            <Field label={`角度 ${artboard.background.angle ?? 180}°`}>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[artboard.background.angle ?? 180]}
                onValueChange={([v]) =>
                  patchArtboard(projectId, (a) => ({
                    ...a,
                    background: { ...a.background, angle: v ?? 180, type: "gradient" },
                  }))
                }
              />
            </Field>
          </>
        )}
        {artboard.background.type === "image" && (
          <Field label="背景圖">
            <Select
              value={artboard.background.assetId ?? "none"}
              onValueChange={(v) =>
                patchArtboard(projectId, (a) => ({
                  ...a,
                  background: { ...a.background, type: "image", assetId: v === "none" ? undefined : v },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇素材" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未選擇</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <p className="text-xs text-muted">點選圖層以編輯位置、文字、裁切與濾鏡。</p>
      </div>
    );
  }

  const selected = layer;

  function set<K extends keyof Layer>(key: K, value: Layer[K]) {
    updateLayer(projectId, selected.id, { [key]: value } as Partial<Layer>);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={selected.name}
          onChange={(e) => set("name", e.target.value)}
          className="h-9"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="secondary" onClick={() => duplicateLayer(projectId, selected.id)}>
          複製
        </Button>
        <Button
          size="sm"
          variant={selected.locked ? "default" : "secondary"}
          onClick={() => set("locked", !selected.locked)}
        >
          {selected.locked ? "已鎖定" : "鎖定"}
        </Button>
        <Button
          size="sm"
          variant={selected.hidden ? "default" : "secondary"}
          onClick={() => set("hidden", !selected.hidden)}
        >
          {selected.hidden ? "已隱藏" : "隱藏"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => removeLayer(projectId, selected.id)}>
          刪除
        </Button>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-muted">對齊畫布</p>
        <div className="flex flex-wrap gap-1">
          {CANVAS_ALIGN.map((item) => (
            <Button
              key={item.mode}
              size="sm"
              variant="secondary"
              disabled={selected.locked}
              onClick={() => alignLayer(projectId, selected.id, item.mode)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <p className="mb-1.5 mt-3 text-xs text-muted">對齊安全區</p>
        <div className="flex flex-wrap gap-1">
          {SAFE_ALIGN.map((item) => (
            <Button
              key={item.mode}
              size="sm"
              variant="secondary"
              disabled={selected.locked}
              onClick={() => alignLayer(projectId, selected.id, item.mode)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Num label="X" value={selected.x} onChange={(v) => set("x", v)} />
        <Num label="Y" value={selected.y} onChange={(v) => set("y", v)} />
        <Num label="寬" value={selected.w} onChange={(v) => set("w", v)} />
        <Num label="高" value={selected.h} onChange={(v) => set("h", v)} />
      </div>
      <Field label={`旋轉 ${Math.round(selected.rotation)}°`}>
        <Slider
          min={-180}
          max={180}
          step={1}
          value={[selected.rotation]}
          onValueChange={([v]) => set("rotation", v ?? 0)}
        />
      </Field>
      <Field label={`透明度 ${Math.round(selected.opacity * 100)}%`}>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={[selected.opacity]}
          onValueChange={([v]) => set("opacity", v ?? 1)}
        />
      </Field>

      {selected.type === "text" && (
        <TextFields
          layer={selected}
          brand={brand}
          onPatch={(patch) => updateLayer(projectId, selected.id, patch)}
        />
      )}
      {selected.type === "shape" && (
        <div className="space-y-3">
          <Field label="填色">
            <ColorRow
              value={selected.fill}
              brand={brand}
              onChange={(hex) => updateLayer(projectId, selected.id, { fill: hex })}
            />
          </Field>
          <Field label="框線">
            <ColorRow
              value={selected.stroke ?? "#000000"}
              brand={brand}
              onChange={(hex) => updateLayer(projectId, selected.id, { stroke: hex })}
            />
          </Field>
          <Num
            label="框線粗細"
            value={selected.strokeWidth ?? 0}
            onChange={(v) => updateLayer(projectId, selected.id, { strokeWidth: v })}
          />
          <Num
            label="圓角"
            value={selected.radius}
            onChange={(v) => updateLayer(projectId, selected.id, { radius: v })}
          />
        </div>
      )}
      {selected.type === "line" && (
        <div className="space-y-3">
          <Field label="線色">
            <ColorRow
              value={selected.stroke}
              brand={brand}
              onChange={(hex) => updateLayer(projectId, selected.id, { stroke: hex })}
            />
          </Field>
          <Field label={`粗細 ${selected.strokeWidth}px`}>
            <Slider
              min={1}
              max={24}
              step={1}
              value={[selected.strokeWidth]}
              onValueChange={([v]) => updateLayer(projectId, selected.id, { strokeWidth: v ?? 4 })}
            />
          </Field>
        </div>
      )}
      {(selected.type === "image" || selected.type === "logo") && (
        <ImageFields
          layer={selected}
          brand={brand}
          assets={assets}
          onPatch={(patch) => updateLayer(projectId, selected.id, patch)}
        />
      )}
      {(selected.type === "image" || selected.type === "shape" || selected.type === "logo") && (
        <ShadowFields
          layer={selected}
          onPatch={(patch) => updateLayer(projectId, selected.id, patch)}
        />
      )}
    </div>
  );
}

function TextFields({
  layer,
  brand,
  onPatch,
}: {
  layer: TextLayer;
  brand: BrandKit;
  onPatch: (patch: Partial<TextLayer>) => void;
}) {
  const clipped = textOverflows(layer);
  return (
    <div className="space-y-3">
      <Field label="內容">
        <Textarea value={layer.text} onChange={(e) => onPatch({ text: e.target.value })} />
      </Field>
      {clipped ? (
        <p className="text-xs text-warn">文字超出圖層高度，已裁切。請加大高度或縮小字級。</p>
      ) : null}
      <Field label="字型">
        <Select value={layer.fontFamily} onValueChange={(v) => onPatch({ fontFamily: v })}>
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
      <div className="grid grid-cols-2 gap-2">
        <Field label="字重">
          <Select
            value={String(layer.fontWeight)}
            onValueChange={(v) => onPatch({ fontWeight: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Num label="字級" value={layer.fontSize} onChange={(v) => onPatch({ fontSize: v })} />
      </div>
      <Field label={`行距 ${layer.lineHeight.toFixed(2)}`}>
        <Slider
          min={0.8}
          max={2.4}
          step={0.05}
          value={[layer.lineHeight]}
          onValueChange={([v]) => onPatch({ lineHeight: v ?? 1.2 })}
        />
      </Field>
      <Field label={`字距 ${layer.letterSpacing}`}>
        <Slider
          min={-6}
          max={16}
          step={0.5}
          value={[layer.letterSpacing]}
          onValueChange={([v]) => onPatch({ letterSpacing: v ?? 0 })}
        />
      </Field>
      <Field label="對齊">
        <div className="flex gap-1">
          {(["left", "center", "right"] as Align[]).map((a) => (
            <Button
              key={a}
              size="sm"
              variant={layer.align === a ? "default" : "secondary"}
              onClick={() => onPatch({ align: a })}
              aria-label={a}
            >
              {a === "left" ? <AlignLeft className="size-4" /> : a === "center" ? <AlignCenter className="size-4" /> : <AlignRight className="size-4" />}
            </Button>
          ))}
        </div>
      </Field>
      <Field label="顏色">
        <ColorRow value={layer.color} brand={brand} onChange={(hex) => onPatch({ color: hex })} />
      </Field>
    </div>
  );
}

function ImageFields({
  layer,
  brand,
  assets,
  onPatch,
}: {
  layer: Extract<Layer, { type: "image" | "logo" }>;
  brand: BrandKit;
  assets: AssetMeta[];
  onPatch: (patch: Partial<Layer>) => void;
}) {
  const isImage = layer.type === "image";
  const filter = isImage ? layer.filter : undefined;
  const crop = isImage ? layer.crop : undefined;
  return (
    <div className="space-y-3">
      {layer.type === "logo" && brand.logos.length > 0 ? (
        <Field label="Logo 版本">
          <Select
            value={layer.assetId ?? brand.logoAssetId ?? "none"}
            onValueChange={(v) => onPatch({ assetId: v === "none" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇版本" />
            </SelectTrigger>
            <SelectContent>
              {brand.logos.map((logo) => (
                <SelectItem key={logo.id} value={logo.assetId}>
                  {logo.name} · {logoUsageLabel(logo.usage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {isImage ? (
        <Field label="替換素材">
          <Select
            value={layer.assetId}
            onValueChange={(v) => onPatch({ assetId: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {isImage && (
        <>
          <Field label="適應">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={layer.objectFit === "cover" ? "default" : "secondary"}
                onClick={() => onPatch({ objectFit: "cover" })}
              >
                裁切填滿
              </Button>
              <Button
                size="sm"
                variant={layer.objectFit === "contain" ? "default" : "secondary"}
                onClick={() => onPatch({ objectFit: "contain" })}
              >
                完整顯示
              </Button>
            </div>
          </Field>
          <p className="text-xs text-muted">圖片不會被拉伸。填滿會裁切，完整顯示會留白。</p>
          <Field label={`裁切水平 ${Math.round(crop?.x ?? 50)}%`}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[crop?.x ?? 50]}
              onValueChange={([v]) => onPatch({ crop: { ...(crop ?? { x: 50, y: 50, zoom: 1 }), x: v ?? 50 } })}
            />
          </Field>
          <Field label={`裁切垂直 ${Math.round(crop?.y ?? 50)}%`}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[crop?.y ?? 50]}
              onValueChange={([v]) => onPatch({ crop: { ...(crop ?? { x: 50, y: 50, zoom: 1 }), y: v ?? 50 } })}
            />
          </Field>
          <Field label={`裁切縮放 ${(crop?.zoom ?? 1).toFixed(2)}x`}>
            <Slider
              min={1}
              max={2.5}
              step={0.05}
              value={[crop?.zoom ?? 1]}
              onValueChange={([v]) => onPatch({ crop: { ...(crop ?? { x: 50, y: 50, zoom: 1 }), zoom: v ?? 1 } })}
            />
          </Field>
          {filter && <FilterFields filter={filter} onChange={(next) => onPatch({ filter: next })} />}
        </>
      )}
      <Num label="圓角" value={layer.radius ?? 0} onChange={(v) => onPatch({ radius: v })} />
    </div>
  );
}

function FilterFields({
  filter,
  onChange,
}: {
  filter: ImageFilter;
  onChange: (filter: ImageFilter) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted">濾鏡</p>
      <Field label={`亮度 ${filter.brightness.toFixed(2)}`}>
        <Slider min={0.4} max={1.8} step={0.01} value={[filter.brightness]} onValueChange={([v]) => onChange({ ...filter, brightness: v ?? 1 })} />
      </Field>
      <Field label={`對比 ${filter.contrast.toFixed(2)}`}>
        <Slider min={0.4} max={1.8} step={0.01} value={[filter.contrast]} onValueChange={([v]) => onChange({ ...filter, contrast: v ?? 1 })} />
      </Field>
      <Field label={`飽和 ${filter.saturate.toFixed(2)}`}>
        <Slider min={0} max={2} step={0.01} value={[filter.saturate]} onValueChange={([v]) => onChange({ ...filter, saturate: v ?? 1 })} />
      </Field>
      <Field label={`模糊 ${filter.blur}px`}>
        <Slider min={0} max={16} step={0.5} value={[filter.blur]} onValueChange={([v]) => onChange({ ...filter, blur: v ?? 0 })} />
      </Field>
      <Field label={`去色 ${Math.round(filter.grayscale * 100)}%`}>
        <Slider min={0} max={1} step={0.01} value={[filter.grayscale]} onValueChange={([v]) => onChange({ ...filter, grayscale: v ?? 0 })} />
      </Field>
    </div>
  );
}

function ShadowFields({
  layer,
  onPatch,
}: {
  layer: Layer;
  onPatch: (patch: Partial<Layer>) => void;
}) {
  const shadow = layer.shadow ?? { enabled: false, x: 0, y: 12, blur: 28, color: "rgba(26,24,20,0.28)" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>陰影</Label>
        <Switch
          checked={shadow.enabled}
          onCheckedChange={(enabled) => onPatch({ shadow: { ...shadow, enabled } })}
        />
      </div>
      {shadow.enabled && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Num label="X" value={shadow.x} onChange={(v) => onPatch({ shadow: { ...shadow, x: v } })} />
            <Num label="Y" value={shadow.y} onChange={(v) => onPatch({ shadow: { ...shadow, y: v } })} />
          </div>
          <Num label="模糊" value={shadow.blur} onChange={(v) => onPatch({ shadow: { ...shadow, blur: v } })} />
        </>
      )}
    </div>
  );
}

function ColorRow({
  value,
  brand,
  onChange,
}: {
  value: string;
  brand: BrandKit;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {brand.colors.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            onClick={() => onChange(c.hex)}
            className="size-7 rounded-full border border-border"
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="color"
          suppressHydrationWarning
          value={/^#/.test(value) && value.length >= 7 ? value.slice(0, 7) : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-11 cursor-pointer rounded-md border border-border"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}
