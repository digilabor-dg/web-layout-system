## MODIFIED Requirements

### Requirement: 特殊則數

則數範圍 SHALL 用下列方式表達。行為一律由展示類型的屬性決定,核心程式 MUST NOT 寫死特定型的 id,換成其他內容導向的網站時只需換資料。

- 「不限」:`max` 為 `null`。無限載入的型另存每次載入的則數 `items.pageSize`(P34 為 10)。
- 分頁籤型(`arrangement` 為 `tabs`,例如 P15):`items` 指每一頁的則數;範本另存分頁數,總則數 = 分頁數 × 每頁則數。
- 圖輯型(展示類型有 `gallery: { min, max }`,例如 P16 為 6~12):`items` 為 1 則圖輯;該則新聞的 `gallery` 張數 MUST 在範圍內。
- P21:主則 1 則加連結 2~4 則,合計 3~5 則。
- P24:每個時段算一則。

#### Scenario: 不限則數

- **WHEN** 引用 P37 的範本設定則數 50
- **THEN** 則數檢查通過

#### Scenario: 自訂的分頁籤型

- **WHEN** 新增一種 `arrangement` 為 `tabs` 的展示類型 P39
- **THEN** 引用 P39 的範本同樣必須有 `tabs`,不必改程式

## ADDED Requirements

### Requirement: 推定欄位的標記

展示類型 MAY 以 `inferred` 列出由 Claude 推定、尚待使用者確認的欄位名稱。`inferred` 只是註記,MUST NOT 影響任何檢查或估算。

#### Scenario: 推定的排列

- **WHEN** P07 的 `inferred` 含 `arrangement`
- **THEN** 第 1 層規則檢查照常執行,不因此回報任何違規
