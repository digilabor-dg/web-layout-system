# 第一次對話要貼給 Claude Code 的指令

請先完整閱讀 CLAUDE.md 與 docs/spec/ 下的 5 份規格,然後只做「第 1 階段:資料模型」:

1. 初始化 Node.js + TypeScript 專案(package.json、tsconfig、Vitest、ESLint),加上 GitHub Actions CI。
2. 依 docs/spec/02-data-structure.md,在 schemas/ 建立 9 種 prototype 的 JSON Schema,包含「評估用的補充欄位」。
3. 在 data/ 建立範例資料:網站設定(平面媒體,主比例 3:2)、38 種展示類型(依 01-architecture.md 的表格)、7 種內容類型、首頁 A~M 共 13 個版位的範本與實例、足夠的示意新聞。
4. 實作第 1 層規則檢查(03-acceptance.md),提供 `npm run validate`,輸出違規清單。
5. 每條規則寫單元測試,含合法與不合法的 fixture。

開始寫程式前,先列出你對規格不清楚或有矛盾的地方問我。完成後開 PR,說明完成項目、測試結果與未決問題。
