# 淡江大學禪學社 AI Creative Marketing Studio — 現況 Audit

日期：2026-09-16  
基準版本：`8a76574`（Export from Grok）

## 結論

現有專案不是需要重做的空殼，而是一套可延續的 local-first Instagram 創作工作站。核心引擎已經具備畫布、跨尺寸排版、Carousel、品牌規範、素材庫、AI Campaign 草案、版本、品質檢查與圖片匯出。正確策略是保留這套創作核心，逐步替換錯誤的通用品牌語意、補上淡江學生情境與多模態能力，再新增官方第三方連接與內容排程邊界。

目前最大的產品錯位是：首頁與導航仍偏作品管理、Seed 是「日食咖啡」、AI Prompt 是一般台灣品牌、素材與內容只存在瀏覽器，且尚無真正的圖片理解／生成、Calendar、Instagram Graph API、Canva API 或跨來源 Creative Memory。

## 現有頁面與功能

| 頁面 | 路由 | 現況 | 判斷 |
| --- | --- | --- | --- |
| 首頁 | `/` | 最近作品、草稿、模板、品牌資產 | 保留資料來源，重構為「今天可以創作什麼」 |
| AI 助手 | `/assistant` | Brief → AI／本機 Campaign Plan → 畫布 | 保留生成管線，重新定位為 AI 創作 |
| Studio | `/studio/$projectId` | 畫布、圖層、格式、Carousel、文案、版本、QA | 核心資產，完整保留並漸進強化 |
| Assets | `/assets` | 上傳、分類、搜尋、收藏、使用狀態、放入畫布 | 保留，演進為 AI Creative Library |
| Brand | `/brand` | 多品牌、Logo、色票、字體、語氣、CTA、禁用規則 | 保留模型，前台收斂為單一社團 Brand Memory |
| Export | `/export` | PNG/JPEG 匯出、品質檢查、匯出紀錄 | 保留；後續補內容包與平台流程 |

路由由 `src/routes/*` 組成；全域殼層在 `src/components/shell/app-shell.tsx`；`AuthProvider` 與 `PreviewHostBridge` 契約正確保留於 `src/routes/__root.tsx`。

## 現有資料流

### 創作資料

`BriefFields` → `generateCampaignPlan` → `CampaignPlan` → `applyCampaignPlan` → `buildCampaignBoards` → `Project.slides/artboards` → Studio 編輯 → QA → Export。

這條端到端資料流已可用，應作為後續 Campaign Generator、IG Copy AI 與一鍵轉格式的主幹。

### 狀態與檔案

- `src/stores/studio-store.ts`：Zustand persist，保存 Brand、Asset metadata、Project 與最近專案。
- `src/lib/studio/assets-idb.ts`：IndexedDB 保存圖片 Blob。
- `src/lib/studio/asset-storage.ts`：已預留可替換 Storage adapter，但目前只有 local backend。
- Undo/redo 只在記憶體；Snapshots、Plan versions、Export metadata 會持久化。

這套 local-first 架構符合單人創作，但不等於跨裝置 Creative Brain。官方來源同步與安全 token 必須建立獨立 server-side 邊界，不能塞進 localStorage。

### AI

- `src/lib/ai/campaign.ts`：有 `XAI_API_KEY` 時使用 xAI chat JSON；否則明確回退本機 mock。
- `src/lib/ai/edit.ts`：文字指令轉為結構化畫布 actions。
- `src/lib/ai/execute.ts`：執行 actions 並寫入 Studio store。
- `src/lib/ai/mock.ts`、`edit-mock.ts`：可離線運作的規則草案。

目前不是多模態：模型只讀文字 Brief 或序列化畫布 JSON，不會讀圖片像素；也沒有圖片／影片生成 API。

## 可直接保留

