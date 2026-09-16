import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { formatById } from "@/lib/studio/formats";
import { cssFilter, cssShadow, cssTextShadow } from "@/lib/studio/layers";
import type {
  Artboard,
  BrandKit,
  GuideLine,
  HandleId,
  ImageLayer,
  Layer,
  LineLayer,
  ShapeLayer,
  TextLayer,
} from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export type LayerDraft = Partial<Pick<Layer, "x" | "y" | "w" | "h" | "rotation">>;

type Props = {
  artboard: Artboard;
  brand: BrandKit;
  urls: Record<string, string>;
  width: number;
  selectedId?: string | null;
  showGrid?: boolean;
  showSafe?: boolean;
  showBounds?: boolean;
  interactive?: boolean;
  draft?: Partial<Record<string, LayerDraft>>;
  guides?: GuideLine[];
  ghost?: LayerDraft;
  editingId?: string | null;
  onPointerDownLayer?: (id: string, event: PointerEvent<HTMLDivElement>) => void;
  onPointerDownCanvas?: (event: PointerEvent<HTMLDivElement>) => void;
  onDoubleClickLayer?: (id: string) => void;
  onHandleDown?: (id: string, handle: HandleId | "rotate", event: PointerEvent<HTMLButtonElement>) => void;
  onTextChange?: (id: string, text: string) => void;
  onTextEditEnd?: () => void;
};

function shapeRadius(layer: ShapeLayer) {
  if (layer.shape === "pill") return layer.h / 2;
  if (layer.shape === "ellipse") return 9999;
  return layer.radius;
}

function imageStyle(layer: ImageLayer): CSSProperties {
  const crop = layer.crop ?? { x: 50, y: 50, zoom: 1 };
  const zoom = Math.max(1, crop.zoom);
  return {
    width: "100%",
    height: "100%",
    objectFit: layer.objectFit,
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    filter: cssFilter(layer.filter),
  };
}

function LayerNode({
  layer,
  brand,
  urls,
  selected,
  interactive,
  draft,
  editing,
  onPointerDownLayer,
  onDoubleClickLayer,
  onTextChange,
  onTextEditEnd,
}: {
  layer: Layer;
  brand: BrandKit;
  urls: Record<string, string>;
  selected: boolean;
  interactive?: boolean;
  draft?: LayerDraft;
  editing?: boolean;
  onPointerDownLayer?: (id: string, event: PointerEvent<HTMLDivElement>) => void;
  onDoubleClickLayer?: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
  onTextEditEnd?: () => void;
}) {
  if (layer.hidden) return null;
  const x = draft?.x ?? layer.x;
  const y = draft?.y ?? layer.y;
  const w = draft?.w ?? layer.w;
  const h = draft?.h ?? layer.h;
  const rotation = draft?.rotation ?? layer.rotation;
  const radius =
    layer.type === "shape" ? shapeRadius(layer) : layer.type === "image" || layer.type === "logo" ? (layer.radius ?? 0) : 0;
  const style: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
    opacity: layer.opacity,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: "center center",
    pointerEvents: interactive && !layer.locked ? "auto" : "none",
    touchAction: interactive ? "none" : undefined,
    overflow: layer.type === "line" ? "visible" : "hidden",
    borderRadius: radius,
    boxShadow: cssShadow(layer),
  };

  let inner: ReactNode = null;
  if (layer.type === "shape") {
    inner = (
      <div
        className="size-full"
        style={{
          background: layer.fill === "transparent" ? "transparent" : layer.fill,
          borderRadius: shapeRadius(layer),
          border: layer.stroke && (layer.strokeWidth ?? 0) > 0
            ? `${layer.strokeWidth}px solid ${layer.stroke}`
            : undefined,
        }}
      />
    );
  } else if (layer.type === "line") {
    const line = layer as LineLayer;
    inner = (
      <div className="relative size-full">
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: line.strokeWidth,
            background: line.stroke,
            borderRadius: 999,
          }}
        />
      </div>
    );
  } else if (layer.type === "text") {
    const t = layer as TextLayer;
    const textStyle: CSSProperties = {
      color: t.color,
      fontFamily: `"${t.fontFamily}", sans-serif`,
      fontWeight: t.fontWeight,
      fontSize: t.fontSize,
      lineHeight: t.lineHeight,
      letterSpacing: t.letterSpacing,
      textAlign: t.align,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      overflow: "hidden",
      textShadow: cssTextShadow(layer),
    };
    inner = editing && interactive ? (
      <textarea
        autoFocus
        value={t.text}
        onChange={(e) => onTextChange?.(layer.id, e.target.value)}
        onBlur={() => onTextEditEnd?.()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onTextEditEnd?.();
          }
        }}
        className="size-full resize-none bg-transparent p-0 outline-none"
        style={textStyle}
      />
    ) : (
      <div className="size-full overflow-hidden" style={textStyle}>
        {t.text}
      </div>
    );
  } else if (layer.type === "image") {
    const src = urls[layer.assetId];
    inner = src ? (
      <img
        src={src}
        alt=""
        draggable={false}
        className="size-full"
        style={imageStyle(layer)}
        crossOrigin="anonymous"
      />
    ) : (
      <div className="flex size-full items-center justify-center bg-surface-2 text-xs text-muted">沒有圖片</div>
    );
  } else {
    const assetId = layer.assetId ?? brand.logoAssetId;
    const src = assetId ? urls[assetId] : undefined;
    inner = src ? (
      <img
        src={src}
        alt=""
        draggable={false}
        className="size-full object-contain"
        crossOrigin="anonymous"
      />
    ) : (
      <div className="flex size-full items-center justify-center bg-surface-2 text-xs text-muted">沒有圖片</div>
    );
  }

  return (
    <div
      data-layer-id={layer.id}
      data-layer-type={layer.type}
      data-layer-name={layer.name}
      data-layer-role={layer.type === "text" ? layer.role : undefined}
      style={style}
      onPointerDown={(e) => onPointerDownLayer?.(layer.id, e)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClickLayer?.(layer.id);
      }}
      className={cn(selected && interactive && "z-10")}
    >
      {inner}
      {selected && interactive && !editing && (
        <div className="pointer-events-none absolute inset-0 outline-2 outline-accent outline-offset-0" />
      )}
    </div>
  );
}

