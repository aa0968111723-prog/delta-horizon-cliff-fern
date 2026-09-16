import { i as __toESM } from "../_runtime.mjs";
import { t as uid } from "./ids-D2oCDrlv.mjs";
import { a as literal, c as string, l as union, n as array, o as number, r as boolean, s as object } from "../_libs/zod.mjs";
import { a as GOALS, d as formatById, i as FORMATS, n as BriefInputSchema } from "./schema-iJpgBEjq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime, d as DialogContent, f as DialogDescription, h as DialogTitle, l as Dialog, m as DialogPortal, p as DialogOverlay, u as DialogClose } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, B as pagesOf, I as migrateBrief, O as emptyBrief, S as createTextLayer, X as useStudio, _ as createGeneratedAsset, a as DELIVERABLE_OPTIONS, c as TEMPLATE_META, j as formatsFromBrief, r as ASSET_NEED_LABEL, s as PAGE_ROLE_LABEL, tt as cn, v as createImageLayer } from "./studio-store-BqpaoTm7.mjs";
import { n as Input, r as Textarea, t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Label, r as SelectItem, t as Select } from "./select-DIEr3sGB.mjs";
import { u as CLUB_SHORT } from "./club-CaoIGk4S.mjs";
import { n as create } from "../_libs/zustand.mjs";
import { i as hydrateSeedAsset } from "./assets-idb-DwbJEnrX.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { n as ErrorState } from "./empty-state-Dqbn-uaE.mjs";
import { B as Image, C as Plus, D as PenLine, E as PenTool, F as Lightbulb, H as House, L as Layers, N as LoaderCircle, P as Link2, R as Instagram, at as Check, c as TriangleAlert, d as SwatchBook, g as Search, h as Sparkles, m as SquareStack, ot as CalendarPlus, r as Video, st as CalendarDays, t as X, u as Tent, w as Play, z as Images } from "../_libs/lucide-react.mjs";
import { _ as createRootRoute, b as useNavigate, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as riskOf, i as isRecognizedPlan, n as actionLabel, r as interpretMock } from "./edit-mock-CJ87x2jK.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { i as Viewport, n as Scrollbar, r as Thumb, t as Root$1 } from "../_libs/radix-ui__react-scroll-area.mjs";
import { i as formatISO, n as setHours, o as differenceInCalendarDays, r as parseISO, s as addDays } from "../_libs/date-fns.mjs";
import { t as Provider } from "../_libs/radix-ui__react-tooltip.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-C1p7zOu_.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/ui-store-2bn7gPg4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ icon: Icon, title, description, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center rounded-2xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-border)]", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-11 items-center justify-center rounded-lg bg-surface-2 text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-xl tracking-tight",
				children: title
			}),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm text-muted",
				children: description
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: action
			}) : null
		]
	});
}
function LoadingState({ label = "載入中…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" }), label]
	});
}
function ErrorState({ title = "出了一點問題", message, onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface px-5 py-8 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: message
			}),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5",
				variant: "secondary",
				onClick: onRetry,
				children: "再試一次"
			}) : null
		]
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/payload-m8dzYCh_.js
function BriefFields({ brief, onChange, compact }) {
	function patchDeliverable(id) {
		onChange({ deliverables: {
			...brief.deliverables,
			[id]: !brief.deliverables[id]
		} });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2",
				children: GOALS.map((goal) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onChange({ goal: goal.id }),
					className: cn("min-h-16 rounded-lg px-3 py-3 text-left shadow-[var(--shadow-border)] transition-colors", brief.goal === goal.id ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: goal.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-0.5 text-xs", brief.goal === goal.id ? "text-accent-fg/80" : "text-muted"),
						children: goal.hint
					})]
				}, goal.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "活動名稱",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: brief.eventName,
					onChange: (e) => {
						const eventName = e.target.value;
						onChange({
							eventName,
							product: brief.product || eventName
						});
					},
					placeholder: "例如：09/24 浮游禪光"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
					label: "時間",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: brief.schedule,
						onChange: (e) => onChange({ schedule: e.target.value }),
						placeholder: "例如：9/24 19:00–21:00"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
					label: "地點",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: brief.location,
						onChange: (e) => onChange({ location: e.target.value }),
						placeholder: "例如：淡江校園／社團辦公室"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "受眾",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: brief.audience,
					onChange: (e) => onChange({ audience: e.target.value }),
					placeholder: "哪一群淡江學生會停下來看"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "活動特色",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: brief.features,
					onChange: (e) => onChange({ features: e.target.value }),
					placeholder: "活動內容、學生會得到什麼、參加方式",
					className: compact ? "min-h-20" : void 0
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "希望風格",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: brief.style,
					onChange: (e) => onChange({ style: e.target.value }),
					placeholder: "例如：舒服、年輕、有晚間校園感"
				})
			}),
			compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "優惠（選填）",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: brief.offer,
					onChange: (e) => onChange({ offer: e.target.value }),
					placeholder: "例如：免費參加／可帶朋友"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
				label: "補充",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: brief.notes,
					onChange: (e) => onChange({ notes: e.target.value }),
					placeholder: "報名連結、必須出現的資訊，以及不要太宗教或太 AI",
					className: compact ? "min-h-20" : void 0
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "需要產出" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: DELIVERABLE_OPTIONS.map((opt) => {
						const on = brief.deliverables[opt.id];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => patchDeliverable(opt.id),
							className: cn("min-h-14 rounded-lg px-3 py-2 text-left shadow-[var(--shadow-border)] transition-colors", on ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: opt.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("text-xs", on ? "text-accent-fg/80" : "text-muted"),
								children: opt.hint
							})]
						}, opt.id);
					})
				})]
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
function describeAdapter(available) {
	if (available) return {
		available: true,
		adapter: "live",
		label: "已連線 AI 企劃",
		detail: "會依品牌規範與活動需求生成結構化企劃，再套進專案與畫布。"
	};
	return {
		available: false,
		adapter: "mock",
		label: "本機企劃草案",
		detail: "目前沒有連到 AI 服務。按下生成會用本機規則寫一版可編輯、可套用的草案，不是線上模型回覆。"
	};
}
var getCampaignAiStatus = createServerFn({ method: "POST" }).handler(createSsrRpc("51052173a1f06126bc3572058baa979c40dbe318b507888eb1c255646b3bd1fe"));
function parseBriefInput(input) {
	if (input && typeof input === "object" && "data" in input) {
		const inner = input.data;
		if (inner && typeof inner === "object" && "eventName" in inner) return BriefInputSchema.parse(inner);
	}
	return BriefInputSchema.parse(input);
}
var generateCampaignPlan = createServerFn({ method: "POST" }).validator((input) => parseBriefInput(input)).handler(createSsrRpc("33f8623ec89488020a450daf3dd1d5eaba647d90bfd212224919e7686b4ad56e"));
var SceneLayerSchema = object({
	id: string(),
	name: string(),
	type: string(),
	role: string().optional(),
	x: number(),
	y: number(),
	w: number(),
	h: number(),
	text: string().optional(),
	fontSize: number().optional(),
	color: string().optional(),
	fill: string().optional(),
	align: string().optional(),
	assetId: string().optional(),
	locked: boolean(),
	hidden: boolean()
});
var EditorSceneSchema = object({
	projectId: string(),
	projectName: string(),
	formatId: string(),
	formatName: string(),
	width: number(),
	height: number(),
	slideIndex: number(),
	slideCount: number(),
	templateId: string(),
	selectedId: string().nullable(),
	copy: object({
		eyebrow: string(),
		headline: string(),
		subhead: string(),
		body: string(),
		cta: string(),
		handle: string()
	}),
	brief: object({
		eventName: string(),
		schedule: string(),
		location: string(),
		audience: string(),
		style: string()
	}),
	brand: object({
		name: string(),
		handle: string(),
		website: string(),
		voice: string(),
		colors: array(object({
			hex: string(),
			role: string(),
			label: string()
		})),
		forbiddenWords: array(string()),
		ctas: array(string())
	}),
	layers: array(SceneLayerSchema),
	assets: array(object({
		id: string(),
		name: string(),
		category: string(),
		kind: string()
	}))
});
var EditInputSchema = object({
	command: string().min(1).max(400),
	scene: EditorSceneSchema,
	forceMock: boolean().optional()
});
function parseEditInput(input) {
	if (input && typeof input === "object" && "data" in input) {
		const inner = input.data;
		if (inner && typeof inner === "object" && "command" in inner) return EditInputSchema.parse(inner);
	}
	return EditInputSchema.parse(input);
}
function describeEditAdapter(available) {
	const base = describeAdapter(available);
	if (available) return {
		...base,
		label: "已連線畫布代理",
		detail: "會先讀目前圖層與品牌，再真正改畫布。不是只回「已完成」。"
	};
	return {
		...base,
		label: "本機畫布規則",
		detail: "目前沒有連到 AI 服務。會用本機規則執行常見操作，仍會真的改畫布，不是假裝完成。"
	};
}
var interpretEditorCommand = createServerFn({ method: "POST" }).validator((input) => parseEditInput(input)).handler(createSsrRpc("86652c34390936ffd17f0154640d9f08f7b9106dd86d50dcb537409d9aeff764"));
/** Visual QR mark encoded from the payload. Finder patterns are real; data modules are payload-derived. */
function renderQrSvg(payload, dark = "#1A1814", light = "#FFFCF7") {
	const n = 25;
	const modules = Array.from({ length: n }, () => Array(n).fill(false));
	function inFinder(x, y) {
		return [
			[0, 0],
			[18, 0],
			[0, 18]
		].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
	}
	function paintFinder(fx, fy) {
		for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
			const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
			const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
			modules[fy + dy][fx + dx] = edge || core;
		}
	}
	paintFinder(0, 0);
	paintFinder(18, 0);
	paintFinder(0, 18);
	for (let i = 8; i < 17; i++) {
		modules[6][i] = i % 2 === 0;
		modules[i][6] = i % 2 === 0;
	}
	const bytes = Array.from(payload, (ch) => ch.charCodeAt(0) & 255);
	if (!bytes.length) bytes.push(1);
	let seed = 2166136261;
	for (const b of bytes) seed = Math.imul(seed ^ b, 16777619) >>> 0;
	let i = 0;
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		if (inFinder(x, y) || x === 6 || y === 6) continue;
		const mixed = bytes[i % bytes.length] + x * 13 + y * 7 + (seed >>> x % 16) & 1;
		modules[y][x] = mixed === 1;
		i += 1;
	}
	const cell = 8;
	const quiet = 16;
	const size = 232;
	const rects = [];
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		if (!modules[y][x]) continue;
		rects.push(`<rect x="${quiet + x * cell}" y="${quiet + y * cell}" width="${cell}" height="${cell}"/>`);
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><rect width="100%" height="100%" fill="${light}"/><g fill="${dark}">${rects.join("")}</g></svg>`;
}
function currentBoard(projectId) {
	const project = useStudio.getState().projects.find((p) => p.id === projectId);
	if (!project) return void 0;
	return pagesOf(project)[project.slideIndex ?? 0];
}
function signature(projectId) {
	const project = useStudio.getState().projects.find((p) => p.id === projectId);
	if (!project) return "";
	const board = pagesOf(project)[project.slideIndex ?? 0];
	return JSON.stringify({
		f: project.activeFormatId,
		i: project.slideIndex,
		t: project.templateId,
		c: project.copy,
		bg: board?.background,
		layers: board?.layers.map((l) => ({
			id: l.id,
			x: l.x,
			y: l.y,
			w: l.w,
			h: l.h,
			hidden: l.hidden,
			text: l.type === "text" ? l.text : void 0,
			fontSize: l.type === "text" ? l.fontSize : void 0,
			assetId: l.type === "image" || l.type === "logo" ? l.assetId : void 0,
			filter: l.type === "image" ? l.filter : void 0
		}))
	});
}
function applyWhitespace(projectId, amount) {
	const store = useStudio.getState();
	const project = store.projects.find((p) => p.id === projectId);
	const board = currentBoard(projectId);
	if (!project || !board) return [];
	const format = formatById(project.activeFormatId);
	const notes = [];
	const factor = amount === "more" ? .86 : 1.08;
	store.patchArtboard(projectId, (art) => {
		const layers = art.layers.map((layer) => {
			if (layer.locked) return layer;
			if (layer.type === "image" && layer.h > format.height * .4) {
				notes.push("縮小主視覺");
				return {
					...layer,
					h: Math.round(layer.h * factor)
				};
			}
			if (layer.type === "text" && layer.role === "body" && amount === "more") {
				notes.push("隱藏內文以增加留白");
				return {
					...layer,
					hidden: true
				};
			}
			if (layer.type !== "image") {
				const pad = amount === "more" ? 24 : -12;
				const x = Math.max(format.safe.left, Math.min(layer.x + (layer.x < format.width / 2 ? pad : 0), format.width - layer.w - format.safe.right));
				const y = layer.y < format.height * .45 ? layer.y + (amount === "more" ? 10 : -8) : layer.y;
				return {
					...layer,
					x,
					y
				};
			}
			return layer;
		});
		return {
			...art,
			layers
		};
	});
	if (!notes.length) notes.push(amount === "more" ? "圖層已往內收" : "圖層已展開");
	return notes;
}
function applyReplaceImage(projectId, action) {
	const store = useStudio.getState();
	const project = store.projects.find((p) => p.id === projectId);
	const board = currentBoard(projectId);
	if (!project || !board) return [];
	const selectedId = store.editor.selectedId;
	const target = board.layers.find((l) => l.id === action.layerId && l.type === "image") ?? board.layers.find((l) => l.id === selectedId && l.type === "image") ?? board.layers.find((l) => l.type === "image" && !l.hidden);
	if (!target || target.type !== "image") return ["這頁沒有照片可換。"];
	const current = target;
	const nextMeta = store.assets.find((a) => a.id === action.assetId && a.category !== "icon" && a.kind !== "logo") ?? store.assets.find((a) => a.id !== current.assetId && a.kind !== "logo" && a.category !== "icon" && a.category !== "logo" && (action.prefer === "people" ? a.category === "people" : action.prefer === "background" ? a.category === "background" : a.category === "photo" || a.category === "background" || a.kind === "image"));
	const brightness = Math.min(1.35, (current.filter.brightness || 1) * 1.14);
	const contrast = Math.min(1.2, (current.filter.contrast || 1) * 1.06);
	store.updateLayer(projectId, current.id, {
		assetId: nextMeta?.id ?? current.assetId,
		filter: {
			...current.filter,
			brightness,
			contrast,
			saturate: Math.max(current.filter.saturate, 1.05)
		}
	});
	if (nextMeta) store.markAssetUsed(nextMeta.id);
	store.select(current.id);
	return [nextMeta ? `已換成「${nextMeta.name}」並提高亮度` : "已提高目前照片亮度"];
}
async function applyQr(projectId, action) {
	const store = useStudio.getState();
	const project = store.projects.find((p) => p.id === projectId);
	const brand = store.brands.find((b) => b.id === project?.brandId) ?? store.brands[0];
	if (!project || !brand) return ["找不到專案。"];
	const format = formatById(project.activeFormatId);
	const size = action.size ?? 196;
	const x = action.x ?? format.width - format.safe.right - size;
	const y = action.y ?? format.height - format.safe.bottom - size - 40;
	const svg = renderQrSvg(action.payload, brand.colors.find((c) => c.role === "ink")?.hex);
	const assetId = uid$1("asset");
	await getAssetStorage().put(assetId, new Blob([svg], { type: "image/svg+xml" }));
	const meta = createGeneratedAsset({
		id: assetId,
		name: action.caption || "報名 QR",
		mime: "image/svg+xml",
		width: 232,
		height: 232,
		category: "icon"
	});
	store.addAsset(meta);
	store.addLayer(projectId, createImageLayer(assetId, action.caption || "報名 QR", {
		x,
		y,
		w: size,
		h: size,
		objectFit: "contain"
	}));
	if (action.caption) store.addLayer(projectId, createTextLayer(brand, {
		name: "QR 說明",
		role: "custom",
		text: action.caption,
		x,
		y: y + size + 8,
		w: size,
		h: 36,
		fontSize: 22,
		align: "center"
	}));
	store.markAssetUsed(assetId);
	return [`已放上「${action.caption || "報名 QR"}」`];
}
function applyLayoutVersions(projectId, count) {
	const store = useStudio.getState();
	const templates = [
		"editorial",
		"product",
		"quote"
	];
	const names = [
		"排版 A · 編輯封面",
		"排版 B · 商品主圖",
		"排版 C · 引言卡片"
	];
	const n = Math.min(3, Math.max(2, count));
	let firstId = null;
	for (let i = 0; i < n; i++) {
		store.reflow(projectId, templates[i]);
		const id = store.captureSnapshot(projectId, names[i]);
		if (i === 0) firstId = id;
	}
	if (firstId) store.restoreSnapshot(projectId, firstId);
	return [`已存 ${names.slice(0, n).join("、")}，可在版本面板比較`];
}
async function runAction(projectId, action) {
	const store = useStudio.getState();
	const project = store.projects.find((p) => p.id === projectId);
	const brand = store.brands.find((b) => b.id === project?.brandId) ?? store.brands[0];
	if (!project || !brand) return ["找不到專案。"];
	switch (action.type) {
		case "update-layer": {
			const layer = currentBoard(projectId)?.layers.find((l) => l.id === action.layerId);
			if (!layer) return [`找不到圖層，略過「${actionLabel(action)}」`];
			const { brightness, contrast, saturate, ...rest } = action.patch;
			const patch = { ...rest };
			if (layer.type === "image" && (brightness != null || contrast != null || saturate != null)) {
				const image = layer;
				patch.filter = {
					...image.filter,
					brightness: brightness ?? image.filter.brightness,
					contrast: contrast ?? image.filter.contrast,
					saturate: saturate ?? image.filter.saturate
				};
			}
			if (layer.type === "text" && action.patch.fontSize) {
				const text = layer;
				const lines = Math.max(1, text.text.split("\n").length);
				patch.h = action.patch.h ?? Math.round(action.patch.fontSize * text.lineHeight * lines + 16);
			}
			store.updateLayer(projectId, action.layerId, patch);
			return [actionLabel(action)];
		}
		case "align-layer":
			store.alignLayer(projectId, action.layerId, action.mode);
			return [actionLabel(action)];
		case "delete-layer":
			store.removeLayer(projectId, action.layerId);
			return [actionLabel(action)];
		case "add-text": {
			const format = formatById(project.activeFormatId);
			const layer = createTextLayer(brand, {
				name: action.name ?? "文字",
				role: action.role ?? "custom",
				text: action.text,
				x: action.x ?? format.safe.left,
				y: action.y ?? format.height - format.safe.bottom - 80,
				w: action.w ?? 640,
				h: action.h ?? 72,
				fontSize: action.fontSize ?? 28,
				align: action.align ?? "left",
				color: action.color
			});
			store.addLayer(projectId, layer);
			return [actionLabel(action)];
		}
		case "add-qr": return applyQr(projectId, action);
		case "replace-image": return applyReplaceImage(projectId, action);
		case "set-background":
			store.patchArtboard(projectId, (art) => ({
				...art,
				background: {
					...art.background,
					type: action.color2 ? "gradient" : art.background.type,
					color: action.color ?? art.background.color,
					color2: action.color2 ?? art.background.color2,
					angle: action.color2 ? 168 : art.background.angle
				}
			}));
			return [actionLabel(action)];
		case "set-format":
			if (project.activeFormatId === action.formatId) return ["已經是這個尺寸"];
			store.setActiveFormat(projectId, action.formatId);
			return [actionLabel(action)];
		case "apply-template":
			store.reflow(projectId, action.templateId);
			return [actionLabel(action)];
		case "set-copy":
			store.setCopy(projectId, action.patch);
			return [actionLabel(action)];
		case "whitespace": return applyWhitespace(projectId, action.amount);
		case "layout-versions": return applyLayoutVersions(projectId, action.count ?? 3);
		case "select":
			store.select(action.layerId);
			return [];
	}
}
async function executeEditPlan(projectId, plan, command) {
	const store = useStudio.getState();
	if (!store.projects.find((p) => p.id === projectId)) return {
		changed: false,
		notes: ["找不到專案。"],
		beforeId: null,
		afterId: null
	};
	if (!plan.actions.length) return {
		changed: false,
		notes: plan.notes?.length ? plan.notes : ["沒有可執行的畫布動作。"],
		beforeId: null,
		afterId: null
	};
	const short = command.trim().slice(0, 18) || plan.summary.slice(0, 18);
	const beforeSig = signature(projectId);
	const beforeId = store.captureSnapshot(projectId, `操作前 · ${short}`);
	const notes = [];
	await store.applyAiEdit(projectId, `AI · ${short}`, async () => {
		for (const action of plan.actions) {
			const lines = await runAction(projectId, action);
			notes.push(...lines);
		}
	});
	const afterId = store.captureSnapshot(projectId, `AI · ${short}`);
	const afterSig = signature(projectId);
	if (!(plan.actions.some((a) => a.type === "layout-versions") || beforeSig !== afterSig)) return {
		changed: false,
		notes: notes.length ? notes : ["畫布已是目標狀態，沒有改動。"],
		beforeId,
		afterId
	};
	return {
		changed: true,
		notes: notes.length ? notes : [plan.summary],
		beforeId,
		afterId
	};
}
function buildScene(input) {
	const format = formatById(input.project.activeFormatId);
	const pages = pagesOf(input.project);
	const layers = (pages[input.project.slideIndex ?? 0]?.layers ?? []).slice(0, 36).map((layer) => ({
		id: layer.id,
		name: layer.name,
		type: layer.type,
		role: layer.type === "text" ? layer.role : void 0,
		x: Math.round(layer.x),
		y: Math.round(layer.y),
		w: Math.round(layer.w),
		h: Math.round(layer.h),
		text: layer.type === "text" ? layer.text.slice(0, 80) : void 0,
		fontSize: layer.type === "text" ? layer.fontSize : void 0,
		color: layer.type === "text" ? layer.color : void 0,
		fill: layer.type === "shape" ? layer.fill : void 0,
		align: layer.type === "text" ? layer.align : void 0,
		assetId: layer.type === "image" || layer.type === "logo" ? layer.assetId : void 0,
		locked: layer.locked,
		hidden: layer.hidden
	}));
	return {
		projectId: input.project.id,
		projectName: input.project.name,
		formatId: input.project.activeFormatId,
		formatName: format.name,
		width: format.width,
		height: format.height,
		slideIndex: input.project.slideIndex ?? 0,
		slideCount: pages.length,
		templateId: input.project.templateId,
		selectedId: input.selectedId,
		copy: {
			eyebrow: input.project.copy.eyebrow,
			headline: input.project.copy.headline,
			subhead: input.project.copy.subhead,
			body: input.project.copy.body,
			cta: input.project.copy.cta,
			handle: input.project.copy.handle
		},
		brief: {
			eventName: input.project.brief.eventName || input.project.brief.product,
			schedule: input.project.brief.schedule,
			location: input.project.brief.location,
			audience: input.project.brief.audience,
			style: input.project.brief.style
		},
		brand: {
			name: input.brand.name,
			handle: input.brand.handle,
			website: input.brand.website,
			voice: input.brand.voice,
			colors: input.brand.colors.map((c) => ({
				hex: c.hex,
				role: c.role,
				label: c.label
			})),
			forbiddenWords: input.brand.forbiddenWords,
			ctas: input.brand.ctas
		},
		layers,
		assets: input.assets.slice(0, 24).map((a) => ({
			id: a.id,
			name: a.name,
			category: a.category,
			kind: a.kind
		}))
	};
}
var EXAMPLES = [
	"把標題放大並移到上方中央",
	"將這張圖換成比較明亮的照片",
	"把整體改成淡江學生喜歡的活潑風格",
	"轉成限時動態尺寸",
	"刪除左下角資訊",
	"增加活動日期與報名 QR Code",
	"讓畫面更有留白",
	"產生三個不同排版版本"
];
function EditorAgent({ projectId, compact }) {
	const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
	const brands = useStudio((s) => s.brands);
	const assets = useStudio((s) => s.assets);
	const selectedId = useStudio((s) => s.editor.selectedId);
	const restoreSnapshot = useStudio((s) => s.restoreSnapshot);
	const undo = useStudio((s) => s.undo);
	const redo = useStudio((s) => s.redo);
	const [command, setCommand] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [liveFailed, setLiveFailed] = (0, import_react.useState)(false);
	const [pending, setPending] = (0, import_react.useState)(null);
	const [last, setLast] = (0, import_react.useState)(null);
	const [compare, setCompare] = (0, import_react.useState)("after");
	const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : void 0;
	const scene = project && brand ? buildScene({
		project,
		brand,
		assets,
		selectedId
	}) : null;
	(0, import_react.useEffect)(() => {
		let alive = true;
		getCampaignAiStatus().then((next) => {
			if (alive) setStatus(describeEditAdapter(next.available));
		}).catch(() => {
			if (alive) setStatus(describeEditAdapter(false));
		});
		return () => {
			alive = false;
		};
	}, []);
	async function interpret(forceMock = false) {
		const text = command.trim();
		if (!text) {
			setError("請先寫要對目前畫面做的事。");
			return;
		}
		const state = useStudio.getState();
		const current = state.projects.find((p) => p.id === projectId);
		const currentBrand = current ? state.brands.find((b) => b.id === current.brandId) ?? state.brands[0] : void 0;
		if (!current || !currentBrand) {
			setError("找不到專案，代理無法讀畫布。");
			return;
		}
		setBusy(true);
		setError(null);
		setPending(null);
		try {
			const nextScene = buildScene({
				project: current,
				brand: currentBrand,
				assets: state.assets,
				selectedId: state.editor.selectedId
			});
			const local = interpretMock(text, nextScene);
			if (local.actions.length) {
				setLiveFailed(false);
				const plan = {
					...local,
					risk: local.risk ?? riskOf(local.actions)
				};
				if (plan.risk === "large") {
					setPending(plan);
					return;
				}
				await apply(plan);
				return;
			}
			if (isRecognizedPlan(local)) {
				setLast({
					summary: local.summary,
					notes: local.notes ?? ["畫布已是目標狀態，沒有改動。"],
					beforeId: null,
					afterId: null,
					changed: false
				});
				toast.message(local.summary);
				return;
			}
			if (!(status?.available ?? false) || forceMock) {
				setLast({
					summary: local.summary,
					notes: local.notes ?? ["沒有可執行的畫布動作。"],
					beforeId: null,
					afterId: null,
					changed: false
				});
				toast.message(local.summary);
				return;
			}
			const result = await interpretEditorCommand({ data: {
				command: text,
				scene: nextScene,
				forceMock: false
			} });
			if (!result.ok) {
				setError(result.error);
				setLiveFailed(result.adapter === "live");
				toast.error(result.error);
				return;
			}
			setLiveFailed(false);
			const plan = {
				...result.plan,
				risk: result.plan.risk ?? riskOf(result.plan.actions)
			};
			if (!plan.actions.length) {
				setLast({
					summary: plan.summary,
					notes: plan.notes ?? ["沒有可執行的畫布動作。"],
					beforeId: null,
					afterId: null,
					changed: false
				});
				toast.message(plan.summary);
				return;
			}
			if (plan.risk === "large") {
				setPending(plan);
				return;
			}
			await apply(plan);
		} catch (err) {
			const message = err instanceof Error ? err.message : "操作失敗";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	async function apply(plan) {
		setBusy(true);
		setError(null);
		try {
			const result = await executeEditPlan(projectId, plan, command);
			setPending(null);
			setCompare("after");
			setLast({
				summary: plan.summary,
				notes: result.notes,
				beforeId: result.beforeId,
				afterId: result.afterId,
				changed: result.changed
			});
			if (!result.changed) {
				toast.message(result.notes[0] ?? "畫布沒有改動");
				return;
			}
			toast.success(plan.summary);
		} catch (err) {
			const message = err instanceof Error ? err.message : "無法套用到畫布";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	if (!project || !brand || !scene) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg bg-surface-2 px-3 py-3 text-sm text-muted",
		children: "先開啟一個專案，代理才能讀畫布、圖層與品牌。"
	});
	const mockMode = status ? !status.available || liveFailed : false;
	const banner = status ?? describeAdapter(false);
	const selected = scene.layers.find((l) => l.id === scene.selectedId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		"data-testid": "editor-agent",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "操作畫布"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "先讀目前頁面、圖層、品牌與選取物件，再執行。小改直接套用；刪多層或大改會先預覽。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("rounded-lg px-3 py-3", !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: status ? banner.label : "正在確認畫布代理"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: status ? banner.detail : "先確認有沒有連到 AI，不會假裝已經改好畫布。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				"data-testid": "editor-scene",
				children: [
					"目前：",
					scene.formatName,
					" · 第 ",
					scene.slideIndex + 1,
					"／",
					scene.slideCount,
					" 頁 · ",
					scene.layers.length,
					" ",
					"個圖層 · ",
					selected ? `已選「${selected.name}」` : "未選取",
					" · ",
					scene.brand.name
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				"data-testid": "editor-command",
				value: command,
				onChange: (e) => setCommand(e.target.value),
				placeholder: "例如：把標題放大並移到上方中央",
				className: compact ? "min-h-20" : "min-h-24",
				disabled: busy,
				onKeyDown: (e) => {
					if ((e.metaKey || e.ctrlKey) && e.key === "Enter") interpret(mockMode);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: EXAMPLES.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-testid": `editor-chip-${index}`,
					className: "min-h-11 rounded-full bg-surface px-3 text-left text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg disabled:opacity-50",
					disabled: busy,
					onClick: () => setCommand(item),
					children: item
				}, item))
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			liveFailed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				variant: "secondary",
				disabled: busy,
				onClick: () => void interpret(true),
				children: "改用本機規則"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				"data-testid": "editor-run",
				disabled: busy || !status,
				onClick: () => void interpret(mockMode),
				children: busy ? "讀畫布並執行中…" : !status ? "確認服務中…" : mockMode ? "用本機規則改畫布" : "讀畫布並執行"
			}),
			pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 rounded-lg bg-warn/15 p-3",
				"data-testid": "editor-preview",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "大幅修改預覽"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: pending.summary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1 text-sm text-muted",
						children: pending.actions.map((action, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", actionLabel(action)] }, `${action.type}-${i}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							"data-testid": "editor-apply-preview",
							disabled: busy,
							onClick: () => void apply(pending),
							children: "套用到畫布"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							variant: "secondary",
							disabled: busy,
							onClick: () => setPending(null),
							children: "取消"
						})]
					})
				]
			}) : null,
			last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 rounded-lg bg-bg p-3",
				"data-testid": "editor-last",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: last.changed ? last.summary : "沒有改動畫布"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1 text-xs text-muted",
						children: last.notes.map((note, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", note] }, `${i}-${note}`))
					}),
					last.changed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: compare === "before" ? "default" : "secondary",
								"data-testid": "editor-compare-before",
								onClick: () => {
									if (last.beforeId) restoreSnapshot(project.id, last.beforeId);
									else undo(project.id);
									setCompare("before");
								},
								children: "看操作前"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: compare === "after" ? "default" : "secondary",
								"data-testid": "editor-compare-after",
								onClick: () => {
									if (last.afterId) restoreSnapshot(project.id, last.afterId);
									else redo(project.id);
									setCompare("after");
								},
								children: "看 AI 結果"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								"data-testid": "editor-undo",
								onClick: () => {
									if (last.beforeId) restoreSnapshot(project.id, last.beforeId);
									else undo(project.id);
									setCompare("before");
									toast.message("已撤銷此次 AI 操作");
								},
								children: "撤銷此次"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								"data-testid": "editor-redo",
								onClick: () => {
									if (last.afterId) restoreSnapshot(project.id, last.afterId);
									else redo(project.id);
									setCompare("after");
									toast.message("已重做此次 AI 操作");
								},
								children: "重做此次"
							})
						]
					}) : null
				]
			}) : null
		]
	});
}
var CopyRequestSchema = object({
	campaignName: string().min(1).max(160),
	hook: string().max(240),
	concept: string().max(500),
	schedule: string().max(120),
	location: string().max(120),
	audience: string().min(1).max(300),
	studentPain: string().max(500),
	cta: string().max(80),
	registrationUrl: string().max(500),
	brandVoice: string().max(500),
	hashtags: array(string().max(60)).max(20),
	forceMock: boolean().optional()
});
var generateCopyPack = createServerFn({ method: "POST" }).validator((input) => CopyRequestSchema.parse(input && typeof input === "object" && "data" in input ? input.data : input)).handler(createSsrRpc("52b222ee496fac70e202564c0c335d08423ec4ee7160668db1b52550958991af"));
function CopyStudio({ projectId }) {
	const project = useStudio((state) => state.projects.find((item) => item.id === projectId));
	const brand = useStudio((state) => state.brands.find((item) => item.id === project?.brandId));
	const patchPlan = useStudio((state) => state.patchPlan);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [activeTone, setActiveTone] = (0, import_react.useState)("學生版");
	const pack = project?.plan?.copyPack;
	if (!project || !project.plan || !brand) return null;
	async function generate() {
		if (!project || !project.plan || !brand) return;
		setBusy(true);
		try {
			const registrationUrl = project.brief.notes.match(/https?:\/\/\S+/)?.[0] ?? "";
			const result = await generateCopyPack({ data: {
				campaignName: project.plan.campaignName || project.name,
				hook: project.plan.hook,
				concept: project.plan.concept,
				schedule: project.brief.schedule,
				location: project.brief.location,
				audience: project.brief.audience,
				studentPain: project.plan.insight || project.brief.features,
				cta: project.plan.cta,
				registrationUrl,
				brandVoice: brand.voice,
				hashtags: project.plan.hashtags,
				forceMock: false
			} });
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			patchPlan(projectId, { copyPack: result.pack });
			setActiveTone("學生版");
			toast.success(result.pack.source === "live" ? "AI Copy Pack 已生成" : "本機 Copy Pack 草案已生成");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "文案生成失敗");
		} finally {
			setBusy(false);
		}
	}
	function applyTone(tone) {
		if (!pack) return;
		const variant = pack.variants.find((item) => item.tone === tone);
		if (!variant) return;
		patchPlan(projectId, {
			hook: variant.hook,
			headline: variant.hook,
			body: variant.body,
			cta: variant.cta,
			hashtags: variant.hashtags,
			captions: [{
				style: variant.tone,
				text: `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`
			}, ...pack.variants.filter((item) => item.tone !== tone).slice(0, 3).map((item) => ({
				style: item.tone,
				text: item.body
			}))]
		});
		setActiveTone(tone);
		toast.success(`已套用${tone}`);
	}
	const variant = pack?.variants.find((item) => item.tone === activeTone) ?? pack?.variants[0];
	const formats = pack ? [
		{
			label: "Threads",
			text: pack.threads
		},
		{
			label: "LINE",
			text: pack.line
		},
		{
			label: "Story",
			text: pack.storyFrames.map((item, index) => `${index + 1}. ${item}`).join("\n\n")
		},
		{
			label: "Carousel",
			text: pack.carouselPages.map((item, index) => `Page ${index + 1}\n${item}`).join("\n\n")
		},
		{
			label: "Reels Script",
			text: pack.reelsScript.map((item) => `${item.timing}\n畫面：${item.visual}\n字幕：${item.subtitle}\n旁白：${item.voiceover}\n轉場：${item.transition}\n素材：${item.assetSuggestion}`).join("\n\n")
		}
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-bg p-4",
		"data-testid": "copy-studio",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg",
					children: "IG Copy Studio"
				}), pack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: pack.source === "live" ? "success" : "warn",
					children: pack.source === "live" ? "AI" : "本機草案"
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs leading-5 text-muted",
				children: "一次產生六種語氣、學生視角檢查與跨平台版本。只有按下按鈕才會呼叫 AI。"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				disabled: busy,
				onClick: () => void generate(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), busy ? "生成中…" : pack ? "重新生成" : "生成 Copy Pack"]
			})]
		}), pack && variant ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto pb-1",
					children: pack.variants.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => applyTone(item.tone),
						className: cn("min-h-10 shrink-0 rounded-full px-3 text-xs", item.tone === activeTone ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
						children: item.tone
					}, item.tone))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "HOOK"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-display text-xl leading-snug",
							children: variant.hook
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 whitespace-pre-line text-sm leading-6 text-muted",
							children: variant.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-accent",
								children: variant.cta
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: async () => {
									await navigator.clipboard.writeText(`${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`);
									toast.success("已複製這個版本");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "複製"]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium",
					children: "淡江學生視角"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2",
					children: pack.studentReview.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-2 rounded-lg bg-surface px-3 py-3",
						children: [item.pass ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-4 shrink-0 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mt-0.5 size-4 shrink-0 text-warn" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: item.question
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs leading-5 text-muted",
							children: item.feedback
						})] })]
					}, item.question))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium",
					children: "一鍵轉換"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid gap-2 sm:grid-cols-2",
					children: formats.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: async () => {
							await navigator.clipboard.writeText(item.text);
							toast.success(`已複製 ${item.label}`);
						},
						className: "min-h-20 rounded-xl bg-surface p-3 text-left shadow-[var(--shadow-border)] hover:bg-surface-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: item.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 line-clamp-2 block whitespace-pre-line text-xs leading-5 text-muted",
							children: item.text
						})]
					}, item.label))
				})] })
			]
		}) : null]
	});
}
function PlanResult({ projectId, onOpenEditor }) {
	const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
	const patchPlan = useStudio((s) => s.patchPlan);
	const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
	const restorePlanVersion = useStudio((s) => s.restorePlanVersion);
	const reflow = useStudio((s) => s.reflow);
	const plan = project?.plan;
	if (!project || !plan) return null;
	const current = project;
	function set(key, value) {
		patchPlan(projectId, { [key]: value });
	}
	function applyToCanvas() {
		if (!current.plan) return;
		applyCampaignPlan(projectId, current.plan, current.brief);
		toast.success("已套用到專案與畫布");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		"data-testid": "plan-result",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: plan.source === "mock" ? "warn" : "success",
					children: plan.source === "mock" ? "本機草案" : "AI 企劃"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: plan.campaignName
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "核心概念",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: plan.concept,
					onChange: (e) => set("concept", e.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "視覺主題",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: plan.visualTheme,
					onChange: (e) => set("visualTheme", e.target.value),
					className: "min-h-20"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "標題",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: plan.headline,
					onChange: (e) => set("headline", e.target.value),
					className: "min-h-20"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "副標",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: plan.subhead,
					onChange: (e) => set("subhead", e.target.value),
					className: "min-h-20"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "CTA",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: plan.cta,
					onChange: (e) => set("cta", e.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "Caption",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					rows: 6,
					value: plan.captions[0]?.text ?? "",
					onChange: (e) => {
						set("captions", plan.captions.length ? plan.captions.map((item, i) => i === 0 ? {
							...item,
							text: e.target.value
						} : item) : [{
							style: "敘事",
							text: e.target.value
						}]);
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: async () => {
						await navigator.clipboard.writeText(plan.captions[0]?.text ?? "");
						toast.success("已複製 Caption");
					},
					children: "複製文案"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: async () => {
						await navigator.clipboard.writeText(plan.hashtags.join(" "));
						toast.success("已複製標籤");
					},
					children: "複製標籤"
				})]
			}),
			plan.captions.slice(1).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "block w-full rounded-md bg-bg p-3 text-left text-sm hover:bg-surface-2",
				onClick: () => {
					set("captions", [{
						...item,
						style: plan.captions[0]?.style ?? item.style
					}, ...plan.captions.filter((c) => c !== item)]);
					toast.success(`已套用「${item.style}」文案`);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: item.style
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1",
					children: item.text
				})]
			}, item.style)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$2, {
				label: "Hashtags",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-20",
					value: plan.hashtags.join(" "),
					onChange: (e) => set("hashtags", e.target.value.split(/\s+/).map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.startsWith("#") ? tag : `#${tag}`))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyStudio, { projectId }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "建議版型" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1",
					children: TEMPLATE_META.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: plan.templateId === t.id ? "default" : "secondary",
						onClick: () => {
							patchPlan(projectId, { templateId: t.id });
							reflow(projectId, t.id);
						},
						children: t.name
					}, t.id))
				})]
			}),
			plan.carouselPages.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "輪播頁面" }), plan.carouselPages.map((page, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarouselPageEditor, {
					page,
					index,
					onChange: (patch) => {
						set("carouselPages", plan.carouselPages.map((item, i) => i === index ? {
							...item,
							...patch
						} : item));
					}
				}, `${page.role}-${index}`))]
			}) : null,
			plan.assetNeeds.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "素材需求" }), plan.assetNeeds.map((need, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-bg p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [ASSET_NEED_LABEL[need.kind], need.required ? " · 必要" : " · 選用"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2",
							value: need.title,
							onChange: (e) => {
								set("assetNeeds", plan.assetNeeds.map((item, i) => i === index ? {
									...item,
									title: e.target.value
								} : item));
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "mt-2 min-h-16",
							value: need.detail,
							onChange: (e) => {
								set("assetNeeds", plan.assetNeeds.map((item, i) => i === index ? {
									...item,
									detail: e.target.value
								} : item));
							}
						})
					]
				}, `${need.title}-${index}`))]
			}) : null,
			plan.checklist.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "發布前檢查" }), plan.checklist.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: item,
					onChange: (e) => {
						set("checklist", plan.checklist.map((row, i) => i === index ? e.target.value : row));
					}
				}, `${item}-${index}`))]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: applyToCanvas,
				children: "套用到畫布"
			}),
			onOpenEditor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				variant: "secondary",
				onClick: () => onOpenEditor(projectId),
				children: "進入編輯器"
			}) : null,
			current.planVersions.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "企劃版本" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: current.planVersions.map((version) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							restorePlanVersion(projectId, version.id);
							toast.success("已還原此企劃版本");
						},
						className: cn("flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-surface-2", current.plan?.generatedAt === version.plan.generatedAt ? "bg-surface-2" : "bg-bg"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: version.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 shrink-0 text-xs text-muted",
							children: new Date(version.createdAt).toLocaleString("zh-TW", {
								month: "numeric",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit"
							})
						})]
					}) }, version.id))
				})]
			}) : null
		]
	});
}
function CarouselPageEditor({ page, index, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-lg bg-bg p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"第 ",
					index + 1,
					" 頁 · ",
					PAGE_ROLE_LABEL[page.role]
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: page.headline,
				onChange: (e) => onChange({ headline: e.target.value })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: page.subhead,
				onChange: (e) => onChange({ subhead: e.target.value })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				className: "min-h-16",
				value: page.body,
				onChange: (e) => onChange({ body: e.target.value })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: page.cta,
				onChange: (e) => onChange({ cta: e.target.value })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: page.visualNote
			})
		]
	});
}
function Field$2({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
function toBriefInput(brief, brand, extra) {
	const b = migrateBrief(brief);
	const eventName = b.eventName.trim() || b.product.trim();
	const d = b.deliverables;
	const any = d.post || d.story || d.carousel || d.reels;
	return {
		eventName,
		schedule: b.schedule,
		location: b.location,
		product: b.product.trim() || eventName,
		offer: b.offer,
		audience: b.audience.trim(),
		goal: b.goal,
		features: b.features,
		style: b.style,
		notes: b.notes,
		wantPost: any ? d.post : true,
		wantStory: d.story,
		wantCarousel: d.carousel,
		wantReels: d.reels,
		brandName: brand.name,
		handle: brand.handle,
		voice: brand.voice,
		doSay: brand.doSay,
		dontSay: brand.dontSay,
		forbiddenWords: brand.forbiddenWords ?? [],
		slogans: (brand.slogans ?? []).join("／"),
		preferredCtas: (brand.ctas ?? []).join("／"),
		imageStyle: [
			brand.imageStyle?.mood,
			brand.imageStyle?.lighting,
			brand.imageStyle?.paletteHint
		].filter(Boolean).join("；"),
		...extra?.forceMock ? { forceMock: true } : {}
	};
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/ui-store-BhJtBOTj.js
var useUi = create((set) => ({
	assistantOpen: false,
	createOpen: false,
	saveStatus: "idle",
	editorPanel: null,
	carouselPreview: false,
	setAssistantOpen: (open) => set({ assistantOpen: open }),
	startCreative: (creativePreset = {}) => set({
		assistantOpen: true,
		creativePreset
	}),
	clearCreativePreset: () => set({ creativePreset: null }),
	toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
	setCreateOpen: (createOpen) => set({ createOpen }),
	setSaveStatus: (saveStatus) => set({ saveStatus }),
	setEditorPanel: (editorPanel) => set({ editorPanel }),
	setCarouselPreview: (carouselPreview) => set({ carouselPreview })
}));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-CCaD8IgA.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "發生錯誤"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: error.message || "未預期的錯誤，請重新整理頁面。"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function AssistantForm({ variant = "page", projectId }) {
	const navigate = useNavigate();
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const createProject = useStudio((s) => s.createProject);
	const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
	const setLastProjectId = useStudio((s) => s.setLastProjectId);
	const setAssistantOpen = useUi((s) => s.setAssistantOpen);
	const creativePreset = useUi((s) => s.creativePreset);
	const clearCreativePreset = useUi((s) => s.clearCreativePreset);
	const existing = projectId ? projects.find((p) => p.id === projectId) : void 0;
	const [targetId, setTargetId] = (0, import_react.useState)(existing?.id ?? "new");
	const [brandId, setBrandId] = (0, import_react.useState)(existing?.brandId ?? brands[0]?.id ?? "");
	const [formatId, setFormatId] = (0, import_react.useState)(existing?.activeFormatId ?? "feed-portrait");
	const [name, setName] = (0, import_react.useState)(existing?.name ?? "");
	const [brief, setBrief] = (0, import_react.useState)(existing ? migrateBrief(existing.brief) : emptyBrief());
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [doneId, setDoneId] = (0, import_react.useState)(existing?.plan ? existing.id : null);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [liveFailed, setLiveFailed] = (0, import_react.useState)(false);
	const brand = brands.find((b) => b.id === brandId) ?? brands[0];
	const resultProject = doneId ? projects.find((p) => p.id === doneId) : targetId !== "new" ? projects.find((p) => p.id === targetId) : void 0;
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
	(0, import_react.useEffect)(() => {
		if (!creativePreset) return;
		const preset = migrateBrief({
			...emptyBrief(),
			...creativePreset
		});
		setTargetId("new");
		setDoneId(null);
		setBrief(preset);
		setName(preset.eventName);
		clearCreativePreset();
	}, [creativePreset, clearCreativePreset]);
	function patchBrief(patch) {
		setBrief((b) => ({
			...b,
			...patch,
			deliverables: patch.deliverables ?? b.deliverables
		}));
	}
	function onTargetChange(id) {
		setTargetId(id);
		setDoneId(id === "new" ? null : id);
		if (id === "new") return;
		const project = projects.find((p) => p.id === id);
		if (!project) return;
		setBrief(migrateBrief(project.brief));
		setBrandId(project.brandId);
		setFormatId(project.activeFormatId);
		setName(project.name);
	}
	async function generate(forceMock = false) {
		if (!brand) {
			setError("請先在品牌中心建立品牌。");
			return;
		}
		if (!brief.eventName.trim() && !brief.product.trim()) {
			setError("請先填活動名稱，代理才有依據。");
			return;
		}
		if (!brief.audience.trim()) {
			setError("請先填受眾，代理才有依據。");
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
			const nextBrief = {
				...brief,
				eventName: brief.eventName.trim() || result.plan.campaignName,
				product: brief.product.trim() || result.plan.campaignName
			};
			const nextFormat = formatsFromBrief(nextBrief, formatId)[0] ?? formatId;
			let project;
			if (targetId === "new") project = createProject({
				name: name.trim() || result.plan.campaignName,
				brandId: brand.id,
				formatId: nextFormat,
				brief: nextBrief,
				templateId: result.plan.templateId
			});
			else {
				const current = projects.find((p) => p.id === targetId);
				if (!current) throw new Error("找不到專案");
				project = current;
			}
			applyCampaignPlan(project.id, result.plan, nextBrief);
			setLastProjectId(project.id);
			setDoneId(project.id);
			setTargetId(project.id);
			setBrief(nextBrief);
			toast.success(result.adapter === "mock" ? "本機草案已套用到畫布" : "企劃已套用到畫布");
		} catch (err) {
			const message = err instanceof Error ? err.message : "企劃失敗";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	function openEditor(id) {
		setAssistantOpen(false);
		navigate({
			to: "/studio/$projectId",
			params: { projectId: id }
		});
	}
	const mockMode = status ? !status.available || liveFailed : false;
	const statusLabel = status ?? describeAdapter(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-5", variant === "page" && "pb-8"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "ai-adapter-banner",
				className: cn("rounded-lg px-3 py-3", !status ? "bg-surface-2" : status.available ? "bg-surface-2" : "bg-warn/15"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: status ? statusLabel.label : "正在確認企劃服務"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: status ? statusLabel.detail : "先確認有沒有連到 AI，不會假裝已經連線。"
				})]
			}),
			targetId !== "new" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorAgent, {
				projectId: targetId,
				compact: variant === "sheet"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: variant === "page" ? "hidden" : void 0,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "活動需求"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "寫清楚活動、對象與要產出的尺寸，再生成可編輯的企劃。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefFields, {
				brief,
				onChange: patchBrief,
				compact: variant === "sheet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "品牌",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: brandId,
						onValueChange: setBrandId,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "選擇品牌" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: brands.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: b.id,
							children: b.name
						}, b.id)) })]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "主尺寸",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: formatId,
						onValueChange: (v) => setFormatId(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FORMATS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: f.id,
							children: [
								f.name,
								" · ",
								f.short
							]
						}, f.id)) })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "套用到",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: targetId,
					onValueChange: onTargetChange,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "new",
						children: "建立新專案"
					}), projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: p.id,
						children: p.name
					}, p.id))] })]
				})
			}),
			targetId === "new" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "專案名稱（選填）",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "空白則用戰役名稱"
				})
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				message: error,
				onRetry: () => void generate(false)
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
				children: busy ? status?.available && !mockMode ? "企劃生成中…" : "草案撰寫中…" : !status ? "確認服務中…" : resultProject?.plan ? mockMode ? "重新生成本機草案" : "重新生成並套用" : mockMode ? "生成本機草案並排版" : "生成企劃並排版"
			}),
			busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-xs text-muted",
				children: status?.available && !mockMode ? "正在依品牌規範寫概念、文案與頁面，並套進畫布。" : "用本機規則寫一版可編輯草案，不是線上模型回覆。"
			}) : null,
			resultProject?.plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanResult, {
				projectId: resultProject.id,
				onOpenEditor: openEditor
			}) : null
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
var Sheet = Dialog;
function SheetContent({ className, children, side = "bottom", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-fg/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("fixed z-50 bg-surface shadow-[var(--shadow-border)] outline-none", side === "bottom" && "inset-x-0 bottom-0 max-h-[78dvh] rounded-t-xl p-4", side === "right" && "inset-y-0 right-0 h-full w-[min(100%,22rem)] p-4", className),
		...props,
		children: [
			side === "bottom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" }),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
				className: "absolute top-3 right-3 rounded-md p-2 text-muted hover:bg-surface-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "關閉"
				})]
			})
		]
	})] });
}
function SheetTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
		className: cn("text-base font-medium", className),
		...props
	});
}
function SheetDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
		className: cn("text-sm text-muted", className),
		...props
	});
}
function SheetHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mb-4 flex flex-col gap-1 pr-10", className),
		...props
	});
}
function ScrollArea({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root$1, {
		className: cn("relative overflow-hidden", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
			className: "size-full rounded-[inherit]",
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scrollbar, {
			orientation: "vertical",
			className: "flex w-2 touch-none p-px select-none",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thumb, { className: "relative flex-1 rounded-full bg-border-strong" })
		})]
	});
}
function AssistantSheet() {
	const open = useUi((s) => s.assistantOpen);
	const setOpen = useUi((s) => s.setAssistantOpen);
	const lastProjectId = useStudio((s) => s.lastProjectId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex max-h-[86dvh] flex-col p-0 lg:max-h-[92dvh]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border px-4 py-3 pr-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "AI 創作" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						"從一個活動或一句想法開始，生成文案、視覺方向與多尺寸內容。",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/assistant",
							className: "text-fg underline-offset-2 hover:underline",
							onClick: () => setOpen(false),
							children: "開啟完整頁面"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "min-h-0 flex-1 px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantForm, {
					variant: "sheet",
					projectId: lastProjectId
				})
			})]
		})
	});
}
/** 「我現在想創作什麼」的入口。前六個是內容型態，後五個是「從什麼開始」。 */
var QUICK_START = [
	{
		id: "ig-post",
		label: "生成 IG 貼文",
		hint: "單張 4:5",
		icon: PenLine,
		to: "/create",
		search: { kind: "ig-post" },
		tone: "clear"
	},
	{
		id: "image",
		label: "生成圖片",
		hint: "先給三個視覺方向",
		icon: Image,
		to: "/create",
		search: {
			kind: "ig-post",
			step: "visual"
		},
		tone: "warm"
	},
	{
		id: "story",
		label: "生成 Story",
		hint: "9:16 三到五張",
		icon: SquareStack,
		to: "/create",
		search: { kind: "story" },
		tone: "night"
	},
	{
		id: "carousel",
		label: "生成 Carousel",
		hint: "多頁講完一件事",
		icon: Layers,
		to: "/create",
		search: { kind: "carousel" },
		tone: "clear"
	},
	{
		id: "reels",
		label: "生成 Reels",
		hint: "20 秒腳本＋封面",
		icon: Video,
		to: "/create",
		search: { kind: "reels" },
		tone: "night"
	},
	{
		id: "campaign",
		label: "建立活動",
		hint: "一次排完整宣傳",
		icon: CalendarPlus,
		to: "/campaigns",
		search: { new: "1" },
		tone: "warm"
	},
	{
		id: "from-idea",
		label: "從一句想法開始",
		hint: "打一句話就好",
		icon: Lightbulb,
		to: "/create",
		search: { from: "idea" },
		tone: "warm"
	},
	{
		id: "from-image",
		label: "從一張圖片開始",
		hint: "AI 讀圖再寫文案",
		icon: Sparkles,
		to: "/create",
		search: { from: "image" },
		tone: "clear"
	},
	{
		id: "from-assets",
		label: "從素材庫開始",
		hint: "挑一張現有素材",
		icon: Images,
		to: "/assets",
		tone: "night"
	},
	{
		id: "from-drive",
		label: "從 Google Drive 開始",
		hint: "歷屆照片與企劃",
		icon: Images,
		to: "/connections",
		search: { focus: "drive" },
		tone: "clear"
	},
	{
		id: "from-canva",
		label: "從 Canva 設計開始",
		hint: "延續舊設計的品牌感",
		icon: Play,
		to: "/connections",
		search: { focus: "canva" },
		tone: "warm"
	},
	{
		id: "from-ig",
		label: "從以前 IG 貼文開始",
		hint: "看表現好的再延伸",
		icon: Instagram,
		to: "/instagram",
		tone: "night"
	}
];
var TONE_RING = {
	clear: "bg-[color-mix(in_oklab,var(--color-clear)_16%,transparent)] text-[var(--color-accent)]",
	warm: "bg-[color-mix(in_oklab,var(--color-warm)_20%,transparent)] text-[color-mix(in_oklab,var(--color-warm)_70%,var(--color-fg))]",
	night: "bg-[color-mix(in_oklab,var(--color-night)_16%,transparent)] text-[var(--color-night)]"
};
function QuickStartGrid({ items = QUICK_START, onNavigate, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4", className),
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: item.to,
			search: item.search,
			onClick: onNavigate,
			className: "flex h-full min-h-[4.5rem] items-center gap-3 rounded-2xl bg-surface px-3 py-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE_RING[item.tone]),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm font-medium",
					children: item.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-muted",
					children: item.hint
				})]
			})]
		}) }, item.id))
	});
}
function SaveIndicator({ className }) {
	const status = useUi((s) => s.saveStatus);
	if (status === "idle") return null;
	const label = status === "saving" ? "儲存中" : status === "saved" ? "已儲存" : "儲存失敗";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs", status === "error" ? "text-danger" : "text-muted", className),
		"aria-live": "polite",
		children: [status === "saving" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : status === "saved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), label]
	});
}
/** 電腦版側欄：創作在最上面，管理類的放後面。 */
var SIDE_NAV = [
	{
		to: "/",
		label: "首頁",
		icon: House,
		match: "home"
	},
	{
		to: "/create",
		label: "AI 創作",
		icon: Sparkles,
		match: "create"
	},
	{
		to: "/campaigns",
		label: "活動",
		icon: Tent,
		match: "campaigns"
	},
	{
		to: "/calendar",
		label: "排程",
		icon: CalendarDays,
		match: "calendar"
	},
	{
		to: "/instagram",
		label: "IG",
		icon: Instagram,
		match: "instagram"
	},
	{
		to: "/assets",
		label: "素材",
		icon: Images,
		match: "assets"
	},
	{
		to: "/studio",
		label: "Studio",
		icon: PenTool,
		match: "studio"
	},
	{
		to: "/search",
		label: "搜尋",
		icon: Search,
		match: "search"
	},
	{
		to: "/brand",
		label: "品牌",
		icon: SwatchBook,
		match: "brand"
	},
	{
		to: "/connections",
		label: "連接",
		icon: Link2,
		match: "connections"
	}
];
/** 手機底部：四個分頁＋中央的「＋ AI 創作」。 */
var TAB_NAV = [
	{
		to: "/",
		label: "首頁",
		icon: House,
		match: "home"
	},
	{
		to: "/calendar",
		label: "排程",
		icon: CalendarDays,
		match: "calendar"
	},
	{
		to: "/assets",
		label: "素材",
		icon: Images,
		match: "assets"
	},
	{
		to: "/instagram",
		label: "IG",
		icon: Instagram,
		match: "instagram"
	}
];
function activeKey(pathname) {
	if (pathname.startsWith("/studio")) return "studio";
	if (pathname.startsWith("/create") || pathname.startsWith("/assistant")) return "create";
	if (pathname.startsWith("/campaigns")) return "campaigns";
	if (pathname.startsWith("/calendar")) return "calendar";
	if (pathname.startsWith("/instagram")) return "instagram";
	if (pathname.startsWith("/assets")) return "assets";
	if (pathname.startsWith("/search")) return "search";
	if (pathname.startsWith("/brand")) return "brand";
	if (pathname.startsWith("/connections")) return "connections";
	if (pathname.startsWith("/export")) return "studio";
	return "home";
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const lastProjectId = useStudio((s) => s.lastProjectId);
	const createOpen = useUi((s) => s.createOpen);
	const setCreateOpen = useUi((s) => s.setCreateOpen);
	const current = activeKey(pathname);
	function hrefFor(item) {
		if (item.match === "studio" && lastProjectId) return {
			to: "/studio/$projectId",
			params: { projectId: lastProjectId }
		};
		return { to: item.to };
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sticky top-0 hidden h-dvh w-[5rem] shrink-0 flex-col border-r border-border bg-surface/70 backdrop-blur lg:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex h-16 flex-col items-center justify-center gap-1",
						"aria-label": "禪學社創作中控台首頁",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "three-lights size-6 rounded-full",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-[0.7rem] tracking-tight text-muted",
							children: CLUB_SHORT
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-1 flex-col gap-1 overflow-y-auto p-2",
						children: SIDE_NAV.map((item) => {
							const active = current === item.match;
							const dest = hrefFor(item);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: dest.to,
								params: "params" in dest ? dest.params : void 0,
								className: cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] transition-colors", active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-[1.15rem]" }), item.label]
							}, item.match);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col items-center gap-2 px-2 pb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveIndicator, {})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-dvh min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 pb-nav",
					children
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative grid grid-cols-5",
						children: [
							TAB_NAV.slice(0, 2).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabLink, {
								item,
								active: current === item.match
							}, item.match)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-start justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setCreateOpen(true),
									"aria-label": "AI 創作",
									className: "three-lights -mt-5 flex size-14 min-h-11 flex-col items-center justify-center rounded-full text-accent-fg shadow-[var(--shadow-glow)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[0.6rem] leading-none",
										children: "AI 創作"
									})]
								})
							}),
							TAB_NAV.slice(2).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabLink, {
								item,
								active: current === item.match
							}, item.match))
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: createOpen,
				onOpenChange: setCreateOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "bottom",
					className: "max-h-[86dvh] overflow-y-auto rounded-t-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
						className: "text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "font-display text-xl",
							children: "今天想創作什麼？"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetDescription, { children: "選一個開始，AI 會先讀品牌記憶跟現在的學期情境。" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickStartGrid, {
						items: QUICK_START.slice(0, 8),
						onNavigate: () => setCreateOpen(false),
						className: "pb-4"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantSheet, {})
		]
	});
}
function TabLink({ item, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: item.to,
		className: cn("flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-[0.68rem]", active ? "text-fg" : "text-muted"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-[1.15rem]" }), item.label]
	});
}
function StudioProvider({ children }) {
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			try {
				await Promise.all([useStudio.persist.rehydrate(), useCreative.persist.rehydrate()]);
			} finally {
				if (!cancelled) {
					useStudio.getState().setHydrated(true);
					useCreative.getState().setHydrated(true);
				}
				const assets = useStudio.getState().assets;
				Promise.all(assets.map(async (asset) => {
					if (!asset.seedSrc) return;
					try {
						await hydrateSeedAsset(asset.id, asset.seedSrc);
					} catch {}
				}));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		let timer = 0;
		const unsub = useStudio.subscribe((state, prev) => {
			if (!state.hydrated) return;
			if (state.projects === prev.projects && state.brands === prev.brands && state.assets === prev.assets) return;
			useUi.getState().setSaveStatus("saving");
			window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				useUi.getState().setSaveStatus("saved");
			}, 420);
		});
		return () => {
			unsub();
			window.clearTimeout(timer);
		};
	}, []);
	return children;
}
function Toaster$1() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme: "light",
		position: "bottom-center",
		toastOptions: { classNames: { toast: "bg-surface text-fg border-border shadow-[var(--shadow-border)]" } }
	});
}
var TooltipProvider = Provider;
var styles_default = "/assets/styles-bnK9MQBp.css";
var APP_NAME = "禪光工作室 · 淡江大學禪學社";
var Route$16 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "淡江大學禪學社的 AI 創作中控台：一個人也能完成 IG 網宣的企劃、文案、圖片與排程。"
			},
			{
				name: "theme-color",
				content: "#F7F5F0"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;600;700&display=swap"
			}
		]
	}),
	component: Root
});
function Root() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-Hant",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
				delayDuration: 250,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StudioProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})] })
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
var $$splitComponentImporter$15 = () => import("./routes-BJowk8ao.mjs");
var Route$15 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./assets-CiEx9Yvt.mjs");
var Route$14 = createFileRoute("/assets")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./assistant-BwZOU59U.mjs");
var Route$13 = createFileRoute("/assistant")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./brand-Bd0FQiOK.mjs");
var Route$12 = createFileRoute("/brand")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./calendar-DsTSmHcx.mjs");
var Route$11 = createFileRoute("/calendar")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./campaigns-goHHQfdU.mjs");
var Route$10 = createFileRoute("/campaigns")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./connections-CNs4RMAv.mjs");
var Route$9 = createFileRoute("/connections")({
	validateSearch: (search) => ({ focus: typeof search.focus === "string" ? search.focus : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./create-BJz1kYbA.mjs");
var Route$8 = createFileRoute("/create")({
	validateSearch: (search) => ({
		kind: typeof search.kind === "string" ? search.kind : void 0,
		from: typeof search.from === "string" ? search.from : void 0,
		seed: typeof search.seed === "string" ? search.seed : void 0,
		contentId: typeof search.contentId === "string" ? search.contentId : void 0,
		campaignId: typeof search.campaignId === "string" ? search.campaignId : void 0,
		step: typeof search.step === "string" ? search.step : void 0
	}),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./export-DLx-h36w.mjs");
var Route$7 = createFileRoute("/export")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./instagram-B0QNdzJ4.mjs");
var Route$6 = createFileRoute("/instagram")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./search-7czg1ywl.mjs");
var Route$5 = createFileRoute("/search")({
	validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./studio-DXiWF76P.mjs");
var Route$4 = createFileRoute("/studio")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./campaigns.index-BeU_1Y0N.mjs");
var Route$3 = createFileRoute("/campaigns/")({
	validateSearch: (search) => ({ new: typeof search.new === "string" ? search.new : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./campaigns._campaignId-CMjPw5-8.mjs");
var Route$2 = createFileRoute("/campaigns/$campaignId")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./studio.index-CgO6qgRG.mjs");
var Route$1 = createFileRoute("/studio/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./studio._projectId-BYOUBW2B.mjs");
var Route = createFileRoute("/studio/$projectId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$15.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$16
});
var AssetsRoute = Route$14.update({
	id: "/assets",
	path: "/assets",
	getParentRoute: () => Route$16
});
var AssistantRoute = Route$13.update({
	id: "/assistant",
	path: "/assistant",
	getParentRoute: () => Route$16
});
var BrandRoute = Route$12.update({
	id: "/brand",
	path: "/brand",
	getParentRoute: () => Route$16
});
var CalendarRoute = Route$11.update({
	id: "/calendar",
	path: "/calendar",
	getParentRoute: () => Route$16
});
var CampaignsRoute = Route$10.update({
	id: "/campaigns",
	path: "/campaigns",
	getParentRoute: () => Route$16
});
var ConnectionsRoute = Route$9.update({
	id: "/connections",
	path: "/connections",
	getParentRoute: () => Route$16
});
var CreateRoute = Route$8.update({
	id: "/create",
	path: "/create",
	getParentRoute: () => Route$16
});
var ExportRoute = Route$7.update({
	id: "/export",
	path: "/export",
	getParentRoute: () => Route$16
});
var InstagramRoute = Route$6.update({
	id: "/instagram",
	path: "/instagram",
	getParentRoute: () => Route$16
});
var SearchRoute = Route$5.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$16
});
var StudioRoute = Route$4.update({
	id: "/studio",
	path: "/studio",
	getParentRoute: () => Route$16
});
var CampaignsIndexRoute = Route$3.update({
	id: "/",
	path: "/",
	getParentRoute: () => CampaignsRoute
});
var CampaignsCampaignIdRoute = Route$2.update({
	id: "/$campaignId",
	path: "/$campaignId",
	getParentRoute: () => CampaignsRoute
});
var StudioIndexRoute = Route$1.update({
	id: "/",
	path: "/",
	getParentRoute: () => StudioRoute
});
var StudioProjectIdRoute = Route.update({
	id: "/$projectId",
	path: "/$projectId",
	getParentRoute: () => StudioRoute
});
var CampaignsRouteChildren = {
	CampaignsCampaignIdRoute,
	CampaignsIndexRoute
};
var CampaignsRouteWithChildren = CampaignsRoute._addFileChildren(CampaignsRouteChildren);
var StudioRouteChildren = {
	StudioProjectIdRoute,
	StudioIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AssetsRoute,
	AssistantRoute,
	BrandRoute,
	CalendarRoute,
	CampaignsRoute: CampaignsRouteWithChildren,
	ConnectionsRoute,
	CreateRoute,
	ExportRoute,
	InstagramRoute,
	SearchRoute,
	StudioRoute: StudioRoute._addFileChildren(StudioRouteChildren)
};
var routeTree = Route$16._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { createSsrRpc as C, useUi as S, PlanResult as _, Route$5 as a, getCampaignAiStatus as b, SaveIndicator as c, Sheet as d, SheetContent as f, EditorAgent as g, BriefFields as h, Route$3 as i, QuickStartGrid as l, AssistantForm as m, Route as n, Route$8 as o, SheetTitle as p, Route$2 as r, Route$9 as s, router_exports as t, ScrollArea as u, describeAdapter as v, toBriefInput as x, generateCampaignPlan as y };
