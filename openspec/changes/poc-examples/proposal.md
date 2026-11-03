# Proposal

## Why

評估系統(POC 2)要能當作證據,光有分數還不夠,要證明兩件事:它抓得到問題;依建議修改後,分數真的會變好。所以做 10 個頁面範例,每個都有 V1(改善前)與 V2(改善後),由程式自動驗收。

## What Changes

- `poc/examples/cases/`:10 個範例,每個以 `data/` 為基礎,用 JSON Patch 描述 V1 與 V2。
  - 01~06:基準首頁本來就有的問題,一個範例修一種。
  - 07~09:V1 刻意製造問題(則數太多、頭條重複、區塊太多),V2 回到原樣。
  - 10:貪婪法從 8 個候選改法中逐步組合(`greedy.ts`,結果可重現)。
- `run.ts`:兩版都跑第 1 層檢查與完整評估(JSON 估算 + 渲染量測),並自動驗收:
  1. 兩版都沒有第 1 層錯誤。
  2. V2 總分高於 V1。
  3. 目標在 V1 有問題、V2 合格;`項目@代號` 以穩定參照追蹤,不怕區塊搬動後代號重排。
  4. V2 沒有新的不合格。
- 產出 `REPORT.md`、`report.html`(before/after 對照)、`screenshots/`。
- 指令:`npm run poc:examples`、`npm run poc:greedy`。

## Capabilities

### New Capabilities

無(POC,`skip_specs: true`)。

### Modified Capabilities

無。

## Impact

- 依據:`openspec/specs/improvement-suggestions`(候選改法、貪婪法)、`evaluation-report`。
- 過程中修正了 POC 的兩個地方:評分結果加上穩定參照 `ref`;渲染器的「更多」連結補上 `min-width: 44px`(評估器抓到的渲染器 bug)。
