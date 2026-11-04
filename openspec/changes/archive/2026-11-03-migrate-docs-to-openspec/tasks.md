# Tasks

## 1. 撰寫 capability spec

每項的驗證方式:檔案存在,而且 `openspec validate migrate-docs-to-openspec --strict` 通過。

- [x] 1.1 第 1 階段:`site-profile`、`layout-patterns`、`content-model`、`image-ratio-policy`、`block-composition`、`page-layout`、`sample-data`、`rule-check`
- [x] 1.2 第 2 階段:`height-estimation`、`template-evaluation`、`page-evaluation`、`evaluation-report`
- [x] 1.3 第 3~7 階段:`html-rendering`、`render-measurement`、`improvement-suggestions`、`ai-review`、`layout-generation`
- [x] 1.4 每份 delta 都寫 `## Purpose`,archive 後主 spec 才不會留下 TBD。驗證:archive 後執行 `openspec validate --all --strict`,沒有 Purpose 警告。

## 2. 記錄詮釋

- [x] 2.1 在 `design.md` 列出 Claude 補充的詮釋。驗證:每條都註明位置與理由。

## Workflow follow-up

- archive 本 change,讓 17 份 spec 進入 `openspec/specs/`。
- 第 1 階段的 change 以這些 spec 為基準。
