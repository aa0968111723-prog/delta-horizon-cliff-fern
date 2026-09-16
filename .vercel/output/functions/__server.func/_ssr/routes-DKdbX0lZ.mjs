import { i as __toESM } from "../_runtime.mjs";
import { d as formatById } from "./schema-DPsPUDiS.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { W as useStudio, a as Button, h as cn, m as categoryLabel } from "./button-D9W66xhT.mjs";
import { E as LayoutGrid, F as Film, H as ChevronRight, J as BrainCircuit, K as Camera, O as Images, S as MessageCircleMore, d as Sparkles, n as WandSparkles, q as CalendarDays, s as Trash2, z as Copy } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as useUi } from "./router-DqaasXOl.mjs";
import { t as ArtboardView } from "./artboard-view-DcaulcuR.mjs";
import { t as useAssetUrls } from "./use-asset-urls-CHCpEvm_.mjs";
import { t as StatusBadge } from "./status-badge-BpTf8101.mjs";
import { n as format, t as zhTW } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DKdbX0lZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var RECOMMENDED_BRIEF = {
	eventName: "09/24 浮游禪光",
	product: "浮游禪光晚間活動",
	schedule: "09/24 19:00–21:00",
	location: "淡江大學校園",
	audience: "剛開學還在適應課表、通勤、宿舍與新關係的淡江學生",
	goal: "awareness",
	features: "一個可以慢下來、整理最近心情，也能自在認識新朋友的晚上",
	style: "夜晚、柔和三色光、有校園生活感，不宗教、不說教",
	notes: "Hook 從開學後的忙亂與很久沒有好好坐下來切入；時間、地點與報名方式要一眼找到。",
	deliverables: {
		post: true,
		carousel: true,
		story: true,
		reels: true
	}
};
var QUICK_STARTS = [
	{
		label: "生成 IG 貼文",
		hint: "Hook、Caption、CTA",
		icon: MessageCircleMore,
		preset: { deliverables: {
			post: true,
			carousel: false,
			story: false,
			reels: false
		} }
	},
	{
		label: "生成 Carousel",
		hint: "六頁說完一個主題",
		icon: LayoutGrid,
		preset: { deliverables: {
			post: true,
			carousel: true,
			story: false,
			reels: false
		} }
	},
	{
		label: "生成 Story",
		hint: "3–5 張限動節奏",
		icon: Camera,
		preset: { deliverables: {
			post: false,
			carousel: false,
			story: true,
			reels: false
		} }
	},
	{
		label: "生成 Reels",
		hint: "封面與短影音企劃",
		icon: Film,
		preset: { deliverables: {
			post: false,
			carousel: false,
			story: false,
			reels: true
		} }
	}
];
function HomePage() {
	const navigate = useNavigate();
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const assets = useStudio((s) => s.assets);
	const startCreative = useUi((s) => s.startCreative);
	const recent = (0, import_react.useMemo)(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [projects]);
	const assetIds = (0, import_react.useMemo)(() => {
		const ids = [];
		for (const p of recent) {
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
		recent,
		brands,
		assets
	]);
	const urls = useAssetUrls(assetIds);
	function begin(preset) {
		startCreative({
			...preset,
			deliverables: preset.deliverables ?? {
				post: true,
				carousel: true,
				story: true,
				reels: false
			}
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-widest text-accent",
					children: "淡江大學禪學社"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 font-display text-2xl tracking-tight md:text-3xl",
					children: "禪作所"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: () => begin({}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), "開始創作"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-5 overflow-hidden rounded-2xl bg-accent text-accent-fg shadow-[var(--shadow-artboard)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid md:grid-cols-[1.2fr_0.8fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 sm:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2 text-xs text-accent-fg/75",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-accent-fg/10 px-2.5 py-1",
									children: "今天推薦創作"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "09/24・還有 8 天" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mt-5 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-4xl",
								children: [
									"最近是不是很久沒有",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"好好坐下來？"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-lg text-sm leading-6 text-accent-fg/80",
								children: "用開學後的忙亂切入「浮游禪光」，做一組不說教、有夜晚校園感的 IG Carousel。"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "mt-6 bg-accent-fg text-accent hover:bg-accent-fg/90",
								onClick: () => begin(RECOMMENDED_BRIEF),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "AI 幫我創作"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative min-h-52 overflow-hidden bg-surface-2/15 p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -right-10 -top-12 size-44 rounded-full bg-warn/40 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-10 left-4 size-40 rounded-full bg-danger/30 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mx-auto flex h-full max-w-64 items-center justify-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-40 rotate-3 rounded-2xl bg-surface p-3 text-fg shadow-[var(--shadow-artboard)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aspect-[4/5] rounded-xl bg-bg p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-medium text-accent",
												children: "09.24 / TKU"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-8 font-display text-2xl leading-tight",
												children: [
													"浮游",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"禪光"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-1 w-10 rounded-full bg-warn" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-3 text-xs leading-5 text-muted",
												children: [
													"留一個晚上",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"和自己坐在一起"
												]
											})
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "-ml-5 mt-8 w-28 -rotate-6 rounded-xl bg-surface p-2 shadow-[var(--shadow-artboard)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aspect-[9/16] rounded-lg bg-accent p-3 text-accent-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs",
											children: "今晚"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-8 font-display text-lg",
											children: [
												"先不用",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"急著想通"
											]
										})]
									})
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "QUICK START"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-xl",
						children: "我現在想創作什麼？"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assistant",
							children: ["完整創作台 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4",
					children: QUICK_STARTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => begin(item.preset),
						className: "min-h-32 rounded-2xl bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-10 items-center justify-center rounded-xl bg-surface-2 text-accent",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-4 block text-sm font-medium",
								children: item.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-xs text-muted",
								children: item.hint
							})
						]
					}, item.label))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "RECENTLY GENERATED"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl",
							children: "最近 AI 生成"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => void navigate({ to: "/studio" }),
							children: ["打開 Studio ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0",
						children: recent.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "min-w-64 sm:min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectCard, {
								project,
								brand: brands.find((b) => b.id === project.brandId),
								urls,
								compact: true
							})
						}, project.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-5 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg",
								children: "接下來的內容節奏"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
							className: "mt-4 space-y-4",
							children: [
								[
									"今天",
									"情緒共鳴",
									"先說出開學後的忙亂"
								],
								[
									"09/18",
									"活動主視覺",
									"讓時間地點一眼可見"
								],
								[
									"09/22",
									"Story 倒數",
									"用投票問最近的狀態"
								]
							].map(([date, title, note]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "grid grid-cols-[3.5rem_1fr] gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-accent",
									children: date
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-medium",
									children: title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-xs leading-5 text-muted",
									children: note
								})] })]
							}, date))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainCircuit, { className: "size-5 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg",
								children: "Creative Brain"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-muted",
							children: "目前會讀取品牌規範、最近創作與此裝置素材。Drive、Canva、Instagram 將在連接後加入來源記憶。"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "RECENT ASSETS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 font-display text-xl",
						children: "最近素材"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assets",
							children: ["AI Creative Library ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0",
					children: assets.slice(0, 6).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "min-w-32 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] sm:min-w-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assets",
							className: "block",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex aspect-square items-center justify-center bg-bg",
									children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: urls[asset.id],
										alt: asset.name,
										className: "size-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-5 text-subtle" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate px-2 pt-2 text-xs font-medium",
									children: asset.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate px-2 pb-2 text-xs text-subtle",
									children: categoryLabel(asset.category)
								})
							]
						})
					}, asset.id))
				})]
			})
		]
	});
}
var SplitComponent = HomePage;
//#endregion
export { SplitComponent as component };
