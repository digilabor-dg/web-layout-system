# Tasks

## 1. 回答問題(使用者)

每題的驗證方式:`design.md` 該題的「回答」已填寫,不再是「(待回答)」。

- [ ] 1.1 P1 `docs/spec/` 與 `openspec/specs/` 的分工
- [ ] 1.2 P2 開發階段與 change 的對應
- [ ] 1.3 A1 影片縮圖的比例
- [ ] 1.4 A2 二選一的圖片比例在哪裡決定
- [ ] 1.5 A3 範例首頁版位 D 的警告
- [ ] 1.6 A4 版面生成的階段編號
- [ ] 1.7 B1 展示類型其餘屬性的值
- [ ] 1.8 B2 型 21~38 未定義的響應式設定
- [ ] 1.9 B3 特殊則數怎麼存
- [ ] 1.10 B4 圖片寬高的格式與檢查層級
- [ ] 1.11 B5 標題字數存不存
- [ ] 1.12 B6 首頁哪些版位放側欄
- [ ] 1.13 B7 網站設定的版面數值
- [ ] 1.14 B8 第 1 層額外的檢查項目
- [ ] 1.15 B9 `npm run validate` 的結束代碼與輸出格式

## 2. 把答案寫回規格

- [ ] 2.1 依答案修改 `docs/spec/01-architecture.md`、`02-data-structure.md`、`03-acceptance.md`、`04-evaluator.md`,只改答案涉及的段落。驗證:`design.md` 每題標明改了哪份文件的哪一節,而且 `git diff docs/spec` 只含這些段落。
- [ ] 2.2 把 `design.md` 每題改寫成「決定與理由」。驗證:`openspec validate resolve-spec-ambiguities --strict` 通過。
- [ ] 2.3 依 P1、P2 的答案更新 CLAUDE.md 與 `openspec/config.yaml` 的流程說明。驗證:兩個檔案都不再寫「由 resolve-spec-ambiguities 決定」。

## Workflow follow-up

- 使用者確認 PR 後,archive 本 change。
- archive 之後,才依 P2 的答案開第 1 階段的 change,並確認 active change 不超過 5 個。
