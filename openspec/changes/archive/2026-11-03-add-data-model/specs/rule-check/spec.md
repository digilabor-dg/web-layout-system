## MODIFIED Requirements

### Requirement: 範本與實例規則

第 1 層 SHALL 對範本與實例執行下列規則:

- `template-item-count`(錯誤):範本則數在展示類型範圍內。
- `template-tabs`(錯誤):分頁籤型(`arrangement` 為 `tabs`)的範本必須有 `tabs`,其他型不得有。
- `image-role`(錯誤):`imageRole` 在 slot 允許清單內;允許清單有多個角色時必須選定;`video` 角色只能用於 `requiresVideo` 的內容類型。
- `suggested-pattern`(警告):內容類型與展示類型不在建議搭配內。
- `override-fields`(錯誤):覆寫只出現 `itemCount`、`selection`、`heading`。
- `override-item-count`(錯誤):覆寫後的則數在範圍內。
- `instance-item-count`(錯誤):實際則數等於覆寫後的則數。
- `instance-content-match`(錯誤):新聞則的內容類型與分類和範本一致。

#### Scenario: 非建議搭配

- **WHEN** `opinion` 範本引用 P07
- **THEN** 回報 `suggested-pattern` 警告

#### Scenario: 新聞用 video 角色

- **WHEN** `news` 範本引用 P12 並設定 `imageRole: "video"`
- **THEN** 回報 `image-role` 錯誤

### Requirement: 圖片規則

第 1 層 SHALL 執行下列規則,皆為錯誤:

- `item-crops`:每則新聞有 `main` 與 `square`;內容類型 `requiresVideo` 時另有 `video`。
- `image-file-ratio`:圖檔寬高比與角色比例相差不超過容許誤差;圖輯的圖以 1:1 檢查。
- `no-portrait`:圖檔不是直式。直式圖只回報 `no-portrait`,不另報 `image-file-ratio`。
- `gallery-size`:圖輯型所放新聞則的圖輯張數在該型的範圍內。

#### Scenario: 4:3 主圖

- **WHEN** 平面站的 `main` 圖檔為 1200×900
- **THEN** 回報 `image-file-ratio` 錯誤

#### Scenario: 直式圖

- **WHEN** `square` 圖檔為 600×900
- **THEN** 只回報 `no-portrait`

### Requirement: npm run validate

系統 SHALL 提供 `npm run validate`,預設檢查 `data/`,也 MAY 指定其他目錄。

- 有錯誤時 exit code 為 1;只有警告時為 0;加 `--strict` 時,有警告也回傳 1;參數錯誤或目錄無法讀取時為 2。
- 預設輸出文字清單,每行一條:嚴重度、檔案、id、規則代號、訊息;最後一行是錯誤數與警告數。
- 加 `--json` 時改輸出 JSON:`{ errors, warnings, violations: [{ file, id, rule, severity, message }] }`。

#### Scenario: 只有警告

- **WHEN** 資料只有一個 `suggested-pattern` 警告
- **THEN** exit code 為 0;加 `--strict` 時為 1

#### Scenario: JSON 輸出

- **WHEN** 執行 `npm run validate -- --json`
- **THEN** 標準輸出是一份可解析的 JSON,`violations` 依排序規則排列

#### Scenario: 不認得的參數

- **WHEN** 執行 `npm run validate -- --fix`
- **THEN** 顯示錯誤訊息,exit code 為 2

## ADDED Requirements

### Requirement: 沒通過 schema 的資料

沒通過 schema 的資料 SHALL 只回報 `schema` 錯誤,MUST NOT 參與其他規則,以免形狀不對造成連鎖誤報。但它的 id 仍 SHALL 視為存在,引用它的資料不另報 `ref-exists`。有頁面沒通過 schema 時,`instance-on-one-page` SHALL 整條跳過,因為無法得知該頁引用了哪些實例。

#### Scenario: 範本格式錯誤

- **WHEN** 範本多了 `mainRatio` 欄位
- **THEN** 只回報該範本的 `schema` 錯誤,引用它的實例不回報 `ref-exists`
