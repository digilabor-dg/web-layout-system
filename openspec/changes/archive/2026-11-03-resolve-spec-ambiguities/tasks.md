# Tasks

## 1. 回答問題(使用者)

每題的驗證方式:`design.md` 該題已有「決定」(第一輪見 commit `2f64803`,第二輪見 `4a6d8b4`)。

- [x] 1.1 P1 `docs/spec/` 與 `openspec/specs/` 的分工
- [x] 1.2 P2 開發階段與 change 的對應
- [x] 1.3 A1 影片縮圖的比例
- [x] 1.4 A2 二選一的圖片比例在哪裡決定
- [x] 1.5 A3 範例首頁版位 D 的警告
- [x] 1.6 A4 版面生成的階段編號
- [x] 1.7 B1 展示類型其餘屬性的值
- [x] 1.8 B2 型 21~38 未定義的響應式設定
- [x] 1.9 B3 特殊則數怎麼存
- [x] 1.10 B4 圖片寬高的格式與檢查層級
- [x] 1.11 B5 標題字數存不存
- [x] 1.12 B6 section、編號與裝置差異
- [x] 1.13 B7 斷點與預設參數組
- [x] 1.14 B8 第 1 層額外的檢查項目
- [x] 1.15 B9 `npm run validate` 的結束代碼與輸出格式

## 2. 記錄決定

P1 選 b,所以答案不寫回 `docs/spec/`,改由下一個 change 寫成 spec。

- [x] 2.1 把 `design.md` 每題改寫成「決定與理由」。驗證:`openspec validate resolve-spec-ambiguities --strict` 通過。
- [x] 2.2 依 A4 把 `docs/spec/04-evaluator.md` 的標題改為「版面生成(第 7 階段)」。驗證:`grep 第三階段 docs/spec/04-evaluator.md` 沒有結果。
- [x] 2.3 依 P1、P2 更新 CLAUDE.md 與 `openspec/config.yaml` 的流程說明。驗證:兩個檔案都不再寫「由 resolve-spec-ambiguities 決定」。

## Workflow follow-up

- archive 本 change。
- 接著開 `migrate-docs-to-openspec`,再開第 1 階段的 change,過程中確認 active change 不超過 5 個。