1. `src/lib/studio/layout.ts`、`adapt.ts`、`formats.ts`：IG 尺寸與跨格式排版。
2. `src/lib/studio/carousel.ts`：Carousel 頁面角色與補全邏輯。
3. `src/lib/studio/quality.ts`、`quality-fix.ts`：視覺 QA 與自動修正。
4. `src/lib/studio/export-png.ts`：瀏覽器圖片輸出。
5. `src/lib/studio/brand.ts`、`copy.ts`、`brief.ts`：品牌、文案、Brief 基礎模型。
6. `src/lib/ai/schema.ts`、`apply.ts`、`actions.ts`：AI 結構化輸出與畫布 action DSL。
7. Studio editor、Carousel preview、Assets upload、Brand editor、版本與匯出 UI。

## 需要重構或重新命名

1. 首頁從 Project Dashboard 改為創作入口與內容節奏首頁。
2. 「助手」改為「AI 創作」；「編輯」改為「Studio」；行動底部導航改為首頁／AI 創作／排程／素材／IG。
3. 多品牌 CRUD 前台收斂為固定的淡江大學禪學社 Brand Memory；底層 `brandId` 暫留以避免破壞 Project schema。
4. `ProjectStatus` 從 `draft/ready/exported` 漸進遷移為想法／創作中／完成／已排程／已發布。
5. `Brief` 擴充活動日期、類型、CTA、報名連結與淡江學生情境；不要加入負責人、審核人。
6. 拆分約 1,100 行的 `studio-store.ts`，但必須在資料 migration 與測試覆蓋後進行。
7. 合併 AssistantForm 與 PlannerPanel 的重複 Campaign 生成 orchestration。
8. 將 `execute.ts` 對全域 store 的直接依賴改為注入式 adapter，保留 action schema。

## 缺失能力與新資料邊界

| 能力 | 現況 | 新邊界 |
| --- | --- | --- |
| AI 圖片生成／Vision | 無 | user-initiated server functions、檔案輸入、用量限制、generated asset metadata |
| Campaign 系統 | Plan 已存在，但 Project 即 Campaign | 新增活動與 content waves，不建立 team workflow |
| Calendar | 只有 Brief 自由文字時間 | Content item、planned/published time、月／週／agenda |
| Google Drive | 平台 connector helper 與 types 存在，產品未串接 | server-side connector calls、來源 metadata、同步狀態 |
| Canva | 完全沒有 | 官方 OAuth/API adapter、design reference metadata |
| Instagram | 只有輸出格式，沒有 API | 官方 Meta OAuth/Graph API、Profile/media/insights memory |
| Global Search | 只有本機字串搜尋 | 統一 SourceRef 與 provider search adapter |
| Creative Memory | 無 | 對來源、分析、標籤、引用建立可追溯索引 |

所有第三方 token 必須只存在 server-side、可 refresh/revoke、不得進前端 bundle、localStorage、console 或 repository。正式串接前須確認官方 API 權限與部署環境，不以爬蟲、Cookie 或模擬登入替代。

## 已確認問題

1. `src/lib/studio/seed.ts` 仍是日食咖啡，與產品客群完全不符。
2. Seed metadata 引用 `/seed/cup.jpg`、`/seed/beans.jpg`，但 public 只有 `nisshoku-mark.svg`；錯誤被 hydration 靜默吞掉，預設畫布會缺圖。
3. `CampaignPlan.assetNeeds` 只顯示，未連到素材搜尋、上傳或生成。
4. AI `replace-image` 只換現有本機素材，不是圖片生成。
5. Export history 只存 metadata，不能重新下載。
6. AI server functions 尚無產品層用量限制；公開部署時有 owner quota 濫用風險。
7. Auth、app-data、multiplayer 有大量預置程式，但 auth/database 目前明確關閉，且產品 UI 未使用；不可把它們誤當成已完成的連接功能。

## 漸進開發順序

