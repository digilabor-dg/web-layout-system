# html-rendering Specification

## Purpose
渲染器:把頁面 JSON 轉成一份 RWD 的 HTML,供渲染量測、截圖與人工審閱。樣式參考 `docs/catalog/index.html`。來源:CLAUDE.md 第 3 階段、`docs/spec/01` 響應式規則與圖片比例規範、`03` 第 2 層可用性項目。

## Requirements

### Requirement: 一份 HTML 對應所有寬度

渲染器 SHALL 把一個 Page 輸出成一份 HTML,以 CSS media query 依 SiteProfile 的斷點改變排列。不同寬度 MUST 使用同一份 HTML,不得依裝置輸出不同內容。

#### Scenario: 兩種寬度

- **WHEN** 同一份輸出在 390px 與 1280px 開啟
- **THEN** DOM 內容相同,只有排列不同

### Requirement: 圖框比例

每張圖 SHALL 放在帶有 CSS `aspect-ratio` 的圖框裡,比例取自圖片角色。輸出 MUST NOT 使用 `object-fit: contain` 或 `cover`。範例資料沒有真實圖片時,SHALL 以比例正確的佔位圖代替,並標示角色與比例。

#### Scenario: 佔位圖

- **WHEN** 渲染一張 `main` 圖而 `src` 不存在
- **THEN** 輸出一個 3:2 的佔位框,標示「main 3:2」

### Requirement: 量測用標記

輸出 SHALL 在元素上加上量測用的 data 屬性:區塊的實例 id 與版位代號、新聞則 id 與序號、圖片角色、section 與欄。

#### Scenario: 找出版位 H

- **WHEN** 量測腳本查詢版位代號 H
- **THEN** 能以 data 屬性找到對應的區塊元素

### Requirement: 可用性

輸出 SHALL 滿足:輪播箭頭、分頁籤等觸控目標至少 44×44px;沒有固定的最小寬度造成水平捲動;P01 疊字在手機截斷為兩行。

#### Scenario: 360px 無水平捲動

- **WHEN** 以 360px 開啟
- **THEN** 頁面寬度不超過視窗寬度

### Requirement: 手機順序與側欄

渲染器 SHALL 在主切換點以下,依 `page-layout` 的手機順序把側欄區塊移入單欄。

#### Scenario: 熱門排行移入主欄

- **WHEN** section 的 `mobileOrder` 把熱門排行排在頭條之後
- **THEN** 手機上熱門排行緊接在頭條之後出現
