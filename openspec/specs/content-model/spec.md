# content-model Specification

## Purpose
內容類型(ContentType)描述區塊「放什麼」,新聞則(ContentItem)是被區塊實例引用的單則內容。來源:`docs/spec/01` 內容類型,`02` 第五、九步、檢查規則與補充欄位,決策 A1、A3、B3、B4、B5。

## Requirements

### Requirement: 七種內容類型

系統 SHALL 內建 7 種內容類型:`news`(新聞,文字報導)、`flash`(快訊,即時短訊)、`video`(影音,影片、短影音、Podcast)、`opinion`(觀點,專欄、社論、評論)、`chart`(圖表,數據新聞、選舉、行情)、`feature`(專題,跨多則的企劃入口)、`promo`(推廣,電子報、App、自家活動)。政治、財經等分類是內容類型的子屬性 `categories`,不另立面向;`news` 的分類 SHALL 至少包含 `politics`、`finance`、`world`、`society`、`tech`。

#### Scenario: 新聞的分類

- **WHEN** 讀取 `news` 的 `categories`
- **THEN** 包含 `politics`、`finance`、`world`、`society`、`tech`

### Requirement: 建議搭配的展示類型

每種內容類型 SHALL 有 `suggestedPatterns`:

| 內容類型 | 建議搭配 |
| --- | --- |
| `news` | P01、P02、P03、P05、P07、P08、P09、P10 |
| `flash` | P06、P19 |
| `video` | P12、P13 |
| `opinion` | P17、P18 |
| `chart` | P20 |
| `feature` | P11、P14 |
| `promo` | P14 |

#### Scenario: 熱門排行用 P05

- **WHEN** 範本以 `news` 搭配 P05
- **THEN** 不回報「非建議搭配」的警告

### Requirement: 新聞則的欄位

ContentItem SHALL 有 `id`、`contentType`、`category`(可省略)、`title`、`url`、`publishedAt`(ISO 8601,含時區)與 `images`。標題字數 MUST NOT 另存欄位,需要時由程式從 `title` 計算。

#### Scenario: 另存標題字數

- **WHEN** ContentItem 出現 `titleLength` 欄位
- **THEN** schema 驗證失敗

### Requirement: 圖片依角色各存一份

`images` 的 key SHALL 對應圖片角色,每份圖 SHALL 存成 `{ src, width, height }`,寬高為裁好之後的像素。每則新聞 MUST 同時提供 `main` 與 `square`;內容類型為 `video` 的新聞則 MUST 另外提供 `video`。

#### Scenario: 缺少 1:1 裁切

- **WHEN** 一則新聞只有 `images.main`
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 影音缺少 16:9

- **WHEN** 內容類型為 `video` 的新聞則沒有 `images.video`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 圖輯

用於 P16 圖片牆的新聞則 SHALL 以 `gallery` 存放 1:1 圖片陣列,每張格式同 `{ src, width, height }`,張數 MUST 在 6~12 張之間。

#### Scenario: 圖輯只有 4 張

- **WHEN** 引用 P16 的實例所放新聞則 `gallery` 只有 4 張
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 示意內容

範例與測試用的新聞則 MUST 使用示意文字、示意網址與示意圖片路徑,MUST NOT 包含真實客戶資料、客戶網址或金鑰。

#### Scenario: 範例新聞的網址

- **WHEN** 檢視範例資料的 `url`
- **THEN** 都是站內相對路徑,例如 `/news/0012`
