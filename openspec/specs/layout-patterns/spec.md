# layout-patterns Specification

## Purpose
展示類型(LayoutPattern)描述區塊「怎麼排」的抽象型式,與內容無關。本 capability 定義展示類型的屬性、外觀標籤(PatternTag)、用途分組(PatternGroup)、內建的 38 種型、slot 與圖片角色,以及響應式設定。來源:`docs/spec/01` 展示類型、類型分組、響應式規則,`02` 第二~四步,決策 A1、A2、B1、B2、B3、B7。

## Requirements

### Requirement: 展示類型的結構屬性

每種展示類型 SHALL 有下列結構屬性,值只能取自列出的範圍:

- 排列 `arrangement`:`single`、`list`、`grid`、`bento`、`carousel`、`tabs`
- 強調 `emphasis`:`none`、`lead1`、`lead2`
- 互動 `interaction`:`none`、`carousel`、`tabs`、`marquee`、`play`、`accordion`、`poll`

#### Scenario: 屬性值不在範圍內

- **WHEN** 展示類型的 `arrangement` 為 `masonry`
- **THEN** schema 驗證失敗

### Requirement: 展示類型的圖文屬性

每種展示類型 SHALL 有下列圖文屬性:

- 圖文關係 `imageText`:`stacked`(圖上文下)、`side`(左圖右文)、`overlay`(HTML 疊字)、`none`(無圖)
- 文字量 `textAmount`:`headline`、`summary`、`paragraph`
- 則數範圍 `items`:`{ min, max }`,`max` 為 `null` 表示不限
- 圖片:各 slot 的 `image` 為圖片角色的允許清單

#### Scenario: 則數範圍顛倒

- **WHEN** 展示類型的 `items` 為 `{ min: 6, max: 4 }`
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 外觀標籤與用途分組

系統 SHALL 內建 5 個外觀標籤與 5 個用途分組。每種展示類型 MUST 有至少 1 個外觀標籤,且 MUST 恰好屬於 1 個用途分組。標籤與分組只供瀏覽和篩選,不參與區塊範本的組成。

| 外觀標籤 id | 名稱 | 條件 |
| --- | --- | --- |
| `image` | 圖 | 以圖片為主體 |
| `text` | 文 | 無圖,或以文字為主 |
| `mixed` | 混合 | 圖片與純文字條目並存 |
| `carousel` | 輪播 | 有左右切換 |
| `zoom` | 放大 | 至少一則放大強調 |

| 用途分組 id | 名稱 |
| --- | --- |
| `news-combo` | 新聞組合 |
| `av` | 影音與廣播 |
| `data` | 數據與資訊 |
| `text-led` | 文字為主 |
| `interactive` | 互動、導覽與推廣 |

#### Scenario: 展示類型引用不存在的標籤

- **WHEN** 展示類型的 `tags` 含有 `poster`
- **THEN** 第 1 層規則檢查回報引用錯誤

### Requirement: 內建 38 種展示類型

系統 SHALL 內建 38 種展示類型,id 為 `P01`~`P38`,依用途分組列在以下各條需求。型 21~38 的則數與圖片為建議值。

#### Scenario: 用途分組的型數

- **WHEN** 依用途分組統計內建展示類型
- **THEN** news-combo 12 型、av 5 型、data 4 型、text-led 11 型、interactive 6 型,合計 38 型

### Requirement: 新聞組合分組的展示類型(之1)

用途分組 `news-combo` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P01 | 大圖疊字 | image, zoom | 1 | main |
| P02 | 大圖下文 | image | 1 | main |
| P03 | 左圖右文 | mixed | 3–6 | main 或 square |
| P07 | 均分圖卡網格 | image | 3–9 | main |
| P08 | 首 1 則放大,其餘小卡 | mixed, zoom | 5 | main |
| P09 | 首 1 則放大,其餘純文字 | mixed, zoom | 4–6 | 首則 main,其餘 none |
| P10 | 首 2 則放大,其餘小卡 | mixed, zoom | 6 | main |

#### Scenario: P01 的分組

- **WHEN** 讀取 P01 與 P10
- **THEN** 兩者的 `group` 都是 `news-combo`

### Requirement: 新聞組合分組的展示類型(之2)

用途分組 `news-combo` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P11 | 拼貼(Bento) | image, zoom | 3–7 | main 與 square |
| P14 | 寬幅專題 | image, zoom | 1–2 | main |
| P16 | 圖片牆 | image | 1 則圖輯(6–12 張) | square |
| P21 | 主新聞群組 | mixed, zoom | 3–5(1 + 2–4 條連結) | 首則 main,連結 none |
| P34 | 無限載入動態 | mixed | 不限(每次約 10) | main |

