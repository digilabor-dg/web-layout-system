# core-library Specification

## Purpose
核心函式庫:規則檢查與模型計算的程式本體。只吃 JSON、回傳結果,不讀檔、不依賴 Node 專屬 API,所以 CLI 與其他介面都只是外層,也能在瀏覽器或其他執行環境使用。

## Requirements

### Requirement: 公開入口

核心 SHALL 以 `src/index.ts` 為唯一公開入口(package.json 的 `exports["."]`),匯出模型型別、比例與網站設定的計算、版位代號推算、`validateDataset`,以及內建的 schema 與預設參數組。讀檔工具 SHALL 另外放在 `src/node/`(`exports["./node"]`)。

#### Scenario: 外部程式檢查資料

- **WHEN** 外部程式從公開入口 import `validateDataset`、`SCHEMAS`、`PRESETS`
- **THEN** 不需讀檔就能對記憶體中的資料集執行第 1 層檢查

### Requirement: 不依賴執行環境

`src/model/`、`src/validate/` 與 `src/index.ts` MUST NOT import `node:` 開頭的模組或任何讀檔、網路、時間、亂數相關的 API。資料集、schema 與預設參數組一律由呼叫端傳入。

#### Scenario: 檢查核心的 import

- **WHEN** 掃描核心目錄的 import
- **THEN** 沒有任何 `node:` 模組
