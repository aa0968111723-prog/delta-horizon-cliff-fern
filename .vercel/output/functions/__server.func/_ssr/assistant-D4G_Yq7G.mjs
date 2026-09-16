import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { K as useStudio } from "./empty-state-DJ_-9JB5.mjs";
import { c as AssistantForm } from "./router-C_PWIgcC.mjs";
import { t as PageHeader } from "./page-header-CMQAVVTL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assistant-D4G_Yq7G.js
var import_jsx_runtime = require_jsx_runtime();
function AssistantPage() {
	const lastProjectId = useStudio((s) => s.lastProjectId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "AI 助手",
			title: "畫布與企劃",
			description: "對目前編輯器下指令（放大標題、換圖、改尺寸），或填活動需求生成企劃。大幅修改會先預覽，每次操作都可撤銷。"
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
