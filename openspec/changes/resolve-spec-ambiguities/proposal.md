# Proposal

## Why

第 1 階段(資料模型)要把 `docs/spec/` 寫成 JSON Schema、範例資料和第 1 層規則檢查。但規格有幾處互相矛盾,也有幾處沒寫。CLAUDE.md 規定「規格沒寫或互相矛盾時,先停下來問」,所以開工前先把這些問題一次問清楚,答案寫回規格,第 1 階段才有明確依據。

## What Changes

- 在 `design.md` 列出 15 個待決問題,分成三組:
  - **P 流程**(2 題):`docs/spec/` 與 `openspec/specs/` 的分工、開發階段怎麼對應 change。
  - **A 矛盾**(4 題):規格之間互相衝突的地方。
  - **B 未定義**(9 題):規格沒寫、但第 1 階段一定要決定的地方。
- 每題附上出處、選項和建議做法,並留一個「回答」欄給使用者填。
- 使用者回答後,依答案修改 `docs/spec/01-architecture.md`、`02-data-structure.md`、`03-acceptance.md` 的相關段落。
- 本 change 不寫程式,也不新增或修改任何系統需求。系統需求留到第 1 階段的 change 再寫成 spec delta,所以設定 `skip_specs: true`。

## Capabilities

### New Capabilities

無。本 change 只做決策與規格文件修訂(`skip_specs: true`)。

### Modified Capabilities

無。

## Impact

- 依據:`docs/spec/01-architecture.md`(展示類型表、內容類型、圖片比例規範、首頁版位配置)、`02-data-structure.md`(範例、檢查規則、評估用的補充欄位)、`03-acceptance.md`(第 1 層規則檢查)、`04-evaluator.md`(版面生成的階段編號)。
- 影響文件:`docs/spec/` 的上述檔案,以及 CLAUDE.md 的流程說明(視 P1、P2 的答案而定)。
- 程式與相依套件:沒有影響。
- 本 change archive 之後,才開第 1 階段的 change。