1. 修正 Seed、品牌語意、AI Prompt、首頁與行動導航，先完成淡江禪學社專用的可玩垂直切片。
2. 在既有 `Project/CampaignPlan` 上建立 Campaign 與 Content item，完成文案、Hook、學生視角檢查與一鍵轉格式。
3. 增加 AI Image/Vision server boundary，生成結果寫回既有 AssetStorage 與畫布。
4. 將 Assets 與 Brand 擴充為 Creative Library／Brand Memory，加入可追溯 `SourceRef`。
5. 逐一建立 Drive、Canva、Instagram 官方 adapter；每個都先具備 connection state、sync、revoke 與來源標示。
6. 用統一 provider interface 建立 Global Creative Search 與 Creative Brain。
7. 新增 Calendar、IG Preview、歷史內容、成效回饋與內容節奏建議。
8. 全程維持單人模型，最後對 375／390／430px、typecheck、build、dev 與 production 瀏覽器進行完整驗證。

## Phases 8–15 現況（2026-09-16 延續）

這不是結案清單。產品目標仍未完成；以下只記錄目前程式邊界。

| Phase | 產品能力 | 現況 | 尚未在這個環境證明的事 |
| --- | --- | --- | --- |
| 1–7 | 淡江語意、Campaign、Copy、多模態、Brand Memory、素材庫 | 單人創作主幹已在跑：首頁節奏、AI 創作、Studio、素材、Brand、Export。一人網宣流程（活動→文案→畫面→預覽→排程→匯出）會把目前活動寫進 AI 創作 Brief 與畫面想法。Copy／圖片／Campaign 生成會注入校園情境、近期活動、已分析素材、Canva 風格與 IG hashtags | 真實 xAI 圖片／Vision 依部署金鑰；跨裝置同步仍是本機 |
| 8 Canva | 官方 Connect OAuth PKCE、搜尋／最近設計、metadata 風格摘要寫入 Brand Memory、Autofill 不假裝 | 已有 server-only secrets、unavailable 卡片、複製 brief、風格參考可寫入規律；「當成生成參考」會打開素材庫 Image Studio | 真實 Canva OAuth、真實設計列表、視覺像素分析、Enterprise Autofill |
| 9 Instagram | Graph / Instagram Login OAuth PKCE + refresh、加密 httpOnly cookie | 已有官方授權 URL、nested token 解析、Insights 權限另開 | 真實 IG OAuth、真實貼文同步 |
| 10 Creative Brain | 跨素材庫 + Drive + Canva + IG + Copy Pack + Brand Memory 搜尋 | 本機索引即時搜；校園情境／語氣／標語／畫面規則會被搜到；點記憶會打開 Brand Memory 該頁；已連接來源需使用者主動搜尋；Drive 僅在 loginRequired+loginUrl 顯示 Continue with Grok。Drive 檔案可「加入素材庫參考」，沒有原圖像素時不能放到畫布 | 真實 Drive／Canva／IG 回傳 |
| 11 Calendar | 月／週／議程、改期、AI 節奏 | 手機 375–430 預設議程，可切本週；從節奏開 AI 會把該則內容連到新作品；已完成作品可去 IG 預覽 | — |
| 12 IG Preview | Studio 畫面套進手機預覽 | 貼文／限動／Reels 框不同、Carousel 可滑、預設學生版 Caption、Reels 有播放示意、`#preview` 會打開預覽頁、不顯示假讚數／觀看次數 | 不是發文 |
| 13 Reels | 腳本 + 9:16 封面 | 封面可進素材庫並放到 Studio Reels 封面；沒腳本時導去 Copy Studio；封面生成帶入 Creative Memory | 真實 AI 封面需 xAI；不能直接上傳 IG |
| 14 Insights | 僅專業帳號授權後顯示 | 無 grant 時誠實 unavailable；有官方列才能寫入 Brand Memory | 真實 insights 數字 |
| 15 Mobile | 375／390／430 | Brand Memory 單頁切換、流程條可橫滑、連接／Brand／IG 分頁 tap ≥44px；需以瀏覽器再驗 | — |

## Phase 1 驗收

- [x] 路由、頁面、元件、Stores、Studio、Assets、Assistant、Brand、Export 已盤點。
- [x] Live AI、mock、local persistence、auth/database 與第三方整合現況已查證。
- [x] 可保留、需重構、可重新命名、缺失能力與安全邊界已分類。
- [x] 已確認不應重寫專案，後續以現有 creative kernel 為基礎。
