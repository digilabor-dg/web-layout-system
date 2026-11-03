# Proposal

## Why

`resolve-spec-ambiguities` 的 P1 決定:規格的唯一依據改為 `openspec/specs/`,而且一次全搬。目前需求散在 `docs/spec/01~05` 的說明文字和表格裡,決策紀錄又在另一份 design.md。本 change 把兩者合併,改寫成可驗收的 SHALL 條文和情境,之後每個階段的 change 都以這些 capability 為基準。

## What Changes

- 新增 17 個 capability spec,內容來自 `docs/spec/01~05`,以及 archive 中 `2026-11-03-resolve-spec-ambiguities/design.md` 的決定。
- 決策紀錄裡已改寫的地方,以決定為準。例如:影片角色 `video`、圖片允許清單、section、版位代號由位置推算、`bs5`/`tw4`/`md3` 預設參數組、平板由程式推算。
- 規格沒寫、但條文必須寫明的地方,由 Claude 補上詮釋,集中列在 design.md 的「Claude 補充的詮釋」,待使用者確認。
- 不搬的內容:延伸應用領域表、需要的知識、上線後驗證、mermaid 圖。這些屬於發想或背景說明,留在 `docs/spec/` 當參考。

## Capabilities

### New Capabilities

| Capability | 內容 | 實作階段 |
| --- | --- | --- |
| `site-profile` | 網站設定:媒體類型、主比例、裝置分類、預設參數組、格線、字體、測試寬度 | 1 |
| `layout-patterns` | 展示類型:7 個屬性、標籤與分組、38 型清單、slot 與圖片角色、響應式 | 1 |
| `content-model` | 內容類型與新聞則 | 1 |
| `image-ratio-policy` | 圖片比例規範 | 1(資料)、3~4(顯示) |
| `block-composition` | 區塊範本、選稿規則、區塊實例與覆寫 | 1 |
| `page-layout` | 頁面、section、版位代號、裝置差異 | 1 |
| `sample-data` | 範例站、首頁 A~M 與示意新聞 | 1 |
| `rule-check` | 第 1 層規則檢查與 `npm run validate` | 1 |
| `height-estimation` | 高度估算公式 | 2 |
| `template-evaluation` | 第 2 層範本量測項目與門檻 | 2(估算)、4(渲染) |
| `page-evaluation` | 第 3 層頁面檢查與版面平衡 | 2 |
| `evaluation-report` | 判定方式、8 個面向、報告與分數 | 2(JSON)、4(HTML) |
| `html-rendering` | 頁面 JSON 轉 HTML | 3 |
| `render-measurement` | Playwright 在 6 種寬度量測 | 4 |
| `improvement-suggestions` | 候選改法、公式試算、貪婪法 | 5 |
| `ai-review` | AI skill 的分工與限制 | 6 |
| `layout-generation` | 版面生成:貪婪法、集束搜尋 | 7 |

### Modified Capabilities

無(目前 `openspec/specs/` 是空的)。

## Impact

- 依據:`docs/spec/01-architecture.md`、`02-data-structure.md`、`03-acceptance.md`、`04-evaluator.md`、`05-examples.md` 全部章節,以及決策紀錄。
- 本 change 只寫規格,不寫程式。archive 後,`openspec/specs/` 會包含第 2~7 階段尚未實作的需求。各階段實作時,若與規格不符,用 MODIFIED 修正。
- `docs/spec/` 內容不動,改為參考資料。
