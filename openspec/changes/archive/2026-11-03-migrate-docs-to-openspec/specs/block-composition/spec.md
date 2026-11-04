## Purpose

區塊範本(BlockTemplate)由內容類型、展示類型、選稿規則與響應式行為組成,是可重複使用的規格;區塊實例(BlockInstance,編輯後台稱「版位」)是範本放到頁面上的那一份,填入實際新聞。來源:`docs/spec/01` 區塊範本、區塊實例,`02` 第六、八步與檢查規則,決策 A2、B3、B6-3、B6-4。

## ADDED Requirements

### Requirement: 區塊範本的欄位

BlockTemplate SHALL 有 `id`、`name`、`role`、`contentType`(`{ ref, category }`,`category` 可省略)、`pattern`(引用一種展示類型)、`itemCount`、`selection`(內嵌的選稿規則)、`responsive`(`null` 表示沿用展示類型預設)與 `heading`(`{ title, moreLink }`)。

#### Scenario: 缺少展示類型

- **WHEN** 範本沒有 `pattern`
- **THEN** schema 驗證失敗

### Requirement: 範本則數

範本的 `itemCount` MUST 落在所引用展示類型的則數範圍內。

#### Scenario: 則數超出範圍

- **WHEN** 範本引用 P09(4–6 則)且 `itemCount` 為 7
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 區塊用途

範本 SHALL 以 `role` 標明區塊用途,供頁面檢查使用。值為 `headline`(頭條)、`subheadline`(次頭條)、`flash`(即時快訊)、`popular`(熱門排行)、`section`(分類版區)、`video`(影音)、`opinion`(觀點評論)、`feature`(專題)、`chart`(圖表)、`promo`(推廣)之一。

#### Scenario: 未知的用途

- **WHEN** 範本的 `role` 為 `banner`
- **THEN** schema 驗證失敗

### Requirement: 選定圖片角色

展示類型的 slot 允許多個圖片角色時,範本 MUST 以 `imageRole` 選定其中一個;選定的角色 MUST 在允許清單內。實例不可覆寫 `imageRole`。

#### Scenario: 二選一卻沒選

- **WHEN** 範本引用 P03 且沒有 `imageRole`
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 選了不允許的角色

- **WHEN** 範本引用 P07 且 `imageRole` 為 `square`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 分頁數

引用 P15 的範本 SHALL 以 `tabs` 記錄分頁數;其他展示類型 MUST NOT 有 `tabs`。

#### Scenario: P07 帶有分頁數

- **WHEN** 引用 P07 的範本有 `tabs: 3`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 選稿規則

`selection.mode` SHALL 為下列 4 種之一:

- `manual`:編輯手選,逐則指定。
- `latest`:依發布時間取最新的 n 則。
- `popular`:依閱讀量取前 n 則。
- `mixed`:前 `pinned` 則編輯手選,其餘依 `fill` 自動補上。

`fill` SHALL 有 `source`(`latest` 或 `popular`),MAY 有 `category` 與 `withinHours`。

#### Scenario: 混合模式

- **WHEN** `mode` 為 `mixed`,`pinned` 為 1,`fill.source` 為 `latest`
- **THEN** schema 驗證通過

### Requirement: 斷點下換型

範本的 `responsive` MAY 設定在主切換點以下改用另一種展示類型(例如 P01 在手機改 P02)。換型 MUST 寫在範本裡,不另建範本;換用的型 MUST 也能容納範本的 `itemCount`。

#### Scenario: P01 在手機改 P02

- **WHEN** 範本 `pattern` 為 P01,`responsive.mobile.pattern` 為 P02
- **THEN** schema 驗證通過

### Requirement: 區塊實例

BlockInstance SHALL 有 `id`、`template`、`overrides` 與 `items`(新聞則 id 的有序清單)。實例在頁面上的位置(section、欄、順序、版位代號)MUST NOT 存在實例裡,只由 Page 決定。同一個範本 MAY 有多個實例。

#### Scenario: 實例存了版位代號

- **WHEN** BlockInstance 出現 `slot` 或 `order` 欄位
- **THEN** schema 驗證失敗

### Requirement: 覆寫限制

`overrides` SHALL 只允許 `itemCount`、`selection`、`heading` 三個欄位。展示類型與圖片比例 MUST NOT 覆寫,要改就另建範本。覆寫後的則數 MUST 仍在展示類型的範圍內。

#### Scenario: 覆寫展示類型

- **WHEN** 實例的 `overrides` 有 `pattern`
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 覆寫後超出範圍

- **WHEN** 範本引用 P09,實例覆寫 `itemCount` 為 3
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 實際則數與內容一致

實例的 `items` 數量 MUST 等於覆寫後的則數(P15 為分頁數 × 每頁則數)。每則新聞的 `contentType` MUST 與範本一致;範本有 `category` 時,新聞則的 `category` MUST 也相同。

#### Scenario: 則數不符

- **WHEN** 範本 `itemCount` 為 6,實例 `items` 只有 2 個 id
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 分類不符

- **WHEN** 財經範本的實例放了一則 `category` 為 `tech` 的新聞
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 各裝置顯示與手機順序

實例 MAY 以 `devices: { mobile, desktop }`(布林值,預設皆為 `true`)設定在某類裝置隱藏整塊。整塊在某類裝置隱藏時,第 1 層 SHALL 列為警告,因為規格要求「不在手機上藏稿」。平板沿用最接近的一端:tablet-V 跟手機、tablet-H 跟電腦。

#### Scenario: 手機上隱藏整塊

- **WHEN** 實例設定 `devices.mobile` 為 `false`
- **THEN** 第 1 層規則檢查回報警告
