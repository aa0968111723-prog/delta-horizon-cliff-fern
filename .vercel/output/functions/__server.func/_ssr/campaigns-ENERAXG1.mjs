import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { H as Button, W as cn } from "./studio-store-xcJ-mtNt.mjs";
import { n as Input, r as Textarea } from "./asset-storage-CpaE1sxh.mjs";
import { C as MapPin, V as Clock3, W as ChevronRight, Y as CalendarDays, d as Sparkles, g as RefreshCw, v as Plus } from "../_libs/lucide-react.mjs";
import { a as SelectTrigger, i as SelectItem, n as Select, o as SelectValue, r as SelectContent, t as Label } from "./select-BaC2bIMR.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as format, r as parseISO, t as zhTW } from "../_libs/date-fns.mjs";
import { d as useUi, i as contentTypeDeliverables, r as useCreative } from "./router-BN40iH_T.mjs";
import { t as PageHeader } from "./page-header-q_x9nRjA.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-CHY4mcIV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaigns-ENERAXG1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CAMPAIGN_TYPES = [
	"茶會",
	"社課",
	"招生",
	"講座",
	"工作坊",
	"社員活動",
	"其他"
];
function emptyCampaign() {
	return {
		name: "",
		type: "社課",
		eventDate: "",
		eventTime: "",
		location: "",
		oneLiner: "",
		description: "",
		theme: "",
		studentPain: "",
		cta: "看看活動",
		registrationUrl: ""
	};
}
function NewCampaignDialog({ open, onOpenChange, onCreated }) {
	const createCampaign = useCreative((state) => state.createCampaign);
	const generateRhythm = useCreative((state) => state.generateRhythm);
	const [form, setForm] = (0, import_react.useState)(emptyCampaign);
	const [error, setError] = (0, import_react.useState)("");
	function patch(patch) {
		setForm((current) => ({
			...current,
			...patch
		}));
	}
	function submit(event) {
		event.preventDefault();
		if (!form.name.trim() || !form.eventDate || !form.location.trim()) {
			setError("請至少填活動名稱、日期與地點。");
			return;
		}
		const campaign = createCampaign({
			...form,
			name: form.name.trim(),
			location: form.location.trim(),
			oneLiner: form.oneLiner.trim(),
			studentPain: form.studentPain.trim() || "淡江學生最近正在面對課表、通勤、宿舍、人際或未來方向帶來的壓力。"
		});
		generateRhythm(campaign.id);
		setForm(emptyCampaign());
		setError("");
		onOpenChange(false);
		onCreated(campaign.id);
		toast.success("活動與宣傳節奏草案已建立");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90dvh] overflow-y-auto sm:max-w-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "建立活動 Campaign" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "寫下活動與學生情境，系統會先安排一版可調整的宣傳節奏。" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-4",
				onSubmit: submit,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-[1fr_10rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "活動名稱",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.name,
								onChange: (event) => patch({ name: event.target.value }),
								placeholder: "例如：秋夜茶會"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "活動類型",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.type,
								onValueChange: (value) => patch({ type: value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: CAMPAIGN_TYPES.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: type,
									children: type
								}, type)) })]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "日期",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: form.eventDate,
									onChange: (event) => patch({ eventDate: event.target.value })
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "時間",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.eventTime,
									onChange: (event) => patch({ eventTime: event.target.value }),
									placeholder: "19:00–21:00"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "地點",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.location,
									onChange: (event) => patch({ location: event.target.value }),
									placeholder: "淡江大學校園"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "一句活動介紹",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.oneLiner,
							onChange: (event) => patch({ oneLiner: event.target.value }),
							placeholder: "學生看一眼就知道這個晚上能得到什麼"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "活動主題",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.theme,
								onChange: (event) => patch({ theme: event.target.value }),
								placeholder: "例如：在忙亂裡留一點空間"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "主要 CTA",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.cta,
								onChange: (event) => patch({ cta: event.target.value }),
								placeholder: "找朋友一起來"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "淡江學生最近的真實情境",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: form.studentPain,
							onChange: (event) => patch({ studentPain: event.target.value }),
							placeholder: "課表、通勤、宿舍、人際、期中壓力，哪一個最接近這次活動？"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "完整介紹",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: form.description,
							onChange: (event) => patch({ description: event.target.value }),
							placeholder: "活動會做什麼、適合誰、參加前需要知道什麼"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "報名連結（選填）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "url",
							value: form.registrationUrl,
							onChange: (event) => patch({ registrationUrl: event.target.value }),
							placeholder: "https://"
						})
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => onOpenChange(false),
							children: "取消"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "建立 Campaign"
						})]
					})
				]
			})]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), children]
	});
}
var STATUS = {
	idea: {
		label: "想法",
		tone: "default"
	},
	creating: {
		label: "創作中",
		tone: "warn"
	},
	complete: {
		label: "完成",
		tone: "accent"
	},
	scheduled: {
		label: "已排程",
		tone: "accent"
	},
	published: {
		label: "已發布",
		tone: "success"
	}
};
function CampaignCenter() {
	const campaigns = useCreative((state) => state.campaigns);
	const contentItems = useCreative((state) => state.contentItems);
	const generateRhythm = useCreative((state) => state.generateRhythm);
	const setContentStatus = useCreative((state) => state.setContentStatus);
	const startCreative = useUi((state) => state.startCreative);
	const [selectedId, setSelectedId] = (0, import_react.useState)(campaigns[0]?.id ?? "");
	const [dialogOpen, setDialogOpen] = (0, import_react.useState)(false);
	const campaign = campaigns.find((item) => item.id === selectedId) ?? campaigns[0];
	const items = (0, import_react.useMemo)(() => contentItems.filter((item) => item.campaignId === campaign?.id).sort((a, b) => a.plannedAt.localeCompare(b.plannedAt)), [campaign?.id, contentItems]);
	function campaignBrief(target, item) {
		return {
			eventName: target.name,
			product: target.oneLiner || target.name,
			schedule: `${target.eventDate} ${target.eventTime}`.trim(),
			location: target.location,
			audience: `淡江大學學生；這次優先回應：${target.studentPain}`,
			features: [target.oneLiner, target.description].filter(Boolean).join("；"),
			style: "自然、年輕、有淡江生活感；把禪轉譯成喘口氣、安定與認識自己",
			notes: [
				target.theme ? `活動主題：${target.theme}` : "",
				item ? `這一波內容：${item.title}。角度：${item.angle}` : "請提出完整宣傳主軸與三個創意方向。",
				target.registrationUrl ? `報名連結：${target.registrationUrl}` : "報名方式尚未填，文案不要假裝已提供。"
			].filter(Boolean).join("\n"),
			deliverables: item ? contentTypeDeliverables(item.type) : {
				post: true,
				carousel: true,
				story: true,
				reels: true
			}
		};
	}
	function createContent(item) {
		if (!campaign) return;
		setContentStatus(item.id, "creating");
		startCreative(campaignBrief(campaign, item));
	}
	if (!campaign) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "CAMPAIGN",
			title: "從下一場活動開始",
			description: "建立活動後，先安排一版宣傳節奏，再逐篇進入 AI 創作。",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => setDialogOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "建立活動"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewCampaignDialog, {
			open: dialogOpen,
			onOpenChange: setDialogOpen,
			onCreated: setSelectedId
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "一人完成整套淡江禪學社網宣",
				title: "Campaign",
				description: "活動資訊、學生情境與每一波內容放在一起。沒有負責人、審核人或多人工單。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setDialogOpen(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "建立活動"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex gap-2 overflow-x-auto pb-2",
				children: campaigns.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSelectedId(item.id),
					className: cn("min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors", item.id === campaign.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
					children: item.name
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-4 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid lg:grid-cols-[1.1fr_0.9fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 sm:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "accent",
									children: campaign.type
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "淡江學生專屬 Campaign"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-4 font-display text-3xl tracking-tight",
								children: campaign.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-2xl text-sm leading-6 text-muted",
								children: campaign.oneLiner || campaign.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4 text-accent" }), format(parseISO(campaign.eventDate), "M月d日 EEEE", { locale: zhTW })]
									}),
									campaign.eventTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-4 text-accent" }), campaign.eventTime]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-accent" }), campaign.location]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => startCreative(campaignBrief(campaign)),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "AI 生成完整宣傳"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									onClick: () => {
										generateRhythm(campaign.id);
										toast.success("本機節奏草案已依活動日期更新");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "重排內容節奏"]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-accent p-5 text-accent-fg sm:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-accent-fg/65",
								children: "STUDENT CONTEXT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 font-display text-xl",
								children: "先理解學生，再講活動"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-6 text-accent-fg/80",
								children: campaign.studentPain
							}),
							campaign.theme ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 rounded-xl bg-accent-fg/10 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-accent-fg/65",
									children: "宣傳主題"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-display text-lg",
									children: campaign.theme
								})]
							}) : null
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "CONTENT RHYTHM"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-xl",
							children: "宣傳節奏"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "這是可調整的本機節奏草案，不會自動發布。"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/assistant",
							children: ["從一句想法開始 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 space-y-3",
					children: items.map((item, index) => {
						const meta = STATUS[item.status];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium text-accent",
										children: format(parseISO(item.plannedAt), "M/d EEE", { locale: zhTW })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted",
										children: format(parseISO(item.plannedAt), "HH:mm")
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs text-subtle",
														children: ["#", String(index + 1).padStart(2, "0")]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: item.type }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: meta.tone,
														children: meta.label
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "mt-2 font-medium",
												children: item.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm leading-6 text-muted",
												children: item.angle
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 sm:justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: item.status,
											onValueChange: (value) => setContentStatus(item.id, value),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "w-28",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: Object.entries(STATUS).map(([value, status]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value,
												children: status.label
											}, value)) })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											onClick: () => createContent(item),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "AI 創作"]
										})]
									})
								]
							})
						}, item.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewCampaignDialog, {
				open: dialogOpen,
				onOpenChange: setDialogOpen,
				onCreated: setSelectedId
			})
		]
	});
}
var SplitComponent = CampaignCenter;
//#endregion
export { SplitComponent as component };
