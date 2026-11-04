## MODIFIED Requirements

### Requirement: 新聞則的欄位

ContentItem SHALL 有 `id`、`contentType`、`category`(可省略)、`title`、`url`、`publishedAt`(ISO 8601,含時區)與 `images`,MAY 有 `summary`(摘要,供文字量為 summary 或 paragraph 的型使用)與 `author`(`{ name }`,供觀點類使用)。標題字數 MUST NOT 另存欄位,需要時由程式從 `title` 計算。

#### Scenario: 另存標題字數

- **WHEN** ContentItem 出現 `titleLength` 欄位
- **THEN** schema 驗證失敗

#### Scenario: 觀點文章的作者

- **WHEN** 觀點類新聞則有 `author: { name: "示意作者甲" }`
- **THEN** schema 驗證通過

### Requirement: 圖片依角色各存一份

`images` 的 key SHALL 對應圖片角色,每份圖 SHALL 存成 `{ src, width, height }`,寬高為裁好之後的像素。每則新聞 MUST 同時提供 `main` 與 `square`;內容類型設定 `requiresVideo: true` 時(範例資料中只有 `video`),每則 MUST 另外提供 `video`。

#### Scenario: 缺少 1:1 裁切

- **WHEN** 一則新聞只有 `images.main`
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 影音缺少 16:9

- **WHEN** 內容類型 `requiresVideo` 為 true 的新聞則沒有 `images.video`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 圖輯

用於圖輯型展示類型(有 `gallery` 範圍,例如 P16 圖片牆)的新聞則 SHALL 以 `gallery` 存放 1:1 圖片陣列,每張格式同 `{ src, width, height }`,張數 MUST 在該型的範圍內。

#### Scenario: 圖輯只有 4 張

- **WHEN** 引用 P16(6~12 張)的實例所放新聞則 `gallery` 只有 4 張
- **THEN** 第 1 層規則檢查回報錯誤
