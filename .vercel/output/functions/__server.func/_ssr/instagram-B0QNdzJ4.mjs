import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, X as useStudio, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { i as contentKindLabel } from "./status-BrzQjlVh.mjs";
import { a as CLUB_HANDLE, c as CLUB_NAME, s as CLUB_INTRO_SHORT } from "./club-CaoIGk4S.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { G as Grid3x3, N as LoaderCircle, P as Link2, R as Instagram, h as Sparkles } from "../_libs/lucide-react.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as SectionHeader, t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as ArtboardView } from "./artboard-view-h-1TjLhY.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { n as getConnections } from "./status-CfaffkOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/instagram-B0QNdzJ4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function buildIgDna(projects, brand) {
	const lengths = projects.map((p) => p.copy.caption.trim()).filter(Boolean).map((c) => c.length);
	const hashtags = /* @__PURE__ */ new Map();
	const ctas = /* @__PURE__ */ new Map();
	const kinds = /* @__PURE__ */ new Map();
	const hooks = [];
	for (const project of projects) {
		for (const tag of project.copy.hashtags) {
			const key = tag.startsWith("#") ? tag : `#${tag}`;
			hashtags.set(key, (hashtags.get(key) ?? 0) + 1);
		}
		const cta = project.copy.cta.trim();
		if (cta) ctas.set(cta, (ctas.get(cta) ?? 0) + 1);
		kinds.set(project.contentKind, (kinds.get(project.contentKind) ?? 0) + 1);
		const firstLine = project.copy.caption.split("\n").find((line) => line.trim());
		if (firstLine) hooks.push(firstLine.trim());
	}
	for (const draft of projects.flatMap((p) => p.copyDrafts)) {
		if (draft.hook) hooks.push(draft.hook);
		if (draft.cta) ctas.set(draft.cta, (ctas.get(draft.cta) ?? 0) + 1);
	}
	return {
		captionLength: {
			min: lengths.length ? Math.min(...lengths) : 0,
			max: lengths.length ? Math.max(...lengths) : 0,
			avg: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0
		},
		topHashtags: rank(hashtags).slice(0, 8),
		topCtas: rank(ctas).slice(0, 5).map((row) => ({
			cta: row.tag,
			count: row.count
		})),
		kinds: rank(kinds).slice(0, 6).map((row) => ({
			kind: row.tag,
			count: row.count
		})),
		colors: (brand?.colors ?? []).map((c) => c.hex),
		hookStarts: [...new Set(hooks)].slice(0, 6),
		sampleCount: projects.length
	};
}
function rank(map) {
	return [...map.entries()].map(([tag, count]) => ({
		tag,
		count
	})).sort((a, b) => b.count - a.count);
}
/**
* Instagram Center。IG 是這個產品的主要輸出平台，不是外掛功能。
*
* 現在可以做的：把自己做好的內容用 IG Grid 的方式預覽、從內容抽出 IG DNA。
* 需要連接才有的：過去貼文、真實成效。那些區塊會誠實說還沒連。
*/
function InstagramCenter() {
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const assets = useStudio((s) => s.assets);
	const urls = useAssetUrls(assets.map((a) => a.id));
	const [tab, setTab] = (0, import_react.useState)("grid");
	const [connection, setConnection] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let alive = true;
		getConnections().then((list) => {
			if (!alive) return;
			setConnection(list.find((item) => item.id === "instagram") ?? null);
		}).finally(() => {
			if (alive) setLoading(false);
		});
		return () => {
			alive = false;
		};
	}, []);
	const brand = brands[0];
	const feed = (0, import_react.useMemo)(() => [...projects].filter((p) => p.status !== "idea").sort((a, b) => (b.publishedAt ?? b.scheduledAt ?? b.updatedAt) - (a.publishedAt ?? a.scheduledAt ?? a.updatedAt)), [projects]);
	const dna = (0, import_react.useMemo)(() => buildIgDna(projects, brand), [projects, brand]);
	const connected = connection?.state === "connected";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "Instagram",
				title: "IG 中心",
				description: `${CLUB_NAME} ${CLUB_HANDLE}。這裡看版面長相、過去內容與帳號自己的語氣習慣。`,
				actions: connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "success",
					children: "已連接"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/connections",
						search: { focus: "instagram" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "連接 Instagram"]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "three-lights flex size-16 shrink-0 items-center justify-center rounded-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Instagram, { className: "size-6 text-accent-fg" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: CLUB_HANDLE
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted",
							children: CLUB_INTRO_SHORT
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: [
								feed.length,
								" 則內容 · ",
								projects.filter((p) => p.status === "published").length,
								" 則已發布"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap gap-1.5",
				children: [
					{
						id: "grid",
						label: "版面預覽"
					},
					{
						id: "history",
						label: "過去 IG"
					},
					{
						id: "dna",
						label: "IG DNA"
					},
					{
						id: "insights",
						label: "成效"
					}
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(item.id),
					className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", tab === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg"),
					children: item.label
				}, item.id))
			}),
			tab === "grid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "版面預覽",
					hint: "像 IG 一樣看整體是不是一致"
				}), feed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyBlock, {
					text: "還沒有可以放上版面的內容。做完一篇之後就會出現在這裡。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/create",
							search: { from: "idea" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "寫一篇"]
						})
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-3 gap-1",
					children: feed.map((project) => {
						const board = project.artboards[project.activeFormatId];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "relative aspect-square overflow-hidden bg-surface-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/studio/$projectId",
								params: { projectId: project.id },
								className: "flex size-full items-center justify-center",
								children: board && brand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtboardView, {
									artboard: board,
									brand,
									urls,
									width: 140
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: project.name
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pointer-events-none absolute inset-x-0 bottom-0 truncate bg-fg/55 px-1.5 py-1 text-[0.6rem] text-accent-fg",
								children: contentKindLabel(project.contentKind)
							})]
						}, project.id);
					})
				})]
			}) : null,
			tab === "history" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "過去 IG",
					hint: "連接後會用真正的 Grid 顯示，點進去可以看 Caption、日期與成效"
				}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "正在確認連接狀態…"]
				}) : connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyBlock, { text: "已連接，但還沒同步過。到連接頁按一次「同步」就會把過去貼文帶進來。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyBlock, {
					text: `還沒連接 Instagram，所以這裡沒有真實貼文。連接之後 AI 才能讀 ${CLUB_NAME} 過去的 Caption、輪播、Reels 與互動，並用它調整下一篇。`,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/connections",
							search: { focus: "instagram" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "連接 Instagram"]
						})
					})
				})]
			}) : null,
			tab === "dna" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
						title: "IG DNA",
						hint: `從 ${dna.sampleCount} 則自己的內容抽出來的習慣。生成新內容時會優先參考這些。`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "Caption 長度",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										"平均 ",
										dna.captionLength.avg,
										" 字（",
										dna.captionLength.min,
										"–",
										dna.captionLength.max,
										"）"
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "常用配色",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "flex flex-wrap gap-1.5",
									children: dna.colors.map((hex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-1.5 text-xs text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-4 rounded-full shadow-[var(--shadow-border)]",
											style: { backgroundColor: hex }
										}), hex]
									}, hex))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "常用 Hashtag",
								children: dna.topHashtags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "flex flex-wrap gap-1.5 text-xs",
									children: dna.topHashtags.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "rounded-full bg-surface-2 px-2 py-0.5 text-muted",
										children: [
											row.tag,
											" · ",
											row.count
										]
									}, row.tag))
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-subtle",
									children: "還沒有資料。"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "常用 CTA",
								children: dna.topCtas.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1 text-xs text-muted",
									children: dna.topCtas.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										row.cta,
										" · ",
										row.count,
										" 次"
									] }, row.cta))
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-subtle",
									children: "還沒有資料。"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "內容型態分布",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1 text-xs text-muted",
									children: dna.kinds.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										contentKindLabel(row.kind),
										" · ",
										row.count
									] }, row.kind))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								title: "開場習慣",
								children: dna.hookStarts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1 text-xs text-muted",
									children: dna.hookStarts.map((hook) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "line-clamp-1",
										children: [
											"「",
											hook,
											"」"
										]
									}, hook))
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-subtle",
									children: "還沒有資料。"
								})
							})
						]
					}),
					!connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "連接 Instagram 後，這裡會再加上真實貼文的視覺風格、圖片類型與學生互動偏好。"
					}) : null
				]
			}) : null,
			tab === "insights" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
						title: "成效",
						hint: "不只看數字，是回答「哪一種 Hook 有效」"
					}),
					connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyBlock, { text: "已連接，同步之後這裡會分析觸及、互動、收藏與分享，並整理成下一次生成的依據。" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyBlock, {
						text: "還沒連接 Instagram，所以沒有真實成效可以分析。這裡不會放假數據。",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/connections",
								search: { focus: "instagram" },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "連接 Instagram"]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-1 text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 哪種 Hook 讓學生停下來？" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 哪種圖片停留比較久？" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 輪播哪種結構看到最後一頁？" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 限動哪種互動比較多？" })
						]
					})
				]
			}) : null
		]
	});
}
function Card({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children
		})]
	});
}
function EmptyBlock({ text, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface p-6 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, { className: "mx-auto size-5 text-subtle" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted",
				children: text
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex justify-center",
				children: action
			}) : null
		]
	});
}
var SplitComponent = InstagramCenter;
//#endregion
export { SplitComponent as component };
