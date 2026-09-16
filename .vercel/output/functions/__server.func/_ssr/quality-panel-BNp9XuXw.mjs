import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { H as Button, M as pagesOf, T as inspectProject, V as useStudio, W as cn } from "./studio-store-xcJ-mtNt.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quality-panel-BNp9XuXw.js
var import_jsx_runtime = require_jsx_runtime();
function QualityPanel({ project, brand }) {
	const select = useStudio((s) => s.select);
	const setSlide = useStudio((s) => s.setSlide);
	const applyQaFix = useStudio((s) => s.applyQaFix);
	const applyQaFixes = useStudio((s) => s.applyQaFixes);
	const pages = pagesOf(project);
	const report = inspectProject(pages, brand, project.copy);
	const tone = report.score >= 85 ? "text-success" : report.score >= 70 ? "text-warn" : "text-danger";
	const problems = report.issues.filter((i) => i.severity !== "pass");
	function jump(issue) {
		if (issue.pageIndex >= 0) setSlide(project.id, issue.pageIndex);
		select(issue.layerId ?? null);
	}
	function fixOne(issue) {
		if (applyQaFix(project.id, issue)) toast.success(`已修正「${issue.title}」，原版在版本列表`);
		else toast.message("這則需要手動調整");
	}
	function fixAll() {
		const n = applyQaFixes(project.id);
		if (n) toast.success(`已自動修正 ${n} 則，原版在版本列表`);
		else toast.message("目前沒有可自動修正的項目");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 p-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "品質檢查"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("font-display text-4xl tabular-nums tracking-tight", tone),
					"data-testid": "qa-score",
					children: report.score
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs leading-relaxed text-muted",
					children: report.summary
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-1 sm:grid-cols-2",
				"data-testid": "qa-checklist",
				children: report.checks.map((check) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-11 items-center justify-between gap-2 rounded-md bg-bg px-3 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: check.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("tabular-nums", check.status === "fail" && "text-danger", check.status === "warn" && "text-warn", check.status === "pass" && "text-success"),
						children: check.status === "pass" ? "通過" : check.status === "fail" ? "必須修" : "建議"
					})]
				}, check.id))
			}),
			report.fixable > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "min-h-11 w-full",
				onClick: fixAll,
				"data-testid": "qa-fix-all",
				children: [
					"一鍵修正 ",
					report.fixable,
					" 則"
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: problems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-lg bg-success/10 px-3 py-3 text-sm",
					children: "13 項都通過。匯出前仍請看一次縮圖。"
				}) : problems.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("rounded-lg px-3 py-3 shadow-[var(--shadow-border)]", issue.severity === "fail" && "bg-danger/10", issue.severity === "warn" && "bg-warn/10"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "w-full text-left",
						onClick: () => jump(issue),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs tracking-wide text-muted",
								children: [
									issue.severity === "fail" ? "必須修正" : "建議",
									" · ",
									issue.location,
									pages[issue.pageIndex]?.role ? "" : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-medium",
								children: issue.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-relaxed text-muted",
								children: issue.detail
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed",
								children: issue.suggestion
							})
						]
					}), issue.fix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "mt-3 min-h-11",
						variant: "secondary",
						"data-testid": `qa-fix-${issue.check}`,
						onClick: () => {
							jump(issue);
							fixOne(issue);
						},
						children: issue.fixLabel || "一鍵修正"
					}) : null]
				}) }, issue.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "修正前會先存一版「修正前 · 品質檢查」，可在版本列表還原。"
			})
		]
	});
}
//#endregion
export { QualityPanel as t };
