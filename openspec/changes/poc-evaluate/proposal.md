# Proposal

## Why

產生器要靠分數挑版型,表單要顯示分數,skill 要讀報告判斷怎麼改,所以「評分 + 報告」是後面所有東西的地基。POC 1 已證明估算公式與瀏覽器一致,POC 2 就在它上面建一套 Lighthouse 式的評分:每個項目判定合格、警告或不合格,8 個面向各 0~100 分,附改善建議。

## What Changes

- `poc/evaluate/`:
  - **JSON 估算的項目**:第 2 層的末列不落單、區塊長度、標題行數、欄底對齊、填充率、列距,第 3 層的手機首屏、間距節奏、同型不連續、區塊數、整頁則數、單塊不重複、放大型不相鄰、用途則數、欄高。另有一項 POC 新增的「輪播填滿」。
  - **渲染量測的項目**:圖片顯示比例、同列對齊、欄寬照格線、觸控目標、水平捲動,用 POC 1 的渲染器與 Playwright 量。
  - **計分**:每個面向 100 分起算,不合格扣 30、警告扣 10;總分是 8 個面向的平均。
  - **報表**:`report.json`(給 skill 與程式讀)、`REPORT.md`、Lighthouse 式的 `report.html`(分數圓環、項目清單、改善建議、截圖)。
- 指令:`npm run poc:2`。

## Capabilities

### New Capabilities

無(POC,`skip_specs: true`)。結論併入第 2、4 階段的 change。

### Modified Capabilities

無。

## Impact

- 依據:`openspec/specs/template-evaluation`、`page-evaluation`、`evaluation-report`、`render-measurement`。
- 只新增 `poc/evaluate/` 與 `package.json` 的指令,不影響 CI。
