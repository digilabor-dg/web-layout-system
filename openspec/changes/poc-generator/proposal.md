# Proposal

## Why

評估系統(POC 2)已能告訴我們版面哪裡不好;下一步是反過來,由參數產生版面,並用評估分數挑出最好的組合。這是規格 `layout-generation`(貪婪法、集束搜尋)與 `improvement-suggestions` 的最小可用版本,也是之後 skill「改參數 → 重跑」的基礎。

## What Changes

- `poc/generator/`:
  - `params.schema.json`:參數格式(區塊與順序、側欄、全寬、欄比、預設參數組、搜尋策略)。
  - `generate.ts`:組 section、每塊的合法選項、分配新聞、目標函數、貪婪法與集束搜尋。
  - `run.ts`:輸出產生的資料、搜尋紀錄、完整評估報表與截圖。
  - `form.html`:參數表單,填完產生 JSON。
  - `params/`:4 組範例參數,其中一組由表單產生。
- 指令:`npm run poc:generate`。

## Capabilities

### New Capabilities

無(POC,`skip_specs: true`)。

### Modified Capabilities

無。

## Impact

- 依據:`openspec/specs/layout-generation`、`improvement-suggestions`、`evaluation-report`。
- 原本規劃的 POC 4(表單)併入本 change,讓 active change 維持在 5 個以內。