#### Scenario: P11 的分組

- **WHEN** 讀取 P11 與 P34
- **THEN** 兩者的 `group` 都是 `news-combo`

### Requirement: 影音與廣播分組的展示類型

用途分組 `av` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P12 | 橫式輪播 | carousel, image | 4–12 | main;影音內容用 video |
| P13 | 方形輪播 | carousel, image | 4–12 | square |
| P22 | 單一影片播放器 | image, zoom | 1 | video |
| P23 | 音訊 / Podcast 清單 | mixed | 3–8 | square 或 none |
| P24 | 節目表 / 直播時段 | text | 4–12(時段) | none |

#### Scenario: P12 的分組

- **WHEN** 讀取 P12 與 P24
- **THEN** 兩者的 `group` 都是 `av`

### Requirement: 數據與資訊分組的展示類型

用途分組 `data` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P20 | 圖表卡 | image | 1–3 | main |
| P25 | 數字卡 | text, zoom | 1–4 | none |
| P26 | 地圖卡 | image | 1 | main |
| P33 | 資訊小工具 | mixed | 1–3 | none |

#### Scenario: P20 的分組

- **WHEN** 讀取 P20 與 P33
- **THEN** 兩者的 `group` 都是 `data`

### Requirement: 文字為主分組的展示類型(之1)

用途分組 `text-led` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P04 | 純文字清單 | text | 5–10 | none |
| P05 | 編號排行 | text | 5–10 | square 或 none |
| P06 | 時間軸 | text | 3–8 | none |
| P17 | 作者卡 | mixed | 3–6 | square |
| P18 | 大字無圖標題卡 | text, zoom | 1–3 | none |
| P19 | 跑馬燈 | text | 3–10 | none |
| P27 | 引言卡 | text, zoom | 1 | none |

#### Scenario: P04 的分組

- **WHEN** 讀取 P04 與 P27
- **THEN** 兩者的 `group` 都是 `text-led`

### Requirement: 文字為主分組的展示類型(之2)

用途分組 `text-led` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P35 | 新聞簡報 | text | 3–6 | none |
| P36 | 重點整理 | text | 3–5 | none |
| P37 | 直播文字 | text | 不限 | none |
| P38 | 背景說明框 | text | 1 | none |

#### Scenario: P35 的分組

- **WHEN** 讀取 P35 與 P38
- **THEN** 兩者的 `group` 都是 `text-led`

### Requirement: 互動、導覽與推廣分組的展示類型

用途分組 `interactive` SHALL 包含下列展示類型:

| id | 名稱 | 標籤 | 則數 | 圖片角色 |
| --- | --- | --- | --- | --- |
| P15 | 分頁籤切換 | mixed | 每頁 3–6 | main、square 或 none |
| P28 | 熱門話題標籤列 | text | 5–12 | none |
| P29 | 分類導覽列 | text | 3–8 | none |
| P30 | 投票 / 民調 | mixed | 1 | main 或 none |
| P31 | 摺疊問答 | text | 3–8 | none |
| P32 | 訂閱 / 電子報招募 | mixed | 1 | main 或 none |

#### Scenario: P15 的分組

- **WHEN** 讀取 P15 與 P32
- **THEN** 兩者的 `group` 都是 `interactive`

### Requirement: 新型式與變體

只有排列方式、互動方式或內容結構不同,才 SHALL 新增展示類型;只差欄數、則數、主比例或文字量時,MUST 視為同一型的變體,用參數處理。展示類型總數 MUST NOT 超過 40。

#### Scenario: 第 41 種展示類型

- **WHEN** 資料中有 41 種展示類型
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: slot 與圖片角色

展示類型 SHALL 以 `slots` 描述各位置,每個 slot 有 `role`、`count`(數字或 `"rest"`)與 `image`(圖片角色的允許清單)。圖片角色只有 `main`(網站主比例)、`square`(1:1)、`video`(16:9)、`none`(無圖)。展示類型 MUST NOT 寫入任何數字比例;`main` 一律換成 SiteProfile 的主比例。

#### Scenario: slot 寫死比例

- **WHEN** slot 的 `image` 為 `"3:2"`
- **THEN** schema 驗證失敗

#### Scenario: 允許清單有兩個角色

- **WHEN** P03 的 slot 允許 `["main", "square"]`
- **THEN** 引用 P03 的範本必須用 `imageRole` 選定其中一個

