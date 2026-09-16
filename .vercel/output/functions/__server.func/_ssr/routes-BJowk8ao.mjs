import { i as __toESM } from "../_runtime.mjs";
import { d as formatById } from "./schema-iJpgBEjq.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, A as formatCampaignDate, K as sortByUpcoming, L as nextCampaign, X as useStudio, g as countdownLabel, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { i as contentKindLabel } from "./status-BrzQjlVh.mjs";
import { _ as eventKindLabel, c as CLUB_NAME, t as APP_TAGLINE } from "./club-CaoIGk4S.mjs";
import { t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { F as Lightbulb, Q as Copy, R as Instagram, ct as ArrowRight, h as Sparkles, l as Trash2, st as CalendarDays, u as Tent, z as Images } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as QuickStartGrid } from "./router-CCaD8IgA.mjs";
import { n as SectionHeader } from "./page-header-DBPXqJkr.mjs";
import { t as ArtboardView } from "./artboard-view-h-1TjLhY.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { t as StatusBadge } from "./status-badge-Coap4BY7.mjs";
import { r as format, t as zhTW } from "../_libs/date-fns.mjs";
import { o as semesterPhaseAt, s as tamsuiContextAt, t as HOOK_PATTERNS } from "./voice-D6qT5Et6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BJowk8ao.js
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
							contentKindLabel(project.contentKind),
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
/** 今天最該做的那一篇：從最近活動的宣傳節奏裡挑出還沒做的那一波。 */
function pickTodaysWave(campaign) {
	if (!campaign) return null;
	const pending = campaign.waves.filter((w) => !w.contentId);
	if (!pending.length) return null;
	const days = campaign.date ? Math.round((Date.parse(`${campaign.date}T00:00:00`) - Date.now()) / 864e5) : null;
	if (days == null) return pending[0];
	return pending.filter((w) => w.offsetDays >= -days - 1)[0] ?? pending[0];
}
function HomePage() {
	const navigate = useNavigate();
	const projects = useStudio((s) => s.projects);
	const campaigns = useStudio((s) => s.campaigns);
	const brands = useStudio((s) => s.brands);
	const assets = useStudio((s) => s.assets);
	const duplicateProject = useStudio((s) => s.duplicateProject);
	const createProject = useStudio((s) => s.createProject);
	const phase = semesterPhaseAt();
	const tamsui = tamsuiContextAt();
	const upcoming = (0, import_react.useMemo)(() => sortByUpcoming(campaigns).slice(0, 3), [campaigns]);
	const focus = (0, import_react.useMemo)(() => nextCampaign(campaigns), [campaigns]);
	const todaysWave = (0, import_react.useMemo)(() => pickTodaysWave(focus), [focus]);
	const recent = (0, import_react.useMemo)(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6), [projects]);
	const scheduled = (0, import_react.useMemo)(() => projects.filter((p) => p.scheduledAt).sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0)).slice(0, 4), [projects]);
	const published = (0, import_react.useMemo)(() => projects.filter((p) => p.status === "published").slice(0, 4), [projects]);
	const assetIds = (0, import_react.useMemo)(() => assets.map((a) => a.id), [assets]);
	const urls = useAssetUrls(assetIds);
	const brand = brands[0];
	function createFromWave() {
		if (!brand || !focus || !todaysWave) return;
		const project = createProject({
			name: todaysWave.title || focus.name,
			brandId: brand.id,
			formatId: "feed-portrait",
			contentKind: todaysWave.kind,
			campaignId: focus.id,
			status: "making",
			brief: {
				product: focus.name,
				eventName: focus.name,
				schedule: `${focus.date} ${focus.time}`.trim(),
				location: focus.location,
				offer: focus.oneLiner,
				audience: focus.audienceIds.join("、"),
				goal: "awareness",
				features: focus.intro,
				style: "安靜、具體、不說教",
				notes: todaysWave.note,
				deliverables: {
					post: true,
					story: false,
					carousel: todaysWave.kind === "carousel",
					reels: false
				}
			},
			sources: [{
				kind: "local",
				label: `活動 / ${focus.name}`,
				detail: todaysWave.stage
			}]
		});
		navigate({
			to: "/create",
			search: {
				contentId: project.id,
				kind: todaysWave.kind
			}
		});
	}
	const suggestion = todaysWave?.hook || focus?.painPoint || HOOK_PATTERNS[0].example;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-muted uppercase",
						children: APP_TAGLINE
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl tracking-tight text-balance md:text-4xl",
						children: "今天可以創作什麼？"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: [
							"現在是",
							phase.label,
							"。",
							phase.mood,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-subtle",
								children: [
									"淡水",
									tamsui.season,
									"：",
									tamsui.weather
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass relative overflow-hidden rounded-3xl p-5 md:p-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "three-lights absolute inset-x-0 top-0 h-1",
						"aria-hidden": true
					}), focus ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 lg:grid-cols-[1.4fr_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "rounded-full bg-surface-2 px-2.5 py-1 font-medium",
											children: [
												formatCampaignDate(focus),
												" ",
												focus.name
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-[color-mix(in_oklab,var(--color-warm)_22%,transparent)] px-2.5 py-1 font-medium",
											children: countdownLabel(focus)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted",
											children: eventKindLabel(focus.kind)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-xs tracking-[0.14em] text-muted uppercase",
									children: "AI 建議這篇"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-display text-2xl leading-snug text-balance md:text-3xl",
									children: [
										"「",
										suggestion,
										"」"
									]
								}),
								todaysWave ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm text-muted",
									children: [
										todaysWave.stage,
										"·",
										contentKindLabel(todaysWave.kind),
										todaysWave.note ? ` — ${todaysWave.note}` : ""
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted",
									children: "這場活動的宣傳節奏都已經有對應內容了。可以往下看今日靈感。"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-5 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: createFromWave,
										disabled: !todaysWave,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "AI 幫我創作"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "secondary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/campaigns/$campaignId",
											params: { campaignId: focus.id },
											children: ["看整場宣傳", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
										})
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 rounded-2xl bg-surface-2/60 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-wide text-muted",
								children: "這場活動的節奏"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-3 space-y-2",
								children: focus.waves.slice(0, 5).map((wave) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("mt-1 size-1.5 shrink-0 rounded-full", wave.contentId ? "bg-[var(--color-clear)]" : "bg-border-strong") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block truncate font-medium",
											children: [
												wave.offsetDays === 0 ? "當天" : `${wave.offsetDays < 0 ? "前" : "後"} ${Math.abs(wave.offsetDays)} 天`,
												"·",
												wave.stage
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-muted",
											children: wave.title
										})]
									})]
								}, wave.id))
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: Tent,
						title: "還沒有排定的活動",
						description: "先建立一場活動，AI 就能幫你排出完整宣傳節奏。也可以直接從一句想法開始寫一篇。",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/campaigns",
									search: { new: "1" },
									children: "建立活動"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/create",
									search: { from: "idea" },
									children: "從一句想法開始"
								})
							})]
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "快速開始",
					hint: "每一個入口都會帶著品牌記憶與學生情境"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickStartGrid, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "今日靈感",
					hint: `${phase.label}適合的角度`,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/create",
							search: { from: "idea" },
							children: "更多靈感"
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
					children: HOOK_PATTERNS.slice(0, 3).map((pattern) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/create",
						search: {
							from: "idea",
							seed: pattern.example
						},
						className: "flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-3.5" }), pattern.label]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-lg leading-snug",
								children: [
									"「",
									pattern.example,
									"」"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: pattern.why
							})
						]
					}) }, pattern.label))
				})]
			}),
			upcoming.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "近期活動",
					hint: "依接近程度排序",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/campaigns",
							children: "全部活動"
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0",
					children: upcoming.map((campaign) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "min-w-[15rem] sm:min-w-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/campaigns/$campaignId",
							params: { campaignId: campaign.id },
							className: "flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center justify-between gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: formatCampaignDate(campaign)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: countdownLabel(campaign)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-lg",
									children: campaign.name || "未命名活動"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "line-clamp-2 text-xs text-muted",
									children: campaign.oneLiner
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-auto text-xs text-subtle",
									children: [
										campaign.waves.filter((w) => w.contentId).length,
										"/",
										campaign.waves.length,
										" 篇已建立"
									]
								})
							]
						})
					}, campaign.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "已排程內容",
					hint: "到時間就發",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/calendar",
							children: "看日曆"
						})
					})
				}), scheduled.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
					children: "還沒有排程。做完一篇後在日曆上排時間。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-2 sm:grid-cols-2",
					children: scheduled.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/studio/$projectId",
						params: { projectId: project.id },
						className: "flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium",
									children: project.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-xs text-muted",
									children: [
										new Date(project.scheduledAt ?? 0).toLocaleString("zh-TW", {
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit"
										}),
										"·",
										contentKindLabel(project.contentKind)
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: project.status })
						]
					}) }, project.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "最近做的內容",
					hint: "依最後編輯排列"
				}), recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Sparkles,
					title: "還沒有內容",
					description: "從一句想法開始，AI 會幫你寫第一版。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/create",
							search: { from: "idea" },
							children: "開始創作"
						})
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
					children: recent.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectCard, {
						project,
						brand: brands.find((b) => b.id === project.brandId),
						urls,
						onDuplicate: () => duplicateProject(project.id)
					}) }, project.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "過去表現不錯的內容",
					hint: "串接 IG 後會用真實成效排序",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/instagram",
							children: "IG 中心"
						})
					})
				}), published.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-surface px-4 py-8 text-center shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Instagram, { className: "mx-auto size-5 text-subtle" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "還沒有標記為已發布的內容。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: [
								"連接 ",
								CLUB_NAME,
								" 的 Instagram 後，這裡會顯示互動最好的貼文，AI 也會用它來調整下一篇。"
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-2 sm:grid-cols-2",
					children: published.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/studio/$projectId",
						params: { projectId: project.id },
						className: "flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-medium",
								children: project.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-xs text-muted",
								children: contentKindLabel(project.contentKind)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: project.status })]
					}) }, project.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "最近素材",
					hint: "Logo、龜龜、校園與淡水",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/assets",
							children: "素材庫"
						})
					})
				}), assets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Images,
					title: "還沒有素材",
					description: "上傳活動照片與 Logo，排版時會直接取用。",
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
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "aspect-square bg-surface-2",
								children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: urls[asset.id],
									alt: asset.name,
									className: "size-full object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex size-full items-center justify-center text-xs text-muted",
									children: "載入中"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate px-2 py-1.5 text-xs",
								children: asset.name
							})]
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
