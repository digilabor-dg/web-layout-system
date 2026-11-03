# site-profile Specification

## Purpose
網站設定(SiteProfile)是全站唯一的約束:決定媒體類型與主比例、裝置分類與斷點、格線、字體預設值與驗收用的測試寬度。區塊範本與實例都受它約束,不能覆寫。來源:`docs/spec/01` 網站設定、`02` 第一步與補充欄位、決策 B7。

## Requirements

### Requirement: 全站唯一的網站設定

系統 SHALL 只接受一份 SiteProfile。區塊範本、區塊實例與頁面 MUST NOT 覆寫網站設定的任何欄位。

#### Scenario: 出現兩份網站設定

- **WHEN** 資料中有兩份 `type` 為 `SiteProfile` 的物件
- **THEN** 第 1 層規則檢查回報錯誤

#### Scenario: 範本試圖指定主比例

- **WHEN** 區塊範本出現 `mainRatio` 或任何比例欄位
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 媒體類型決定主比例

SiteProfile SHALL 有 `mediaKind`,值為 `print`(平面)或 `broadcast`(影視)。主比例 `mainRatio` MUST 與媒體類型一致:`print` 為 `3:2`(1.5),`broadcast` 為 `16:9`(約 1.778)。

#### Scenario: 平面站

- **WHEN** `mediaKind` 為 `print`
- **THEN** `mainRatio` 必須是 `3:2`,否則回報錯誤

#### Scenario: 影視站

- **WHEN** `mediaKind` 為 `broadcast`
- **THEN** `mainRatio` 必須是 `16:9`

### Requirement: 1:1 一律可用與比例容許誤差

SiteProfile SHALL 固定 `squareRatioAllowed: true`,並以 `ratioTolerance` 記錄比例容許誤差,預設 `0.01`(1%)。

#### Scenario: 關閉 1:1

- **WHEN** `squareRatioAllowed` 為 `false`
- **THEN** schema 驗證失敗

### Requirement: 四類裝置與預設參數組

系統 SHALL 把裝置分成 `mobile`、`tablet-V`、`tablet-H`、`desktop` 四類,斷點由預設參數組決定。SiteProfile SHALL 以 `preset` 選擇 `bs5`、`tw4`、`md3` 或 `custom`,並 MAY 逐項覆寫預設值。預設參數組 SHALL 包含:斷點、各斷點容器寬、容器內距、欄距、欄數、基本字級、行高。數值依各框架官方文件,並註明版本;不使用任何框架的程式碼。

| 裝置 | `bs5` | `tw4` | `md3` |
| --- | --- | --- | --- |
| mobile | < 768 | < 768 | < 600 |
| tablet-V | 768–991 | 768–1023 | 600–839 |
| tablet-H | 992–1199 | 1024–1279 | 840–1199 |
| desktop | ≥ 1200 | ≥ 1280 | ≥ 1200 |

#### Scenario: 選用 bs5 並覆寫欄距

- **WHEN** SiteProfile 設定 `preset: "bs5"` 並覆寫 `gutter` 為 `1rem`
- **THEN** 斷點與容器寬採用 bs5 的值,欄距採用 1rem

#### Scenario: 未知的預設參數組

- **WHEN** `preset` 不是 `bs5`、`tw4`、`md3`、`custom` 之一
- **THEN** schema 驗證失敗

### Requirement: 主切換點

主切換點 SHALL 等於 tablet-H 的起點(`bs5` 為 992px)。小於主切換點時採用手機排法(結構,例如上下堆疊),大於或等於時採用電腦排法(例如左右並排)。平板的欄數由程式推算,見 `layout-patterns`。

#### Scenario: 1024px 使用 bs5

- **WHEN** 測試寬度為 1024px,預設參數組為 `bs5`
- **THEN** 裝置分類為 tablet-H,採用電腦排法

### Requirement: 測試寬度

SiteProfile SHALL 定義 6 種測試寬度:360、390、768、1024、1280、1440px。每種寬度依斷點對應到一類裝置。內建的三組預設參數組 MUST 得到相同的對應:360、390 為 mobile;768 為 tablet-V;1024 為 tablet-H;1280、1440 為 desktop。

#### Scenario: 三組預設參數組對應一致

- **WHEN** 分別用 `bs5`、`tw4`、`md3` 計算 6 種測試寬度的裝置分類
- **THEN** 三組結果完全相同

### Requirement: 測試視窗高度

每種測試寬度 SHALL 有對應的視窗高度,供「區塊長度」「手機首屏」等以螢幕高度為分母的項目使用:360×800、390×844、768×1024、1024×768、1280×800、1440×900。

#### Scenario: 手機首屏

- **WHEN** 計算手機首屏占比
- **THEN** 使用 390×844

### Requirement: 格線與容器寬

格線 SHALL 為 12 欄。各測試寬度的內容寬度 SHALL 由預設參數組的容器寬與容器內距推算,同樣的輸入 MUST 得到同樣的結果。

#### Scenario: 推算內容寬度

- **WHEN** 預設參數組為 `bs5`、測試寬度為 1280px
- **THEN** 容器寬為 1140px,內容寬度為容器寬減去左右內距

### Requirement: 字體與間距預設值

SiteProfile SHALL 存放估算用的字體與間距數值:基本字級、行高、各文字量的標題字級、平均字寬(中文與西文分開)、則與則的間距、區塊間距、卡片內距。預設參數組提供基本字級與行高;框架沒有定義的平均字寬,中文預設 1em。這些數值在第 4 階段以渲染量測校正之前,標為示意值。

#### Scenario: 缺少平均字寬

- **WHEN** SiteProfile 沒有設定中文平均字寬
- **THEN** 使用預設值 1em
