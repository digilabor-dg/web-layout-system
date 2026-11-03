# POC 2:Lighthouse 式評估系統

對一個頁面跑第 2、3 層的 21 個項目,8 個面向各 0~100 分,輸出 JSON、Markdown 與 HTML 報表。

```bash
npm run poc:2
```

```bash
npm run poc:2 -- 資料目錄 --json-only
```

```bash
npm run poc:2 -- --check-determinism
```

- `--json-only`:只跑 JSON 估算,不開瀏覽器;比例與可用性不給分。

## 產出

| 檔案 | 用途 |
| --- | --- |
| `report.json` | 給程式、skill 與日後的 MCP 讀;格式見 `report.schema.json` |
| `report.html` | Lighthouse 式報表:分數圓環、改善建議、依面向列出的項目、截圖 |
| `REPORT.md` | 同內容的 Markdown |
| `screenshots/` | 390px 與 1280px 截圖 |

## 項目

| 來源 | 項目 |
| --- | --- |
| JSON 估算(第 2 層) | 末列不落單、區塊長度、標題行數(含疊字)、欄底對齊、填充率、列距、輪播填滿(POC 新增) |
| JSON 估算(第 3 層) | 手機首屏、間距節奏、同型不連續、區塊數、整頁則數、單塊不重複、放大型不相鄰、用途則數、欄高 |
| 渲染量測 | 圖片比例、同列對齊、欄寬照格線、觸控目標、水平捲動 |

## 計分

- 每個面向 100 分起算,不合格扣 30、警告扣 10。
- **一個項目只扣一次**,取最差的對象;有問題的對象全部列在明細裡。這和 Lighthouse 相同,分數不會因為區塊多就被放大。
- 總分是 8 個面向的平均。
- 整頁判定:任一項目不合格,或 3 個以上項目警告,即為不合格。
- 權重是經驗值,之後用數據校正。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `checks.ts` | 門檻判定(純函式) |
| `evaluate.ts` | JSON 估算的項目、合併最差結果、計分 |
| `render-audit.ts` | 渲染量測的 5 個項目 |
| `report-html.ts` | HTML 報表 |
| `run.ts` | 主程式 |