const HANDLES: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function handlePos(id: HandleId): { left: string; top: string } {
  const x = id.includes("w") ? "0%" : id.includes("e") ? "100%" : "50%";
  const y = id.includes("n") ? "0%" : id.includes("s") ? "100%" : "50%";
  return { left: x, top: y };
}

function TransformOverlay({
  layer,
  draft,
  scale,
  onHandleDown,
}: {
  layer: Layer;
  draft?: LayerDraft;
  scale: number;
  onHandleDown?: (id: string, handle: HandleId | "rotate", event: PointerEvent<HTMLButtonElement>) => void;
}) {
  if (layer.locked) return null;
  const x = draft?.x ?? layer.x;
  const y = draft?.y ?? layer.y;
  const w = draft?.w ?? layer.w;
  const h = draft?.h ?? layer.h;
  const rotation = draft?.rotation ?? layer.rotation;
  const size = Math.max(14, 16 / scale);
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: "center center",
        zIndex: 20,
      }}
    >
      {HANDLES.map((id) => {
        const pos = handlePos(id);
        return (
          <button
            key={id}
            type="button"
            aria-label={`縮放 ${id}`}
            className="pointer-events-auto absolute rounded-sm border border-accent bg-surface"
            style={{
              width: size,
              height: size,
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onHandleDown?.(layer.id, id, e);
            }}
          />
        );
      })}
      <button
        type="button"
        aria-label="旋轉"
        className="pointer-events-auto absolute left-1/2 rounded-full border border-accent bg-surface"
        style={{
          width: size,
          height: size,
          top: -Math.max(36, 48 / scale),
          transform: "translate(-50%, -50%)",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onHandleDown?.(layer.id, "rotate", e);
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 w-px bg-accent"
        style={{
          top: -Math.max(36, 48 / scale),
          height: Math.max(36, 48 / scale),
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}

export function ArtboardView({
  artboard,
  brand,
  urls,
  width,
  selectedId,
  showGrid,
  showSafe,
  showBounds,
  interactive,
  draft,
  guides,
  ghost,
  editingId,
  onPointerDownLayer,
  onPointerDownCanvas,
  onDoubleClickLayer,
  onHandleDown,
  onTextChange,
  onTextEditEnd,
}: Props) {
  const format = formatById(artboard.formatId);
  const scale = width / format.width;
  const height = format.height * scale;
  const safe = format.safe;
  const bg = artboard.background;
  const selected = selectedId ? artboard.layers.find((l) => l.id === selectedId) : undefined;
  const backgroundImage = bg.type === "image" && bg.assetId ? urls[bg.assetId] : undefined;

  return (
    <div
      className="relative overflow-hidden bg-surface"
      style={{
        width,
        height,
        boxShadow: "var(--shadow-artboard)",
      }}
      onPointerDown={onPointerDownCanvas}
    >
      <div
        style={{
          width: format.width,
          height: format.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background:
            bg.type === "gradient" && bg.color2
              ? `linear-gradient(${bg.angle ?? 180}deg, ${bg.color}, ${bg.color2})`
              : bg.color,
        }}
      >
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
            crossOrigin="anonymous"
          />
        ) : null}
        {artboard.layers.map((layer) => (
          <LayerNode
            key={layer.id}
            layer={layer}
            brand={brand}
            urls={urls}
            selected={selectedId === layer.id}
            interactive={interactive}
            draft={draft?.[layer.id]}
            editing={editingId === layer.id}
            onPointerDownLayer={onPointerDownLayer}
            onDoubleClickLayer={onDoubleClickLayer}
            onTextChange={onTextChange}
            onTextEditEnd={onTextEditEnd}
          />
        ))}
        {showGrid && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 1px)",
              backgroundSize: "54px 54px",
            }}
          />
        )}
        {showBounds && (
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_18%,transparent)]" />
        )}
        {showSafe && (
          <div
            className="pointer-events-none absolute"
            style={{
              top: safe.top,
              left: safe.left,
              right: safe.right,
              bottom: safe.bottom,
              boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-accent) 45%, transparent)",
            }}
          />
        )}
        {ghost && (ghost.w ?? 0) > 4 && (ghost.h ?? 0) > 4 && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10"
            style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
          />
        )}
        {guides?.map((guide, i) =>
          guide.axis === "v" ? (
            <div
              key={`v-${guide.pos}-${i}`}
              className="pointer-events-none absolute top-0 h-full w-px bg-accent"
              style={{ left: guide.pos }}
            />
          ) : (
            <div
              key={`h-${guide.pos}-${i}`}
              className="pointer-events-none absolute left-0 h-px w-full bg-accent"
              style={{ top: guide.pos }}
            />
          ),
        )}
        {selected && interactive && editingId !== selected.id && (
          <TransformOverlay
            layer={selected}
            draft={draft?.[selected.id]}
            scale={scale}
            onHandleDown={onHandleDown}
          />
        )}
      </div>
    </div>
  );
}
