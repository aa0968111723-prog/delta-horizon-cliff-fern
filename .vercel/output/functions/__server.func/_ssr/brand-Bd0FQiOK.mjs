import { i as __toESM } from "../_runtime.mjs";
import { t as uid } from "./ids-D2oCDrlv.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, P as logoUsageLabel, X as useStudio, o as LOGO_USAGE, tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { n as Input, r as Textarea, t as getAssetStorage } from "./asset-storage-CpaE1sxh.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, o as Label, r as SelectItem, t as Select } from "./select-DIEr3sGB.mjs";
import { n as decodeAssetImage, t as AssetUploadError } from "./asset-upload-BZwZSP2I.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
import { t as EmptyState } from "./empty-state-Dqbn-uaE.mjs";
import { C as Plus, d as SwatchBook, f as Star, i as Upload, l as Trash2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as StorageNotice, t as BrandSubnav } from "./storage-notice-CtwZWNSK.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
import { t as useAssetUrls } from "./use-asset-urls-BkoYZEBn.mjs";
import { n as STUDIO_FONTS, r as Switch } from "./fonts-B8H2r7PQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/brand-Bd0FQiOK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ROLES = [
	{
		id: "primary",
		label: "主色"
	},
	{
		id: "secondary",
		label: "輔助色"
	},
	{
		id: "background",
		label: "背景色"
	},
	{
		id: "accent",
		label: "強調"
	},
	{
		id: "ink",
		label: "文字"
	}
];
var SECTIONS = [
	{
		id: "identity",
		label: "識別"
	},
	{
		id: "logo",
		label: "Logo"
	},
	{
		id: "colors",
		label: "色彩"
	},
	{
		id: "fonts",
		label: "字體"
	},
	{
		id: "copy",
		label: "標語與 CTA"
	},
	{
		id: "style",
		label: "圖片風格"
	},
	{
		id: "rules",
		label: "禁用規則"
	}
];
function BrandEditor() {
	const brands = useStudio((s) => s.brands);
	const updateBrand = useStudio((s) => s.updateBrand);
	const createBrand = useStudio((s) => s.createBrand);
	const deleteBrand = useStudio((s) => s.deleteBrand);
	const addAsset = useStudio((s) => s.addAsset);
	const [activeId, setActiveId] = (0, import_react.useState)(brands[0]?.id ?? "");
	const [section, setSection] = (0, import_react.useState)("identity");
	const brand = brands.find((b) => b.id === activeId) ?? brands[0];
	const fileRef = (0, import_react.useRef)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const logoIds = (brand?.logos ?? []).map((item) => item.assetId);
	if (brand?.logoAssetId) logoIds.push(brand.logoAssetId);
	const urls = useAssetUrls(logoIds);
	if (!brand) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto w-full max-w-3xl px-4 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: SwatchBook,
			title: "尚無品牌",
			description: "建立品牌規範後，排版與 AI 企劃都會跟著走。",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setActiveId(createBrand("新品牌").id),
				children: "建立品牌"
			})
		})
	});
	function patch(key, value) {
		updateBrand(brand.id, { [key]: value });
	}
	async function onLogo(file) {
		setUploading(true);
		try {
			const { blob, width, height, mime } = await decodeAssetImage(file);
			const id = uid("asset");
			await getAssetStorage().put(id, blob);
			addAsset({
				id,
				name: file.name.replace(/\.[^.]+$/, "") || "Logo",
				kind: "logo",
				category: "logo",
				mime,
				width,
				height,
				tags: ["logo", "品牌"],
				createdAt: Date.now(),
				updatedAt: Date.now(),
				source: "upload",
				licenseNotes: "品牌自有標誌",
				licenseOwner: brand.name,
				favorite: false,
				lastUsedAt: null,
				useCount: 0
			});
			const variant = {
				id: uid("logo"),
				name: brand.logos.length === 0 ? "主標誌" : file.name.replace(/\.[^.]+$/, "") || "Logo 變體",
				assetId: id,
				usage: brand.logos.length === 0 ? "primary" : "mark"
			};
			const logos = [...brand.logos, variant];
			updateBrand(brand.id, {
				logos,
				logoAssetId: brand.logoAssetId ?? id
			});
			toast.success("已加入 Logo 版本（僅存此裝置）");
		} catch (err) {
			const message = err instanceof AssetUploadError ? err.message : err instanceof Error ? err.message : "上傳失敗";
			toast.error(message);
		} finally {
			setUploading(false);
		}
	}
	const primary = brand.colors.find((c) => c.role === "primary");
	const bg = brand.colors.find((c) => c.role === "background");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				kicker: "品牌中心",
				title: "品牌規範",
				description: "名稱、Logo 版本、色彩、字體、標語、CTA、圖片風格與禁用規則會套進排版、AI 企劃與品質檢查。",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandSubnav, { current: "brand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							onClick: () => setActiveId(createBrand("新品牌").id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "新增品牌"]
						}),
						brands.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => deleteBrand(brand.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "刪除"]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorageNotice, {}),
			brands.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: brands.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: b.id === brand.id ? "default" : "secondary",
					onClick: () => setActiveId(b.id),
					children: b.name
				}, b.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-border)]",
				style: {
					background: bg?.hex ?? "#F4E6D4",
					color: primary?.hex ?? "#1A1814"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-12 items-center justify-center overflow-hidden rounded-lg bg-surface/80",
						children: brand.logoAssetId && urls[brand.logoAssetId] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: urls[brand.logoAssetId],
							alt: "",
							className: "size-full object-contain p-1"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: "無 Logo"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl tracking-tight",
							style: { fontFamily: brand.fontDisplay },
							children: brand.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm opacity-70",
							style: { fontFamily: brand.fontBody },
							children: [
								brand.handle || "尚未設定帳號",
								" · ",
								brand.slogans[0] || "尚未設定標語"
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex gap-2",
					children: brand.colors.slice(0, 5).map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "size-7 rounded-full border border-border",
						style: { background: color.hex },
						title: `${color.label} ${color.hex}`
					}, color.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none",
				children: SECTIONS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: section === item.id ? "default" : "secondary",
					onClick: () => {
						setSection(item.id);
						document.getElementById(`brand-${item.id}`)?.scrollIntoView({
							behavior: "smooth",
							block: "start"
						});
					},
					children: item.label
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-identity",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "品牌識別"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "品牌名稱",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: brand.name,
									onChange: (e) => patch("name", e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "IG 帳號",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: brand.handle,
									onChange: (e) => patch("handle", e.target.value),
									placeholder: "@brand"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "網站",
								className: "sm:col-span-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: brand.website,
									onChange: (e) => patch("website", e.target.value)
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "品牌聲音",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: brand.voice,
							onChange: (e) => patch("voice", e.target.value),
							placeholder: "語氣、節奏、像誰在說話"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-logo",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: "Logo 與版本"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted",
							children: "主標誌、反白、圖標與橫式可分開管理，畫布會優先使用主標誌。"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "secondary",
							size: "sm",
							disabled: uploading,
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), uploading ? "處理中…" : "上傳版本"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/svg+xml,image/gif",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) onLogo(file);
								e.target.value = "";
							}
						})
					]
				}), brand.logos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-xl bg-bg px-4 py-8 text-center text-sm text-muted",
					children: "尚未上傳 Logo。建議正方形、透明底 SVG 或 PNG。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
					children: brand.logos.map((logo) => {
						const isPrimary = brand.logoAssetId === logo.assetId && logo.usage === "primary" ? true : brand.logoAssetId === logo.assetId && !brand.logos.some((item) => item.usage === "primary");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-xl bg-bg p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface",
									children: urls[logo.assetId] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: urls[logo.assetId],
										alt: logo.name,
										className: "size-full object-contain p-3"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "載入中"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-2 h-9",
									value: logo.name,
									onChange: (e) => patch("logos", brand.logos.map((item) => item.id === logo.id ? {
										...item,
										name: e.target.value
									} : item))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: logo.usage,
									onValueChange: (v) => {
										const usage = v;
										patch("logos", brand.logos.map((item) => item.id === logo.id ? {
											...item,
											usage
										} : item));
										if (usage === "primary") patch("logoAssetId", logo.assetId);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "mt-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LOGO_USAGE.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: item.id,
										children: item.label
									}, item.id)) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: brand.logoAssetId === logo.assetId ? "default" : "ghost",
										onClick: () => patch("logoAssetId", logo.assetId),
										children: brand.logoAssetId === logo.assetId ? "主標誌" : "設為主標誌"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon-sm",
										"aria-label": `移除 ${logo.name}`,
										onClick: () => {
											const logos = brand.logos.filter((item) => item.id !== logo.id);
											patch("logos", logos);
											if (brand.logoAssetId === logo.assetId) patch("logoAssetId", logos[0]?.assetId ?? null);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
									})]
								}),
								isPrimary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted",
									children: logoUsageLabel(logo.usage)
								}) : null
							]
						}, logo.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-colors",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "色彩"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "主色、輔助色與背景色會進自動排版；強調色用於 CTA 與線條。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: brand.colors.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[2.5rem_1fr_1fr_auto] items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "color",
									value: color.hex,
									onChange: (e) => patch("colors", brand.colors.map((c) => c.id === color.id ? {
										...c,
										hex: e.target.value.toUpperCase()
									} : c)),
									className: "size-10 cursor-pointer rounded-md border border-border bg-transparent",
									"aria-label": color.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: color.hex,
									onChange: (e) => patch("colors", brand.colors.map((c) => c.id === color.id ? {
										...c,
										hex: e.target.value
									} : c))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: color.role,
									onValueChange: (v) => patch("colors", brand.colors.map((c) => c.id === color.id ? {
										...c,
										role: v
									} : c)),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ROLES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: r.id,
										children: r.label
									}, r.id)) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon-sm",
									"aria-label": "移除色票",
									onClick: () => patch("colors", brand.colors.filter((c) => c.id !== color.id)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						}, color.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => {
							const next = {
								id: uid("c"),
								hex: "#1A1814",
								role: "accent",
								label: "新色"
							};
							patch("colors", [...brand.colors, next]);
						},
						children: "新增色票"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-fonts",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "字體"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "標題字體",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: brand.fontDisplay,
								onValueChange: (v) => patch("fontDisplay", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STUDIO_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: f.id,
									children: f.label
								}, f.id)) })]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "內文字體",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: brand.fontBody,
								onValueChange: (v) => patch("fontBody", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STUDIO_FONTS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: f.id,
									children: f.label
								}, f.id)) })]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-bg px-4 py-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl tracking-tight",
							style: { fontFamily: brand.fontDisplay },
							children: brand.slogans[0] || brand.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-muted",
							style: { fontFamily: brand.fontBody },
							children: [
								"標題用 ",
								brand.fontDisplay,
								"，內文用 ",
								brand.fontBody,
								"。品質檢查會限制畫布不超過兩種字型。"
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-copy",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "固定標語與常用 CTA"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipList, {
						label: "固定標語",
						hint: "主標語會出現在品牌預覽，AI 企劃會參考。",
						values: brand.slogans,
						placeholder: "例如：這個月只烘一個產地。",
						onChange: (slogans) => patch("slogans", slogans)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChipList, {
						label: "常用 CTA",
						hint: "第一則會作為新專案預設按鈕文案。",
						values: brand.ctas,
						placeholder: "例如：查看風味",
						onChange: (ctas) => {
							patch("ctas", ctas);
							patch("boilerplate", {
								...brand.boilerplate,
								cta: ctas[0] || brand.boilerplate.cta
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "貼文結尾句",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: brand.boilerplate.captionClose,
							onChange: (e) => patch("boilerplate", {
								...brand.boilerplate,
								captionClose: e.target.value
							}),
							placeholder: "例如：歡迎到店，或私訊詢問。"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "固定標籤（逗號分隔）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.boilerplate.hashtags.join("，"),
							onChange: (e) => patch("boilerplate", {
								...brand.boilerplate,
								hashtags: e.target.value.split(/[,，\s]+/).map((w) => w.trim()).filter(Boolean).map((w) => w.startsWith("#") ? w : `#${w}`)
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "免責／備註",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.boilerplate.disclaimer,
							onChange: (e) => patch("boilerplate", {
								...brand.boilerplate,
								disclaimer: e.target.value
							})
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-style",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "圖片風格"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "給攝影師與 AI 企劃看的視覺方向，不會自動套濾鏡。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "畫面情緒",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.imageStyle.mood,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								mood: e.target.value
							}),
							placeholder: "沉靜、暖光、留白"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "光線",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.imageStyle.lighting,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								lighting: e.target.value
							}),
							placeholder: "窗邊自然光，避免硬閃"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "色調",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.imageStyle.paletteHint,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								paletteHint: e.target.value
							}),
							placeholder: "亞麻、深焙、赤陶"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "構圖",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.imageStyle.composition,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								composition: e.target.value
							}),
							placeholder: "商品置中或上半，下半留白給標題"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "應該拍／用",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: brand.imageStyle.do,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								do: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "不要拍／用",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: brand.imageStyle.dont,
							onChange: (e) => patch("imageStyle", {
								...brand.imageStyle,
								dont: e.target.value
							})
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: "brand-rules",
				className: "space-y-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "品牌禁用規則"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "可以說",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.doSay,
							onChange: (e) => patch("doSay", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "不要說",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.dontSay,
							onChange: (e) => patch("dontSay", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "禁用詞（逗號分隔）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: brand.forbiddenWords.join("，"),
							onChange: (e) => patch("forbiddenWords", e.target.value.split(/[,，]/).map((w) => w.trim()).filter(Boolean))
						})
					}),
					brand.forbiddenWords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: brand.forbiddenWords.map((word) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "danger",
							children: word
						}, word))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "禁止競品標誌",
						hint: "畫布與素材不得出現其他品牌 Logo。",
						checked: brand.rules.noCompetitorMarks,
						onChange: (noCompetitorMarks) => patch("rules", {
							...brand.rules,
							noCompetitorMarks
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "禁止浮水印",
						hint: "不使用帶浮水印的圖庫或截圖。",
						checked: brand.rules.noWatermark,
						onChange: (noWatermark) => patch("rules", {
							...brand.rules,
							noWatermark
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "禁止低解析素材",
						hint: "品質檢查會把過小的圖片標為錯誤。",
						checked: brand.rules.noLowRes,
						onChange: (noLowRes) => patch("rules", {
							...brand.rules,
							noLowRes
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "其他規則",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: brand.rules.notes,
							onChange: (e) => patch("rules", {
								...brand.rules,
								notes: e.target.value
							}),
							placeholder: "例如：Logo 不壓在杯緣；價格不進主畫面。"
						})
					})
				]
			})
		]
	});
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn(className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "mb-1.5 block",
			children: label
		}), children]
	});
}
function ToggleRow({ label, hint, checked, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 rounded-xl bg-bg px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
			checked,
			onCheckedChange: onChange
		})]
	});
}
function ChipList({ label, hint, values, placeholder, onChange }) {
	const [draft, setDraft] = (0, import_react.useState)("");
	function add() {
		const text = draft.trim();
		if (!text) return;
		if (values.includes(text)) {
			toast.error("已經有這句了");
			return;
		}
		onChange([...values, text]);
		setDraft("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "mb-1.5 block",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-xs text-muted",
			children: hint
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: draft,
				onChange: (e) => setDraft(e.target.value),
				placeholder,
				onKeyDown: (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						add();
					}
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "secondary",
				onClick: add,
				children: "加入"
			})]
		}),
		values.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-muted",
			children: "尚未新增。"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-2",
			children: values.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-2 rounded-lg bg-bg px-3 py-2",
				children: [
					index === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 text-warn" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3.5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "h-9",
						value: item,
						onChange: (e) => onChange(values.map((v, i) => i === index ? e.target.value : v))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "移除",
						onClick: () => onChange(values.filter((_, i) => i !== index)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})
				]
			}, `${item}-${index}`))
		})
	] });
}
function BrandPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandEditor, {});
}
//#endregion
export { BrandPage as component };
