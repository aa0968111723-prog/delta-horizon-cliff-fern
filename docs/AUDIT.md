# Phase 1 — 現有 Repository Audit

> 目標：在保留可用架構的前提下，把「構幀（日食咖啡 IG 網宣工作站）」收斂成
> **淡江大學禪學社 AI Creative Marketing Studio**。本文件記錄現況、保留 / 重構 / 重命名決策。

## 1. 現有架構（保留）

| 層 | 位置 | 狀態 | 決策 |
| --- | --- | --- | --- |
| 路由 | `src/routes/*` (TanStack Start file routes) | 可用 | 保留；新增 `/campaigns`、`/create`、`/calendar`、`/instagram`、`/connections`、`/search` |
| Shell | `src/components/shell/app-shell.tsx` | 可用（5 tab 底部導覽 + 桌面側欄） | 重構：底部 首頁 / AI 創作(中央＋) / 排程 / 素材 / IG |
| 狀態 | `src/stores/studio-store.ts` (zustand persist, IndexedDB 素材) | 可用、完整 | 保留全部畫布 / 專案邏輯；新增 `campaigns`、`contents`、`brandMemory`、`connections` slice |
| 畫布編輯器 | `src/components/editor/*`, `src/lib/studio/layout.ts`, `layers.ts`, `geometry.ts` | 可用、成熟 | 完整保留（IG 4:5 / 1:1 / 1.91:1 / Story / Reels Cover） |
| 品牌 | `src/components/brand/brand-editor.tsx`, `src/lib/studio/brand.ts` | 可用 | 保留 UI；`BrandKit` 延伸 **Brand Memory**（龜龜、三色光、社團理念、固定介紹、喜歡/不喜歡風格） |
| 素材 | `src/components/assets/*`, `src/lib/studio/assets*.ts` | 可用 | 保留；分類重定義為 AI Creative Library（Logo / 龜龜 / 活動照片 / 社員 / 校園 / 淡水 / 海報 / 背景 / AI 生成 / IG / Story / Reels / 歷屆） |
| AI 企劃 | `src/lib/ai/campaign.ts` (xAI grok-4.5 + 本機 mock) | 可用 | 保留 adapter 模式（live / mock）；prompt 改為淡江禪學社 + 淡江學生情境；新增 Copy AI / Campaign Generator / 學生模擬 / 視覺方向 / 內容轉換 |
| AI 編輯代理 | `src/lib/ai/edit.ts`, `execute.ts`, `actions.ts` | 可用 | 保留（畫布指令） |
| 品質檢查 | `src/lib/studio/quality*.ts`, `src/components/qa/*` | 可用 | 保留 |
| 輸出 | `src/components/export/*`, `src/lib/studio/export-png.ts` | 可用 | 保留 |
| 平台檔 | `public/__grok/`, `server/`, `scripts/`, `src/lib/auth`, `src/lib/db.ts`, `src/lib/app-data` | 平台預接 | 不動；auth / db 依 §0.5 維持 OFF（localStorage） |

## 2. 需重命名 / 重定位

- 產品名「構幀」→「**禪光 Studio**」（淡江大學禪學社 AI Creative Marketing Studio）。
- Seed 品牌 `日食咖啡` → `淡江大學禪學社`（handle `@tku.zen`），seed 專案改為禪學社示範內容。
- `ProjectStatus` `draft / ready / exported` 保留給畫布專案；**內容狀態**新增 `ContentStatus`：想法 / 創作中 / 完成 / 已排程 / 已發布。
- `CampaignGoal`（awareness / traffic / conversion / ugc）保留作相容，UI 文字改為社團語言（讓人認識 / 來活動 / 報名 / 互動）。
- Storage key `kouzhen-studio-v1` → `tku-zen-studio-v1`（舊資料不載入、不刪除）。

## 3. 資料流需重新串接

1. **Campaign → Content → Project**：Campaign（活動）產生多波 Content（內容）；每則 Content 可對應一個畫布 Project（延用既有 `createProject` + `applyCampaignPlan`）。
2. **Brand Memory → 所有 AI 呼叫**：`toBriefInput` 之外新增 `brandMemoryContext()`，每次生成前先讀。
3. **淡江情境 → AI**：`src/lib/zen/context.ts` 依日期推斷學期階段（開學 / 期中 / 期末 / 假期）、淡水季節，供 prompt 與本機生成使用。
4. **來源標示**：Content / 生成結果帶 `sources[]`（Google Drive / Canva / Instagram / AI Generated / 本機素材）。

## 4. 缺失功能（Phase 2–15 補足）

- 首頁「今天可以創作什麼」；Campaign 系統；IG Copy AI（Hook / 正文 / CTA / Hashtags，6 種語氣）；Campaign Generator（宣傳主軸 / 3 方向 / 發布節奏）；反向學生模擬；一鍵轉換（Carousel / Story / Threads / LINE / Reels Script）；AI Image Studio（視覺方向 A/B/C、多尺寸）；圖片理解；Calendar；Instagram Center（Grid / Feed Preview）；Connection Center（Drive / Canva / IG 官方 OAuth）；Global Creative Search；成效回饋。

## 5. 不做的事

負責人 / 審核人 / Approve / Reject / 多人權限 / 團隊通知 / 企業 Dashboard / 大型報表 / 爬蟲式 IG。
