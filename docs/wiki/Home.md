# web-layout-system

**內容導向 CMS 的版面生成與評估核心(開源、headless)。** 第一個案例是新聞首頁。

用 JSON 定義版面:網站設定、展示類型、區塊範本與實例、新聞則。核心程式在存檔時做規則檢查,再估算高度,在 6 種寬度渲染量測,最後依 8 個面向給 0~100 分並提出改善建議。同樣的輸入一定得到同樣的結果。

## 頁面

| 頁面 | 內容 |
| --- | --- |
| [成果](成果.md) | 目前完成了什麼、各 POC 的結論與數字 |
| [評估系統](評估系統.md) | Lighthouse 式評估:21 個項目、8 個面向、計分方式、報表格式 |
| [範例](範例.md) | 10 個頁面範例的 V1 → V2 對照(分數、驗收、截圖) |
| [規格](規格.md) | 18 個 capability 導覽、決策紀錄 |
| [發現與型式限制](發現與型式限制.md) | 評估器揭露、靠參數解不了的問題 |
| [待確認](待確認.md) | 需要使用者決定或確認的事項 |

## 快速開始

```bash
npm ci
```

```bash
npm run validate
```

```bash
npm test
```

```bash
npm run poc:2
```

```bash
npm run poc:examples
```

- `npm run validate`:第 1 層規則檢查(範例資料應為 0 錯誤、0 警告)。
- `npm test`:單元測試(每條規則都有合法與不合法的 fixture)。
- `npm run poc:2`:對範例首頁產生評估報表(`poc/evaluate/report.html`)。
- `npm run poc:examples`:跑 10 個範例並產生對照報表(`poc/examples/report.html`)。
- 渲染量測需要 Chromium(Playwright)。

## 目錄

| 目錄 | 內容 |
| --- | --- |
| `openspec/specs/` | **規格的唯一依據**(18 個 capability) |
| `openspec/changes/` | 進行中的變更;`archive/` 是已完成的變更與決策紀錄 |
| `schemas/` | 9 種 prototype 的 JSON Schema |
| `presets/` | 預設參數組 bs5、tw4、md3 |
| `data/` | 範例資料:範例站、38 種展示類型、首頁 A~M、61 則示意新聞 |
| `src/` | 核心函式庫(不依賴 Node 專屬 API)與 CLI |
| `tests/` | 單元測試與 fixture(JSON Patch,可跨語言沿用) |
| `poc/` | POC 1(估算 vs 渲染)、POC 2(評估系統)、範例、本文件產生器 |
| `docs/spec/` | 原始設計說明(發想與資料收集) |
| `docs/research/` | 可搭配的 skill、MCP 與開源工具調查 |

## 工作流程

變更用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 管理,同時最多 5 個未 archive 的 change(CI 會檢查)。詳見 [CLAUDE.md](../../CLAUDE.md)。
