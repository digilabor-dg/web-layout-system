# Proposal

## Why

第 1 階段要把 `openspec/specs/` 裡資料模型相關的需求實作出來,做成整個系統的地基:JSON Schema 定義資料、範例資料當活範例、第 1 層規則檢查在存檔時就能抓出不合法的組合。後面的估算、渲染、評估與生成,都建立在這一層上。

## What Changes

- **專案骨架**:Node.js 20 以上、TypeScript、ES modules;Vitest、ESLint(flat config);GitHub Actions `ci.yml`,在 Node 20 與 22 跑 lint、型別檢查、測試與 `npm run validate -- --strict`。
- **`schemas/`**:9 種 prototype 的 JSON Schema(2020-12),包含評估用的補充欄位;另有共用定義與預設參數組的 schema。
- **`presets/`**:`bs5`、`tw4`、`md3` 三組預設參數組,註明出處。
- **`data/`**:144 個檔案。
  - 範例站:平面、3:2、bs5、欄距 1rem。
  - 38 種展示類型,推定的屬性以 `inferred` 標記。
  - 7 種內容類型。
  - 首頁 A~M 共 13 個範本與實例。
  - 61 則示意新聞。
- **核心函式庫**(`src/model/`、`src/validate/`、公開入口 `src/index.ts`):25 條第 1 層規則。核心不讀檔、不依賴 Node 專屬 API。
- **CLI**:`npm run validate [目錄] [--json] [--strict]`。
- **測試**:203 個。
  - 每條規則一份資料驅動的 fixture,以 JSON Patch 描述,可跨語言沿用。
  - 模型函式的 fixture。
  - 範例資料與 spec 表格逐欄比對。
- **README**:標題改為 web-layout-system。
- **規格調整**(見 specs delta):
  - 核心不寫死特定型的 id:分頁籤型看 `arrangement`、圖輯型看 `gallery`、16:9 縮圖看內容類型的 `requiresVideo`。
  - `columns` 改為 `{ width, blocks }` 的形狀。
  - CLI 輸出加上嚴重度欄,參數錯誤時 exit code 為 2。
  - 新聞則可選填 `summary`、`author`。
  - 新增 `core-library` capability。

## Capabilities

### New Capabilities

- `core-library`:核心函式庫的公開入口與「不依賴執行環境」的界線。

### Modified Capabilities

- `layout-patterns`:特殊則數改由屬性決定;新增推定欄位的標記。
- `content-model`:新聞則選填欄位;`requiresVideo`;圖輯範圍來自展示類型。
- `block-composition`:分頁數與實際則數改看 `arrangement`。
- `page-layout`:stack 的 `columns` 形狀。
- `site-profile`:預設參數組的存放方式。
- `rule-check`:規則說明配合上述調整;CLI 結束代碼與輸出;沒通過 schema 的資料如何處理。

## Impact

- 依據:`openspec/specs/` 的 `site-profile`、`layout-patterns`、`content-model`、`image-ratio-policy`(資料部分)、`block-composition`、`page-layout`、`sample-data`、`rule-check`。
- 新增相依套件:`ajv`、`ajv-formats`(MIT);開發用 `typescript`、`tsx`、`vitest`、`eslint`、`typescript-eslint`。
- 目前 package.json 的 `exports` 直接指向 `.ts`,使用端需要 TypeScript 載入器;發佈成 JS 套件的建置步驟留待之後。
