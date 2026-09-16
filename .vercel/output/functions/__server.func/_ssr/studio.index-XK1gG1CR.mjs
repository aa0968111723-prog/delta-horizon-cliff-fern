import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { F as resolveProjectId, H as Button, V as useStudio } from "./studio-store-BWfSiXeC.mjs";
import { F as FolderKanban } from "../_libs/lucide-react.mjs";
import { v as Link, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as EmptyState } from "./router-Dh2P_fa6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio.index-XK1gG1CR.js
var import_jsx_runtime = require_jsx_runtime();
function StudioIndex() {
	const hydrated = useStudio((s) => s.hydrated);
	const lastProjectId = useStudio((s) => s.lastProjectId);
	useStudio((s) => s.projects);
	if (!hydrated) return null;
	const id = resolveProjectId(lastProjectId);
	if (id) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/studio/$projectId",
		params: { projectId: id }
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto flex w-full max-w-lg flex-col px-4 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: FolderKanban,
			title: "還沒有可編輯的專案",
			description: "先從首頁建立作品，或用 AI 助手寫一份活動需求。",
			action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap justify-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "回首頁"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/assistant",
						children: "開啟助手"
					})
				})]
			})
		})
	});
}
//#endregion
export { StudioIndex as component };
