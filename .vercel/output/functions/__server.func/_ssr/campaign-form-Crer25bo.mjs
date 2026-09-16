import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { n as Input } from "./asset-storage-CpaE1sxh.mjs";
import { o as Label } from "./select-DIEr3sGB.mjs";
import { p as EVENT_KINDS } from "./club-CaoIGk4S.mjs";
import { t as AUDIENCE_SEGMENTS } from "./audience-Bhnj2Vl6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign-form-Crer25bo.js
var import_jsx_runtime = require_jsx_runtime();
var TEXTAREA = "w-full min-h-20 rounded-xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring";
/**
* 活動欄位。刻意沒有負責人與審核人——這個產品假設一個人做完整套網宣。
*/
function CampaignForm({ value, onChange, onDone, doneLabel = "儲存" }) {
	function toggleAudience(id) {
		onChange({ audienceIds: value.audienceIds.includes(id) ? value.audienceIds.filter((a) => a !== id) : [...value.audienceIds, id] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-name",
						children: "活動名稱"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-name",
						value: value.name,
						onChange: (e) => onChange({ name: e.target.value }),
						placeholder: "浮游禪光",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-kind",
						children: "活動類型"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: EVENT_KINDS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							title: item.hint,
							onClick: () => onChange({ kind: item.id }),
							className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", value.kind === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg"),
							children: item.label
						}, item.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-date",
						children: "活動日期"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-date",
						type: "date",
						value: value.date,
						onChange: (e) => onChange({ date: e.target.value }),
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-time",
						children: "時間"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-time",
						value: value.time,
						onChange: (e) => onChange({ time: e.target.value }),
						placeholder: "19:00",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "c-loc",
							children: "地點"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "c-loc",
							value: value.location,
							onChange: (e) => onChange({ location: e.target.value }),
							placeholder: "淡江大學 商管大樓 B302",
							className: "mt-1.5"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "c-one",
				children: "一句活動介紹"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: "c-one",
				value: value.oneLiner,
				onChange: (e) => onChange({ oneLiner: e.target.value }),
				placeholder: "一小時的空白，讓開學後的自己喘一口氣。",
				className: "mt-1.5"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "c-intro",
				children: "完整介紹"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				id: "c-intro",
				value: value.intro,
				onChange: (e) => onChange({ intro: e.target.value }),
				placeholder: "當天會發生什麼、流程多長、需不需要準備東西。",
				className: cn(TEXTAREA, "mt-1.5")
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-theme",
						children: "活動主題"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-theme",
						value: value.theme,
						onChange: (e) => onChange({ theme: e.target.value }),
						placeholder: "在忙起來之前，先幫自己留一小時。",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-pain",
						children: "學生痛點"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-pain",
						value: value.painPoint,
						onChange: (e) => onChange({ painPoint: e.target.value }),
						placeholder: "行程被塞滿，卻沒有一段時間是自己的",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-cta",
						children: "主要 CTA"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-cta",
						value: value.cta,
						onChange: (e) => onChange({ cta: e.target.value }),
						placeholder: "來坐一下",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "c-signup",
						children: "報名連結"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "c-signup",
						value: value.signupUrl,
						onChange: (e) => onChange({ signupUrl: e.target.value }),
						placeholder: "沒有就留空，文案會寫「直接來就好」",
						className: "mt-1.5"
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "這場想打到誰"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: AUDIENCE_SEGMENTS.map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					title: seg.pain,
					onClick: () => toggleAudience(seg.id),
					className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", value.audienceIds.includes(seg.id) ? "bg-[color-mix(in_oklab,var(--color-warm)_24%,transparent)] text-fg" : "bg-surface-2 text-muted hover:text-fg"),
					children: seg.label
				}, seg.id))
			})] }),
			onDone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end pt-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: onDone,
					children: doneLabel
				})
			}) : null
		]
	});
}
//#endregion
export { CampaignForm as t };
