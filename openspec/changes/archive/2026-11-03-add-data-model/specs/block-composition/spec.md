## MODIFIED Requirements

### Requirement: 分頁數

引用分頁籤型(`arrangement` 為 `tabs`,例如 P15)的範本 SHALL 以 `tabs` 記錄分頁數;其他展示類型 MUST NOT 有 `tabs`。

#### Scenario: P07 帶有分頁數

- **WHEN** 引用 P07 的範本有 `tabs: 3`
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: P15 沒有分頁數

- **WHEN** 引用 P15 的範本沒有 `tabs`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 實際則數與內容一致

實例的 `items` 數量 MUST 等於覆寫後的則數(分頁籤型為分頁數 × 每頁則數)。每則新聞的 `contentType` MUST 與範本一致;範本有 `category` 時,新聞則的 `category` MUST 也相同。

#### Scenario: 則數不符

- **WHEN** 範本 `itemCount` 為 6,實例 `items` 只有 2 個 id
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 分類不符

- **WHEN** 財經範本的實例放了一則 `category` 為 `tech` 的新聞
- **THEN** 第 1 層規則檢查回報錯誤
