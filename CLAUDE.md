# CLAUDE.md

## 專案是什麼

新聞首頁區塊排版系統:用 JSON 定義版面,評估工具自動找出不平衡、留白、擁擠等問題,並提出改進建議。
**規格的唯一依據是 `openspec/specs/`**;規格沒寫或互相矛盾時,先停下來問,不要自行假設。
文件分三層:**發想(規格前)→ 規格 → wiki(規格後)**。
`docs/brainstorm/` 是規格之前的發想(pre-requirements),每份開頭寫狀態(發想、試驗中、已提案、已併入規格、擱置);決定要做時開 change,proposal 註明來自哪一份發想。`docs/research/` 是資料收集。
`docs/spec/` 是最初的設計說明 01~05,已全部搬進 `openspec/specs/`,參考用、不再更新。視覺範例在 `docs/catalog/index.html`。
`docs/wiki/` **以白話描述 `openspec/specs/`**(條文以 spec 為準):spec 有變動(archive)時,同步更新對應的 wiki 頁;`tests/wiki.test.ts` 會檢查每個 capability 都有白話說明。進度與證據(成果、範例、待確認)也在 wiki;數字頁由 `npm run docs:wiki` 產生。
`openspec/specs/` 共 18 個 capability(`openspec list --specs`);Claude 補充的詮釋見 `openspec/changes/archive/2026-11-03-migrate-docs-to-openspec/design.md`,待使用者確認。

| 檔案(`docs/spec/`,參考用) | 內容 |
| --- | --- |
| `docs/spec/01-architecture.md` | 架構、術語、38 種展示類型、響應式規則、圖片比例規範、首頁配置原則 |
| `docs/spec/02-data-structure.md` | 9 種 prototype 的 JSON 範例與檢查規則 |
| `docs/spec/03-acceptance.md` | 三層驗收標準、判定方式、版面平衡、報告格式 |
| `docs/spec/04-evaluator.md` | 兩段式評估、Lighthouse 式結構、改進建議、版面生成 |
| `docs/spec/05-examples.md` | 問題類型對照表與三個評估實例 |

## 技術選型

- Node.js 20 以上,TypeScript,ES modules。
- JSON Schema(Ajv)驗證資料;Vitest 測試;Playwright 做渲染量測(第 4 階段才用)。
- GitHub Actions 跑 lint、型別檢查與測試。

## 建議目錄

```
schemas/      9 種 prototype 的 JSON Schema
data/         範例資料:網站設定、38 種展示類型、內容類型、範本、頁面、實例、示意新聞
src/
  validate/   第 1 層規則檢查
  estimate/   高度估算公式
  evaluate/   第 2、3 層可由 JSON 估算的項目
  render/     把頁面 JSON 渲染成 HTML(第 3 階段)
  measure/    Playwright 渲染量測(第 4 階段)
  suggest/    候選改法與貪婪法(第 5 階段)
  generate/   版面生成,集束搜尋(第 7 階段)
  report/     JSON 與 HTML 報告
skills/       AI skill(第 6 階段)
tests/
```

## 開發階段

一次只做一個階段;每個階段完成後開一個 PR,PR 說明列出完成項目、測試結果與未決問題。

1. **資料模型**:9 種 JSON Schema、範例資料(首頁 A~M 共 13 個版位)、第 1 層規則檢查 CLI(`npm run validate`)、測試、CI。
2. **JSON 估算評估**:高度公式、第 2 與第 3 層可估算的項目、JSON 報告(`npm run evaluate`)。
3. **渲染器**:頁面 JSON 轉 HTML,樣式參考 `docs/catalog/index.html`。
4. **渲染評估**:Playwright 在 6 種測試寬度量測,輸出 HTML 報告(含各面向 0~100 分)。
5. **改進建議**:候選改法、公式試算、貪婪法,只對前 3 名渲染驗證。
6. **AI skill**:讀報告與截圖,判斷不平衡是否刻意,寫出建議。
7. **版面生成**:集束搜尋;仿生演算法暫不做。

**持續主線:人評對齊(雙評分)**。從第 2 階段起持續進行:每個階段都用真人評分(以及 `agents/` 的 AI 擬人評分)校正評估器;A/B 一致率、反饋覆蓋率、程式分數與人評的等級相關,列為各階段的驗收指標之一。工具在 `poc/rating/`(檢視與評分)、`poc/feedback/`(覆蓋率),流程見 `skills/layout-tuner/SKILL.md`。正式規格(暫名 `score-calibration`)待 POC 確認後再寫;反饋收集介面的發想在 `docs/brainstorm/feedback-collection.md`。

## 工作流程(OpenSpec)

- 變更用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 管理:每個 change 放在 `openspec/changes/<名稱>/`,內含 proposal、design、tasks 與 spec delta。指令:`/opsx:propose`、`/opsx:apply`、`/opsx:archive`。
- **同時最多 5 個未 archive 的 change**(任務做完但還沒 archive 的也算)。已滿 5 個時不得再開新 change,先 archive 一個。CI(`.github/workflows/openspec.yml`)會檢查這條,並跑 `openspec validate --all --strict`。
- **一個開發階段 = 一個 change = 一個 PR**。新需求先寫進 change 的 spec delta,archive 後併入 `openspec/specs/`。
- 決策紀錄:`openspec/changes/archive/2026-11-03-resolve-spec-ambiguities/design.md`(P、A、B 各題的決定與理由)。

## 不可違反的規則

- 圖片只用網站主比例(平面 3:2 或影視 16:9,二選一)與 1:1;影片一律 16:9;禁止直式圖。
- 圖片框高度由寬度推算(CSS aspect-ratio),不用 object-fit 的 contain 或 cover 湊比例。
- 評分、估算、檢查一律是確定性的程式碼:同樣輸入必須得到同樣結果。
- 這是公開 repo:不放任何真實客戶資料、客戶網址或金鑰;範例新聞一律用示意文字。

## 程式碼風格

- 程式碼註解用繁體中文。關鍵邏輯逐行註解,分段標示【第一步】【第二步】…,白話說明每行在做什麼。
- 每條規則、每個公式都要有單元測試,測試資料放 `tests/fixtures/`。

## 環境備註

- 第 4 階段 Playwright 需要下載瀏覽器;若在 Claude Code web 安裝失敗,請在環境設定開放網路存取,或改用 `npx playwright install --with-deps chromium` 後回報錯誤訊息。
