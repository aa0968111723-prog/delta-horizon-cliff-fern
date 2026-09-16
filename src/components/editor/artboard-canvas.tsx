import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { toast } from "sonner";
import { ArtboardView, type LayerDraft } from "@/components/studio/artboard-view";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { AssetUploadError, decodeAssetImage } from "@/lib/studio/asset-upload";
import { ASSET_DRAG_MIME, kindFromCategory } from "@/lib/studio/assets";
import { formatById } from "@/lib/studio/formats";
import { resizeBox, rotateByPointer, snapMove } from "@/lib/studio/geometry";
import { uid } from "@/lib/studio/ids";
import {
  createLineLayer,
  createShapeLayer,
  createTextLayer,
} from "@/lib/studio/layers";
import type { Artboard, BrandKit, GuideLine, HandleId, Layer } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

type Draft = Partial<Record<string, LayerDraft>>;

type DragState =
  | {
      kind: "move" | "resize" | "rotate";
      id: string;
      handle?: HandleId;
      startX: number;
      startY: number;
      orig: Pick<Layer, "x" | "y" | "w" | "h" | "rotation">;
      keepAspect: boolean;
    }
  | {
      kind: "create";
      tool: "rect" | "ellipse" | "line";
      startX: number;
      startY: number;
    };

