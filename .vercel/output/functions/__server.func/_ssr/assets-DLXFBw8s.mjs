import { i as __toESM } from "../_runtime.mjs";
import { d as formatById, v as uid } from "./schema-DPsPUDiS.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { B as usageLabel, E as kindFromCategory, H as Button, N as previewTemplate, O as matchesAssetQuery, R as sourceLabel, U as buttonVariants, V as useStudio, W as cn, d as assetUsageStatus, f as categoryLabel, i as ASSET_SOURCES, l as TEMPLATE_STARTERS, n as ASSET_DRAG_MIME, p as collectUsedAssetIds, t as ASSET_CATEGORIES } from "./studio-store-BWfSiXeC.mjs";
import { n as Input, r as Textarea, t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { k as Images, l as Star, r as Upload, s as Trash2 } from "../_libs/lucide-react.mjs";
import { a as SelectTrigger, i as SelectItem, n as Select, o as SelectValue, r as SelectContent, t as Label } from "./select-BaC2bIMR.mjs";
import { n as decodeAssetImage, t as AssetUploadError } from "./asset-upload-BZwZSP2I.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { b as ErrorState, c as SheetContent, l as SheetTitle, s as Sheet, y as EmptyState } from "./router-Dh2P_fa6.mjs";
import { n as StorageNotice, t as BrandSubnav } from "./storage-notice-CtwZWNSK.mjs";
import { t as PageHeader } from "./page-header-q_x9nRjA.mjs";
import { t as ArtboardView } from "./artboard-view-CoDxtyhX.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assets-DLXFBw8s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AssetCard({ asset, url, usage, draggable = true, onOpen, onFavorite, onDelete, onPlace }) {
	const [broken, setBroken] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "group overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]",
		draggable,
		onDragStart: (e) => {
			e.dataTransfer.setData(ASSET_DRAG_MIME, asset.id);
			e.dataTransfer.effectAllowed = "copy";
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onOpen,
			className: "block w-full text-left",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-square bg-bg",
				children: [url && !broken ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: url,
					alt: asset.name,
					className: "size-full object-cover",
					draggable: false,
					onError: () => setBroken(true)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex size-full items-center justify-center px-3 text-center text-xs text-muted",
					children: broken ? "預覽失敗" : "載入中"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-2 left-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: usage === "in-use" ? "success" : usage === "used" ? "default" : "default",
						children: usageLabel(usage)
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1.5 px-3 py-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium",
							children: asset.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs text-muted",
							children: [
								categoryLabel(asset.category),
								" · ",
								sourceLabel(asset.source)
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": asset.favorite ? "取消收藏" : "收藏",
						onClick: onFavorite,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-4", asset.favorite && "fill-warn text-warn") })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate text-xs text-subtle tabular-nums",
					children: [
						asset.width,
						"×",
						asset.height,
						asset.licenseOwner ? ` · ${asset.licenseOwner}` : ""
					]
				}),
				asset.tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-xs text-subtle",
					children: asset.tags.slice(0, 3).join(" · ")
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1 pt-1",
					children: [onPlace ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						className: "flex-1",
						onClick: onPlace,
						children: "放到畫布"
					}) : null, onDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": `刪除 ${asset.name}`,
						onClick: onDelete,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					}) : null]
				})
			]
		})]
	});
}
function AssetDetailSheet({ asset, url, usage, open, onOpenChange, onDelete }) {
	const navigate = useNavigate();
	const updateAsset = useStudio((s) => s.updateAsset);
	const placeAsset = useStudio((s) => s.placeAsset);
	const lastProjectId = useStudio((s) => s.lastProjectId);
	const toggleFavorite = useStudio((s) => s.toggleFavorite);
	if (!asset) return null;
	const current = asset;
	function patch(key, value) {
		updateAsset(current.id, { [key]: value });
	}
	function place() {
		if (!lastProjectId) {
			toast.error("還沒有開啟的專案，請先到編輯器。");
			return;
		}
		if (!placeAsset(lastProjectId, current.id)) {
			toast.error("無法放到畫布");
			return;
		}
		toast.success(`已放入「${current.name}」`);
		onOpenChange(false);
		navigate({
			to: "/studio/$projectId",
			params: { projectId: lastProjectId }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "flex max-h-[88dvh] flex-col gap-4 overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: asset.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-24 overflow-hidden rounded-xl bg-bg",
						children: url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: url,
							alt: "",
							className: "size-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-full items-center justify-center text-xs text-muted",
							children: "無預覽"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								asset.width,
								"×",
								asset.height,
								" · ",
								asset.mime
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1",
								children: ["來源：", sourceLabel(asset.source)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1",
								children: ["狀態：", usageLabel(usage)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1",
								children: [
									"使用 ",
									asset.useCount,
									" 次"
								]
							}),
							asset.lastUsedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1",
								children: ["最近 ", new Date(asset.lastUsedAt).toLocaleString("zh-TW")]
							}) : null
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "mb-1.5 block",
					children: "名稱"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: asset.name,
					onChange: (e) => patch("name", e.target.value)
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "mb-1.5 block",
					children: "分類"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: asset.category,
					onValueChange: (v) => {
						const category = v;
						updateAsset(asset.id, {
							category,
							kind: kindFromCategory(category)
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: item.id,
						children: item.label
					}, item.id)) })]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "mb-1.5 block",
					children: "標籤（逗號分隔）"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: asset.tags.join("，"),
					onChange: (e) => patch("tags", e.target.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "mb-1.5 block",
					children: "授權備註"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: asset.licenseNotes,
					onChange: (e) => patch("licenseNotes", e.target.value),
					placeholder: "拍攝者、授權範圍、可否商用"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					className: "mb-1.5 block",
					children: "權利人／來源"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: asset.licenseOwner,
					onChange: (e) => patch("licenseOwner", e.target.value),
					placeholder: "例如：日食咖啡、攝影師姓名"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "來源與授權只存在此裝置，不會上傳到雲端。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2 pb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: place,
							disabled: !lastProjectId,
							children: "放到目前畫布"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => toggleFavorite(asset.id),
							children: asset.favorite ? "取消收藏" : "收藏"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: onDelete,
							children: "刪除"
						})
					]
				})
			]
		})
	});
}
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
function AlertDialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
		className: cn("fixed inset-0 z-50 bg-fg/30", className),
		...props
	});
}
function AlertDialogContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		className: cn("fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] outline-none", className),
		...props
	})] });
}
function AlertDialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("space-y-1", className),
		...props
	});
}
function AlertDialogFooter({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("mt-5 flex justify-end gap-2", className),
		...props
	});
}
function AlertDialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
		className: cn("text-base font-medium", className),
		...props
	});
}
function AlertDialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
		className: cn("text-sm text-muted", className),
		...props
	});
}
function AlertDialogAction({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
		className: cn(buttonVariants(), className),
		...props
	});
}
function AlertDialogCancel({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
		className: cn(buttonVariants({ variant: "secondary" }), className),
		...props
	});
}
function AssetLibrary() {
	const navigate = useNavigate();
	const assets = useStudio((s) => s.assets);
	const brands = useStudio((s) => s.brands);
	const projects = useStudio((s) => s.projects);
	const lastProjectId = useStudio((s) => s.lastProjectId);
	const addAsset = useStudio((s) => s.addAsset);
	const removeAsset = useStudio((s) => s.removeAsset);
	const toggleFavorite = useStudio((s) => s.toggleFavorite);
	const placeAsset = useStudio((s) => s.placeAsset);
	const createFromTemplate = useStudio((s) => s.createFromTemplate);
	const fileRef = (0, import_react.useRef)(null);
	const [q, setQ] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [source, setSource] = (0, import_react.useState)("all");
	const [usageFilter, setUsageFilter] = (0, import_react.useState)("all");
	const [uploadCategory, setUploadCategory] = (0, import_react.useState)("photo");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [errors, setErrors] = (0, import_react.useState)([]);
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const [dropOver, setDropOver] = (0, import_react.useState)(false);
	const usedIds = (0, import_react.useMemo)(() => collectUsedAssetIds(projects, brands), [projects, brands]);
	const brand = brands[0];
	const filtered = (0, import_react.useMemo)(() => {
		return assets.filter((asset) => {
			if (!matchesAssetQuery(asset, q)) return false;
			if (source !== "all" && asset.source !== source) return false;
			const usage = assetUsageStatus(asset, usedIds);
			if (usageFilter !== "all" && usage !== usageFilter) return false;
			if (filter === "favorite") return asset.favorite;
			if (filter === "history") return usage !== "unused";
			if (filter === "template") return false;
			if (filter !== "all" && asset.category !== filter) return false;
			return true;
		});
	}, [
		assets,
		q,
		filter,
		source,
		usageFilter,
		usedIds
	]);
	const urls = useAssetUrls(assets.map((a) => a.id));
	const counts = (0, import_react.useMemo)(() => {
		const map = {
			all: assets.length,
			favorite: assets.filter((a) => a.favorite).length
		};
		for (const cat of ASSET_CATEGORIES) if (cat.id === "template") map[cat.id] = TEMPLATE_STARTERS.length;
		else if (cat.id === "history") map[cat.id] = assets.filter((a) => assetUsageStatus(a, usedIds) !== "unused").length;
		else map[cat.id] = assets.filter((a) => a.category === cat.id).length;
		return map;
	}, [assets, usedIds]);
	async function onFiles(files) {
		setBusy(true);
		setErrors([]);
		const nextErrors = [];
		let ok = 0;
		try {
			for (const file of Array.from(files)) try {
				const decoded = await decodeAssetImage(file);
				const id = uid("asset");
				await getAssetStorage().put(id, decoded.blob);
				const meta = {
					id,
					name: file.name.replace(/\.[^.]+$/, "") || "未命名素材",
					kind: kindFromCategory(uploadCategory),
					category: uploadCategory,
					mime: decoded.mime,
					width: decoded.width,
					height: decoded.height,
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
					source: "upload",
					licenseNotes: "",
					licenseOwner: brand?.name ?? "",
					favorite: false,
					lastUsedAt: null,
					useCount: 0
				};
				addAsset(meta);
				ok += 1;
			} catch (err) {
				const message = err instanceof AssetUploadError ? err.message : err instanceof Error ? `${file.name}：${err.message}` : `${file.name} 上傳失敗`;
				nextErrors.push(message);
			}
			if (ok) toast.success(`已加入 ${ok} 張（僅存此裝置）`);
			if (nextErrors.length) {
				setErrors(nextErrors);
				toast.error(nextErrors[0]);
			}
		} finally {
			setBusy(false);
		}
	}
	function place(asset) {
		if (!lastProjectId) {
			toast.error("還沒有開啟的專案。");
			return;
		}
		if (!placeAsset(lastProjectId, asset.id)) {
			toast.error("無法放到畫布");
			return;
		}
		toast.success(`已放入「${asset.name}」`);
		navigate({
			to: "/studio/$projectId",
			params: { projectId: lastProjectId }
		});
	}
	const active = assets.find((a) => a.id === activeId) ?? null;
	const showTemplates = filter === "all" || filter === "template";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "淡江禪學社 Creative Brain",
				title: "AI Creative Library",
				description: "集中活動照片、社員、淡江校園、淡水、龜龜、三色光與歷屆網宣。現在可搜尋、收藏並放入創作，後續會加入 AI 分析與跨來源素材。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandSubnav, { current: "assets" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						disabled: busy,
						onClick: () => fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), busy ? "處理中…" : "上傳圖片"]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorageNotice, { className: "mt-4" }),
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("mt-6 rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition-colors", dropOver ? "border-accent bg-surface-2 text-fg" : "border-border-strong bg-surface text-muted"),
				onDragOver: (e) => {
					e.preventDefault();
					setDropOver(true);
				},
				onDragLeave: () => setDropOver(false),
				onDrop: (e) => {
					e.preventDefault();
					setDropOver(false);
					if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "把圖片拖到這裡。JPG / PNG / WebP / GIF / SVG，單檔上限 8 MB。" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mt-3 flex max-w-xs items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs",
						children: "上傳分類"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: uploadCategory,
						onValueChange: (v) => setUploadCategory(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "h-9",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: item.id,
							children: item.label
						}, item.id)) })]
					})]
				})]
			}),
			errors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
					title: "部分檔案沒有加入",
					message: errors.join(" "),
					onRetry: () => {
						setErrors([]);
						fileRef.current?.click();
					}
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3 md:flex-row md:items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "搜尋名稱、標籤、授權、來源",
						className: "max-w-sm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: source,
						onValueChange: (v) => setSource(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "md:w-40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "來源" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "全部來源"
						}), ASSET_SOURCES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: item.id,
							children: item.label
						}, item.id))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: usageFilter,
						onValueChange: (v) => setUsageFilter(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "md:w-40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "使用狀態" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "全部狀態"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "in-use",
								children: "使用中"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "used",
								children: "曾使用"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "unused",
								children: "未使用"
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-subtle tabular-nums",
						children: [filter === "template" ? TEMPLATE_STARTERS.length : filtered.length, " 件"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						active: filter === "all",
						onClick: () => setFilter("all"),
						count: counts.all,
						children: "全部"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterChip, {
						active: filter === "favorite",
						onClick: () => setFilter("favorite"),
						count: counts.favorite,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5" }), "收藏"]
					}),
					ASSET_CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
						active: filter === item.id,
						onClick: () => setFilter(item.id),
						count: counts[item.id] ?? 0,
						children: item.label
					}, item.id))
				]
			}),
			filter === "template" || filter === "all" && showTemplates && !q ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-sm font-medium",
					children: "模板"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
					children: TEMPLATE_STARTERS.map((tpl) => {
						const preview = brand ? previewTemplate(tpl, brand, assets.find((a) => a.kind === "image")?.id) : null;
						const format = formatById(tpl.formatId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (!brand) return;
								const project = createFromTemplate({
									templateId: tpl.id,
									brandId: brand.id
								});
								navigate({
									to: "/studio/$projectId",
									params: { projectId: project.id }
								});
							},
							className: "w-full rounded-2xl bg-surface p-3 text-left shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-32 items-center justify-center overflow-hidden rounded-lg bg-bg",
									children: preview && brand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
										artboard: preview,
										brand,
										urls,
										width: Math.min(110, 110 * format.width / format.height)
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "預覽"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 truncate text-sm font-medium",
									children: tpl.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 line-clamp-2 text-xs text-muted",
									children: tpl.description
								})
							]
						}) }, tpl.id);
					})
				})]
			}) : null,
			filter === "template" ? null : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				className: "mt-8",
				icon: Images,
				title: assets.length === 0 ? "還沒有素材" : "沒有符合的素材",
				description: assets.length === 0 ? "上傳活動照片、人物或 Logo。檔案會壓縮後存在這個瀏覽器。" : "試試別的關鍵字、分類或來源。",
				action: assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => fileRef.current?.click(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "上傳圖片"]
				}) : void 0
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4",
				children: filtered.map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetCard, {
					asset,
					url: urls[asset.id],
					usage: assetUsageStatus(asset, usedIds),
					onOpen: () => setActiveId(asset.id),
					onFavorite: () => toggleFavorite(asset.id),
					onDelete: () => setPendingDelete(asset.id),
					onPlace: lastProjectId ? () => place(asset) : void 0
				}) }, asset.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetDetailSheet, {
				asset: active,
				url: active ? urls[active.id] : void 0,
				usage: active ? assetUsageStatus(active, usedIds) : "unused",
				open: Boolean(active),
				onOpenChange: (open) => {
					if (!open) setActiveId(null);
				},
				onDelete: () => {
					if (active) setPendingDelete(active.id);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: () => setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "刪除這個素材？" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "此裝置上的檔案會一併移除。已放上畫布的圖層會變成空白預覽，無法復原。" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "取消" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: async () => {
						if (!pendingDelete) return;
						await getAssetStorage().delete(pendingDelete);
						removeAsset(pendingDelete);
						if (activeId === pendingDelete) setActiveId(null);
						setPendingDelete(null);
						toast.success("已從此裝置刪除");
					},
					children: "刪除"
				})] })] })
			})
		]
	});
}
function FilterChip({ active, onClick, count, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs", active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums opacity-70",
			children: count
		})]
	});
}
function AssetsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetLibrary, {});
}
//#endregion
export { AssetsPage as component };
