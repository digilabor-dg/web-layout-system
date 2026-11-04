# Proposal

## Why

第 1 階段(資料模型)要把規格寫成 JSON Schema、範例資料和第 1 層規則檢查。但 `docs/spec/` 有幾處互相矛盾,也有幾處沒寫。CLAUDE.md 規定「規格沒寫或互相矛盾時,先停下來問」,所以開工前先把這些問題一次問清楚,讓後續的 change 有明確依據。

## What Changes

- 在 `design.md` 列出 15 個待決問題,經兩輪問答後記錄成決定與理由。三組問題:
  - **P 流程**(2 題):規格的唯一依據放在哪裡、開發階段怎麼對應 change。
  - **A 矛盾**(4 題):規格之間互相衝突的地方。
  - **B 未定義**(9 題):規格沒寫、但第 1 階段一定要決定的地方。
- 依 P1、P2 更新 CLAUDE.md 與 `openspec/config.yaml` 的流程說明。
- 依 A4 修正 `docs/spec/04-evaluator.md` 的階段編號。
- 本 change 不寫程式,也不新增系統需求。依 P1 的決定,需求由下一個 change `migrate-docs-to-openspec` 一次寫成 spec,所以本 change 設定 `skip_specs: true`。

## Capabilities

### New Capabilities

無。本 change 只做決策(`skip_specs: true`)。

### Modified Capabilities

無。

## Impact

- 依據:`docs/spec/01-architecture.md`(展示類型表、內容類型、圖片比例規範、首頁版位配置)、`02-data-structure.md`(範例、檢查規則、評估用的補充欄位)、`03-acceptance.md`(第 1 層規則檢查、版面平衡)、`04-evaluator.md`(版面生成的階段編號)。
- 影響文件:CLAUDE.md、`openspec/config.yaml`、`docs/spec/04-evaluator.md` 的一個標題。
- 程式與相依套件:沒有影響。
