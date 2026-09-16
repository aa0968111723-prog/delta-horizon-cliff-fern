import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, Q as waveDateMs, X as useStudio, f as campaignDateMs, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { i as contentKindLabel } from "./status-BrzQjlVh.mjs";
import { h as Sparkles, nt as ChevronRight, rt as ChevronLeft, st as CalendarDays, u as Tent } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as StatusBadge } from "./status-badge-Coap4BY7.mjs";
import { a as startOfMonth, c as startOfDay, d as addDays, i as endOfWeek, l as startOfWeek, n as isSameMonth, o as endOfMonth, r as format, s as isSameDay, t as zhTW, u as addMonths } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-DsTSmHcx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CalendarPage() {
	useNavigate();
	const projects = useStudio((s) => s.projects);
	const campaigns = useStudio((s) => s.campaigns);
	const setSchedule = useStudio((s) => s.setSchedule);
	const [cursor, setCursor] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	const [view, setView] = (0, import_react.useState)("month");
	const [dragId, setDragId] = (0, import_react.useState)(null);
	const items = (0, import_react.useMemo)(() => {
		const rows = [];
		for (const project of projects) {
			const at = project.scheduledAt ?? project.publishedAt;
			if (at) rows.push({
				type: "content",
				project,
				at
			});
		}
		for (const campaign of campaigns) {
			const eventAt = campaignDateMs(campaign);
			if (eventAt) rows.push({
				type: "event",
				campaign,
				at: eventAt
			});
			for (const wave of campaign.waves) {
				if (wave.contentId) continue;
				const at = waveDateMs(campaign, wave);
				if (at) rows.push({
					type: "wave",
					campaign,
					waveId: wave.id,
					title: wave.title,
					stage: wave.stage,
					at
				});
			}
		}
		return rows.sort((a, b) => a.at - b.at);
	}, [projects, campaigns]);
	const days = (0, import_react.useMemo)(() => {
		if (view === "week") {
			const start = startOfWeek(cursor, { weekStartsOn: 1 });
			return Array.from({ length: 7 }, (_, i) => addDays(start, i));
		}
		const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
		const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
		const out = [];
		for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
		return out;
	}, [cursor, view]);
	const agenda = (0, import_react.useMemo)(() => {
		const from = startOfDay(/* @__PURE__ */ new Date()).getTime();
		return items.filter((item) => item.at >= from).slice(0, 30);
	}, [items]);
	function itemsOn(day) {
		return items.filter((item) => isSameDay(item.at, day));
	}
	function dropOn(day) {
		if (!dragId) return;
		const project = projects.find((p) => p.id === dragId);
		if (!project) return;
		const prev = project.scheduledAt ? new Date(project.scheduledAt) : null;
		const next = new Date(day);
		next.setHours(prev?.getHours() ?? 19, prev?.getMinutes() ?? 0, 0, 0);
		setSchedule(project.id, next.getTime());
		setDragId(null);
		toast.success(`已改到 ${format(next, "M/d HH:mm")}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "排程",
				title: "內容日曆",
				description: "只服務創作與發布：什麼時候發、發什麼型態。沒有負責人，也沒有審核流程。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-border)]",
					children: [
						{
							id: "month",
							label: "月"
						},
						{
							id: "week",
							label: "週"
						},
						{
							id: "agenda",
							label: "清單"
						}
					].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setView(tab.id),
						className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", view === tab.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"),
						children: tab.label
					}, tab.id))
				})
			}),
			view !== "agenda" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": "上一個",
							onClick: () => setCursor(view === "week" ? addDays(cursor, -7) : addMonths(cursor, -1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-28 text-center text-sm font-medium",
							children: format(cursor, view === "week" ? "M月 d日 那週" : "yyyy年 M月", { locale: zhTW })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": "下一個",
							onClick: () => setCursor(view === "week" ? addDays(cursor, 7) : addMonths(cursor, 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => setCursor(/* @__PURE__ */ new Date()),
					children: "今天"
				})]
			}) : null,
			view === "agenda" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgendaList, { items: agenda }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted",
					children: [
						"一",
						"二",
						"三",
						"四",
						"五",
						"六",
						"日"
					].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: d }, d))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 grid grid-cols-7 gap-1",
					children: days.map((day) => {
						const dayItems = itemsOn(day);
						const dim = view === "month" && !isSameMonth(day, cursor);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onDragOver: (e) => {
								if (dragId) e.preventDefault();
							},
							onDrop: () => dropOn(day),
							className: cn("min-h-24 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)] transition-shadow sm:min-h-28", dim && "opacity-45", isSameDay(day, /* @__PURE__ */ new Date()) && "ring-2 ring-ring", dragId && "hover:shadow-[var(--shadow-lift)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-0.5 text-xs tabular-nums text-muted",
								children: format(day, "d")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-1 space-y-1",
								children: [dayItems.slice(0, 3).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarChip, {
									item,
									onDragStart: setDragId
								}) }, keyOf(item))), dayItems.length > 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "px-1 text-[0.65rem] text-subtle",
									children: ["+", dayItems.length - 3]
								}) : null]
							})]
						}, day.toISOString());
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-subtle",
					children: "已排程的內容可以直接拖到別的日期。灰色的是 AI 排好但還沒建立的那幾篇。"
				})
			] }),
			items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-2xl bg-surface p-8 text-center shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "mx-auto size-5 text-subtle" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "日曆上還沒有東西。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/campaigns",
								search: { new: "1" },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tent, { className: "size-4" }), "建立活動"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/create",
								search: { from: "idea" },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "寫一篇"]
							})
						})]
					})
				]
			}) : null
		]
	});
}
function keyOf(item) {
	if (item.type === "content") return `c_${item.project.id}`;
	if (item.type === "wave") return `w_${item.waveId}`;
	return `e_${item.campaign.id}`;
}
function CalendarChip({ item, onDragStart }) {
	if (item.type === "event") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/campaigns/$campaignId",
		params: { campaignId: item.campaign.id },
		className: "block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-warm)_28%,transparent)] px-1.5 py-1 text-[0.65rem] font-medium",
		children: item.campaign.name || "活動"
	});
	if (item.type === "wave") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/campaigns/$campaignId",
		params: { campaignId: item.campaign.id },
		className: "block truncate rounded-lg bg-surface-2 px-1.5 py-1 text-[0.65rem] text-muted",
		title: `${item.stage}·${item.title}（還沒建立）`,
		children: item.title || item.stage
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/studio/$projectId",
		params: { projectId: item.project.id },
		draggable: true,
		onDragStart: () => onDragStart(item.project.id),
		onDragEnd: () => onDragStart(null),
		className: "block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)] px-1.5 py-1 text-[0.65rem] font-medium",
		title: item.project.name,
		children: item.project.name
	});
}
function AgendaList({ items }) {
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-6 space-y-2",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
			children: item.type === "content" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/studio/$projectId",
				params: { projectId: item.project.id },
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "w-14 shrink-0 text-xs tabular-nums text-muted",
						children: [format(item.at, "M/d"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-subtle",
							children: format(item.at, "HH:mm")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium",
							children: item.project.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-xs text-muted",
							children: contentKindLabel(item.project.contentKind)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: item.project.status })
				]
			}) : item.type === "event" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/campaigns/$campaignId",
				params: { campaignId: item.campaign.id },
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-14 shrink-0 text-xs tabular-nums text-muted",
					children: format(item.at, "M/d")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm font-medium",
						children: item.campaign.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-xs text-muted",
						children: "活動當天"
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/campaigns/$campaignId",
				params: { campaignId: item.campaign.id },
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-14 shrink-0 text-xs tabular-nums text-subtle",
					children: format(item.at, "M/d")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block truncate text-xs text-subtle",
						children: [item.stage, "·還沒建立"]
					})]
				})]
			})
		}, keyOf(item)))
	});
}
var SplitComponent = CalendarPage;
//#endregion
export { SplitComponent as component };
