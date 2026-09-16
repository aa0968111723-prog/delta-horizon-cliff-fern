import { d as formatById } from "./schema-DPsPUDiS.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as cssFilter, T as cssTextShadow, h as cn, w as cssShadow } from "./button-D9W66xhT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/artboard-view-DcaulcuR.js
var import_jsx_runtime = require_jsx_runtime();
function shapeRadius(layer) {
	if (layer.shape === "pill") return layer.h / 2;
	if (layer.shape === "ellipse") return 9999;
	return layer.radius;
}
function imageStyle(layer) {
	const crop = layer.crop ?? {
		x: 50,
		y: 50,
		zoom: 1
	};
	const zoom = Math.max(1, crop.zoom);
	return {
		width: "100%",
		height: "100%",
		objectFit: layer.objectFit,
		objectPosition: `${crop.x}% ${crop.y}%`,
		transform: zoom !== 1 ? `scale(${zoom})` : void 0,
		transformOrigin: `${crop.x}% ${crop.y}%`,
		filter: cssFilter(layer.filter)
	};
}
function LayerNode({ layer, brand, urls, selected, interactive, draft, editing, onPointerDownLayer, onDoubleClickLayer, onTextChange, onTextEditEnd }) {
	if (layer.hidden) return null;
	const x = draft?.x ?? layer.x;
	const y = draft?.y ?? layer.y;
	const w = draft?.w ?? layer.w;
	const h = draft?.h ?? layer.h;
	const rotation = draft?.rotation ?? layer.rotation;
	const radius = layer.type === "shape" ? shapeRadius(layer) : layer.type === "image" || layer.type === "logo" ? layer.radius ?? 0 : 0;
	const style = {
		position: "absolute",
		left: x,
		top: y,
		width: w,
		height: h,
		opacity: layer.opacity,
		transform: rotation ? `rotate(${rotation}deg)` : void 0,
		transformOrigin: "center center",
		pointerEvents: interactive && !layer.locked ? "auto" : "none",
		touchAction: interactive ? "none" : void 0,
		overflow: layer.type === "line" ? "visible" : "hidden",
		borderRadius: radius,
		boxShadow: cssShadow(layer)
	};
	let inner = null;
	if (layer.type === "shape") inner = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "size-full",
		style: {
			background: layer.fill === "transparent" ? "transparent" : layer.fill,
			borderRadius: shapeRadius(layer),
			border: layer.stroke && (layer.strokeWidth ?? 0) > 0 ? `${layer.strokeWidth}px solid ${layer.stroke}` : void 0
		}
	});
	else if (layer.type === "line") {
		const line = layer;
		inner = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative size-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-0 right-0 top-1/2 -translate-y-1/2",
				style: {
					height: line.strokeWidth,
					background: line.stroke,
					borderRadius: 999
				}
			})
		});
	} else if (layer.type === "text") {
		const t = layer;
		const textStyle = {
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
			textShadow: cssTextShadow(layer)
		};
		inner = editing && interactive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			autoFocus: true,
			value: t.text,
			onChange: (e) => onTextChange?.(layer.id, e.target.value),
			onBlur: () => onTextEditEnd?.(),
			onPointerDown: (e) => e.stopPropagation(),
			onKeyDown: (e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onTextEditEnd?.();
				}
			},
			className: "size-full resize-none bg-transparent p-0 outline-none",
			style: textStyle
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "size-full overflow-hidden",
			style: textStyle,
			children: t.text
		});
	} else if (layer.type === "image") {
		const src = urls[layer.assetId];
		inner = src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			draggable: false,
			className: "size-full",
			style: imageStyle(layer),
			crossOrigin: "anonymous"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex size-full items-center justify-center bg-surface-2 text-xs text-muted",
			children: "沒有圖片"
		});
	} else {
		const assetId = layer.assetId ?? brand.logoAssetId;
		const src = assetId ? urls[assetId] : void 0;
		inner = src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			draggable: false,
			className: "size-full object-contain",
			crossOrigin: "anonymous"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex size-full items-center justify-center bg-surface-2 text-xs text-muted",
			children: "沒有圖片"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-layer-id": layer.id,
		"data-layer-type": layer.type,
		"data-layer-name": layer.name,
		"data-layer-role": layer.type === "text" ? layer.role : void 0,
		style,
		onPointerDown: (e) => onPointerDownLayer?.(layer.id, e),
		onDoubleClick: (e) => {
			e.stopPropagation();
			onDoubleClickLayer?.(layer.id);
		},
		className: cn(selected && interactive && "z-10"),
		children: [inner, selected && interactive && !editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 outline-2 outline-accent outline-offset-0" })]
	});
}
var HANDLES = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
];
function handlePos(id) {
	return {
		left: id.includes("w") ? "0%" : id.includes("e") ? "100%" : "50%",
		top: id.includes("n") ? "0%" : id.includes("s") ? "100%" : "50%"
	};
}
function TransformOverlay({ layer, draft, scale, onHandleDown }) {
	if (layer.locked) return null;
	const x = draft?.x ?? layer.x;
	const y = draft?.y ?? layer.y;
	const w = draft?.w ?? layer.w;
	const h = draft?.h ?? layer.h;
	const rotation = draft?.rotation ?? layer.rotation;
	const size = Math.max(14, 16 / scale);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute",
		style: {
			left: x,
			top: y,
			width: w,
			height: h,
			transform: rotation ? `rotate(${rotation}deg)` : void 0,
			transformOrigin: "center center",
			zIndex: 20
		},
		children: [
			HANDLES.map((id) => {
				const pos = handlePos(id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `縮放 ${id}`,
					className: "pointer-events-auto absolute rounded-sm border border-accent bg-surface",
					style: {
						width: size,
						height: size,
						left: pos.left,
						top: pos.top,
						transform: "translate(-50%, -50%)"
					},
					onPointerDown: (e) => {
						e.stopPropagation();
						onHandleDown?.(layer.id, id, e);
					}
				}, id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "旋轉",
				className: "pointer-events-auto absolute left-1/2 rounded-full border border-accent bg-surface",
				style: {
					width: size,
					height: size,
					top: -Math.max(36, 48 / scale),
					transform: "translate(-50%, -50%)"
				},
				onPointerDown: (e) => {
					e.stopPropagation();
					onHandleDown?.(layer.id, "rotate", e);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute left-1/2 w-px bg-accent",
				style: {
					top: -Math.max(36, 48 / scale),
					height: Math.max(36, 48 / scale),
					transform: "translateX(-50%)"
				}
			})
		]
	});
}
function ArtboardView({ artboard, brand, urls, width, selectedId, showGrid, showSafe, showBounds, interactive, draft, guides, ghost, editingId, onPointerDownLayer, onPointerDownCanvas, onDoubleClickLayer, onHandleDown, onTextChange, onTextEditEnd }) {
	const format = formatById(artboard.formatId);
	const scale = width / format.width;
	const height = format.height * scale;
	const safe = format.safe;
	const bg = artboard.background;
	const selected = selectedId ? artboard.layers.find((l) => l.id === selectedId) : void 0;
	const backgroundImage = bg.type === "image" && bg.assetId ? urls[bg.assetId] : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative overflow-hidden bg-surface",
		style: {
			width,
			height,
			boxShadow: "var(--shadow-artboard)"
		},
		onPointerDown: onPointerDownCanvas,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				width: format.width,
				height: format.height,
				transform: `scale(${scale})`,
				transformOrigin: "top left",
				background: bg.type === "gradient" && bg.color2 ? `linear-gradient(${bg.angle ?? 180}deg, ${bg.color}, ${bg.color2})` : bg.color
			},
			children: [
				backgroundImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: backgroundImage,
					alt: "",
					draggable: false,
					className: "pointer-events-none absolute inset-0 size-full object-cover",
					crossOrigin: "anonymous"
				}) : null,
				artboard.layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerNode, {
					layer,
					brand,
					urls,
					selected: selectedId === layer.id,
					interactive,
					draft: draft?.[layer.id],
					editing: editingId === layer.id,
					onPointerDownLayer,
					onDoubleClickLayer,
					onTextChange,
					onTextEditEnd
				}, layer.id)),
				showGrid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-0",
					style: {
						backgroundImage: "linear-gradient(to right, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 1px)",
						backgroundSize: "54px 54px"
					}
				}),
				showBounds && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_18%,transparent)]" }),
				showSafe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute",
					style: {
						top: safe.top,
						left: safe.left,
						right: safe.right,
						bottom: safe.bottom,
						boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-accent) 45%, transparent)"
					}
				}),
				ghost && (ghost.w ?? 0) > 4 && (ghost.h ?? 0) > 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10",
					style: {
						left: ghost.x,
						top: ghost.y,
						width: ghost.w,
						height: ghost.h
					}
				}),
				guides?.map((guide, i) => guide.axis === "v" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute top-0 h-full w-px bg-accent",
					style: { left: guide.pos }
				}, `v-${guide.pos}-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute left-0 h-px w-full bg-accent",
					style: { top: guide.pos }
				}, `h-${guide.pos}-${i}`)),
				selected && interactive && editingId !== selected.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransformOverlay, {
					layer: selected,
					draft: draft?.[selected.id],
					scale,
					onHandleDown
				})
			]
		})
	});
}
//#endregion
export { ArtboardView as t };
