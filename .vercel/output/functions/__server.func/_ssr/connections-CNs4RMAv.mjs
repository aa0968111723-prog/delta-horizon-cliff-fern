import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { c as CLUB_NAME } from "./club-CaoIGk4S.mjs";
import { N as LoaderCircle, O as Palette, P as Link2, R as Instagram, a as Unlink, at as Check, x as RefreshCw, z as Images } from "../_libs/lucide-react.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as Route$9 } from "./router-CCaD8IgA.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { n as getConnections, t as disconnectProvider } from "./status-CfaffkOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/connections-CNs4RMAv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICON = {
	drive: Images,
	canva: Palette,
	instagram: Instagram
};
/**
* 連接中心。刻意不是工程師的 API 設定頁：沒有 token 欄位、沒有要貼的字串，
* 每個連接只有連接／重新授權／同步／中斷。
*/
function ConnectionCenter({ focus }) {
	const [list, setList] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	async function refresh() {
		try {
			setList(await getConnections());
		} catch {
			toast.error("讀取連接狀態時出錯了。");
		}
	}
	(0, import_react.useEffect)(() => {
		refresh();
	}, []);
	async function disconnect(id) {
		setBusy(id);
		try {
			await disconnectProvider({ data: { id } });
			await refresh();
			toast.success("已中斷連接");
		} finally {
			setBusy(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "連接",
				title: "素材與帳號",
				description: `把 ${CLUB_NAME} 的雲端硬碟、Canva 與 Instagram 接進來，AI 就不用每次從零開始。全部走官方授權，token 只留在伺服器端。`
			}),
			list === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "正在讀取連接狀態…"]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 space-y-3",
				children: list.map((item) => {
					const Icon = ICON[item.id];
					const highlight = focus === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]", highlight && "ring-2 ring-ring"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "flex items-center gap-2 text-sm font-medium",
												children: [item.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StateBadge, { state: item.state })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-muted",
												children: item.purpose
											}),
											item.accountLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-xs text-subtle",
												children: ["帳號：", item.accountLabel]
											}) : null
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex shrink-0 flex-wrap gap-2",
									children: item.state === "connected" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "secondary",
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: `/api/connections/${item.id}/sync`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "同步"]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: `/api/connections/${item.id}/start`,
												children: "重新授權"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											variant: "ghost",
											onClick: () => void disconnect(item.id),
											disabled: busy === item.id,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unlink, { className: "size-4" }), "中斷"]
										})
									] }) : item.state === "needs-auth" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `/api/connections/${item.id}/start`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "連接"]
										})
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										disabled: true,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4" }), "尚未開放"]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 rounded-xl bg-surface-2/60 px-3 py-2 text-xs text-muted",
								children: item.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 flex flex-wrap gap-1.5",
								children: item.reads.map((read) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "rounded-full bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted",
									children: read
								}, read))
							})
						]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-2xl bg-surface p-4 text-xs text-muted shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-fg",
					children: "關於安全"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-2 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 三個連接都用各平台的官方 OAuth，不會爬網站、不模擬登入、也不會存你的帳號密碼。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 授權後的 token 加密後只留在伺服器端，前端 JS 讀不到，也不會寫進瀏覽器儲存空間。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 隨時可以按「中斷」撤銷；重新授權會換一組新的 token。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "· 應用程式憑證由平台以環境變數注入，不會出現在這個專案的程式碼裡。" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-xs text-subtle",
				children: [
					"還沒連接也可以創作：",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/assets",
						className: "underline",
						children: "素材庫"
					}),
					"裡的圖片、",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/brand",
						className: "underline",
						children: "品牌記憶"
					}),
					"與現有內容都會被 AI 讀進去。"
				]
			})
		]
	});
}
function StateBadge({ state }) {
	if (state === "connected") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] px-2 py-0.5 text-[0.68rem] text-[var(--color-success)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), "已連接"]
	});
	if (state === "needs-auth") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-full bg-[color-mix(in_oklab,var(--color-warm)_22%,transparent)] px-2 py-0.5 text-[0.68rem]",
		children: "待授權"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-full bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted",
		children: "尚未設定"
	});
}
function ConnectionsRoute() {
	const search = Route$9.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectionCenter, { focus: search.focus });
}
//#endregion
export { ConnectionsRoute as component };
