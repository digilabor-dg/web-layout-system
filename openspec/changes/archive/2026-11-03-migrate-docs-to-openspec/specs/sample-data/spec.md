## Purpose

範例資料是規則檢查、估算與渲染的共同輸入,也是規格的活範例:平面媒體站、38 種展示類型、7 種內容類型、首頁 A~M 共 13 個版位,以及足夠的示意新聞。來源:`docs/spec/01` 範例首頁版位配置、首頁配置原則,CLAUDE.md 第 1 階段,決策 A3、B6、B7。

## ADDED Requirements

### Requirement: 範例網站設定

範例站 SHALL 為平面媒體(`mediaKind: "print"`,主比例 3:2),預設參數組為 `bs5`,欄距覆寫為 1rem。

#### Scenario: 讀取範例站

- **WHEN** 載入 `data/` 的網站設定
- **THEN** `mainRatio` 為 `3:2`,`preset` 為 `bs5`

### Requirement: 範例首頁的結構

範例首頁 SHALL 使用 `flat` 編號,共 4 個 section、13 個版位、61 則,只用到 9 種展示類型。section 1 與 section 3 為 stack `[8, 4]`;section 2 與 section 4 為全寬。

#### Scenario: 推算版位代號

- **WHEN** 依 `page-layout` 的規則推算範例首頁的版位代號
- **THEN** 依序得到 A~M

#### Scenario: 整頁則數

- **WHEN** 加總 13 個實例的則數
- **THEN** 合計 61 則

### Requirement: 範例首頁 section 1 與 2

section 1 左欄 SHALL 為 A、B,右欄為 C、D;section 2 為 E。

| 版位 | 範本 | 用途 | 內容類型 | 型 | 則數 |
| --- | --- | --- | --- | --- | --- |
| A | 頭條 | headline | news | P01 | 1 |
| B | 次頭條 | subheadline | news | P07 | 4 |
| C | 即時快訊 | flash | flash | P06 | 4 |
| D | 熱門排行 | popular | news | P05 | 8 |
| E | 影音焦點 | video | video | P12 | 4 |

#### Scenario: 側欄

- **WHEN** 讀取 section 1 的右欄
- **THEN** 依序為即時快訊與熱門排行

### Requirement: 範例首頁 section 3 與 4

section 3 左欄 SHALL 為 F~J,右欄為 K;section 4 為 L、M。

| 版位 | 範本 | 用途 | 內容類型 | 型 | 則數 |
| --- | --- | --- | --- | --- | --- |
| F | 國際 | section | news(world) | P09 | 6 |
| G | 政治 / 兩岸 | section | news(politics) | P09 | 6 |
| H | 財經 | section | news(finance) | P09 | 6 |
| I | 專題 | feature | feature | P14 | 2 |
| J | 社會 / 生活 | section | news(society) | P07 | 6 |
| K | 觀點評論 | opinion | opinion | P17 | 4 |
| L | 科技 / 文化 | section | news(tech) | P07 | 6 |
| M | 短影音 | video | video | P13 | 4 |

#### Scenario: F、G、H 共用型

- **WHEN** 讀取 F、G、H 的範本
- **THEN** 三者都引用 P09,但分類不同

### Requirement: 範例資料通過第 1 層

範例資料 SHALL 通過第 1 層規則檢查,錯誤與警告都是 0。

#### Scenario: 跑檢查

- **WHEN** 執行 `npm run validate`
- **THEN** 回報 0 個錯誤、0 個警告,exit code 為 0

### Requirement: 示意新聞

範例 SHALL 提供足夠的示意新聞,讓每個實例的 `items` 都填滿,且同一則新聞 MUST NOT 出現在同一頁的兩個實例中。新聞內容 MUST 為示意文字,符合 `content-model` 的示意內容規定。

#### Scenario: 同一則重複出現

- **WHEN** 一則新聞同時出現在版位 B 與 J
- **THEN** 第 1 層回報 `duplicate-item-on-page` 警告,範例資料不符本需求
