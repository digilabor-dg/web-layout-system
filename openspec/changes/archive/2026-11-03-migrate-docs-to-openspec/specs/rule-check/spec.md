## Purpose

第 1 層規則檢查:存檔時對範本、實例與其他資料做靜態檢查,不必渲染,結果為合法或不合法,另列警告。以 `npm run validate` 提供 CLI。來源:`docs/spec/03` 第 1 層、`02` 檢查規則、`04` 工具分工,決策 B4、B6、B8、B9。

## ADDED Requirements

### Requirement: 規則代號與嚴重度

第 1 層 SHALL 執行以下各條需求列出的規則。每條規則有固定的 kebab-case 代號與嚴重度(錯誤或警告)。schema 能表達的限制由 schema 驗證處理,代號為 `schema`。展示類型 `responsiveDefault` 為 `null` 的部分 MUST NOT 檢查。每個代號 SHALL 至少有一份合法與一份不合法的 fixture,不合法的 fixture 剛好觸發該代號。

#### Scenario: 合法資料

- **WHEN** 對範例資料執行全部規則
- **THEN** 沒有任何違規

### Requirement: 資料完整性規則

第 1 層 SHALL 執行下列規則,皆為錯誤:

- `schema`:每份資料都通過所屬 prototype 的 JSON Schema。
- `duplicate-id`:同一種 prototype 內 id 不重複。
- `ref-exists`:引用的 id 都存在,而且是正確的 prototype。
- `single-site-profile`:恰好一份 SiteProfile。
- `main-ratio-media-kind`:主比例與媒體類型一致。
- `pattern-limit`:展示類型不超過 40 種。
- `pattern-item-range`:展示類型的 `items.min` ≤ `items.max`。

#### Scenario: 引用不存在的範本

- **WHEN** 實例的 `template` 指向不存在的 id
- **THEN** 回報 `ref-exists` 錯誤

### Requirement: 範本與實例規則

第 1 層 SHALL 對範本與實例執行下列規則:

- `template-item-count`(錯誤):範本則數在展示類型範圍內。
- `template-tabs`(錯誤):只有引用 P15 的範本可以有 `tabs`。
- `image-role`(錯誤):`imageRole` 在 slot 允許清單內;允許清單有多個角色時必須選定。
- `suggested-pattern`(警告):內容類型與展示類型不在建議搭配內。
- `override-fields`(錯誤):覆寫只出現 `itemCount`、`selection`、`heading`。
- `override-item-count`(錯誤):覆寫後的則數在範圍內。
- `instance-item-count`(錯誤):實際則數等於覆寫後的則數。
- `instance-content-match`(錯誤):新聞則的內容類型與分類和範本一致。

#### Scenario: 非建議搭配

- **WHEN** `opinion` 範本引用 P07
- **THEN** 回報 `suggested-pattern` 警告

### Requirement: 圖片規則

第 1 層 SHALL 執行下列規則,皆為錯誤:

- `item-crops`:每則新聞有 `main` 與 `square`;影音另有 `video`。
- `image-file-ratio`:圖檔寬高比與角色比例相差不超過容許誤差。
- `no-portrait`:圖檔不是直式。
- `gallery-size`:P16 所放新聞則的圖輯為 6~12 張。

#### Scenario: 4:3 主圖

- **WHEN** 平面站的 `main` 圖檔為 1200×900
- **THEN** 回報 `image-file-ratio` 錯誤

### Requirement: 頁面規則

第 1 層 SHALL 對頁面執行下列規則:

- `instance-on-one-page`(錯誤):每個實例恰好被一個頁面引用一次。
- `stack-columns-sum`(錯誤):stack section 的欄寬加總為 12。
- `mobile-order-complete`(錯誤):`mobileOrder` 恰好列出該 section 所有實例。
- `code-capacity`(錯誤):`flat` 整頁不超過 26 塊;`sectioned` 每層不超過 26。
- `device-hidden`(警告):實例在某類裝置整塊隱藏。
- `duplicate-item-on-page`(警告):同一則新聞出現在同一頁的兩個實例。

#### Scenario: 同一則新聞出現兩次

- **WHEN** 一則新聞同時出現在版位 B 與 J
- **THEN** 回報 `duplicate-item-on-page` 警告

### Requirement: 確定性

規則檢查 MUST 是確定性的程式:同樣的輸入 MUST 得到同樣的違規清單,而且順序相同。違規清單 SHALL 依檔案路徑、id、規則代號排序。

#### Scenario: 重跑

- **WHEN** 對同一份資料連續執行兩次
- **THEN** 兩次輸出逐字相同

### Requirement: npm run validate

系統 SHALL 提供 `npm run validate`,預設檢查 `data/`,也 MAY 指定其他目錄。

- 有錯誤時 exit code 為 1;只有警告時為 0;加 `--strict` 時,有警告也回傳 1。
- 預設輸出文字清單,每行一條:檔案、id、規則代號、訊息;最後一行是錯誤數與警告數。
- 加 `--json` 時改輸出 JSON:`{ errors, warnings, violations: [{ file, id, rule, severity, message }] }`。

#### Scenario: 只有警告

- **WHEN** 資料只有一個 `suggested-pattern` 警告
- **THEN** exit code 為 0;加 `--strict` 時為 1

#### Scenario: JSON 輸出

- **WHEN** 執行 `npm run validate -- --json`
- **THEN** 標準輸出是一份可解析的 JSON,`violations` 依排序規則排列

### Requirement: 可移植的測試資料

規則的測試 SHALL 寫成資料驅動的 fixture,放在 `tests/fixtures/`:每份 fixture 有輸入資料與預期的違規清單(JSON),不依賴特定語言。日後移植到其他語言時,MUST 能直接沿用同一組 fixture。

#### Scenario: 新增一條規則

- **WHEN** 新增規則代號
- **THEN** 同時新增它的合法與不合法 fixture
