## Purpose

頁面(Page)由上而下列出 section,section 裡放區塊實例。本 capability 定義 section 的排法、版位代號的推算方式、手機上的順序,以及每個實例只能出現在一個頁面。來源:`docs/spec/02` 第七步與補充欄位、`03` 版面平衡,決策 B6-1~B6-4。

## ADDED Requirements

### Requirement: section 寫在 Page 裡

Page SHALL 有 `id`、`name`、`path`、`codeScheme` 與有序的 `sections`。section MUST 寫在 Page 裡,不另立 prototype。每個 section SHALL 有 `id`、`mode`(`stack` 或 `flow`)與 `fluid`(布林值,`true` 表示不受容器最大寬度限制)。

#### Scenario: 頁面沒有 section

- **WHEN** Page 的 `sections` 是空陣列
- **THEN** schema 驗證失敗

### Requirement: stack 排法

`mode` 為 `stack` 的 section SHALL 以 `columns` 宣告欄配置,例如 `[8, 4]`,欄寬加總 MUST 等於 12。每一欄有自己的實例清單,由上而下堆疊;各欄高度彼此獨立。主欄與側欄的關係以此表達,「欄底對齊」「欄塊數」等版面平衡項目以 section 的欄為單位計算。

#### Scenario: 欄寬加總不是 12

- **WHEN** stack section 的 `columns` 為 `[8, 3]`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: flow 排法

`mode` 為 `flow` 的 section SHALL 依序列出實例,每個實例宣告在手機與電腦各佔幾欄(`span: { mobile, desktop }`,1~12)。由左而右排,累計超過 12 就換到下一列。

#### Scenario: 自然換列

- **WHEN** flow section 依序放 span 為 8、4、6、6 的四塊
- **THEN** 第一列為前兩塊,第二列為後兩塊

#### Scenario: span 超過 12

- **WHEN** 某塊的 `span.desktop` 為 13
- **THEN** schema 驗證失敗

### Requirement: 版位代號由位置推算

版位代號與則的序號 SHALL 由位置推算,MUST NOT 存在資料裡。實例之間的引用一律用 `id`。排序方式:section 由上而下;stack section 內由左欄到右欄,每欄由上而下;flow section 內依列出順序。`codeScheme` 決定格式:

- `flat`:整頁依上述順序編為 A~Z;則為代號加序數,例如 H3。整頁 MUST NOT 超過 26 塊。
- `sectioned`:section 依序為 A~Z,section 內的區塊也依序為 A~Z,兩碼合併,例如 AC;則例如 AC12。

#### Scenario: flat 編號

- **WHEN** 首頁第 1 個 section 為 stack `[8,4]`,左欄 2 塊、右欄 2 塊
- **THEN** 左欄為 A、B,右欄為 C、D

#### Scenario: sectioned 編號

- **WHEN** 同一頁改用 `sectioned`
- **THEN** 這 4 塊為 AA、AB、AC、AD,第 2 個 section 的第 1 塊為 BA

#### Scenario: 移動區塊

- **WHEN** 把一塊從側欄移到主欄
- **THEN** 它的版位代號重新推算,但所有引用(用 `id`)不受影響

### Requirement: 手機上的順序

在手機上,每個 section SHALL 依欄的順序把各欄串成單欄(stack 為左欄後接右欄)。section MAY 以 `mobileOrder`(實例 id 的完整清單)指定別的順序,例如把側欄的熱門排行插到頭條之後。

#### Scenario: 指定手機順序

- **WHEN** section 的 `mobileOrder` 為 `[A, C, B, D]` 對應的 id
- **THEN** 手機上依此順序排列

#### Scenario: mobileOrder 不完整

- **WHEN** `mobileOrder` 少了該 section 的某個實例
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 每個實例只屬於一個頁面

每個 BlockInstance MUST 恰好被一個 Page 引用一次。

#### Scenario: 實例重複出現

- **WHEN** 同一個實例 id 出現在兩個 section
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 孤兒實例

- **WHEN** 某個實例沒有被任何頁面引用
- **THEN** 第 1 層規則檢查回報錯誤
