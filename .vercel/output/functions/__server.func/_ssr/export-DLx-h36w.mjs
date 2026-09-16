import { i as __toESM } from "../_runtime.mjs";
import { t as uid } from "./ids-D2oCDrlv.mjs";
import { d as formatById } from "./schema-iJpgBEjq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, B as pagesOf, C as cssFilter, R as normalizeCrop, X as useStudio, u as activeArtboard, z as normalizeFilter } from "./studio-store-BqpaoTm7.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Label, r as SelectItem, t as Select } from "./select-DIEr3sGB.mjs";
import { n as getAssetBlob } from "./assets-idb-DwbJEnrX.mjs";
import { r as LoadingState, t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { J as FolderKanban, Z as Download } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as ArtboardView } from "./artboard-view-h-1TjLhY.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { t as StatusBadge } from "./status-badge-Coap4BY7.mjs";
import { r as format, t as zhTW } from "../_libs/date-fns.mjs";
import { t as QualityPanel } from "./quality-panel-CQynoSjf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/export-DLx-h36w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function roundRect(ctx, x, y, w, h, r) {
	const radius = Math.max(0, Math.min(r, w / 2, h / 2));
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x, y, radius);
	ctx.closePath();
}
function wrapText(ctx, text, maxWidth) {
	const paragraphs = text.split("\n");
	const lines = [];
	for (const p of paragraphs) {
		if (!p) {
			lines.push("");
			continue;
		}
		let line = "";
		for (const ch of [...p]) {
			const next = line + ch;
			if (ctx.measureText(next).width > maxWidth && line) {
				lines.push(line);
				line = ch;
			} else line = next;
		}
		if (line) lines.push(line);
	}
	return lines.length ? lines : [""];
}
function applyShadow(ctx, layer) {
	const s = layer.shadow;
	if (!s?.enabled) return;
	ctx.shadowOffsetX = s.x;
	ctx.shadowOffsetY = s.y;
	ctx.shadowBlur = s.blur;
	ctx.shadowColor = s.color;
}
function drawImageFitted(ctx, img, x, y, w, h, layer) {
	const fit = layer.type === "logo" ? "contain" : layer.objectFit;
	const crop = layer.type === "image" ? normalizeCrop(layer.crop) : {
		x: 50,
		y: 50,
		zoom: 1
	};
	const radius = layer.radius ?? 0;
	ctx.save();
	if (radius > 0) {
		roundRect(ctx, x, y, w, h, radius);
		ctx.clip();
	} else {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.clip();
	}
	if (layer.type === "image") {
		const filter = cssFilter(normalizeFilter(layer.filter));
		if (filter) ctx.filter = filter;
	}
	const z = Math.max(1, crop.zoom);
	const ir = img.width / Math.max(1, img.height);
	const br = w / Math.max(1, h);
	let dw;
	let dh;
	if (fit === "contain") {
		if (ir > br) {
			dw = w * z;
			dh = dw / ir;
		} else {
			dh = h * z;
			dw = dh * ir;
		}
	} else if (ir > br) {
		dh = h * z;
		dw = dh * ir;
	} else {
		dw = w * z;
		dh = dw / ir;
	}
	const dx = x + (w - dw) * (crop.x / 100);
	const dy = y + (h - dh) * (crop.y / 100);
	ctx.drawImage(img, dx, dy, dw, dh);
	ctx.restore();
}
function paintLayer(ctx, layer, images, brand) {
	if (layer.hidden || layer.opacity <= 0) return;
	ctx.save();
	ctx.globalAlpha = layer.opacity;
	const cx = layer.x + layer.w / 2;
	const cy = layer.y + layer.h / 2;
	if (layer.rotation) {
		ctx.translate(cx, cy);
		ctx.rotate(layer.rotation * Math.PI / 180);
		ctx.translate(-cx, -cy);
	}
	applyShadow(ctx, layer);
	if (layer.type === "shape") {
		const r = layer.shape === "pill" ? layer.h / 2 : layer.shape === "ellipse" ? Math.max(layer.w, layer.h) : layer.radius;
		if (layer.shape === "ellipse") {
			ctx.beginPath();
			ctx.ellipse(cx, cy, layer.w / 2, layer.h / 2, 0, 0, Math.PI * 2);
		} else roundRect(ctx, layer.x, layer.y, layer.w, layer.h, r);
		if (layer.fill && layer.fill !== "transparent") {
			ctx.fillStyle = layer.fill;
			ctx.fill();
		}
		if (layer.stroke && (layer.strokeWidth ?? 0) > 0) {
			ctx.strokeStyle = layer.stroke;
			ctx.lineWidth = layer.strokeWidth ?? 1;
			ctx.stroke();
		}
	} else if (layer.type === "line") drawLine(ctx, layer);
	else if (layer.type === "text") drawText(ctx, layer);
	else if (layer.type === "image" || layer.type === "logo") {
		const assetId = layer.type === "logo" ? layer.assetId ?? brand.logoAssetId : layer.assetId;
		const img = assetId ? images[assetId] : void 0;
		if (img) {
			ctx.shadowColor = "transparent";
			if (layer.shadow?.enabled) {
				ctx.save();
				applyShadow(ctx, layer);
				ctx.fillStyle = "rgba(0,0,0,0.01)";
				roundRect(ctx, layer.x, layer.y, layer.w, layer.h, layer.radius ?? 0);
				ctx.fill();
				ctx.restore();
			}
			drawImageFitted(ctx, img, layer.x, layer.y, layer.w, layer.h, layer);
		}
	}
	ctx.restore();
}
function drawLine(ctx, layer) {
	ctx.beginPath();
	ctx.moveTo(layer.x, layer.y + layer.h / 2);
	ctx.lineTo(layer.x + layer.w, layer.y + layer.h / 2);
	ctx.strokeStyle = layer.stroke;
	ctx.lineWidth = layer.strokeWidth;
	ctx.lineCap = "round";
	ctx.stroke();
}
function drawText(ctx, layer) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(layer.x, layer.y, layer.w, layer.h);
	ctx.clip();
	ctx.fillStyle = layer.color;
	ctx.font = `${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;
	ctx.textAlign = layer.align;
	ctx.textBaseline = "top";
	const lines = wrapText(ctx, layer.text, layer.w);
	const lh = layer.fontSize * layer.lineHeight;
	if ((layer.letterSpacing ?? 0) !== 0) ctx.letterSpacing = `${layer.letterSpacing}px`;
	let x = layer.x;
	if (layer.align === "center") x = layer.x + layer.w / 2;
	if (layer.align === "right") x = layer.x + layer.w;
	lines.forEach((line, i) => {
		const y = layer.y + i * lh;
		if (y > layer.y + layer.h) return;
		ctx.fillText(line, x, y, layer.w);
	});
	ctx.restore();
}
async function renderArtboardToCanvas(artboard, brand, images, scale = 1) {
	const format = formatById(artboard.formatId);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(format.width * scale);
	canvas.height = Math.round(format.height * scale);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("無法建立畫布");
	ctx.scale(scale, scale);
	ctx.fillStyle = artboard.background.color;
	ctx.fillRect(0, 0, format.width, format.height);
	if (artboard.background.type === "gradient" && artboard.background.color2) {
		const angle = (artboard.background.angle ?? 180) * Math.PI / 180;
		const x2 = format.width / 2 + Math.cos(angle) * format.width;
		const y2 = format.height / 2 + Math.sin(angle) * format.height;
		const x1 = format.width / 2 - Math.cos(angle) * format.width;
		const y1 = format.height / 2 - Math.sin(angle) * format.height;
		const g = ctx.createLinearGradient(x1, y1, x2, y2);
		g.addColorStop(0, artboard.background.color);
		g.addColorStop(1, artboard.background.color2);
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, format.width, format.height);
	}
	if (artboard.background.type === "image" && artboard.background.assetId) {
		const img = images[artboard.background.assetId];
		if (img) {
			const ir = img.width / img.height;
			const br = format.width / format.height;
			let dw = format.width;
			let dh = format.height;
			let dx = 0;
			let dy = 0;
			if (ir > br) {
				dw = format.height * ir;
				dx = (format.width - dw) / 2;
			} else {
				dh = format.width / ir;
				dy = (format.height - dh) / 2;
			}
			ctx.drawImage(img, dx, dy, dw, dh);
		}
	}
	await document.fonts.ready.catch(() => void 0);
	for (const layer of artboard.layers) paintLayer(ctx, layer, images, brand);
	return canvas;
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function canvasToBlob(canvas, type, quality = .95) {
	return await new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) reject(/* @__PURE__ */ new Error("匯出失敗"));
			else resolve(blob);
		}, type, quality);
	});
}
function collectArtboardAssetIds(artboard, brand) {
	const ids = [];
	if (artboard.background.assetId) ids.push(artboard.background.assetId);
	for (const layer of artboard.layers) {
		if (layer.type === "image") ids.push(layer.assetId);
		if (layer.type === "logo") ids.push(layer.assetId ?? brand.logoAssetId ?? "");
	}
	return ids.filter(Boolean);
}
async function loadImages(ids) {
	const map = {};
	await Promise.all([...new Set(ids)].map(async (id) => {
		const blob = await getAssetBlob(id);
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		try {
			const img = await new Promise((resolve, reject) => {
				const el = new Image();
				el.onload = () => resolve(el);
				el.onerror = () => reject(/* @__PURE__ */ new Error("圖片載入失敗"));
				el.src = url;
			});
			map[id] = img;
		} finally {
			URL.revokeObjectURL(url);
		}
	}));
	return map;
}
function ExportPanel({ project, brand, artboard }) {
	const recordExport = useStudio((s) => s.recordExport);
	const [scale, setScale] = (0, import_react.useState)(2);
	const [type, setType] = (0, import_react.useState)("image/png");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const format = formatById(artboard.formatId);
	const outW = format.width * scale;
	const outH = format.height * scale;
	const pages = pagesOf(project, artboard.formatId);
	async function exportArtboard(target, suffix) {
		const blob = await canvasToBlob(await renderArtboardToCanvas(target, brand, await loadImages(collectArtboardAssetIds(target, brand)), scale), type, .95);
		const ext = type === "image/png" ? "png" : "jpg";
		const filename = `${project.name.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "export"}-${format.short}${suffix}-${outW}x${outH}.${ext}`;
		downloadBlob(blob, filename);
		recordExport(project.id, {
			id: uid("exp"),
			createdAt: Date.now(),
			formatId: target.formatId,
			scale,
			mime: type,
			width: outW,
			height: outH,
			filename
		});
	}
	async function exportNow() {
		setBusy(true);
		setError(null);
		try {
			await exportArtboard(artboard, "");
			toast.success("已開始下載此頁");
		} catch (err) {
			const message = err instanceof Error ? err.message : "匯出失敗";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	async function exportCarousel() {
		setBusy(true);
		setError(null);
		try {
			for (let i = 0; i < pages.length; i += 1) {
				await exportArtboard(pages[i], `-p${i + 1}`);
				if (i < pages.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 450));
			}
			toast.success(`已匯出 ${pages.length} 頁輪播`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "匯出失敗";
			setError(message);
			toast.error(message);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "高畫質輸出"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "Instagram 以 1080 邊長為準。建議 PNG 2x 再壓縮，避免平台二次糊掉。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "倍率" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex gap-2",
					children: [
						1,
						2,
						3
					].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: scale === n ? "default" : "secondary",
						onClick: () => setScale(n),
						children: [n, "x"]
					}, n))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-subtle tabular-nums",
					children: [
						outW,
						" × ",
						outH,
						" px · ",
						format.name,
						pages.length > 1 ? ` · ${pages.length} 頁輪播` : ""
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "格式" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: type === "image/png" ? "default" : "secondary",
					onClick: () => setType("image/png"),
					children: "PNG"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: type === "image/jpeg" ? "default" : "secondary",
					onClick: () => setType("image/jpeg"),
					children: "JPEG"
				})]
			})] }),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				disabled: busy,
				onClick: () => void exportNow(),
				children: busy ? "匯出中…" : "下載此頁"
			}),
			pages.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "w-full",
				variant: "secondary",
				disabled: busy,
				onClick: () => void exportCarousel(),
				children: [
					"匯出輪播全部（",
					pages.length,
					" 頁）"
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				className: "w-full",
				onClick: async () => {
					const text = `${project.copy.caption}\n\n${project.copy.hashtags.join(" ")}`.trim();
					await navigator.clipboard.writeText(text);
					toast.success("已複製貼文文案");
				},
				children: "複製貼文文案"
			}),
			project.copy.altText ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: ["Alt：", project.copy.altText]
			}) : null
		]
	});
}
function ExportCenter() {
	const navigate = useNavigate();
	const hydrated = useStudio((s) => s.hydrated);
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const lastProjectId = useStudio((s) => s.lastProjectId);
	const setLastProjectId = useStudio((s) => s.setLastProjectId);
	const setActiveFormat = useStudio((s) => s.setActiveFormat);
	const ensureArtboard = useStudio((s) => s.ensureArtboard);
	const setSlide = useStudio((s) => s.setSlide);
	const project = projects.find((p) => p.id === lastProjectId) ?? projects[0];
	const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : void 0;
	const artboard = project ? activeArtboard(project) : void 0;
	const assetIds = (0, import_react.useMemo)(() => {
		const ids = [];
		if (artboard) {
			if (artboard.background.assetId) ids.push(artboard.background.assetId);
			for (const l of artboard.layers) {
				if (l.type === "image") ids.push(l.assetId);
				if (l.type === "logo" && l.assetId) ids.push(l.assetId);
			}
		}
		if (brand?.logoAssetId) ids.push(brand.logoAssetId);
		return ids;
	}, [artboard, brand]);
	const urls = useAssetUrls(assetIds);
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, { label: "讀取作品…" });
	if (!project || !brand) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: FolderKanban,
			title: "還沒有可輸出的作品",
			description: "先完成一則網宣，再回來檢查與下載。",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "回首頁"
				})
			})
		})
	});
	if (!artboard) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, { label: "正在準備預覽…" });
	const format$1 = formatById(artboard.formatId);
	const pages = pagesOf(project);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "輸出中心",
				title: "預覽與下載",
				description: "檢查安全區與文案，再輸出 Instagram 用的高畫質檔案。每次下載會留下版本紀錄。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/studio/$projectId",
						params: { projectId: project.id },
						children: "回編輯器"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: project.id,
					onValueChange: (id) => {
						setLastProjectId(id);
						navigate({ to: "/export" });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "sm:max-w-xs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: p.id,
						children: p.name
					}, p.id)) })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: project.status })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-3 flex flex-wrap gap-1",
							children: [
								"feed-square",
								"feed-portrait",
								"feed-landscape",
								"story",
								"reels-cover"
							].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: project.activeFormatId === id ? "default" : "secondary",
								onClick: () => {
									ensureArtboard(project.id, id);
									setActiveFormat(project.id, id);
								},
								children: formatById(id).short
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex min-h-80 items-center justify-center rounded-lg bg-bg p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
								artboard,
								brand,
								urls,
								width: Math.min(280, 280 * format$1.width / format$1.height),
								showSafe: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-center text-xs text-muted tabular-nums",
							children: [
								format$1.name,
								" · ",
								format$1.width,
								"×",
								format$1.height,
								pages.length > 1 ? ` · 第 ${(project.slideIndex ?? 0) + 1}/${pages.length} 頁` : ""
							]
						}),
						pages.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex justify-center gap-1",
							children: pages.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: i === (project.slideIndex ?? 0) ? "default" : "secondary",
								onClick: () => setSlide(project.id, i),
								children: i + 1
							}, i))
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportPanel, {
							project,
							brand,
							artboard
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QualityPanel, {
							project,
							brand
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "版本紀錄"
				}), project.exports.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
					children: "還沒有下載紀錄。第一次匯出會出現在這裡。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: project.exports.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: item.filename
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted tabular-nums",
								children: [
									formatById(item.formatId).short,
									" · ",
									item.width,
									"×",
									item.height,
									" · ",
									item.scale,
									"x ·",
									" ",
									format(item.createdAt, "M/d HH:mm", { locale: zhTW })
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4 shrink-0 text-subtle" })]
					}, item.id))
				})]
			})
		]
	});
}
var SplitComponent = ExportCenter;
//#endregion
export { SplitComponent as component };
