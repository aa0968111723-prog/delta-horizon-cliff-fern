import { i as __toESM } from "../_runtime.mjs";
import { a as GOALS, d as formatById, i as FORMATS } from "./schema-DPsPUDiS.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { K as useStudio, R as previewTemplate, _ as categoryLabel, a as Button, k as emptyBrief, o as DELIVERABLE_OPTIONS, p as TEMPLATE_STARTERS, s as EmptyState, v as cn } from "./empty-state-DJ_-9JB5.mjs";
import { t as Input } from "./input-DgRZflFK.mjs";
import { E as Images, F as Copy, _ as Plus, j as FolderKanban, o as Trash2 } from "../_libs/lucide-react.mjs";
import { a as SelectItem, i as SelectContent, n as Label, o as SelectTrigger, r as Select, s as SelectValue } from "./select-DgCb9BIh.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as SectionHeader, t as PageHeader } from "./page-header-CMQAVVTL.mjs";
import { t as ArtboardView } from "./artboard-view-BQUTim4K.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-DM5Xf6Jr.mjs";
import { t as useAssetUrls } from "./use-asset-urls-DlkdIQ_Y.mjs";
import { t as StatusBadge } from "./status-badge-B6l8gB6s.mjs";
import { n as format, t as zhTW } from "../_libs/date-fns.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-BxZxuEEi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B248qEc9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NewProjectDialog({ open, onOpenChange }) {
	const brands = useStudio((s) => s.brands);
	const createProject = useStudio((s) => s.createProject);
	const navigate = useNavigate();
	const [name, setName] = (0, import_react.useState)("");
	const [brandId, setBrandId] = (0, import_react.useState)(brands[0]?.id ?? "");
	const [formatId, setFormatId] = (0, import_react.useState)("feed-portrait");
	const [brief, setBrief] = (0, import_react.useState)(emptyBrief());
	const [error, setError] = (0, import_react.useState)(null);
	function submit(e) {
		e.preventDefault();
		if (!name.trim()) {
			setError("請輸入專案名稱。");
			return;
		}
		if (!brief.eventName.trim() || !brief.audience.trim()) {
			setError("請填寫活動名稱與受眾，之後企劃代理才有依據。");
			return;
		}
		if (!brandId) {
			setError("請先建立品牌。");
			return;
		}
		const project = createProject({
			name: name.trim(),
			brandId,
			formatId,
			brief: {
				...brief,
				product: brief.product || brief.eventName
			}
		});
		onOpenChange(false);
		setName("");
		setBrief(emptyBrief());
		setError(null);
		navigate({
			to: "/studio/$projectId",
			params: { projectId: project.id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90dvh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "新建網宣專案" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "先寫清楚活動與受眾，再進工作區編輯畫面與文案。" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-3",
				onSubmit: submit,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "proj-name",
							children: "專案名稱"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "proj-name",
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "例如：九月單品上市"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "品牌" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: brandId,
								onValueChange: setBrandId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "選擇品牌" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: brands.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: b.id,
									children: b.name
								}, b.id)) })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "主尺寸" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
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
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "event",
							children: "活動名稱"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "event",
							value: brief.eventName,
							onChange: (e) => setBrief({
								...brief,
								eventName: e.target.value,
								product: brief.product || e.target.value
							}),
							placeholder: "賣什麼、什麼檔期"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "schedule",
								children: "時間"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "schedule",
								value: brief.schedule,
								onChange: (e) => setBrief({
									...brief,
									schedule: e.target.value
								}),
								placeholder: "9/12–9/30"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "location",
								children: "地點"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "location",
								value: brief.location,
								onChange: (e) => setBrief({
									...brief,
									location: e.target.value
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "audience",
							children: "受眾"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "audience",
							value: brief.audience,
							onChange: (e) => setBrief({
								...brief,
								audience: e.target.value
							}),
							placeholder: "誰會停下來看這則"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "目標" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: brief.goal,
							onValueChange: (v) => setBrief({
								...brief,
								goal: v
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: GOALS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: g.id,
								children: g.label
							}, g.id)) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "需要產出" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: DELIVERABLE_OPTIONS.map((opt) => {
								const on = brief.deliverables[opt.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setBrief({
										...brief,
										deliverables: {
											...brief.deliverables,
											[opt.id]: !brief.deliverables[opt.id]
										}
									}),
									className: cn("min-h-11 rounded-lg px-3 text-left text-sm shadow-[var(--shadow-border)]", on ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2"),
									children: opt.label
								}, opt.id);
							})
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => onOpenChange(false),
							children: "取消"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "進入工作區"
						})]
					})
				]
			})]
		})
	});
}
function ProjectCard({ project, brand, urls, onDuplicate, onDelete, footer, compact }) {
	const board = project.artboards[project.activeFormatId];
	const format$1 = formatById(project.activeFormatId);
	const previewW = compact ? 112 : Math.min(180, 180 * format$1.width / format$1.height);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "group rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/studio/$projectId",
				params: { projectId: project.id },
				className: cn("block overflow-hidden rounded-lg bg-bg", compact ? "h-40" : "h-52"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-full items-center justify-center p-3",
					children: board && brand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
						artboard: board,
						brand,
						urls,
						width: previewW
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted",
						children: "尚無畫布"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2 px-1 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/studio/$projectId",
						params: { projectId: project.id },
						className: "block truncate font-medium",
						children: project.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 text-xs text-muted",
						children: [
							brand?.name ?? "未指定品牌",
							" · ",
							format$1.short,
							" ·",
							" ",
							format(project.updatedAt, "M/d HH:mm", { locale: zhTW })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: project.status })]
			}),
			footer ?? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex justify-end",
				children: [onDuplicate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": "複製專案",
					onClick: onDuplicate,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
				}) : null, onDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon-sm",
					"aria-label": "刪除專案",
					onClick: onDelete,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				}) : null]
			})
		]
	});
}
function HomePage() {
	const navigate = useNavigate();
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const assets = useStudio((s) => s.assets);
	const duplicateProject = useStudio((s) => s.duplicateProject);
	const deleteProject = useStudio((s) => s.deleteProject);
	const createFromTemplate = useStudio((s) => s.createFromTemplate);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	const filtered = (0, import_react.useMemo)(() => {
		const n = q.trim().toLowerCase();
		return [...n ? projects.filter((p) => p.name.toLowerCase().includes(n) || (brands.find((b) => b.id === p.brandId)?.name ?? "").toLowerCase().includes(n)) : projects].sort((a, b) => b.updatedAt - a.updatedAt);
	}, [
		projects,
		brands,
		q
	]);
	const drafts = filtered.filter((p) => p.status === "draft");
	const recent = filtered.slice(0, 8);
	const brand = brands[0];
	const assetIds = (0, import_react.useMemo)(() => {
		const ids = [];
		for (const p of filtered) {
			const board = p.artboards[p.activeFormatId];
			if (!board) continue;
			for (const l of board.layers) {
				if (l.type === "image") ids.push(l.assetId);
				if (l.type === "logo" && l.assetId) ids.push(l.assetId);
			}
		}
		for (const b of brands) if (b.logoAssetId) ids.push(b.logoAssetId);
		for (const a of assets) ids.push(a.id);
		return ids;
	}, [
		filtered,
		brands,
		assets
	]);
	const urls = useAssetUrls(assetIds);
	function startTemplate(id) {
		if (!brand) return;
		const project = createFromTemplate({
			templateId: id,
			brandId: brand.id
		});
		navigate({
			to: "/studio/$projectId",
			params: { projectId: project.id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "Instagram 網宣工作台",
				title: "構幀",
				description: "最近作品、草稿、模板與品牌資產都在這裡。手機用底部導覽，電腦可開左右面板編輯。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "新建專案"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "搜尋作品或品牌",
					className: "max-w-sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-subtle tabular-nums",
					children: [filtered.length, " 件"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "最近作品",
					hint: "依最後編輯排列"
				}), recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: FolderKanban,
					title: "還沒有作品",
					description: "從模板開始，或新建一則網宣。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => setOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "新建專案"]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
					children: recent.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectCard, {
						project,
						brand: brands.find((b) => b.id === project.brandId),
						urls,
						onDuplicate: () => duplicateProject(project.id),
						onDelete: () => setPendingDelete(project.id)
					}) }, project.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "草稿",
					hint: "尚未完成企劃或輸出"
				}), drafts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
					children: "沒有草稿。完成企劃後會標成可輸出。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3",
					children: drafts.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "min-w-[16rem] sm:min-w-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectCard, {
							project,
							brand: brands.find((b) => b.id === project.brandId),
							urls,
							compact: true,
							onDuplicate: () => duplicateProject(project.id),
							onDelete: () => setPendingDelete(project.id)
						})
					}, project.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "模板",
					hint: "套用品牌色與字體，立刻進編輯器"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
					children: TEMPLATE_STARTERS.map((tpl) => {
						const preview = brand ? previewTemplate(tpl, brand, assets.find((a) => a.kind === "image")?.id) : null;
						const format = formatById(tpl.formatId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => startTemplate(tpl.id),
							className: "w-full rounded-2xl bg-surface p-3 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-36 items-center justify-center overflow-hidden rounded-lg bg-bg",
									children: preview && brand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
										artboard: preview,
										brand,
										urls,
										width: Math.min(120, 120 * format.width / format.height)
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "品牌資產",
					hint: "Logo、商品圖與場景",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/assets",
							children: "全部素材"
						})
					})
				}), assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Images,
					title: "還沒有素材",
					description: "上傳 Logo 與商品圖，之後排版會直接取用。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/assets",
							children: "前往素材庫"
						})
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6",
					children: assets.slice(0, 12).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assets",
							className: "block",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "aspect-square bg-bg",
									children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: urls[asset.id],
										alt: asset.name,
										className: "size-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex size-full items-center justify-center text-xs text-muted",
										children: "載入中"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate px-2 py-1.5 text-xs",
									children: asset.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate px-2 pb-1.5 text-xs text-subtle",
									children: categoryLabel(asset.category)
								})
							]
						})
					}, asset.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewProjectDialog, {
				open,
				onOpenChange: setOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: Boolean(pendingDelete),
				onOpenChange: () => setPendingDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "刪除這個專案？" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "此動作無法復原。素材庫與品牌規範會保留。" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "取消" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => {
						if (pendingDelete) deleteProject(pendingDelete);
						setPendingDelete(null);
					},
					children: "刪除"
				})] })] })
			})
		]
	});
}
var SplitComponent = HomePage;
//#endregion
export { SplitComponent as component };