### Requirement: 特殊則數

則數範圍 SHALL 用下列方式表達:

- 「不限」:`max` 為 `null`。P34 另存每次載入的則數 `pageSize: 10`。
- P15:`items` 指每一頁的則數;範本另存分頁數,總則數 = 分頁數 × 每頁則數。
- P16:`items` 為 1 則圖輯;該則新聞的 `gallery` 圖片數 MUST 在 6~12 張之間。
- P21:主則 1 則加連結 2~4 則,合計 3~5 則。
- P24:每個時段算一則。

#### Scenario: 不限則數

- **WHEN** 引用 P37 的範本設定則數 50
- **THEN** 則數檢查通過

### Requirement: 響應式設定只存手機與電腦

展示類型的預設響應式設定 `responsiveDefault` SHALL 只存 `mobile` 與 `desktop` 兩組,各含排法(`layout`)與欄數(`cols`)。尚未定義排法的型(P21~P38)MAY 為 `null`,第 1 層不檢查。平板的欄數 MUST NOT 存在資料裡,由程式用確定性規則推算:初版為「電腦版欄數減一欄,且不少於手機欄數」;tablet-V 用手機排法,tablet-H 用電腦排法。

#### Scenario: 推算平板欄數

- **WHEN** P07 的手機 2 欄、電腦 4 欄
- **THEN** 平板推算為 3 欄

#### Scenario: 尚未定義的型

- **WHEN** P25 的 `responsiveDefault` 為 `null`
- **THEN** 第 1 層規則檢查不回報錯誤

### Requirement: 型 01~10 的預設響應式排法

型 01~10 的 `responsiveDefault` SHALL 依下表設定:

| 型 | 手機(< 主切換點) | 電腦(≥ 主切換點) |
| --- | --- | --- |
| 01 | 全寬,疊字限兩行;圖太扁時改型 02 | 主欄全寬,疊字加摘要 |
| 02 | 全寬 | 主欄寬,結構相同 |
| 03 | 單欄,縮圖約 1/3 寬 | 縮圖約 1/4 寬,或兩欄並排 |
| 04 | 單欄 | 側欄單欄,或主欄兩欄 |
| 05 | 單欄,先顯示前 5 則 | 側欄單欄 |
| 06 | 單欄 | 側欄單欄 |
| 07 | 2 欄 | 3–4 欄 |
| 08 | 大圖全寬,小卡 2 欄在下 | 左 8 右 4,小卡 2×2 |
| 09 | 大圖全寬,清單在下 | 左右並排,約 8:4 |
| 10 | 兩則大圖上下堆疊,小卡 2 欄 | 大圖 2 欄,小卡 4 欄 |

#### Scenario: P09 的預設

- **WHEN** 讀取 P09 的 `responsiveDefault`
- **THEN** 手機為 `stack`,電腦為 `split` 且 `cols` 為 `[8, 4]`

### Requirement: 型 11~20 的預設響應式排法

型 11~20 的 `responsiveDefault` SHALL 依下表設定:

| 型 | 手機(< 主切換點) | 電腦(≥ 主切換點) |
| --- | --- | --- |
| 11 | 主圖全寬,其餘 2 欄 | 主圖 2/3 + 側邊 2 格,下排 4 格 |
| 12 | 一次約 1.2 張,手指滑動 | 一次 3–4 張,加左右箭頭 |
| 13 | 一次約 2.2 張 | 一次 5–6 張 |
| 14 | 圖上文下 | 左圖右文,約 7:5 |
| 15 | 分頁籤可橫向捲動 | 分頁籤一列排開 |
| 16 | 3 欄 | 6–8 欄 |
| 17 | 2 欄,或橫向捲動 | 4 欄 |
| 18 | 單欄,字級縮小 | 2–3 欄並排 |
| 19 | 速度放慢,或改單則輪替 | 單列跑馬燈 |
| 20 | 全寬,標籤精簡 | 依所在欄寬 |

#### Scenario: P16 的預設

- **WHEN** 讀取 P16 的 `responsiveDefault`
- **THEN** 手機為 3 欄

### Requirement: 響應式規則

響應式 SHALL 只用 RWD:同一份 HTML 依寬度改變排列。比例 MUST NOT 隨裝置改變;則數 MUST NOT 因裝置刪減,太長時改用輪播或「看更多」;側欄區塊在手機上移入主欄。

#### Scenario: 手機上減少則數

- **WHEN** 範本設定手機只顯示 3 則、電腦顯示 6 則
- **THEN** schema 驗證失敗(則數不分裝置)
