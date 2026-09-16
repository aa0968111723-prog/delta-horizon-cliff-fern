import { i as __toESM } from "../_runtime.mjs";
import { c as string, n as array, o as number, r as boolean, s as object } from "../_libs/zod.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, A as formatCampaignDate, D as defaultWavePlan, E as daysUntil, X as useStudio, Z as waveDateLabel, g as countdownLabel, p as campaignTitle, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { i as contentKindLabel, t as CONTENT_KIND_META } from "./status-BrzQjlVh.mjs";
import { _ as eventKindLabel } from "./club-CaoIGk4S.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { N as LoaderCircle, T as Pencil, ct as ArrowRight, h as Sparkles, l as Trash2, n as WandSparkles, st as CalendarDays } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as createSsrRpc, r as Route$2 } from "./router-CCaD8IgA.mjs";
import { n as SectionHeader, t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { a as AlertDialogDescription, c as AlertDialogTitle, i as AlertDialogContent, n as AlertDialogAction, o as AlertDialogFooter, r as AlertDialogCancel, s as AlertDialogHeader, t as AlertDialog } from "./alert-dialog-D0iW1Okp.mjs";
import { t as StatusBadge } from "./status-badge-Coap4BY7.mjs";
import { t as CampaignForm } from "./campaign-form-Crer25bo.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CHY4mcIV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns._campaignId-CMjPw5-8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CampaignBriefSchema = object({
	name: string().max(120).catch(""),
	kind: string().max(40).catch("class"),
	date: string().max(20).catch(""),
	time: string().max(40).catch(""),
	location: string().max(120).catch(""),
	oneLiner: string().max(300).catch(""),
	intro: string().max(1500).catch(""),
	theme: string().max(200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	signupUrl: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	/** 宣傳期還有幾天，AI 用來決定波次密度 */
	daysUntil: number().int().min(-90).max(400).catch(14),
	/** 跨來源搜到的素材摘要，讓 AI 知道有什麼可用 */
	availableAssets: array(string().max(120)).max(20).catch([]),
	forceLocal: boolean().optional()
});
function unwrap(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
/**
* 「AI 生成完整宣傳」：宣傳主軸 + 3 個創意方向 + 發布節奏。
* 節奏由 AI 依活動類型、宣傳期長度自己決定，不是寫死的 14/10/7/5/3/2/1。
*/
var generateCampaignStrategy = createServerFn({ method: "POST" }).validator((input) => unwrap(input, CampaignBriefSchema)).handler(createSsrRpc("7fa32adcefe04ce494c9666a6c08adc0c5b2886a1c27e0f9c37853ec29bfcb11"));
var IdeaSchema = object({
	audienceIds: array(string().max(40)).max(8).catch([]),
	recentTopics: array(string().max(120)).max(12).catch([]),
	upcoming: string().max(300).catch(""),
	forceLocal: boolean().optional()
});
createServerFn({ method: "POST" }).validator((input) => unwrap(input, IdeaSchema)).handler(createSsrRpc("2e49305bc0c291ee368d144a30d188482352f2cde0ff93e37a0a1acd7a9473e9"));
function CampaignDetailPage({ campaignId }) {
	const navigate = useNavigate();
	const campaign = useStudio((s) => s.campaigns.find((c) => c.id === campaignId));
	const projects = useStudio((s) => s.projects);
	const brands = useStudio((s) => s.brands);
	const updateCampaign = useStudio((s) => s.updateCampaign);
	const deleteCampaign = useStudio((s) => s.deleteCampaign);
	const createProject = useStudio((s) => s.createProject);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(false);
	if (!campaign) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto w-full max-w-lg px-4 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: CalendarDays,
			title: "找不到這場活動",
			description: "它可能已經被刪除了。",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/campaigns",
					children: "回活動列表"
				})
			})
		})
	});
	const brand = brands[0];
	const made = campaign.waves.filter((w) => w.contentId).length;
	async function runStrategy() {
		setBusy(true);
		try {
			const res = await generateCampaignStrategy({ data: {
				name: campaign.name,
				kind: campaign.kind,
				date: campaign.date,
				time: campaign.time,
				location: campaign.location,
				oneLiner: campaign.oneLiner,
				intro: campaign.intro,
				theme: campaign.theme,
				painPoint: campaign.painPoint,
				cta: campaign.cta,
				signupUrl: campaign.signupUrl,
				audienceIds: campaign.audienceIds,
				daysUntil: daysUntil(campaign) ?? 14,
				availableAssets: []
			} });
			if (!res.ok) {
				updateCampaign(campaign.id, {
					waves: mergeWaves(campaign.waves, defaultWavePlan(campaign)),
					planSource: "mock"
				});
				toast.warning(`${res.error}已放上本機節奏草稿。`);
				return;
			}
			updateCampaign(campaign.id, {
				axis: res.axis,
				directions: res.directions,
				waves: mergeWaves(campaign.waves, res.waves),
				planSource: "live"
			});
			toast.success("已生成完整宣傳");
		} catch {
			toast.error("生成宣傳時出錯了，再試一次。");
		} finally {
			setBusy(false);
		}
	}
	function createContentForWave(wave) {
		if (!brand || !campaign) return;
		const meta = CONTENT_KIND_META[wave.kind];
		const project = createProject({
			name: wave.title || `${campaign.name} · ${wave.stage}`,
			brandId: brand.id,
			formatId: meta.formatId,
			contentKind: wave.kind,
			campaignId: campaign.id,
			status: "making",
			brief: {
				product: campaign.name,
				eventName: campaign.name,
				schedule: `${campaign.date} ${campaign.time}`.trim(),
				location: campaign.location,
				offer: campaign.oneLiner,
				audience: campaign.audienceIds.join("、"),
				goal: "awareness",
				features: campaign.intro,
				style: "安靜、具體、不說教",
				notes: wave.note,
				deliverables: {
					post: wave.kind === "ig-post",
					story: wave.kind === "story" || wave.kind === "countdown",
					carousel: wave.kind === "carousel",
					reels: wave.kind === "reels"
				}
			},
			sources: [{
				kind: "local",
				label: `活動 / ${campaign.name}`,
				detail: `${wave.stage}·${wave.title}`
			}]
		});
		updateCampaign(campaign.id, { waves: campaign.waves.map((w) => w.id === wave.id ? {
			...w,
			contentId: project.id
		} : w) });
		navigate({
			to: "/create",
			search: {
				contentId: project.id,
				kind: wave.kind,
				campaignId: campaign.id,
				seed: wave.hook
			}
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: `${eventKindLabel(campaign.kind)} · ${countdownLabel(campaign)}`,
				title: campaignTitle(campaign),
				description: campaign.oneLiner || campaign.theme,
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: runStrategy,
							disabled: busy,
							children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "AI 生成完整宣傳"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							onClick: () => setEditing(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), "活動資訊"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": "刪除活動",
							onClick: () => setPendingDelete(true),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 grid gap-2 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)] sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "日期",
						value: `${formatCampaignDate(campaign)} ${campaign.time}`.trim()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "地點",
						value: campaign.location || "未定"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "主要行動",
						value: campaign.cta
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "報名",
						value: campaign.signupUrl || "直接到現場"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "學生痛點",
						value: campaign.painPoint || "還沒填"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "想打到誰",
						value: campaign.audienceIds.length ? `${campaign.audienceIds.length} 個族群` : "還沒選"
					})
				]
			}),
			campaign.axis ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "宣傳主軸"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: campaign.planSource === "live" ? "accent" : "default",
						children: campaign.planSource === "live" ? "AI 生成" : "本機草稿"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: campaign.axis
				})]
			}) : null,
			campaign.directions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "創意方向",
					hint: "選一個往下做，其他留著換角度"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-3 sm:grid-cols-3",
					children: campaign.directions.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-lg",
								children: dir.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: dir.concept
							}),
							dir.visual ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-subtle",
								children: ["視覺：", dir.visual]
							}) : null,
							dir.sampleHook ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-auto rounded-xl bg-surface-2/60 p-2 text-xs",
								children: [
									"「",
									dir.sampleHook,
									"」"
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => void navigate({
									to: "/create",
									search: {
										campaignId: campaign.id,
										seed: dir.sampleHook || dir.concept
									}
								}),
								children: "用這個方向創作"
							})
						]
					}, dir.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "宣傳節奏",
					hint: `${made}/${campaign.waves.length} 篇已建立，刻意穿插生活與互動內容`,
					action: campaign.waves.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/calendar",
							children: "在日曆上看"
						})
					}) : null
				}), campaign.waves.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: WandSparkles,
					title: "還沒有宣傳節奏",
					description: "按「AI 生成完整宣傳」，會依活動類型與剩下的天數排出每一篇要講什麼。",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: runStrategy,
						disabled: busy,
						children: "AI 生成完整宣傳"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-2",
					children: campaign.waves.map((wave) => {
						const content = projects.find((p) => p.id === wave.contentId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "flex flex-wrap items-center gap-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-surface-2 px-2 py-0.5 font-medium",
													children: waveDateLabel(campaign, wave)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[var(--color-accent)]",
													children: wave.stage
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted",
													children: contentKindLabel(wave.kind)
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1.5 text-sm font-medium",
											children: wave.title
										}),
										wave.hook ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 font-display text-base leading-snug",
											children: [
												"「",
												wave.hook,
												"」"
											]
										}) : null,
										wave.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-muted",
											children: wave.note
										}) : null
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex shrink-0 items-center gap-2",
									children: content ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: content.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										size: "sm",
										variant: "secondary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/studio/$projectId",
											params: { projectId: content.id },
											children: ["打開", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
										})
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => createContentForWave(wave),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "建立這篇"]
									})
								})]
							})
						}, wave.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editing,
				onOpenChange: setEditing,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[86dvh] overflow-y-auto sm:max-w-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "活動資訊" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignForm, {
						value: campaign,
						onChange: (patch) => updateCampaign(campaign.id, patch),
						onDone: () => setEditing(false)
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: pendingDelete,
				onOpenChange: setPendingDelete,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "刪除這場活動？" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "已經做好的內容會保留，只是不再連到這場活動。" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "取消" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: () => {
						deleteCampaign(campaign.id);
						navigate({ to: "/campaigns" });
					},
					children: "刪除"
				})] })] })
			})
		]
	});
}
/** 重新生成節奏時，保留已經建立內容的那幾波。 */
function mergeWaves(current, next) {
	const kept = current.filter((w) => w.contentId);
	const merged = [...kept];
	for (const wave of next) if (!kept.some((k) => k.offsetDays === wave.offsetDays && k.kind === wave.kind)) merged.push(wave);
	return merged.sort((a, b) => a.offsetDays - b.offsetDays);
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex gap-2"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "w-16 shrink-0 text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "min-w-0 text-muted",
			children: value
		})]
	});
}
function CampaignRoute() {
	const { campaignId } = Route$2.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CampaignDetailPage, { campaignId });
}
//#endregion
export { CampaignRoute as component };
