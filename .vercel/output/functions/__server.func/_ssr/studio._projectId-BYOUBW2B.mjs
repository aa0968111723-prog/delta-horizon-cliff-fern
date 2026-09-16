import { i as __toESM } from "../_runtime.mjs";
import { t as uid } from "./ids-D2oCDrlv.mjs";
import { d as formatById, i as FORMATS, o as PAGE_ROLE_LABEL, t as ADAPT_FORMATS, u as copyFromArtboard } from "./schema-iJpgBEjq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, B as pagesOf, F as matchesAssetQuery, G as snapMove, H as resizeBox, I as migrateBrief, J as textOverflows$1, M as inspectProject, N as kindFromCategory, P as logoUsageLabel, S as createTextLayer, W as rotateByPointer, X as useStudio, b as createLogoLayer, n as ASSET_DRAG_MIME, t as ASSET_CATEGORIES, tt as cn, u as activeArtboard, v as createImageLayer, x as createShapeLayer, y as createLineLayer } from "./studio-store-BqpaoTm7.mjs";
import { n as Input, r as Textarea, t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Label, r as SelectItem, t as Select } from "./select-DIEr3sGB.mjs";
import { n as decodeAssetImage, t as AssetUploadError } from "./asset-upload-BZwZSP2I.mjs";
import { t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { $ as Circle, A as Minus, B as Image, C as Plus, I as LayoutGrid, L as Layers, M as LockOpen, Q as Copy, S as Redo2, U as History, X as EyeOff, Y as Eye, _ as Scan, b as RotateCcw, dt as AlignCenter, f as Star, h as Sparkles, i as Upload, it as ChevronDown, j as Lock, k as MousePointer2, l as Trash2, lt as AlignLeft, nt as ChevronRight, o as Undo2, p as Square, q as Frame, rt as ChevronLeft, s as Type, tt as ChevronUp, ut as AlignRight, v as Save, x as RefreshCw, y as Rows3, z as Images } from "../_libs/lucide-react.mjs";
import { a as Trigger, i as Root2, n as Item2, r as Portal2, t as Content2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as useUi, _ as PlanResult, b as getCampaignAiStatus, c as SaveIndicator, d as Sheet, f as SheetContent, g as EditorAgent, h as BriefFields, n as Route, p as SheetTitle, u as ScrollArea, v as describeAdapter, x as toBriefInput, y as generateCampaignPlan } from "./router-CCaD8IgA.mjs";
import { t as ArtboardView } from "./artboard-view-h-1TjLhY.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { n as STUDIO_FONTS, r as Switch, t as FONT_WEIGHTS } from "./fonts-B8H2r7PQ.mjs";
import { r as format, t as zhTW } from "../_libs/date-fns.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-CHY4mcIV.mjs";
import { t as QualityPanel } from "./quality-panel-CQynoSjf.mjs";
import { n as nn, r as qt, t as Qt } from "../_libs/react-resizable-panels.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
import { i as Trigger$1, n as List, r as Root2$1, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio._projectId-BYOUBW2B.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AssetTray({ projectId }) {
	const assets = useStudio((s) => s.assets);
	const addAsset = useStudio((s) => s.addAsset);
	const placeAsset = useStudio((s) => s.placeAsset);
	const toggleFavorite = useStudio((s) => s.toggleFavorite);
	const urls = useAssetUrls(assets.map((a) => a.id));
	const fileRef = (0, import_react.useRef)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const visible = (0, import_react.useMemo)(() => {
		return assets.filter((asset) => {
			if (!matchesAssetQuery(asset, q)) return false;
			if (category === "favorite") return asset.favorite;
			if (category !== "all" && asset.category !== category) return false;
			return true;
		});
	}, [
		assets,
		q,
		category
	]);
	async function onFiles(files) {
		setBusy(true);
		try {
			let ok = 0;
			for (const file of Array.from(files)) try {
				const { blob, width, height, mime } = await decodeAssetImage(file);
				const id = uid("asset");
				await getAssetStorage().put(id, blob);
				addAsset({
					id,
					name: file.name.replace(/\.[^.]+$/, ""),
					kind: kindFromCategory("photo"),
					category: "photo",
					mime,
					width,
					height,
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
					source: "upload",
					licenseNotes: "",
					licenseOwner: "",
					favorite: false,
					lastUsedAt: null,
					useCount: 0
				});
				ok += 1;
			} catch (err) {
				toast.error(err instanceof AssetUploadError || err instanceof Error ? err.message : "上傳失敗");
			}
			if (ok) toast.success(`已加入 ${ok} 張（僅存此裝置）`);
		} finally {
			setBusy(false);
		}
	}
	function place(assetId, name) {
		if (placeAsset(projectId, assetId)) toast.success(`已放入「${name}」`);
		else toast.error("無法放到畫布");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium text-muted",
						children: "素材"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						disabled: busy,
						onClick: () => fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), busy ? "處理中…" : "上傳"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: "image/jpeg,image/png,image/webp,image/gif,image/svg+xml",
						multiple: true,
						className: "hidden",
						onChange: (e) => {
							if (e.target.files?.length) onFiles(e.target.files);
							e.target.value = "";
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "搜尋",
					className: "h-9"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1 overflow-x-auto px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: category === "all",
						onClick: () => setCategory("all"),
						children: "全部"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: category === "favorite",
						onClick: () => setCategory("favorite"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3" })
					}),
					ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						active: category === item.id,
						onClick: () => setCategory(item.id),
						children: item.label
					}, item.id))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pb-1 text-xs text-subtle",
				children: "拖到畫布，或點一下放入。檔案只存在此裝置。"
			}),
			visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Images,
					title: "沒有素材",
					description: "上傳商品圖或 Logo，點一下就能放到畫布。"
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "min-h-0 flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-2 p-3",
					children: visible.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						draggable: true,
						onDragStart: (e) => {
							e.dataTransfer.setData(ASSET_DRAG_MIME, asset.id);
							e.dataTransfer.effectAllowed = "copy";
						},
						onClick: () => place(asset.id, asset.name),
						className: "w-full overflow-hidden rounded-lg bg-bg text-left shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "aspect-square",
							children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: urls[asset.id],
								alt: "",
								className: "size-full object-cover",
								draggable: false
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-full items-center justify-center text-xs text-muted",
								children: "載入中"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-1 px-2 py-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs",
								children: asset.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								role: "button",
								tabIndex: 0,
								onClick: (e) => {
									e.stopPropagation();
									toggleFavorite(asset.id);
								},
								onKeyDown: (e) => {
									if (e.key === "Enter") {
										e.stopPropagation();
										toggleFavorite(asset.id);
									}
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-3", asset.favorite && "fill-warn text-warn") })
							})]
						})]
					}) }, asset.id))
				})
			})
		]
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("flex h-8 shrink-0 items-center rounded-full px-2 text-xs", active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"),
		children
	});
}
function ArtboardCanvas({ projectId, artboard, brand, urls }) {
	const wrapRef = (0, import_react.useRef)(null);
	const [box, setBox] = (0, import_react.useState)({
		w: 320,
		h: 480
	});
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
	const [draft, setDraft] = (0, import_react.useState)({});
	const [guides, setGuides] = (0, import_react.useState)([]);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const dragRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		const obs = new ResizeObserver(() => {
			const r = el.getBoundingClientRect();
			setBox({
				w: r.width,
				h: r.height
			});
		});
		obs.observe(el);
		return () => obs.disconnect();
	}, []);
	const format = formatById(artboard.formatId);
	const pad = 48;
	const fit = Math.min((box.w - pad) / format.width, (box.h - pad) / format.height);
	const zoom = zoomPref > 0 ? zoomPref : Math.max(.12, fit);
	const width = format.width * zoom;
	function clientToNative(clientX, clientY) {
		const wrap = wrapRef.current?.getBoundingClientRect();
		if (!wrap) return {
			x: 0,
			y: 0
		};
		const boardW = format.width * zoom;
		const boardH = format.height * zoom;
		const ox = wrap.left + (wrap.width - boardW) / 2;
		const oy = wrap.top + (wrap.height - boardH) / 2;
		return {
			x: (clientX - ox) / zoom,
			y: (clientY - oy) / zoom
		};
	}
	function layerAt(id) {
		return artboard.layers.find((l) => l.id === id);
	}
	function onPointerDownLayer(id, event) {
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
			orig: {
				x: layer.x,
				y: layer.y,
				w: layer.w,
				h: layer.h,
				rotation: layer.rotation
			},
			keepAspect: event.shiftKey
		};
		event.currentTarget.setPointerCapture?.(event.pointerId);
	}
	function onHandleDown(id, handle, event) {
		event.stopPropagation();
		const layer = layerAt(id);
		if (!layer || layer.locked) return;
		select(id);
		const origDraft = draft[id];
		dragRef.current = {
			kind: handle === "rotate" ? "rotate" : "resize",
			id,
			handle: handle === "rotate" ? void 0 : handle,
			startX: event.clientX,
			startY: event.clientY,
			orig: {
				x: origDraft?.x ?? layer.x,
				y: origDraft?.y ?? layer.y,
				w: origDraft?.w ?? layer.w,
				h: origDraft?.h ?? layer.h,
				rotation: origDraft?.rotation ?? layer.rotation
			},
			keepAspect: event.shiftKey || layer.type === "logo"
		};
		wrapRef.current?.setPointerCapture?.(event.pointerId);
	}
	function onPointerDownCanvas(event) {
		if (event.target !== event.currentTarget && event.target.dataset.layerId) return;
		const native = clientToNative(event.clientX, event.clientY);
		if (tool === "text") {
			const layer = createTextLayer(brand, {
				x: Math.round(native.x - 200),
				y: Math.round(native.y - 40),
				w: 400,
				h: 80
			});
			addLayer(projectId, layer);
			setEditingId(layer.id);
			return;
		}
		if (tool === "rect" || tool === "ellipse" || tool === "line") {
			dragRef.current = {
				kind: "create",
				tool,
				startX: native.x,
				startY: native.y
			};
			wrapRef.current?.setPointerCapture?.(event.pointerId);
			return;
		}
		setEditingId(null);
		select(null);
	}
	function onPointerMove(event) {
		const drag = dragRef.current;
		if (!drag) return;
		if (drag.kind === "create") {
			const native = clientToNative(event.clientX, event.clientY);
			const x = Math.min(drag.startX, native.x);
			const y = Math.min(drag.startY, native.y);
			const w = Math.abs(native.x - drag.startX);
			const h = Math.abs(native.y - drag.startY);
			setDraft({ __creating: {
				x,
				y,
				w,
				h,
				rotation: 0
			} });
			return;
		}
		const native = clientToNative(event.clientX, event.clientY);
		const start = clientToNative(drag.startX, drag.startY);
		if (drag.kind === "move") {
			const moved = {
				x: Math.round(drag.orig.x + (native.x - start.x)),
				y: Math.round(drag.orig.y + (native.y - start.y)),
				w: drag.orig.w,
				h: drag.orig.h
			};
			const snapped = snapMove(moved, artboard, format, drag.id, Math.max(8, 10 / zoom), showGrid);
			setGuides(snapped.guides);
			setDraft({ [drag.id]: {
				...snapped.box,
				rotation: drag.orig.rotation
			} });
			return;
		}
		if (drag.kind === "rotate") {
			const next = rotateByPointer(drag.orig, start, native, event.shiftKey);
			setDraft({ [drag.id]: {
				x: drag.orig.x,
				y: drag.orig.y,
				w: drag.orig.w,
				h: drag.orig.h,
				rotation: next
			} });
			return;
		}
		if (drag.kind === "resize" && drag.handle) {
			const keepAspect = drag.keepAspect || event.shiftKey;
			const boxNext = resizeBox(drag.orig, drag.handle, native, {
				min: drag.orig.w < 40 && drag.orig.h < 40 ? 8 : 16,
				keepAspect
			});
			setDraft({ [drag.id]: {
				...boxNext,
				rotation: drag.orig.rotation
			} });
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
			if (drag.tool === "line") addLayer(projectId, createLineLayer(brand, {
				x: Math.round(x),
				y: Math.round(y),
				w: Math.max(40, w),
				h: 40
			}));
			else addLayer(projectId, createShapeLayer(brand, drag.tool, {
				x: Math.round(x),
				y: Math.round(y),
				w: Math.max(24, w),
				h: Math.max(24, h)
			}));
			return;
		}
		const next = draft[drag.id];
		if (next) updateLayer(projectId, drag.id, next);
		setDraft({});
	}
	const cursor = tool === "text" ? "text" : tool === "select" ? "default" : "crosshair";
	async function onDrop(event) {
		event.preventDefault();
		const assetId = event.dataTransfer.getData(ASSET_DRAG_MIME);
		const native = clientToNative(event.clientX, event.clientY);
		if (assetId) {
			if (placeAsset(projectId, assetId, native)) toast.success("已放到畫布");
			return;
		}
		const files = event.dataTransfer.files;
		if (!files.length) return;
		for (const file of Array.from(files)) try {
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
				useCount: 0
			});
			placeAsset(projectId, id, native);
			toast.success(`已放入「${file.name}」（僅存此裝置）`);
		} catch (err) {
			toast.error(err instanceof AssetUploadError || err instanceof Error ? err.message : "無法放到畫布");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "relative flex h-0 min-h-0 w-full flex-1 items-center justify-center overflow-auto bg-bg touch-none",
		style: { cursor },
		onPointerMove,
		onPointerUp,
		onPointerCancel: onPointerUp,
		onDragOver: (e) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		},
		onDrop: (e) => {
			onDrop(e);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
			artboard,
			brand,
			urls,
			width,
			selectedId,
			showGrid,
			showSafe,
			showBounds,
			interactive: true,
			draft,
			guides,
			ghost: draft.__creating,
			editingId,
			onPointerDownLayer,
			onPointerDownCanvas,
			onDoubleClickLayer: (id) => {
				const layer = layerAt(id);
				if (layer?.type === "text" && !layer.locked) setEditingId(id);
			},
			onHandleDown,
			onTextChange: (id, text) => {
				useStudio.getState().patchArtboard(projectId, (a) => ({
					...a,
					layers: a.layers.map((l) => l.id === id && l.type === "text" ? {
						...l,
						text
					} : l)
				}), false);
			},
			onTextEditEnd: () => {
				useStudio.getState().patchArtboard(projectId, (a) => a, true);
				setEditingId(null);
			}
		})
	});
}
function CopyPanel({ project }) {
	const setCopy = useStudio((s) => s.setCopy);
	const reflow = useStudio((s) => s.reflow);
	const artboard = activeArtboard(project);
	const slideCopy = artboard ? copyFromArtboard(artboard, project.copy) : project.copy;
	const roleLabel = artboard?.role ? PAGE_ROLE_LABEL[artboard.role] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 p-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "text-sm font-medium",
				children: ["文字", roleLabel ? ` · ${roleLabel}` : ""]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "改這裡只影響目前這一頁，風格與品牌色不變。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "眉題",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: slideCopy.eyebrow,
					onChange: (e) => setCopy(project.id, { eyebrow: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "畫面標題",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: slideCopy.headline,
					onChange: (e) => setCopy(project.id, { headline: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "副標",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: slideCopy.subhead,
					onChange: (e) => setCopy(project.id, { subhead: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "內文",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: slideCopy.body,
					onChange: (e) => setCopy(project.id, { body: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "CTA",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: slideCopy.cta,
					onChange: (e) => setCopy(project.id, { cta: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				className: "w-full",
				onClick: () => reflow(project.id),
				children: "依此頁文案重排"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "Caption",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					rows: 6,
					value: project.copy.caption,
					onChange: (e) => setCopy(project.id, { caption: e.target.value })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: async () => {
						await navigator.clipboard.writeText(project.copy.caption);
						toast.success("已複製 Caption");
					},
					children: "複製文案"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: async () => {
						await navigator.clipboard.writeText(project.copy.hashtags.join(" "));
						toast.success("已複製標籤");
					},
					children: "複製標籤"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: project.copy.hashtags.join(" ")
			})
		]
	});
}
function Field$1({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
var TOOLS = [
	{
		id: "select",
		label: "選取",
		icon: MousePointer2
	},
	{
		id: "text",
		label: "文字",
		icon: Type
	},
	{
		id: "rect",
		label: "矩形",
		icon: Square
	},
	{
		id: "ellipse",
		label: "圓形",
		icon: Circle
	},
	{
		id: "line",
		label: "線條",
		icon: Minus
	}
];
function EditorToolbar() {
	const tool = useStudio((s) => s.editor.tool);
	const zoom = useStudio((s) => s.editor.zoom);
	const showGrid = useStudio((s) => s.editor.showGrid);
	const showSafe = useStudio((s) => s.editor.showSafe);
	const showBounds = useStudio((s) => s.editor.showBounds);
	const setEditor = useStudio((s) => s.setEditor);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1 overflow-x-auto px-2 py-1.5",
		children: [
			TOOLS.map((item) => {
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: tool === item.id ? "default" : "ghost",
					onClick: () => setEditor({ tool: item.id }),
					"aria-label": item.label,
					className: cn("shrink-0"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden md:inline",
						children: item.label
					})]
				}, item.id);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-1 h-5 w-px shrink-0 bg-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: zoom === 0 ? "secondary" : "ghost",
				onClick: () => setEditor({ zoom: 0 }),
				children: "適應"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: zoom === .5 ? "secondary" : "ghost",
				onClick: () => setEditor({ zoom: .5 }),
				children: "50%"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: zoom === 1 ? "secondary" : "ghost",
				onClick: () => setEditor({ zoom: 1 }),
				children: "100%"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-1 h-5 w-px shrink-0 bg-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon-sm",
				variant: showSafe ? "secondary" : "ghost",
				"aria-label": "安全區",
				onClick: () => setEditor({ showSafe: !showSafe }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon-sm",
				variant: showBounds ? "secondary" : "ghost",
				"aria-label": "畫布邊界",
				onClick: () => setEditor({ showBounds: !showBounds }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: showGrid ? "secondary" : "ghost",
				onClick: () => setEditor({ showGrid: !showGrid }),
				children: "格線"
			})
		]
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-6 w-full touch-none items-center select-none", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1 w-full grow overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-accent shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring/30" })]
	});
}
var CANVAS_ALIGN = [
	{
		mode: "left",
		label: "左"
	},
	{
		mode: "center",
		label: "中"
	},
	{
		mode: "right",
		label: "右"
	},
	{
		mode: "top",
		label: "上"
	},
	{
		mode: "middle",
		label: "直中"
	},
	{
		mode: "bottom",
		label: "下"
	}
];
var SAFE_ALIGN = [
	{
		mode: "safe-left",
		label: "安全左"
	},
	{
		mode: "safe-center",
		label: "安全中"
	},
	{
		mode: "safe-right",
		label: "安全右"
	},
	{
		mode: "safe-top",
		label: "安全上"
	},
	{
		mode: "safe-bottom",
		label: "安全下"
	}
];
function Inspector({ projectId, artboard, brand }) {
	const selectedId = useStudio((s) => s.editor.selectedId);
	const updateLayer = useStudio((s) => s.updateLayer);
	const patchArtboard = useStudio((s) => s.patchArtboard);
	const alignLayer = useStudio((s) => s.alignLayer);
	const duplicateLayer = useStudio((s) => s.duplicateLayer);
	const removeLayer = useStudio((s) => s.removeLayer);
	const assets = useStudio((s) => s.assets);
	const layer = artboard.layers.find((l) => l.id === selectedId);
	if (!layer) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "畫布"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "背景類型",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: artboard.background.type,
					onValueChange: (v) => patchArtboard(projectId, (a) => ({
						...a,
						background: {
							...a.background,
							type: v,
							color2: a.background.color2 ?? a.background.color
						}
					})),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "solid",
							children: "單色"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "gradient",
							children: "漸層"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "image",
							children: "圖片"
						})
					] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "底色",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
					value: artboard.background.color,
					brand,
					onChange: (hex) => patchArtboard(projectId, (a) => ({
						...a,
						background: {
							...a.background,
							color: hex
						}
					}))
				})
			}),
			artboard.background.type === "gradient" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "漸層終點",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
					value: artboard.background.color2 ?? artboard.background.color,
					brand,
					onChange: (hex) => patchArtboard(projectId, (a) => ({
						...a,
						background: {
							...a.background,
							color2: hex,
							type: "gradient"
						}
					}))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `角度 ${artboard.background.angle ?? 180}°`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 360,
					step: 1,
					value: [artboard.background.angle ?? 180],
					onValueChange: ([v]) => patchArtboard(projectId, (a) => ({
						...a,
						background: {
							...a.background,
							angle: v ?? 180,
							type: "gradient"
						}
					}))
				})
			})] }),
			artboard.background.type === "image" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "背景圖",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: artboard.background.assetId ?? "none",
					onValueChange: (v) => patchArtboard(projectId, (a) => ({
						...a,
						background: {
							...a.background,
							type: "image",
							assetId: v === "none" ? void 0 : v
						}
					})),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "選擇素材" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "none",
						children: "未選擇"
					}), assets.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: asset.id,
						children: asset.name
					}, asset.id))] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "點選圖層以編輯位置、文字、裁切與濾鏡。"
			})
		]
	});
	const selected = layer;
	function set(key, value) {
		updateLayer(projectId, selected.id, { [key]: value });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: selected.name,
					onChange: (e) => set("name", e.target.value),
					className: "h-9"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: () => duplicateLayer(projectId, selected.id),
						children: "複製"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: selected.locked ? "default" : "secondary",
						onClick: () => set("locked", !selected.locked),
						children: selected.locked ? "已鎖定" : "鎖定"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: selected.hidden ? "default" : "secondary",
						onClick: () => set("hidden", !selected.hidden),
						children: selected.hidden ? "已隱藏" : "隱藏"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => removeLayer(projectId, selected.id),
						children: "刪除"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1.5 text-xs text-muted",
					children: "對齊畫布"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: CANVAS_ALIGN.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						disabled: selected.locked,
						onClick: () => alignLayer(projectId, selected.id, item.mode),
						children: item.label
					}, item.mode))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1.5 mt-3 text-xs text-muted",
					children: "對齊安全區"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: SAFE_ALIGN.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						disabled: selected.locked,
						onClick: () => alignLayer(projectId, selected.id, item.mode),
						children: item.label
					}, item.mode))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "X",
						value: selected.x,
						onChange: (v) => set("x", v)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Y",
						value: selected.y,
						onChange: (v) => set("y", v)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "寬",
						value: selected.w,
						onChange: (v) => set("w", v)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "高",
						value: selected.h,
						onChange: (v) => set("h", v)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `旋轉 ${Math.round(selected.rotation)}°`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: -180,
					max: 180,
					step: 1,
					value: [selected.rotation],
					onValueChange: ([v]) => set("rotation", v ?? 0)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `透明度 ${Math.round(selected.opacity * 100)}%`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 1,
					step: .01,
					value: [selected.opacity],
					onValueChange: ([v]) => set("opacity", v ?? 1)
				})
			}),
			selected.type === "text" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextFields, {
				layer: selected,
				brand,
				onPatch: (patch) => updateLayer(projectId, selected.id, patch)
			}),
			selected.type === "shape" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "填色",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							value: selected.fill,
							brand,
							onChange: (hex) => updateLayer(projectId, selected.id, { fill: hex })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "框線",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							value: selected.stroke ?? "#000000",
							brand,
							onChange: (hex) => updateLayer(projectId, selected.id, { stroke: hex })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "框線粗細",
						value: selected.strokeWidth ?? 0,
						onChange: (v) => updateLayer(projectId, selected.id, { strokeWidth: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "圓角",
						value: selected.radius,
						onChange: (v) => updateLayer(projectId, selected.id, { radius: v })
					})
				]
			}),
			selected.type === "line" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "線色",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
						value: selected.stroke,
						brand,
						onChange: (hex) => updateLayer(projectId, selected.id, { stroke: hex })
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `粗細 ${selected.strokeWidth}px`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 1,
						max: 24,
						step: 1,
						value: [selected.strokeWidth],
						onValueChange: ([v]) => updateLayer(projectId, selected.id, { strokeWidth: v ?? 4 })
					})
				})]
			}),
			(selected.type === "image" || selected.type === "logo") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageFields, {
				layer: selected,
				brand,
				assets,
				onPatch: (patch) => updateLayer(projectId, selected.id, patch)
			}),
			(selected.type === "image" || selected.type === "shape" || selected.type === "logo") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShadowFields, {
				layer: selected,
				onPatch: (patch) => updateLayer(projectId, selected.id, patch)
			})
		]
	});
}
function TextFields({ layer, brand, onPatch }) {
	const clipped = textOverflows$1(layer);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "內容",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: layer.text,
					onChange: (e) => onPatch({ text: e.target.value })
				})
			}),
			clipped ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-warn",
				children: "文字超出圖層高度，已裁切。請加大高度或縮小字級。"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "字型",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: layer.fontFamily,
					onValueChange: (v) => onPatch({ fontFamily: v }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STUDIO_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: f.id,
						children: f.label
					}, f.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "字重",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: String(layer.fontWeight),
						onValueChange: (v) => onPatch({ fontWeight: Number(v) }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FONT_WEIGHTS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: String(w),
							children: w
						}, w)) })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
					label: "字級",
					value: layer.fontSize,
					onChange: (v) => onPatch({ fontSize: v })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `行距 ${layer.lineHeight.toFixed(2)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: .8,
					max: 2.4,
					step: .05,
					value: [layer.lineHeight],
					onValueChange: ([v]) => onPatch({ lineHeight: v ?? 1.2 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `字距 ${layer.letterSpacing}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: -6,
					max: 16,
					step: .5,
					value: [layer.letterSpacing],
					onValueChange: ([v]) => onPatch({ letterSpacing: v ?? 0 })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "對齊",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: [
						"left",
						"center",
						"right"
					].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: layer.align === a ? "default" : "secondary",
						onClick: () => onPatch({ align: a }),
						"aria-label": a,
						children: a === "left" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlignLeft, { className: "size-4" }) : a === "center" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlignCenter, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlignRight, { className: "size-4" })
					}, a))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "顏色",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
					value: layer.color,
					brand,
					onChange: (hex) => onPatch({ color: hex })
				})
			})
		]
	});
}
function ImageFields({ layer, brand, assets, onPatch }) {
	const isImage = layer.type === "image";
	const filter = isImage ? layer.filter : void 0;
	const crop = isImage ? layer.crop : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			layer.type === "logo" && brand.logos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Logo 版本",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: layer.assetId ?? brand.logoAssetId ?? "none",
					onValueChange: (v) => onPatch({ assetId: v === "none" ? void 0 : v }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "選擇版本" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: brand.logos.map((logo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
						value: logo.assetId,
						children: [
							logo.name,
							" · ",
							logoUsageLabel(logo.usage)
						]
					}, logo.id)) })]
				})
			}) : null,
			isImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "替換素材",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: layer.assetId,
					onValueChange: (v) => onPatch({ assetId: v }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: assets.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: asset.id,
						children: asset.name
					}, asset.id)) })]
				})
			}) : null,
			isImage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "適應",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: layer.objectFit === "cover" ? "default" : "secondary",
							onClick: () => onPatch({ objectFit: "cover" }),
							children: "裁切填滿"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: layer.objectFit === "contain" ? "default" : "secondary",
							onClick: () => onPatch({ objectFit: "contain" }),
							children: "完整顯示"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "圖片不會被拉伸。填滿會裁切，完整顯示會留白。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `裁切水平 ${Math.round(crop?.x ?? 50)}%`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 0,
						max: 100,
						step: 1,
						value: [crop?.x ?? 50],
						onValueChange: ([v]) => onPatch({ crop: {
							...crop ?? {
								x: 50,
								y: 50,
								zoom: 1
							},
							x: v ?? 50
						} })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `裁切垂直 ${Math.round(crop?.y ?? 50)}%`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 0,
						max: 100,
						step: 1,
						value: [crop?.y ?? 50],
						onValueChange: ([v]) => onPatch({ crop: {
							...crop ?? {
								x: 50,
								y: 50,
								zoom: 1
							},
							y: v ?? 50
						} })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: `裁切縮放 ${(crop?.zoom ?? 1).toFixed(2)}x`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 1,
						max: 2.5,
						step: .05,
						value: [crop?.zoom ?? 1],
						onValueChange: ([v]) => onPatch({ crop: {
							...crop ?? {
								x: 50,
								y: 50,
								zoom: 1
							},
							zoom: v ?? 1
						} })
					})
				}),
				filter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterFields, {
					filter,
					onChange: (next) => onPatch({ filter: next })
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				label: "圓角",
				value: layer.radius ?? 0,
				onChange: (v) => onPatch({ radius: v })
			})
		]
	});
}
function FilterFields({ filter, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-muted",
				children: "濾鏡"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `亮度 ${filter.brightness.toFixed(2)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: .4,
					max: 1.8,
					step: .01,
					value: [filter.brightness],
					onValueChange: ([v]) => onChange({
						...filter,
						brightness: v ?? 1
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `對比 ${filter.contrast.toFixed(2)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: .4,
					max: 1.8,
					step: .01,
					value: [filter.contrast],
					onValueChange: ([v]) => onChange({
						...filter,
						contrast: v ?? 1
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `飽和 ${filter.saturate.toFixed(2)}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 2,
					step: .01,
					value: [filter.saturate],
					onValueChange: ([v]) => onChange({
						...filter,
						saturate: v ?? 1
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `模糊 ${filter.blur}px`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 16,
					step: .5,
					value: [filter.blur],
					onValueChange: ([v]) => onChange({
						...filter,
						blur: v ?? 0
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: `去色 ${Math.round(filter.grayscale * 100)}%`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: 1,
					step: .01,
					value: [filter.grayscale],
					onValueChange: ([v]) => onChange({
						...filter,
						grayscale: v ?? 0
					})
				})
			})
		]
	});
}
function ShadowFields({ layer, onPatch }) {
	const shadow = layer.shadow ?? {
		enabled: false,
		x: 0,
		y: 12,
		blur: 28,
		color: "rgba(26,24,20,0.28)"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "陰影" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
				checked: shadow.enabled,
				onCheckedChange: (enabled) => onPatch({ shadow: {
					...shadow,
					enabled
				} })
			})]
		}), shadow.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				label: "X",
				value: shadow.x,
				onChange: (v) => onPatch({ shadow: {
					...shadow,
					x: v
				} })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
				label: "Y",
				value: shadow.y,
				onChange: (v) => onPatch({ shadow: {
					...shadow,
					y: v
				} })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
			label: "模糊",
			value: shadow.blur,
			onChange: (v) => onPatch({ shadow: {
				...shadow,
				blur: v
			} })
		})] })]
	});
}
function ColorRow({ value, brand, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-1.5",
			children: brand.colors.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				title: c.label,
				onClick: () => onChange(c.hex),
				className: "size-7 rounded-full border border-border",
				style: { background: c.hex }
			}, c.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "color",
				suppressHydrationWarning: true,
				value: /^#/.test(value) && value.length >= 7 ? value.slice(0, 7) : "#000000",
				onChange: (e) => onChange(e.target.value.toUpperCase()),
				className: "size-11 cursor-pointer rounded-md border border-border"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value,
				onChange: (e) => onChange(e.target.value)
			})]
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type: "number",
			value: Math.round(value),
			onChange: (e) => onChange(Number(e.target.value))
		})
	});
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		sideOffset,
		className: cn("z-50 min-w-40 overflow-hidden rounded-lg bg-surface p-1 shadow-[var(--shadow-border)]", className),
		...props
	}) });
}
function DropdownMenuItem({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
		className: cn("flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-highlighted:bg-surface-2", className),
		...props
	});
}
function LayerTree({ projectId, artboard, brand }) {
	const selectedId = useStudio((s) => s.editor.selectedId);
	const select = useStudio((s) => s.select);
	const addLayer = useStudio((s) => s.addLayer);
	const removeLayer = useStudio((s) => s.removeLayer);
	const duplicateLayer = useStudio((s) => s.duplicateLayer);
	const updateLayer = useStudio((s) => s.updateLayer);
	const reorderLayer = useStudio((s) => s.reorderLayer);
	const assets = useStudio((s) => s.assets);
	const layers = [...artboard.layers].reverse();
	function addLogo() {
		const layer = createLogoLayer(brand);
		if (layer) addLayer(projectId, layer);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-muted",
				children: "圖層"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center",
				children: [selectedId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "上移",
						onClick: () => reorderLayer(projectId, selectedId, "up"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "下移",
						onClick: () => reorderLayer(projectId, selectedId, "down"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "複製圖層",
						onClick: () => duplicateLayer(projectId, selectedId),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "刪除圖層",
						onClick: () => removeLayer(projectId, selectedId),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "新增圖層",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createTextLayer(brand)),
						children: "文字"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createShapeLayer(brand, "rect")),
						children: "矩形"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createShapeLayer(brand, "ellipse")),
						children: "圓形"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createShapeLayer(brand, "pill")),
						children: "膠囊"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createLineLayer(brand)),
						children: "線條"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
						onSelect: addLogo,
						disabled: !brand.logoAssetId,
						children: "Logo"
					}),
					assets.slice(0, 8).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
						onSelect: () => addLayer(projectId, createImageLayer(asset.id, asset.name)),
						children: ["圖片 · ", asset.name]
					}, asset.id))
				] })] })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
			className: "min-h-0 flex-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "px-2 pb-4",
				children: layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerRow, {
					layer,
					selected: selectedId === layer.id,
					onSelect: () => select(layer.id),
					onToggleHide: () => updateLayer(projectId, layer.id, { hidden: !layer.hidden }),
					onToggleLock: () => updateLayer(projectId, layer.id, { locked: !layer.locked })
				}, layer.id))
			})
		})]
	});
}
function LayerIcon({ type }) {
	const cls = "size-3.5 shrink-0 text-muted";
	if (type === "text") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: cls });
	if (type === "image") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: cls });
	if (type === "logo") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: cls });
	if (type === "line") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: cls });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: cls });
}
function LayerRow({ layer, selected, onSelect, onToggleHide, onToggleLock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: cn("flex items-center rounded-md", selected ? "bg-surface-2" : "hover:bg-bg", layer.hidden && "opacity-50"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex min-h-11 min-w-0 flex-1 items-center gap-2 truncate px-2 py-2 text-left text-sm",
				onClick: onSelect,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerIcon, { type: layer.type }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: layer.name
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": layer.hidden ? "顯示" : "隱藏",
				onClick: onToggleHide,
				children: layer.hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				"aria-label": layer.locked ? "解鎖" : "鎖定",
				onClick: onToggleLock,
				children: layer.locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { className: "size-3.5" })
			})
		]
	});
}
function SlideBar({ project }) {
	const setSlide = useStudio((s) => s.setSlide);
	const addSlide = useStudio((s) => s.addSlide);
	const removeSlide = useStudio((s) => s.removeSlide);
	const reorderSlide = useStudio((s) => s.reorderSlide);
	const regenerateSlide = useStudio((s) => s.regenerateSlide);
	const expandCarousel = useStudio((s) => s.expandCarousel);
	const adaptToFormat = useStudio((s) => s.adaptToFormat);
	const setCarouselPreview = useUi((s) => s.setCarouselPreview);
	const pages = pagesOf(project);
	const index = project.slideIndex ?? 0;
	const canAdd = pages.length < 10;
	const current = pages[index];
	function adapt(formatId) {
		const from = formatById(project.activeFormatId);
		const to = formatById(formatId);
		adaptToFormat(project.id, formatId);
		toast.success(formatId === project.activeFormatId ? `已重排 ${pages.length} 頁 · ${to.short}` : `已保留 ${from.short} 原版，並重排出 ${to.short}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5 px-2 py-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 overflow-x-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mr-1 shrink-0 text-xs text-muted",
						children: "輪播"
					}),
					pages.map((page, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: i === index ? "default" : "secondary",
						onClick: () => setSlide(project.id, i),
						"data-testid": page.role ? `slide-role-${page.role}` : void 0,
						className: cn("min-h-11 shrink-0 tabular-nums"),
						children: page.role ? PAGE_ROLE_LABEL[page.role] : i + 1
					}, `${page.role ?? "page"}-${i}`)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-1 shrink-0 text-xs text-subtle tabular-nums",
						children: [
							index + 1,
							"/",
							pages.length
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 overflow-x-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "左移",
						disabled: index <= 0,
						onClick: () => reorderSlide(project.id, index, index - 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "右移",
						disabled: index >= pages.length - 1,
						onClick: () => reorderSlide(project.id, index, index + 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "新增空白頁",
						disabled: !canAdd,
						onClick: () => addSlide(project.id, "blank"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "複製此頁",
						disabled: !canAdd,
						onClick: () => addSlide(project.id, "duplicate"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "重排此頁",
						onClick: () => {
							regenerateSlide(project.id);
							toast.success(`已重排「${current?.role ? PAGE_ROLE_LABEL[current.role] : "此頁"}」`);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "刪除此頁",
						disabled: pages.length <= 1,
						onClick: () => removeSlide(project.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						className: "min-h-11",
						variant: "ghost",
						onClick: () => setCarouselPreview(true),
						"data-testid": "carousel-preview-open",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rows3, { className: "size-4" }), "整組預覽"]
					}),
					pages.length < 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "min-h-11",
						variant: "secondary",
						onClick: () => {
							expandCarousel(project.id);
							toast.success("已展開為六頁輪播腳本");
						},
						children: "展開六頁"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 overflow-x-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex shrink-0 items-center gap-1 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "size-3.5" }), "自動排版"]
				}), ADAPT_FORMATS.map((id) => {
					const format = formatById(id);
					const active = project.activeFormatId === id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "min-h-11",
						variant: active ? "default" : "secondary",
						"data-testid": `adapt-format-${id}`,
						onClick: () => adapt(id),
						children: active ? `重排 ${format.short}` : format.short
					}, id);
				})]
			})
		]
	});
}
function CarouselPreview({ project, brand, open, onOpenChange }) {
	const setSlide = useStudio((s) => s.setSlide);
	const pages = pagesOf(project);
	const index = project.slideIndex ?? 0;
	const format = formatById(project.activeFormatId);
	const assetIds = (0, import_react.useMemo)(() => {
		const ids = [];
		for (const page of pages) {
			for (const layer of page.layers) {
				if (layer.type === "image") ids.push(layer.assetId);
				if (layer.type === "logo" && layer.assetId) ids.push(layer.assetId);
			}
			if (page.background.assetId) ids.push(page.background.assetId);
		}
		if (brand.logoAssetId) ids.push(brand.logoAssetId);
		return ids;
	}, [pages, brand.logoAssetId]);
	const urls = useAssetUrls(assetIds);
	const current = pages[index];
	const previewWidth = format.height > format.width ? 220 : 280;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[92dvh] overflow-y-auto sm:max-w-lg",
			"data-testid": "carousel-preview",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "整組預覽" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					format.name,
					" · ",
					pages.length,
					" 頁。點縮圖可進入該頁編輯。"
				] })] }),
				current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								index + 1,
								"/",
								pages.length,
								current.role ? ` · ${PAGE_ROLE_LABEL[current.role]}` : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-hidden rounded-lg bg-bg shadow-[var(--shadow-artboard)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
								artboard: current,
								brand,
								urls,
								width: previewWidth
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								disabled: index <= 0,
								onClick: () => setSlide(project.id, index - 1),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "上一頁"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								disabled: index >= pages.length - 1,
								onClick: () => setSlide(project.id, index + 1),
								children: ["下一頁", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
							})]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto pb-1",
					children: pages.map((page, i) => {
						const thumbW = Math.round(72 * (format.width / format.height));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSlide(project.id, i),
							className: cn("shrink-0 overflow-hidden rounded-md", i === index ? "ring-2 ring-ring" : "opacity-80 hover:opacity-100"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
								artboard: page,
								brand,
								urls,
								width: Math.max(48, thumbW)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-center text-xs text-muted",
								children: page.role ? PAGE_ROLE_LABEL[page.role] : i + 1
							})]
						}, `${page.role ?? "p"}-${i}`);
					})
				})
			]
		})
	});
}
function VersionPanel({ project }) {
	const captureSnapshot = useStudio((s) => s.captureSnapshot);
	const restoreSnapshot = useStudio((s) => s.restoreSnapshot);
	const deleteSnapshot = useStudio((s) => s.deleteSnapshot);
	const snapshots = project.snapshots ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium text-muted",
				children: "版本"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => {
					captureSnapshot(project.id, "手動版本");
					toast.success("已儲存版本");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "儲存此頁"]
			})]
		}), snapshots.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "p-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: History,
				title: "還沒有版本",
				description: "編輯時會自動備份。也可手動存一版，之後一鍵還原。"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1 px-2 pb-4",
			children: snapshots.map((snap) => {
				const format$1 = FORMATS.find((f) => f.id === snap.formatId);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-md bg-bg px-3 py-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm",
								children: snap.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									format$1?.short ?? snap.formatId,
									snap.pages?.length ? ` · ${snap.pages.length} 頁` : ` · 第 ${(snap.slideIndex ?? 0) + 1} 頁`,
									" · ",
									format(snap.createdAt, "M/d HH:mm", { locale: zhTW }),
									snap.kind === "auto" ? " · 自動" : snap.kind === "format" ? " · 尺寸" : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon-sm",
								variant: "ghost",
								"aria-label": "還原",
								onClick: () => {
									restoreSnapshot(project.id, snap.id);
									toast.success("已還原版本");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon-sm",
								variant: "ghost",
								"aria-label": "刪除版本",
								onClick: () => deleteSnapshot(project.id, snap.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})]
						})]
					})
				}, snap.id);
			})
		})]
	});
}
function PlannerPanel({ project, brand }) {
	const updateProject = useStudio((s) => s.updateProject);
	const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [liveFailed, setLiveFailed] = (0, import_react.useState)(false);
	const brief = migrateBrief(project.brief);
	(0, import_react.useEffect)(() => {
		let alive = true;
		getCampaignAiStatus().then((next) => {
			if (alive) setStatus(next);
		}).catch(() => {
			if (alive) setStatus(describeAdapter(false));
		});
		return () => {
			alive = false;
		};
	}, []);
	async function generate(forceMock = false) {
		if (!brief.eventName.trim() && !brief.product.trim()) {
			setError("請先填活動名稱。");
			return;
		}
		if (!brief.audience.trim()) {
			setError("請先填受眾。");
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const connected = status?.available ?? false;
			const result = await generateCampaignPlan({ data: toBriefInput(brief, brand, { forceMock: forceMock || !connected }) });
			if (!result.ok) {
				setError(result.error);
				setLiveFailed(result.adapter === "live");
				toast.error(result.error);
				return;
			}
			setLiveFailed(false);
			applyCampaignPlan(project.id, result.plan, brief);
			toast.success(result.adapter === "mock" ? "本機草案已套用到畫布" : "企劃已套用到畫布");
		} catch (err) {
			const message = err instanceof Error ? err.message : "企劃失敗";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	const mockMode = status ? !status.available || liveFailed : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 p-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorAgent, {
				projectId: project.id,
				compact: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border pt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "宣傳企劃"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "給代理的活動條件。生成後會變成頁面與畫布。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "ai-adapter-banner",
				className: cn("rounded-lg px-3 py-3", !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: status ? status.label : "正在確認企劃服務"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: status ? status.detail : "先確認有沒有連到 AI，不會假裝已經連線。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefFields, {
				brief,
				compact: true,
				onChange: (patch) => updateProject(project.id, { brief: {
					...brief,
					...patch
				} })
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			liveFailed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				variant: "secondary",
				disabled: busy,
				onClick: () => void generate(true),
				children: "改用本機草案"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				"data-testid": "ai-generate",
				disabled: busy || !status,
				onClick: () => void generate(mockMode),
				children: busy ? status?.available && !mockMode ? "企劃生成中…" : "草案撰寫中…" : !status ? "確認服務中…" : project.plan ? mockMode ? "重新生成本機草案" : "重新生成並排版" : mockMode ? "生成本機草案並排版" : "生成企劃並排版"
			}),
			project.plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanResult, { projectId: project.id }) : null
		]
	});
}
var Tabs = Root2$1;
function TabsList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
		className: cn("inline-flex h-11 items-center gap-1 rounded-lg bg-surface-2 p-1", className),
		...props
	});
}
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger$1, {
		className: cn("inline-flex h-9 items-center justify-center rounded-md px-3 text-sm text-muted", "data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-[var(--shadow-border)]", className),
		...props
	});
}
function TabsContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
		className: cn("outline-none", className),
		...props
	});
}
function StudioWorkspace({ projectId }) {
	const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
	const brands = useStudio((s) => s.brands);
	const setActiveFormat = useStudio((s) => s.setActiveFormat);
	const ensureArtboard = useStudio((s) => s.ensureArtboard);
	const setLastProjectId = useStudio((s) => s.setLastProjectId);
	const editor = useStudio((s) => s.editor);
	const undo = useStudio((s) => s.undo);
	const redo = useStudio((s) => s.redo);
	const removeLayer = useStudio((s) => s.removeLayer);
	const duplicateLayer = useStudio((s) => s.duplicateLayer);
	const nudgeLayer = useStudio((s) => s.nudgeLayer);
	const captureSnapshot = useStudio((s) => s.captureSnapshot);
	const panel = useUi((s) => s.editorPanel);
	const setPanel = useUi((s) => s.setEditorPanel);
	const carouselPreview = useUi((s) => s.carouselPreview);
	const setCarouselPreview = useUi((s) => s.setCarouselPreview);
	const [rightTab, setRightTab] = (0, import_react.useState)("inspect");
	(0, import_react.useEffect)(() => {
		setLastProjectId(projectId);
	}, [projectId, setLastProjectId]);
	(0, import_react.useEffect)(() => {
		if (project) ensureArtboard(project.id, project.activeFormatId);
	}, [project, ensureArtboard]);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			const meta = e.metaKey || e.ctrlKey;
			const t = e.target;
			const typing = Boolean(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable));
			if (meta && e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) redo(projectId);
				else undo(projectId);
				return;
			}
			if (meta && e.key.toLowerCase() === "d" && editor.selectedId && !typing) {
				e.preventDefault();
				duplicateLayer(projectId, editor.selectedId);
				return;
			}
			if (meta && e.key.toLowerCase() === "s") {
				e.preventDefault();
				captureSnapshot(projectId, "手動版本");
				toast.success("已儲存版本");
				return;
			}
			if ((e.key === "Backspace" || e.key === "Delete") && editor.selectedId && !typing) {
				e.preventDefault();
				removeLayer(projectId, editor.selectedId);
				return;
			}
			if (!typing && editor.selectedId && [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight"
			].includes(e.key)) {
				e.preventDefault();
				const step = e.shiftKey ? 10 : 1;
				const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
				const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
				nudgeLayer(projectId, editor.selectedId, dx, dy);
			}
			if (e.key === "Escape") {
				useStudio.getState().select(null);
				useStudio.getState().setEditor({ tool: "select" });
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		projectId,
		editor.selectedId,
		undo,
		redo,
		removeLayer,
		duplicateLayer,
		nudgeLayer,
		captureSnapshot
	]);
	const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : void 0;
	const artboard = project ? activeArtboard(project) : void 0;
	const assetIds = (0, import_react.useMemo)(() => {
		const ids = [];
		if (artboard) {
			for (const l of artboard.layers) {
				if (l.type === "image") ids.push(l.assetId);
				if (l.type === "logo" && l.assetId) ids.push(l.assetId);
			}
			if (artboard.background.assetId) ids.push(artboard.background.assetId);
		}
		if (brand?.logoAssetId) ids.push(brand.logoAssetId);
		return ids;
	}, [artboard, brand]);
	const urls = useAssetUrls(assetIds);
	if (!project || !brand) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-app items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: Layers,
			title: "找不到這個專案",
			description: "它可能已被刪除，或還沒同步到此裝置。",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "回到首頁"
				})
			})
		})
	});
	if (!artboard) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-app flex-col items-center justify-center gap-3 text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" }), "正在建立畫布…"]
	});
	const qa = inspectProject(pagesOf(project), brand, project.copy);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-app flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 shrink-0 items-center gap-1 border-b border-border bg-surface px-2 md:gap-2 md:px-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "返回首頁",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "min-w-0 flex-1 truncate text-sm font-medium",
						children: project.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden items-center gap-1 md:flex",
						children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: project.activeFormatId === f.id ? "default" : "ghost",
							onClick: () => setActiveFormat(project.id, f.id),
							children: f.short
						}, f.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveIndicator, { className: "hidden sm:inline-flex" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "復原",
						onClick: () => undo(project.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						"aria-label": "重做",
						onClick: () => redo(project.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "qa-score-chip",
						onClick: () => {
							setRightTab("qa");
							setPanel("qa");
						},
						className: cn("px-2 text-xs tabular-nums", qa.score >= 85 ? "text-success" : qa.score >= 70 ? "text-warn" : "text-danger"),
						children: qa.score
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-0 min-h-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden h-full min-h-0 min-w-0 flex-1 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(qt, {
						orientation: "horizontal",
						className: "h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qt, {
								defaultSize: "20%",
								minSize: "16%",
								className: "bg-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
									defaultValue: "layers",
									className: "flex h-full min-h-0 flex-col",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "px-3 pt-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
												className: "grid w-full grid-cols-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
														value: "layers",
														children: "圖層"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
														value: "assets",
														children: "素材"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
														value: "versions",
														children: "版本"
													})
												]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "layers",
											className: "min-h-0 flex-1",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerTree, {
												projectId: project.id,
												artboard,
												brand
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "assets",
											className: "min-h-0 flex-1",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetTray, { projectId: project.id })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
											value: "versions",
											className: "min-h-0 flex-1 overflow-y-auto",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionPanel, { project })
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(nn, { className: "w-1 bg-border hover:bg-border-strong" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qt, {
								defaultSize: "56%",
								minSize: "36%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex h-full min-h-0 flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-b border-border bg-surface",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorToolbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlideBar, { project })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardCanvas, {
										projectId: project.id,
										artboard,
										brand,
										urls
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(nn, { className: "w-1 bg-border hover:bg-border-strong" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Qt, {
								defaultSize: "24%",
								minSize: "18%",
								className: "bg-surface",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
									value: rightTab,
									onValueChange: setRightTab,
									className: "flex h-full min-h-0 flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "px-3 pt-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
											className: "grid w-full grid-cols-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
													value: "inspect",
													children: "屬性"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
													value: "copy",
													children: "文字"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
													value: "qa",
													children: "檢查"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
													value: "ai",
													"data-testid": "studio-tab-ai",
													children: "AI"
												})
											]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ScrollArea, {
										className: "min-h-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
												value: "inspect",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
													projectId: project.id,
													artboard,
													brand
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
												value: "copy",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyPanel, { project })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
												value: "qa",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QualityPanel, {
													project,
													brand
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
												value: "ai",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerPanel, {
													project,
													brand
												})
											})
										]
									})]
								})
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-0 min-h-0 min-w-0 flex-1 flex-col lg:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-b border-border bg-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorToolbar, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardCanvas, {
							projectId: project.id,
							artboard,
							brand,
							urls
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border bg-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlideBar, { project })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex border-t border-border bg-surface md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormatScroller, {
								value: project.activeFormatId,
								onChange: (id) => setActiveFormat(project.id, id)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-12 border-t border-border bg-surface",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" }),
									label: "圖層",
									onClick: () => setPanel("layers"),
									active: panel === "layers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-4" }),
									label: "素材",
									onClick: () => setPanel("assets"),
									active: panel === "assets"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-4" }),
									label: "文字",
									onClick: () => setPanel("copy"),
									active: panel === "copy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, { className: "size-4" }),
									label: "屬性",
									onClick: () => setPanel("inspect"),
									active: panel === "inspect"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-4" }),
									label: "版本",
									onClick: () => setPanel("versions"),
									active: panel === "versions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTab, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }),
									label: "AI",
									onClick: () => setPanel("ai"),
									active: panel === "ai",
									testId: "studio-tab-ai-mobile"
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: panel !== null,
				onOpenChange: (o) => !o && setPanel(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "flex max-h-[78dvh] flex-col overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
						className: "mb-3",
						children: panel === "layers" ? "圖層" : panel === "assets" ? "素材" : panel === "copy" ? "文字" : panel === "inspect" ? "屬性" : panel === "versions" ? "版本" : panel === "qa" ? "品質檢查" : "AI 操作"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-h-0 flex-1 overflow-y-auto",
						children: [
							panel === "layers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-[52dvh]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerTree, {
									projectId: project.id,
									artboard,
									brand
								})
							}),
							panel === "assets" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-[52dvh]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetTray, { projectId: project.id })
							}),
							panel === "copy" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyPanel, { project }),
							panel === "inspect" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
								projectId: project.id,
								artboard,
								brand
							}),
							panel === "versions" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionPanel, { project }),
							panel === "qa" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QualityPanel, {
								project,
								brand
							}),
							panel === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerPanel, {
								project,
								brand
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarouselPreview, {
				project,
				brand,
				open: carouselPreview,
				onOpenChange: setCarouselPreview
			})
		]
	});
}
function MobileTab({ icon, label, onClick, active, testId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-testid": testId,
		onClick,
		className: cn("flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs", active ? "text-fg" : "text-muted"),
		children: [icon, label]
	});
}
function FormatScroller({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex w-full gap-1 overflow-x-auto px-2 py-2",
		children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "sm",
			variant: value === f.id ? "default" : "secondary",
			onClick: () => onChange(f.id),
			children: f.short
		}, f.id))
	});
}
function StudioPage() {
	const { projectId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioWorkspace, { projectId });
}
//#endregion
export { StudioPage as component };
