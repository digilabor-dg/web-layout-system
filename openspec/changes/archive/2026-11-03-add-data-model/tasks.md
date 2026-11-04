# Tasks

## 1. 專案骨架

- [x] 1.1 package.json、tsconfig、ESLint、Vitest、.gitignore。驗證:`npm run lint`、`npm run typecheck` 通過。
- [x] 1.2 GitHub Actions `ci.yml`(Node 20、22)。驗證:PR 的 CI 綠燈。

## 2. Schema 與預設參數組

- [x] 2.1 `schemas/` 9 種 prototype 加共用定義與預設參數組 schema。驗證:Ajv 嚴格模式編譯成功,範例資料全部通過。
- [x] 2.2 `presets/` bs5、tw4、md3。驗證:`tests/model` 的裝置分類與內容寬度 fixture 通過。

## 3. 範例資料

- [x] 3.1 網站設定、標籤、分組、38 型、7 種內容類型。驗證:`tests/sample-data.test.ts` 與 spec 表格逐欄比對通過。
- [x] 3.2 首頁 13 個範本與實例、61 則示意新聞。驗證:代號推算為 A~M、61 則、9 種型。

## 4. 第 1 層規則與 CLI

- [x] 4.1 核心:schema 驗證、索引、25 條規則、排序。驗證:`tests/rules.test.ts` 每條規則的合法與不合法案例通過。
- [x] 4.2 CLI `npm run validate`:`--json`、`--strict`、結束代碼。驗證:`tests/cli.test.ts`;範例資料 0 錯誤 0 警告。
- [x] 4.3 公開入口 `src/index.ts` 與 `exports`。驗證:`tests/core-library.test.ts`(核心沒有 `node:` import)。

## 5. 文件

- [x] 5.1 README 標題改為 web-layout-system。驗證:`head -1 README.md`。

## Workflow follow-up

- archive 本 change,接著做 POC 1(估算 vs 渲染)。
