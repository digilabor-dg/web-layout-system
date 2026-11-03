# Tasks

## 1. JSON 估算的評分(驗收條件)

- [x] 1.1 涵蓋規格裡全部 15 項可由 JSON 估算的項目。驗證:`evaluate.test.ts`「涵蓋規格裡全部可由 JSON 估算的項目」。
- [x] 1.2 抓到 POC 1 截圖上肉眼看到的問題:F、G、H 同型連續;I 填充率;M 輪播填滿;section 欄高。驗證:`evaluate.test.ts`。
- [x] 1.3 門檻邊界正確(合格、警告、不合格的分界點)。驗證:`evaluate.test.ts`「門檻邊界」。
- [x] 1.4 確定性。驗證:`npm run poc:2 -- --check-determinism`。

## 2. 渲染量測與 Lighthouse 式報表(驗收條件)

- [ ] 2.1 渲染項目:圖片顯示比例、同列對齊、欄寬照格線、觸控目標、水平捲動,6 種寬度都量。驗證:報表的「比例」「可用性」面向有分數。
- [ ] 2.2 `report.html`:總分與 8 個面向的分數圓環、不合格與警告項目、改善建議、截圖;390px 手機寬度也能閱讀。驗證:親自檢查截圖。
- [ ] 2.3 `report.json` 的格式固定,作為日後 skill 與 MCP 的輸出格式。驗證:schema 測試。

## Workflow follow-up

- 不 archive:等使用者看過報表再決定。
