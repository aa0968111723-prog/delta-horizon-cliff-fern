import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, A as formatCampaignDate, K as sortByUpcoming, X as useStudio, g as countdownLabel, k as emptyCampaign } from "./studio-store-BqpaoTm7.mjs";
import { _ as eventKindLabel } from "./club-CaoIGk4S.mjs";
import { t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { C as Plus, u as Tent } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Route$3 } from "./router-CCaD8IgA.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as CampaignForm } from "./campaign-form-Crer25bo.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CHY4mcIV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns.index-BeU_1Y0N.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CampaignListPage({ openNew }) {
	const navigate = useNavigate();
	const campaigns = useStudio((s) => s.campaigns);
	const createCampaign = useStudio((s) => s.createCampaign);
	const fillDefaultWaves = useStudio((s) => s.fillDefaultWaves);
	const [open, setOpen] = (0, import_react.useState)(Boolean(openNew));
	const [draft, setDraft] = (0, import_react.useState)(() => emptyCampaign());
	const list = sortByUpcoming(campaigns);
	function submit() {
		if (!draft.name.trim()) return;
		const created = createCampaign(draft);
		fillDefaultWaves(created.id);
		setOpen(false);
		setDraft(emptyCampaign());
		navigate({
			to: "/campaigns/$campaignId",
			params: { campaignId: created.id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "活動",
				title: "社課與活動",
				description: "建立活動之後，AI 可以一次排出整場宣傳的節奏，每一波都能單獨重新生成。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "建立活動"]
				})
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: Tent,
					title: "還沒有活動",
					description: "社課、茶會、迎新、講座都算。建立後 AI 會依活動類型與剩下的天數安排宣傳節奏。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => setOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "建立活動"]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 grid gap-3 sm:grid-cols-2",
				children: list.map((campaign) => {
					const made = campaign.waves.filter((w) => w.contentId).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/campaigns/$campaignId",
						params: { campaignId: campaign.id },
						className: "flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center justify-between gap-2 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-surface-2 px-2.5 py-1 font-medium",
									children: [
										formatCampaignDate(campaign),
										" ",
										campaign.time
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: countdownLabel(campaign)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl",
								children: campaign.name || "未命名活動"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [eventKindLabel(campaign.kind), campaign.location ? ` · ${campaign.location}` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "line-clamp-2 text-sm text-muted",
								children: campaign.oneLiner
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-auto flex items-center gap-2 pt-2 text-xs text-subtle",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "three-lights block h-full rounded-full",
											style: { width: `${campaign.waves.length ? made / campaign.waves.length * 100 : 0}%` }
										})
									}),
									made,
									"/",
									campaign.waves.length,
									" 篇"
								]
							})
						]
					}) }, campaign.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[86dvh] overflow-y-auto sm:max-w-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "建立活動" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignForm, {
						value: draft,
						onChange: (patch) => setDraft((prev) => ({
							...prev,
							...patch
						})),
						onDone: submit,
						doneLabel: "建立並排宣傳節奏"
					})]
				})
			})
		]
	});
}
function CampaignsIndex() {
	const search = Route$3.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignListPage, { openNew: search.new === "1" });
}
//#endregion
export { CampaignsIndex as component };
