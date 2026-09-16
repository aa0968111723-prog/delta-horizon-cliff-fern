import { i as __toESM } from "../_runtime.mjs";
import { t as uid } from "./ids-D2oCDrlv.mjs";
import { c as string, n as array, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, X as useStudio, _ as createGeneratedAsset, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { n as Input, t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { o as Label } from "./select-DIEr3sGB.mjs";
import { i as contentKindLabel, n as CONTENT_KIND_ORDER, t as CONTENT_KIND_META } from "./status-BrzQjlVh.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { B as Image$1, D as PenLine, F as Lightbulb, K as GraduationCap, N as LoaderCircle, Q as Copy, V as ImagePlus, Y as Eye, Z as Download, at as Check, c as TriangleAlert, ct as ArrowRight, et as CircleCheck, h as Sparkles, i as Upload, n as WandSparkles, x as RefreshCw } from "../_libs/lucide-react.mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as createSsrRpc, o as Route$8 } from "./router-CCaD8IgA.mjs";
import { n as SectionHeader, t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { n as DEFAULT_AUDIENCE_IDS, t as AUDIENCE_SEGMENTS } from "./audience-Bhnj2Vl6.mjs";
import { a as scanCopyIssues, o as semesterPhaseAt } from "./voice-D6qT5Et6.mjs";
import { n as COPY_TOPICS, o as toneLabel, t as COPY_TONES } from "./copy-local-C-0StsLs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-BJz1kYbA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function copyDraftText(draft) {
	return [
		draft.hook,
		draft.body,
		draft.cta,
		draft.hashtags.join(" ")
	].filter(Boolean).join("\n\n");
}
function CopyDraftCard({ draft, onUse, onReview, onRegenerate, used }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const issues = scanCopyIssues(copyDraftText(draft));
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(copyDraftText(draft));
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex h-full flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: draft.source === "live" ? "accent" : "default",
					children: toneLabel(draft.tone)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-subtle",
					children: draft.source === "live" ? "AI 生成" : "本機草稿"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-lg leading-snug text-balance",
				children: draft.hook
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "whitespace-pre-wrap text-sm leading-relaxed text-muted",
				children: draft.body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: draft.cta
					}),
					draft.hashtags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs break-words text-[var(--color-accent)]",
						children: draft.hashtags.join(" ")
					}) : null,
					issues.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1 rounded-xl bg-[color-mix(in_oklab,var(--color-warn)_10%,transparent)] p-2.5 text-xs text-muted",
						children: issues.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", issue] }, issue))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							onUse ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: onUse,
								disabled: used,
								children: [used ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), used ? "已套用" : "用這版"]
							}) : null,
							onReview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: onReview,
								children: "學生視角檢查"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: copyToClipboard,
								children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied ? "已複製" : "複製"]
							}),
							onRegenerate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: onRegenerate,
								"aria-label": "重新生成這版",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" })
							}) : null
						]
					})
				]
			})
		]
	});
}
/** 主視覺方向：一個方向包含概念、配色、構圖、字體與可直接送生成的圖片 prompt。 */
var DirectionBriefSchema = object({
	intent: string().min(1).max(600),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	painPoint: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	imageStyle: string().max(600).optional(),
	forceLocal: boolean().optional()
});
function unwrap$1(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
/** 沒有 AI 時的三個方向，仍然照品牌記憶走。 */
/**
* AI Image Studio 的第一步：不是直接生圖，而是先想清楚方向。
* 使用者輸入「我要宣傳茶會」，AI 會先考慮活動、學生情境、淡水、品牌色，
* 再提出三個可以各自往下生成的視覺方向。
*/
var generateVisualDirections = createServerFn({ method: "POST" }).validator((input) => unwrap$1(input, DirectionBriefSchema)).handler(createSsrRpc("be0447b4c1a8c8942aa6c3fad59c141c81b2d731750fbc5191f22be12f982747"));
var ImageGenSchema = object({
	prompt: string().min(1).max(1200),
	/** 產出比例，會影響加在 prompt 後面的說明 */
	ratio: _enum([
		"4:5",
		"1:1",
		"9:16",
		"1.91:1"
	]).catch("4:5")
});
/**
* 真的呼叫 xAI Imagine 生圖。金鑰是社團擁有者的，所以只在使用者按下按鈕時呼叫，
* 一次一張，不做自動重試風暴。
*/
var generateImage = createServerFn({ method: "POST" }).validator((input) => unwrap$1(input, ImageGenSchema)).handler(createSsrRpc("164be129fc3d75a3d02af05799091b61462961f408ef096197cd3f8a58ed7539"));
var VisionSchema = object({
	imageUrl: string().min(1).max(3e6),
	question: string().max(600).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([])
});
/** 圖片理解：丟一張照片、歷屆海報、IG 截圖或 Canva 設計進來，AI 讀它。 */
var analyzeImage = createServerFn({ method: "POST" }).validator((input) => unwrap$1(input, VisionSchema)).handler(createSsrRpc("9a3f680954aed293f72e1ad989246bf475f866215b5eec2338fc8fdc4093fe93"));
/**
* 圖片理解：丟一張照片、歷屆海報、IG 截圖或 Canva 匯出圖進來。
* AI 讀畫面內容、色彩、構圖、品牌感，並判斷是不是太宗教／太老氣／太像 AI。
*/
function ImageUnderstanding({ audienceIds, onUseCaption, onUseStylePrompt }) {
	const assets = useStudio((s) => s.assets);
	const urls = useAssetUrls(assets.map((a) => a.id));
	const fileRef = (0, import_react.useRef)(null);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [analysis, setAnalysis] = (0, import_react.useState)(null);
	async function pickFile(file) {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = String(reader.result);
			setPreview(dataUrl);
			setAnalysis(null);
		};
		reader.readAsDataURL(file);
	}
	async function pickAsset(assetId) {
		const url = urls[assetId];
		if (!url) return;
		try {
			const blob = await (await fetch(url)).blob();
			const reader = new FileReader();
			reader.onload = () => {
				setPreview(String(reader.result));
				setAnalysis(null);
			};
			reader.readAsDataURL(blob);
		} catch {
			toast.error("讀不到這張素材。");
		}
	}
	async function run() {
		if (!preview) {
			toast.error("先選一張圖片。");
			return;
		}
		setBusy(true);
		try {
			const res = await analyzeImage({ data: {
				imageUrl: preview,
				audienceIds
			} });
			if (!res.ok) {
				toast.warning(res.error);
				return;
			}
			setAnalysis(res.analysis);
		} catch {
			toast.error("分析圖片時出錯了，再試一次。");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "圖片理解"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "照片、歷屆海報、IG 截圖、Canva 設計都可以。"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) pickFile(file);
								e.target.value = "";
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "上傳圖片"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: run,
							disabled: busy || !preview,
							children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), "AI 分析"]
						})
					]
				})]
			}),
			assets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "或從素材庫挑一張"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1",
					children: assets.slice(0, 12).map((asset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void pickAsset(asset.id),
						className: "size-16 overflow-hidden rounded-xl bg-surface-2 shadow-[var(--shadow-border)]",
						"aria-label": `分析 ${asset.name}`,
						children: urls[asset.id] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: urls[asset.id],
							alt: asset.name,
							className: "size-full object-cover"
						}) : null
					}) }, asset.id))
				})]
			}) : null,
			preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: preview,
					alt: "待分析的圖片",
					className: "w-full rounded-xl bg-surface-2 object-cover"
				}), analysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: analysis.summary
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
									ok: !analysis.tooReligious,
									label: analysis.tooReligious ? "偏宗教" : "不會太宗教"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
									ok: !analysis.tooOld,
									label: analysis.tooOld ? "偏老氣" : "不會太老氣"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
									ok: !analysis.tooAi,
									label: analysis.tooAi ? "有 AI 感" : "沒有 AI 感"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verdict, {
									ok: analysis.fitsTku,
									label: analysis.fitsTku ? "適合淡江學生" : "不太像淡江學生的畫面"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid gap-1.5 text-xs sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "畫面",
									value: analysis.content
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "人物",
									value: analysis.people
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "色彩",
									value: analysis.color
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "光線",
									value: analysis.light
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "構圖",
									value: analysis.composition
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "文字比例",
									value: analysis.textRatio
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "視覺層級",
									value: analysis.hierarchy
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "品牌感",
									value: analysis.brandFit
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "學生感",
									value: analysis.studentFit
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "停留感",
									value: analysis.stopPower
								})
							]
						}),
						analysis.nextSteps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "可以直接做的下一步"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 space-y-1 text-xs text-muted",
							children: analysis.nextSteps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", step] }, step))
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [analysis.captionIdea && onUseCaption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => onUseCaption(analysis.captionIdea),
								children: "用這句寫文案"
							}) : null, analysis.stylePrompt && onUseStylePrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => onUseStylePrompt(analysis.stylePrompt),
								children: "延續這個風格"
							}) : null]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "按「AI 分析」讀這張圖：畫面、色彩、構圖、品牌感，還有它適不適合淡江學生。"
				})]
			}) : null
		]
	});
}
function Field({ label, value }) {
	if (!value) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "text-muted",
			children: value
		})]
	});
}
function Verdict({ ok, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs", ok ? "bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)]" : "bg-[color-mix(in_oklab,var(--color-warn)_16%,transparent)] text-[var(--color-warn)]"),
		children: [ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3" }), label]
	});
}
/**
* 反向學生模擬的結果。AI 生成完之後自動切換成淡江學生視角，
* 一題一題回答「我會停下來嗎、我知道時間地點嗎」，再給修改建議。
*/
function StudentReviewPanel({ review, onApplyHook, onClose }) {
	const risks = review.items.filter((item) => item.verdict === "risk");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-night)_16%,transparent)] text-[var(--color-night)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "淡江學生視角"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							review.source === "live" ? "AI 切換身分重看一次" : "本機規則檢查",
							"·會停下來的可能 ",
							review.score,
							"%"
						]
					})] })]
				}), onClose ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: onClose,
					children: "收起"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "three-lights h-full rounded-full transition-[width] duration-300",
					style: { width: `${Math.max(6, Math.min(100, review.score))}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 grid gap-1.5 sm:grid-cols-2",
				children: review.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs", item.verdict === "risk" ? "bg-[color-mix(in_oklab,var(--color-warn)_12%,transparent)]" : "bg-surface-2/60"),
					children: [item.verdict === "risk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-3.5 shrink-0 text-[var(--color-warn)]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-3.5 shrink-0 text-[var(--color-success)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-medium",
							children: item.question
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-muted",
							children: item.note
						})]
					})]
				}, item.question))
			}),
			review.rewriteHook ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-2xl bg-surface-2/60 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "學生更想看的第一句"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-display text-base leading-snug",
						children: [
							"「",
							review.rewriteHook,
							"」"
						]
					}),
					onApplyHook ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						className: "mt-2",
						onClick: () => onApplyHook(review.rewriteHook),
						children: "換成這句"
					}) : null
				]
			}) : null,
			review.suggestions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-1 text-xs text-muted",
				children: review.suggestions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", s] }, s))
			}) : null,
			risks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-[var(--color-success)]",
				children: "學生視角沒有明顯問題，可以進畫面了。"
			}) : null
		]
	});
}
/** AI 生成的圖片存進素材庫，之後可以直接拖到畫布、也能被搜尋到。 */
async function saveGeneratedImage(input) {
	const blob = await (await fetch(input.dataUrl)).blob();
	const size = await measure(input.dataUrl);
	const id = uid("asset");
	await getAssetStorage().put(id, blob);
	return createGeneratedAsset({
		id,
		name: input.name,
		mime: blob.type || "image/png",
		width: size.width,
		height: size.height,
		category: "photo",
		tags: ["AI 生成", ...input.tags ?? []],
		licenseNotes: `由 AI 依 prompt 生成：${input.prompt.slice(0, 180)}`,
		licenseOwner: "AI 生成"
	});
}
function measure(src) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve({
			width: img.naturalWidth || 1080,
			height: img.naturalHeight || 1350
		});
		img.onerror = () => resolve({
			width: 1080,
			height: 1350
		});
		img.src = src;
	});
}
/** IG 常用尺寸。生成時直接決定構圖比例。 */
var RATIOS = [
	{
		id: "4:5",
		label: "IG 4:5"
	},
	{
		id: "1:1",
		label: "IG 1:1"
	},
	{
		id: "9:16",
		label: "Story 9:16"
	},
	{
		id: "1.91:1",
		label: "LINE / 連結"
	}
];
function VisualDirectionCard({ direction, onUseCopy, onImageSaved }) {
	const addAsset = useStudio((s) => s.addAsset);
	const [ratio, setRatio] = (0, import_react.useState)("4:5");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [preview, setPreview] = (0, import_react.useState)(null);
	async function runGenerate() {
		setBusy(true);
		try {
			const res = await generateImage({ data: {
				prompt: direction.imagePrompt,
				ratio
			} });
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			setPreview(res.dataUrl);
			const meta = await saveGeneratedImage({
				dataUrl: res.dataUrl,
				name: `${direction.title} · ${ratio}`,
				prompt: res.revisedPrompt || direction.imagePrompt,
				tags: [direction.title, ratio]
			});
			addAsset(meta);
			onImageSaved?.(meta.id);
			toast.success("圖片已存進素材庫");
		} catch {
			toast.error("生成圖片時出錯了，再試一次。");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex h-full flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "flex items-start justify-between gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg",
						children: direction.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: direction.concept
					})]
				})
			}),
			preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: preview,
				alt: `${direction.title} 生成結果`,
				className: "w-full rounded-xl bg-surface-2 object-cover"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "space-y-1.5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "配色",
						value: direction.palette
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "構圖",
						value: direction.composition
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "字體",
						value: direction.typography
					})
				]
			}),
			direction.headline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-surface-2/60 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "主文案"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-base leading-snug whitespace-pre-line",
						children: direction.headline
					}),
					direction.subhead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: direction.subhead
					}) : null,
					onUseCopy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						className: "mt-2",
						onClick: () => onUseCopy(direction.headline, direction.subhead),
						children: "套用到畫面"
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-xl bg-surface-2/40 p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer text-muted",
					children: "圖片 Prompt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 break-words text-subtle",
					children: direction.imagePrompt
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: RATIOS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setRatio(item.id),
						className: cn("rounded-full px-2.5 py-1 text-xs transition-colors", ratio === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg"),
						children: item.label
					}, item.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: runGenerate,
						disabled: busy,
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), preview ? "換一張" : "生成圖片"]
					}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: preview,
							download: `${direction.title}.png`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "下載"]
						})
					}) : null]
				})]
			})
		]
	});
}
function Row({ label, value }) {
	if (!value) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "w-10 shrink-0 text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "min-w-0 text-muted",
			children: value
		})]
	});
}
function DirectionSourceNote({ adapter }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: adapter === "live" ? "accent" : "default",
		children: adapter === "live" ? "AI 生成方向" : "本機方向草稿"
	});
}
function RegenerateButton({ onClick, busy }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "secondary",
		onClick,
		disabled: busy,
		children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "重新想方向"]
	});
}
var ToneSchema = _enum([
	"short",
	"normal",
	"emotional",
	"student",
	"life",
	"humor"
]);
var CopyBriefSchema = object({
	topic: _enum([
		"event",
		"emotion",
		"campus",
		"recruit",
		"member",
		"zen-life",
		"countdown",
		"recap",
		"knowledge"
	]).catch("event"),
	tones: array(ToneSchema).min(1).max(4),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	detail: string().max(1200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	signupUrl: string().max(300).catch(""),
	brandVoice: string().max(600).optional(),
	brandDontSay: string().max(300).optional(),
	forbiddenWords: array(string().max(40)).max(20).optional(),
	forceLocal: boolean().optional()
});
function unwrap(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
var generateIgCopy = createServerFn({ method: "POST" }).validator((input) => unwrap(input, CopyBriefSchema)).handler(createSsrRpc("ca6121e6bfa5e659459d5a4afa6adff810d28176000d1565582ceb662f14fd92"));
var ReviewSchema = object({
	text: string().min(1).max(4e3),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	signupUrl: string().max(300).catch(""),
	painPoint: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	forceLocal: boolean().optional()
});
/** 反向學生模擬：用淡江學生視角重看一次自己寫的東西。 */
var reviewAsStudent = createServerFn({ method: "POST" }).validator((input) => unwrap(input, ReviewSchema)).handler(createSsrRpc("1830499ede9f7054919614dc4b7eec520e9a1b10152ac740f01bcbace08b8686"));
var ReelsSchema = object({
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	detail: string().max(1200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	forceLocal: boolean().optional()
});
var generateReelsScript = createServerFn({ method: "POST" }).validator((input) => unwrap(input, ReelsSchema)).handler(createSsrRpc("7ef27ed7046fbee271f733c33c19ad89852901bd561e23efba86c02be7574e09"));
var getZenAiStatus = createServerFn({ method: "POST" }).handler(createSsrRpc("053c91563332c678986db16317e15e99668511125d016720b799489391a15690"));
var TEXTAREA = "w-full min-h-24 rounded-xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring";
function CreatePage({ search }) {
	const navigate = useNavigate();
	const brands = useStudio((s) => s.brands);
	const campaigns = useStudio((s) => s.campaigns);
	const projects = useStudio((s) => s.projects);
	const createProject = useStudio((s) => s.createProject);
	const addCopyDraft = useStudio((s) => s.addCopyDraft);
	const useCopyDraft = useStudio((s) => s.useCopyDraft);
	const setStudentReview = useStudio((s) => s.setStudentReview);
	const setReels = useStudio((s) => s.setReels);
	const setCopy = useStudio((s) => s.setCopy);
	const updateCampaign = useStudio((s) => s.updateCampaign);
	const brand = brands[0];
	const phase = semesterPhaseAt();
	const linkedProject = (0, import_react.useMemo)(() => projects.find((p) => p.id === search.contentId) ?? null, [projects, search.contentId]);
	const campaign = (0, import_react.useMemo)(() => {
		const id = search.campaignId ?? linkedProject?.campaignId;
		return campaigns.find((c) => c.id === id) ?? null;
	}, [
		campaigns,
		search.campaignId,
		linkedProject
	]);
	const [from, setFrom] = (0, import_react.useState)(search.from === "image" ? "image" : "idea");
	const [kind, setKind] = (0, import_react.useState)((search.kind && search.kind in CONTENT_KIND_META ? search.kind : null) ?? linkedProject?.contentKind ?? "ig-post");
	const [topic, setTopic] = (0, import_react.useState)(campaign ? "event" : "emotion");
	const [tones, setTones] = (0, import_react.useState)([
		"student",
		"short",
		"emotional"
	]);
	const [idea, setIdea] = (0, import_react.useState)(search.seed ?? "");
	const [eventName, setEventName] = (0, import_react.useState)(campaign?.name ?? linkedProject?.brief.eventName ?? "");
	const [schedule, setSchedule] = (0, import_react.useState)(campaign ? `${campaign.date} ${campaign.time}`.trim() : linkedProject?.brief.schedule ?? "");
	const [location, setLocation] = (0, import_react.useState)(campaign?.location ?? linkedProject?.brief.location ?? "");
	const [painPoint, setPainPoint] = (0, import_react.useState)(campaign?.painPoint ?? "");
	const [signupUrl, setSignupUrl] = (0, import_react.useState)(campaign?.signupUrl ?? "");
	const [audienceIds, setAudienceIds] = (0, import_react.useState)(campaign?.audienceIds.length ? campaign.audienceIds : DEFAULT_AUDIENCE_IDS);
	const [aiStatus, setAiStatus] = (0, import_react.useState)(null);
	const [copyBusy, setCopyBusy] = (0, import_react.useState)(false);
	const [drafts, setDrafts] = (0, import_react.useState)(linkedProject?.copyDrafts ?? []);
	const [usedDraftId, setUsedDraftId] = (0, import_react.useState)(null);
	const [review, setReview] = (0, import_react.useState)(linkedProject?.studentReview ?? null);
	const [reviewBusy, setReviewBusy] = (0, import_react.useState)(false);
	const [visualBusy, setVisualBusy] = (0, import_react.useState)(false);
	const [directions, setDirections] = (0, import_react.useState)([]);
	const [directionAdapter, setDirectionAdapter] = (0, import_react.useState)("local");
	const [reelsBusy, setReelsBusy] = (0, import_react.useState)(false);
	const resultsRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		getZenAiStatus().then((status) => {
			if (alive) setAiStatus(status);
		});
		return () => {
			alive = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (search.step === "visual" && !directions.length && !visualBusy) resultsRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}, [
		search.step,
		directions.length,
		visualBusy
	]);
	const briefPayload = (0, import_react.useMemo)(() => ({
		topic,
		eventName: eventName.trim(),
		schedule: schedule.trim(),
		location: location.trim(),
		detail: [idea.trim(), campaign?.intro ?? ""].filter(Boolean).join("\n"),
		painPoint: painPoint.trim(),
		cta: campaign?.cta ?? brand?.boilerplate.cta ?? "來坐一下",
		audienceIds,
		signupUrl: signupUrl.trim(),
		brandVoice: brand?.voice,
		brandDontSay: brand?.dontSay,
		forbiddenWords: brand?.forbiddenWords ?? []
	}), [
		topic,
		eventName,
		schedule,
		location,
		idea,
		painPoint,
		signupUrl,
		audienceIds,
		brand,
		campaign
	]);
	async function runCopy() {
		if (!idea.trim() && !eventName.trim() && !painPoint.trim()) {
			toast.error("先寫一句想法，或填活動名稱。");
			return;
		}
		setCopyBusy(true);
		try {
			const res = await generateIgCopy({ data: {
				...briefPayload,
				tones
			} });
			setDrafts(res.drafts);
			if (!res.ok) toast.warning(res.error);
			else if (res.adapter === "local") toast.info("目前是本機草稿，可以直接編輯。");
			resultsRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		} catch {
			toast.error("生成文案時出錯了，再試一次。");
		} finally {
			setCopyBusy(false);
		}
	}
	async function runVisuals() {
		const intent = [idea.trim(), eventName.trim() ? `活動：${eventName.trim()}` : ""].filter(Boolean).join("／");
		if (!intent) {
			toast.error("先寫一句你想宣傳什麼。");
			return;
		}
		setVisualBusy(true);
		try {
			const res = await generateVisualDirections({ data: {
				intent,
				eventName: eventName.trim(),
				schedule: schedule.trim(),
				location: location.trim(),
				painPoint: painPoint.trim(),
				audienceIds,
				imageStyle: brand ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}` : void 0
			} });
			setDirections(res.directions);
			setDirectionAdapter(res.ok ? "live" : "local");
			if (!res.ok) toast.warning(res.error);
		} catch {
			toast.error("想視覺方向時出錯了，再試一次。");
		} finally {
			setVisualBusy(false);
		}
	}
	async function runReview(draft) {
		setReviewBusy(true);
		try {
			const res = await reviewAsStudent({ data: {
				text: copyDraftText(draft),
				eventName: eventName.trim(),
				schedule: schedule.trim(),
				location: location.trim(),
				signupUrl: signupUrl.trim(),
				painPoint: painPoint.trim(),
				audienceIds
			} });
			setReview(res.review);
			if (!res.ok) toast.warning(res.error);
		} catch {
			toast.error("檢查時出錯了，再試一次。");
		} finally {
			setReviewBusy(false);
		}
	}
	/** 把選中的版本變成一個可以編輯、可以排程的內容。 */
	function commitDraft(draft) {
		if (!brand) return;
		const meta = CONTENT_KIND_META[kind];
		const name = draft.hook.slice(0, 18) || eventName || "未命名內容";
		const target = linkedProject ?? createProject({
			name,
			brandId: brand.id,
			formatId: meta.formatId,
			contentKind: kind,
			campaignId: campaign?.id ?? null,
			status: "making",
			brief: {
				product: eventName || name,
				eventName: eventName || name,
				schedule: schedule.trim(),
				location: location.trim(),
				offer: campaign?.oneLiner ?? "",
				audience: audienceIds.join("、"),
				goal: "awareness",
				features: idea.trim(),
				style: "安靜、具體、不說教",
				notes: painPoint.trim(),
				deliverables: {
					post: kind === "ig-post",
					story: kind === "story" || kind === "countdown",
					carousel: kind === "carousel" || kind === "knowledge" || kind === "qa",
					reels: kind === "reels"
				}
			},
			sources: campaign ? [{
				kind: "local",
				label: `活動 / ${campaign.name}`,
				detail: "活動資訊"
			}] : []
		});
		addCopyDraft(target.id, draft);
		useCopyDraft(target.id, draft.id);
		if (review) setStudentReview(target.id, review);
		setUsedDraftId(draft.id);
		if (campaign) {
			const wave = campaign.waves.find((w) => !w.contentId && w.kind === kind);
			if (wave) updateCampaign(campaign.id, { waves: campaign.waves.map((w) => w.id === wave.id ? {
				...w,
				contentId: target.id
			} : w) });
		}
		toast.success("已建立內容，可以進畫面編輯了");
		return target.id;
	}
	async function runReels(draft) {
		setReelsBusy(true);
		try {
			const res = await generateReelsScript({ data: {
				eventName: eventName.trim(),
				schedule: schedule.trim(),
				location: location.trim(),
				detail: [idea.trim(), draft?.body ?? ""].filter(Boolean).join("\n"),
				painPoint: painPoint.trim(),
				cta: draft?.cta ?? "",
				audienceIds
			} });
			if (!res.ok) toast.warning(res.error);
			const id = linkedProject?.id;
			if (id) {
				setReels(id, res.reels);
				toast.success("Reels 腳本已存到這則內容");
			} else toast.info("先選一個文案版本建立內容，腳本就會存進去。");
			return res.reels;
		} finally {
			setReelsBusy(false);
		}
	}
	function toggleTone(tone) {
		setTones((prev) => prev.includes(tone) ? prev.filter((t) => t !== tone) : prev.length >= 4 ? prev : [...prev, tone]);
	}
	function toggleAudience(id) {
		setAudienceIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "AI 創作",
				title: linkedProject ? linkedProject.name : "從一句想法開始",
				description: aiStatus ? aiStatus.detail : `現在是${phase.label}。${phase.angle}`,
				actions: linkedProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					onClick: () => void navigate({
						to: "/studio/$projectId",
						params: { projectId: linkedProject.id }
					}),
					children: ["進畫面編輯", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
				}) : null
			}),
			aiStatus && !aiStatus.available ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 rounded-xl bg-[color-mix(in_oklab,var(--color-warn)_12%,transparent)] px-3 py-2 text-xs text-muted",
				children: [
					aiStatus.label,
					"：",
					aiStatus.detail
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex gap-2",
				children: [{
					id: "idea",
					label: "從一句想法",
					icon: Lightbulb
				}, {
					id: "image",
					label: "從一張圖片",
					icon: Image$1
				}].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setFrom(tab.id),
					className: cn("flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors", from === tab.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(tab.icon, { className: "size-4" }), tab.label]
				}, tab.id))
			}),
			from === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUnderstanding, {
					audienceIds,
					onUseCaption: (caption) => {
						setIdea(caption);
						setFrom("idea");
					},
					onUseStylePrompt: (prompt) => setDirections([{
						id: `vis_from_image_${Date.now()}`,
						title: "延續這張圖的風格",
						concept: "從既有素材抽出風格，再做新的內容。",
						palette: "沿用原圖配色",
						composition: "沿用原圖構圖，留白給標題",
						typography: "跟現有版面一致",
						imagePrompt: prompt,
						headline: "",
						subhead: ""
					}])
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 space-y-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "idea",
						children: "一句想法"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "idea",
						value: idea,
						onChange: (e) => setIdea(e.target.value),
						placeholder: "例：下週有一場茶會／期中考大家都很累／想讓新生知道第一次來不用準備什麼",
						className: cn(TEXTAREA, "mt-1.5")
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "eventName",
								children: "活動名稱（可留空）"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "eventName",
								value: eventName,
								onChange: (e) => setEventName(e.target.value),
								placeholder: "浮游禪光",
								className: "mt-1.5"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "schedule",
								children: "時間"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "schedule",
								value: schedule,
								onChange: (e) => setSchedule(e.target.value),
								placeholder: "9/24（三）19:00",
								className: "mt-1.5"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "location",
								children: "地點"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "location",
								value: location,
								onChange: (e) => setLocation(e.target.value),
								placeholder: "商管大樓 B302",
								className: "mt-1.5"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "signup",
								children: "報名連結（可留空）"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "signup",
								value: signupUrl,
								onChange: (e) => setSignupUrl(e.target.value),
								placeholder: "直接來就好",
								className: "mt-1.5"
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "pain",
						children: "想打到的狀態"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "pain",
						value: painPoint,
						onChange: (e) => setPainPoint(e.target.value),
						placeholder: "最近連休息都覺得有罪惡感",
						className: "mt-1.5"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "要做成什麼"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: CONTENT_KIND_ORDER.slice(0, 8).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setKind(item),
							className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", kind === item ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg"),
							children: contentKindLabel(item)
						}, item))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "內容角度"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: COPY_TOPICS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTopic(item.id),
							className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", topic === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg"),
							children: item.label
						}, item.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "要幾種語氣（最多 4）"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: COPY_TONES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleTone(item.id),
							className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", tones.includes(item.id) ? "bg-[color-mix(in_oklab,var(--color-night)_18%,transparent)] text-fg" : "bg-surface-2 text-muted hover:text-fg"),
							children: item.label
						}, item.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "給誰看"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: AUDIENCE_SEGMENTS.map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleAudience(seg.id),
							title: seg.pain,
							className: cn("min-h-9 rounded-full px-3 text-xs transition-colors", audienceIds.includes(seg.id) ? "bg-[color-mix(in_oklab,var(--color-warm)_24%,transparent)] text-fg" : "bg-surface-2 text-muted hover:text-fg"),
							children: seg.label
						}, seg.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 pt-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: runCopy,
								disabled: copyBusy,
								children: [copyBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-4" }), "生成文案"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: runVisuals,
								disabled: visualBusy,
								children: [visualBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "想 3 個視覺方向"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								onClick: () => void runReels(drafts[0]),
								disabled: reelsBusy,
								children: [reelsBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "size-4" }), "寫 Reels 腳本"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: resultsRef }),
			drafts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
						title: "文案版本",
						hint: "每一版都是 Hook / 正文 / CTA / Hashtags",
						action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: runCopy,
							disabled: copyBusy,
							children: "重新生成"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
						children: drafts.map((draft) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyDraftCard, {
							draft,
							used: usedDraftId === draft.id,
							onUse: () => {
								const id = commitDraft(draft);
								if (id && !linkedProject) navigate({
									to: "/create",
									search: {
										contentId: id,
										kind
									}
								});
							},
							onReview: () => void runReview(draft)
						}) }, draft.id))
					}),
					reviewBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 flex items-center gap-2 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }), "正在用淡江學生的視角重看一次…"]
					}) : null
				]
			}) : null,
			review ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentReviewPanel, {
					review,
					onApplyHook: (hook) => {
						if (linkedProject) {
							setCopy(linkedProject.id, { headline: hook.slice(0, 24) });
							toast.success("已換成這句");
						} else {
							setIdea(hook);
							toast.info("已放到想法欄，重新生成就會用這個角度。");
						}
					},
					onClose: () => setReview(null)
				})
			}) : null,
			directions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: "視覺方向",
					hint: "先想方向，再生圖",
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirectionSourceNote, { adapter: directionAdapter }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegenerateButton, {
							onClick: runVisuals,
							busy: visualBusy
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
					children: directions.map((direction) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisualDirectionCard, {
						direction,
						onUseCopy: (headline, subhead) => {
							if (linkedProject) {
								setCopy(linkedProject.id, {
									headline,
									subhead
								});
								toast.success("已套用到畫面");
							} else toast.info("先選一個文案版本建立內容，才有畫面可以套用。");
						}
					}) }, direction.id))
				})]
			}) : null,
			linkedProject?.reels ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
						title: "Reels 腳本",
						hint: `Hook：${linkedProject.reels.hook}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2",
						children: linkedProject.reels.beats.map((beat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium tracking-wide text-[var(--color-accent)]",
									children: beat.range
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm font-medium",
									children: beat.caption
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-subtle",
											children: "畫面"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: beat.visual })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-subtle",
											children: "旁白"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: beat.voice })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-subtle",
											children: "轉場"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: beat.transition })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "text-subtle",
											children: "素材"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: beat.asset })] })
									]
								})
							]
						}, beat.range))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-subtle",
						children: ["封面：", linkedProject.reels.cover]
					})
				]
			}) : null
		]
	});
}
function CreateRoute() {
	const search = Route$8.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatePage, { search });
}
//#endregion
export { CreateRoute as component };
