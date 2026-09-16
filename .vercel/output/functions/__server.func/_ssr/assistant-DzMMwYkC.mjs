import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { X as useStudio } from "./studio-store-BqpaoTm7.mjs";
import { m as AssistantForm } from "./router-CCaD8IgA.mjs";
import { t as PageHeader } from "./page-header-DBPXqJkr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assistant-BwZOU59U.js
var import_jsx_runtime = require_jsx_runtime();
function AssistantPage() {
	const lastProjectId = useStudio((s) => s.lastProjectId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "淡江禪學社 Creative Brain",
			title: "今天想創作什麼？",
			description: "從活動或一句想法開始。AI 會先代入淡江學生的生活，再生成 Hook、IG 文案、視覺方向、Carousel、Story 與 Reels 封面草案。"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantForm, {
				variant: "page",
				projectId: lastProjectId
			})
		})]
	});
}
//#endregion
export { AssistantPage as component };
