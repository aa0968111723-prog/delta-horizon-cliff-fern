import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, F as matchesAssetQuery, X as useStudio, p as campaignTitle, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { n as Input } from "./asset-storage-CpaE1sxh.mjs";
import { i as contentKindLabel } from "./status-BrzQjlVh.mjs";
import { O as Palette, P as Link2, R as Instagram, g as Search, h as Sparkles, z as Images } from "../_libs/lucide-react.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Route$5 } from "./router-CCaD8IgA.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { n as getConnections } from "./status-CfaffkOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-7czg1ywl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Global Creative Search：一個搜尋框，同時找素材庫、AI 生成、內容與活動，
* 之後接上 Drive / Canva / Instagram 也在同一個框裡出結果，分類顯示。
*/
function CreativeSearchPage({ initialQuery }) {
	const [q, setQ] = (0, import_react.useState)(initialQuery ?? "");
	const assets = useStudio((s) => s.assets);
	const projects = useStudio((s) => s.projects);
	const campaigns = useStudio((s) => s.campaigns);
	const urls = useAssetUrls(assets.map((a) => a.id));
	const [connections, setConnections] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		getConnections().then((list) => {
			if (alive) setConnections(list);
		});
		return () => {
			alive = false;
		};
	}, []);
	const query = q.trim();
	const assetHits = (0, import_react.useMemo)(() => query ? assets.filter((a) => matchesAssetQuery(a, query)) : assets.slice(0, 12), [assets, query]);
	const generatedHits = (0, import_react.useMemo)(() => assetHits.filter((a) => a.source === "generated"), [assetHits]);
	const libraryHits = (0, import_react.useMemo)(() => assetHits.filter((a) => a.source !== "generated"), [assetHits]);
	const contentHits = (0, import_react.useMemo)(() => {
		if (!query) return projects.slice(0, 6);
		const n = query.toLowerCase();
		return projects.filter((p) => [
			p.name,
			p.copy.caption,
			p.copy.headline,
			p.brief.eventName,
			...p.copy.hashtags
		].join(" ").toLowerCase().includes(n));
	}, [projects, query]);
	const campaignHits = (0, import_react.useMemo)(() => {
		if (!query) return campaigns.slice(0, 4);
		const n = query.toLowerCase();
		return campaigns.filter((c) => [
			c.name,
			c.oneLiner,
			c.intro,
			c.theme,
			c.location
		].join(" ").toLowerCase().includes(n));
	}, [campaigns, query]);
	const total = generatedHits.length + libraryHits.length + contentHits.length + campaignHits.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "搜尋",
				title: "找素材與過去的內容",
				description: "一個框就好。不用分別去每個 App 找。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center gap-2 rounded-2xl bg-surface px-3 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 shrink-0 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "例：以前晚上的茶會照片／有龜龜的素材／浮游禪光",
					className: "border-0 bg-transparent shadow-none focus-visible:ring-0"
				})]
			}),
			query ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted",
				children: [
					"找到 ",
					total,
					" 個相關項目"
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-wrap gap-1.5",
				children: [
					"浮游禪光",
					"茶會",
					"龜龜",
					"淡水",
					"夜晚",
					"社課"
				].map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setQ(tag),
					className: "min-h-9 rounded-full bg-surface-2 px-3 text-xs text-muted hover:text-fg",
					children: tag
				}) }, tag))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "素材庫",
				count: libraryHits.length,
				icon: Images,
				children: libraryHits.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-3 gap-2 sm:grid-cols-5",
					children: libraryHits.slice(0, 15).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assets",
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block aspect-square bg-surface-2",
								children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: urls[asset.id],
									alt: asset.name,
									className: "size-full object-cover"
								}) : null
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate px-2 py-1.5 text-xs",
								children: asset.name
							})]
						})
					}, asset.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "素材庫裡沒有符合的東西。" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "AI 生成",
				count: generatedHits.length,
				icon: Sparkles,
				children: generatedHits.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-3 gap-2 sm:grid-cols-5",
					children: generatedHits.slice(0, 10).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assets",
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block aspect-square bg-surface-2",
								children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: urls[asset.id],
									alt: asset.name,
									className: "size-full object-cover"
								}) : null
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate px-2 py-1.5 text-xs",
								children: asset.name
							})]
						})
					}, asset.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "還沒有 AI 生成的圖片。" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "做過的內容",
				count: contentHits.length,
				icon: Instagram,
				children: contentHits.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: contentHits.slice(0, 8).map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/studio/$projectId",
						params: { projectId: project.id },
						className: "block rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium",
							children: project.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block truncate text-xs text-muted",
							children: [contentKindLabel(project.contentKind), project.copy.caption ? ` · ${project.copy.caption.slice(0, 40)}` : ""]
						})]
					}) }, project.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "沒有符合的內容。" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
				title: "活動",
				count: campaignHits.length,
				icon: Palette,
				children: campaignHits.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: campaignHits.map((campaign) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/campaigns/$campaignId",
						params: { campaignId: campaign.id },
						className: "block rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-medium",
							children: campaignTitle(campaign)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-xs text-muted",
							children: campaign.oneLiner
						})]
					}) }, campaign.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { text: "沒有符合的活動。" })
			}),
			connections.filter((c) => c.state !== "connected").length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "還沒接進搜尋的來源"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-2",
						children: connections.filter((c) => c.state !== "connected").map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-wrap items-center justify-between gap-2 text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								c.name,
								"：",
								c.state === "unconfigured" ? "尚未設定憑證" : "待授權"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								size: "sm",
								variant: "ghost",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/connections",
									search: { focus: c.id },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-3.5" }), "去連接"]
								})
							})]
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-subtle",
						children: "連上之後，這一個搜尋框就會同時找 Google Drive、Canva 與 Instagram，並分類顯示。"
					})
				]
			}) : null
		]
	});
}
function Group({ title, count, icon: Icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-subtle" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("text-xs", count ? "text-muted" : "text-subtle"),
					children: count
				})
			]
		}), children]
	});
}
function Empty({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-2xl bg-surface px-4 py-5 text-center text-xs text-subtle shadow-[var(--shadow-border)]",
		children: text
	});
}
function SearchRoute() {
	const search = Route$5.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreativeSearchPage, { initialQuery: search.q });
}
//#endregion
export { SearchRoute as component };