export function ArtboardCanvas({
  projectId,
  artboard,
  brand,
  urls,
}: {
  projectId: string;
  artboard: Artboard;
  brand: BrandKit;
  urls: Record<string, string>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 320, h: 480 });
  const selectedId = useStudio((s) => s.editor.selectedId);
  const showGrid = useStudio((s) => s.editor.showGrid);
  const showSafe = useStudio((s) => s.editor.showSafe);
  const showBounds = useStudio((s) => s.editor.showBounds);
  const zoomPref = useStudio((s) => s.editor.zoom);
  const tool = useStudio((s) => s.editor.tool);
  const select = useStudio((s) => s.select);
  const updateLayer = useStudio((s) => s.updateLayer);
  const addLayer = useStudio((s) => s.addLayer);
  const addAsset = useStudio((s) => s.addAsset);
  const placeAsset = useStudio((s) => s.placeAsset);
  const [draft, setDraft] = useState<Draft>({});
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      setBox({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const format = formatById(artboard.formatId);
  const pad = box.h < 280 ? 16 : 48;
  const fit = Math.min((box.w - pad) / format.width, (box.h - pad) / format.height);
  const zoom = zoomPref > 0 ? zoomPref : Math.max(0.2, Number.isFinite(fit) ? fit : 0.2);
  const width = format.width * zoom;

  function clientToNative(clientX: number, clientY: number) {
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (!wrap) return { x: 0, y: 0 };
    const boardW = format.width * zoom;
    const boardH = format.height * zoom;
    const ox = wrap.left + (wrap.width - boardW) / 2;
    const oy = wrap.top + (wrap.height - boardH) / 2;
    return {
      x: (clientX - ox) / zoom,
      y: (clientY - oy) / zoom,
    };
  }

  function layerAt(id: string): Layer | undefined {
    return artboard.layers.find((l) => l.id === id);
  }

  function onPointerDownLayer(id: string, event: PointerEvent<HTMLDivElement>) {
    if (tool !== "select") return;
    event.stopPropagation();
    const layer = layerAt(id);
    if (!layer) return;
    select(id);
    if (layer.locked || editingId === id) return;
    dragRef.current = {
      kind: "move",
      id,
      startX: event.clientX,
      startY: event.clientY,
      orig: { x: layer.x, y: layer.y, w: layer.w, h: layer.h, rotation: layer.rotation },
      keepAspect: event.shiftKey,
    };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function onHandleDown(id: string, handle: HandleId | "rotate", event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const layer = layerAt(id);
    if (!layer || layer.locked) return;
    select(id);
    const origDraft = draft[id];
    dragRef.current = {
      kind: handle === "rotate" ? "rotate" : "resize",
      id,
      handle: handle === "rotate" ? undefined : handle,
      startX: event.clientX,
      startY: event.clientY,
      orig: {
        x: origDraft?.x ?? layer.x,
        y: origDraft?.y ?? layer.y,
        w: origDraft?.w ?? layer.w,
        h: origDraft?.h ?? layer.h,
        rotation: origDraft?.rotation ?? layer.rotation,
      },
      keepAspect: event.shiftKey || layer.type === "logo",
    };
    wrapRef.current?.setPointerCapture?.(event.pointerId);
  }

  function onPointerDownCanvas(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget && (event.target as HTMLElement).dataset.layerId) return;
    const native = clientToNative(event.clientX, event.clientY);
    if (tool === "text") {
      const layer = createTextLayer(brand, {
        x: Math.round(native.x - 200),
        y: Math.round(native.y - 40),
        w: 400,
        h: 80,
      });
      addLayer(projectId, layer);
      setEditingId(layer.id);
      return;
    }
    if (tool === "rect" || tool === "ellipse" || tool === "line") {
      dragRef.current = { kind: "create", tool, startX: native.x, startY: native.y };
      wrapRef.current?.setPointerCapture?.(event.pointerId);
      return;
    }
    setEditingId(null);
    select(null);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind === "create") {
      const native = clientToNative(event.clientX, event.clientY);
      const x = Math.min(drag.startX, native.x);
      const y = Math.min(drag.startY, native.y);
      const w = Math.abs(native.x - drag.startX);
      const h = Math.abs(native.y - drag.startY);
      setDraft({
        __creating: { x, y, w, h, rotation: 0 },
      });
      return;
    }
    const native = clientToNative(event.clientX, event.clientY);
    const start = clientToNative(drag.startX, drag.startY);
    if (drag.kind === "move") {
      const moved = {
        x: Math.round(drag.orig.x + (native.x - start.x)),
        y: Math.round(drag.orig.y + (native.y - start.y)),
        w: drag.orig.w,
        h: drag.orig.h,
      };
      const snapped = snapMove(
        moved,
        artboard,
        format,
        drag.id,
        Math.max(8, 10 / zoom),
        showGrid,
      );
      setGuides(snapped.guides);
      setDraft({
        [drag.id]: { ...snapped.box, rotation: drag.orig.rotation },
      });
      return;
    }
    if (drag.kind === "rotate") {
      const next = rotateByPointer(drag.orig, start, native, event.shiftKey);
      setDraft({
        [drag.id]: { x: drag.orig.x, y: drag.orig.y, w: drag.orig.w, h: drag.orig.h, rotation: next },
      });
      return;
    }
    if (drag.kind === "resize" && drag.handle) {
      const keepAspect = drag.keepAspect || event.shiftKey;
      const boxNext = resizeBox(drag.orig, drag.handle, native, {
        min: drag.orig.w < 40 && drag.orig.h < 40 ? 8 : 16,
        keepAspect,
      });
      setDraft({
        [drag.id]: { ...boxNext, rotation: drag.orig.rotation },
      });
    }
  }

  function onPointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    setGuides([]);
    if (!drag) {
      setDraft({});
      return;
    }
    if (drag.kind === "create") {
      const creating = draft.__creating;
      setDraft({});
      const w = Math.max(8, creating?.w ?? 0);
      const h = Math.max(8, creating?.h ?? 0);
      const x = creating?.x ?? drag.startX;
      const y = creating?.y ?? drag.startY;
      if (drag.tool === "line") {
        addLayer(
          projectId,
          createLineLayer(brand, {
            x: Math.round(x),
            y: Math.round(y),
            w: Math.max(40, w),
            h: 40,
          }),
        );
      } else {
        addLayer(
          projectId,
          createShapeLayer(brand, drag.tool, {
            x: Math.round(x),
            y: Math.round(y),
            w: Math.max(24, w),
            h: Math.max(24, h),
          }),
        );
      }
      return;
    }
    const next = draft[drag.id];
    if (next) {
      updateLayer(projectId, drag.id, next);
    }
    setDraft({});
  }

  const cursor =
    tool === "text" ? "text" : tool === "select" ? "default" : "crosshair";

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const assetId = event.dataTransfer.getData(ASSET_DRAG_MIME);
    const native = clientToNative(event.clientX, event.clientY);
    if (assetId) {
      const ok = placeAsset(projectId, assetId, native);
      if (ok) toast.success("已放到畫布");
      return;
    }
    const files = event.dataTransfer.files;
    if (!files.length) return;
    for (const file of Array.from(files)) {
      try {
        const decoded = await decodeAssetImage(file);
        const id = uid("asset");
        await getAssetStorage().put(id, decoded.blob);
        addAsset({
          id,
          name: file.name.replace(/\.[^.]+$/, "") || "未命名素材",
          kind: kindFromCategory("photo"),
          category: "photo",
          mime: decoded.mime,
          width: decoded.width,
          height: decoded.height,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source: "upload",
          licenseNotes: "",
          licenseOwner: "",
          favorite: false,
          lastUsedAt: null,
          useCount: 0,
        });
        placeAsset(projectId, id, native);
        toast.success(`已放入「${file.name}」（僅存此裝置）`);
      } catch (err) {
        toast.error(err instanceof AssetUploadError || err instanceof Error ? err.message : "無法放到畫布");
      }
    }
  }

  return (
    <div
      ref={wrapRef}
      data-testid="studio-artboard"
      className="relative flex h-0 min-h-[240px] w-full min-w-0 flex-1 items-center justify-center overflow-auto bg-bg touch-none"
      style={{ cursor }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        void onDrop(e);
      }}
    >
      <ArtboardView
        artboard={artboard}
        brand={brand}
        urls={urls}
        width={width}
        selectedId={selectedId}
        showGrid={showGrid}
        showSafe={showSafe}
        showBounds={showBounds}
        interactive
        draft={draft}
        guides={guides}
        ghost={draft.__creating}
        editingId={editingId}
        onPointerDownLayer={onPointerDownLayer}
        onPointerDownCanvas={onPointerDownCanvas}
        onDoubleClickLayer={(id) => {
          const layer = layerAt(id);
          if (layer?.type === "text" && !layer.locked) setEditingId(id);
        }}
        onHandleDown={onHandleDown}
        onTextChange={(id, text) => {
          useStudio.getState().patchArtboard(
            projectId,
            (a) => ({
              ...a,
              layers: a.layers.map((l) => (l.id === id && l.type === "text" ? { ...l, text } : l)),
            }),
            false,
          );
        }}
        onTextEditEnd={() => {
          useStudio.getState().patchArtboard(projectId, (a) => a, true);
          setEditingId(null);
        }}
      />
    </div>
  );
}
