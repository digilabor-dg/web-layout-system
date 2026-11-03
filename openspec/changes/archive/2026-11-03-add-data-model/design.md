# Design

## Context

需求見 `openspec/specs/`;本文件只記實作上的選擇。

## Goals / Non-Goals

**Goals:**

- 第 1 層規則全部實作,每條都有合法與不合法的 fixture。
- 核心可移植:資料、schema、預設參數組都由呼叫端傳入。

**Non-Goals:**

- 不做估算、渲染、評估(第 2 階段以後)。
- 不建置成可發佈的 JS 套件。

## Decisions

### 一份資料一個檔,依 `type` 選 schema

`data/` 依 prototype 分資料夾,每筆資料一個 JSON 檔。載入時不看資料夾名稱,只看每份資料的 `type` 欄位,所以資料夾怎麼放不影響檢查結果。

### 兩輪檢查

1. 逐檔做 schema 驗證;通過的資料依 prototype 建索引。
2. 規則只看索引裡的資料。

沒通過 schema 的資料不進第二輪,避免形狀不對造成連鎖誤報。但它的 id 仍記為「存在」,引用它的資料不另報 `ref-exists`。

### 不寫死特定型

規則判斷用展示類型的屬性,而不是型的 id:

- 分頁籤型:`arrangement: "tabs"`。
- 圖輯型:`gallery: { min, max }`。
- 需要 16:9 縮圖的內容:`requiresVideo: true`。

換成其他內容導向的網站時,只要換資料,不用改程式。

### 嚴重度集中定義

`src/validate/types.ts` 的 `RULES` 是規則代號與嚴重度的唯一來源。建立違規時一律查這張表,測試也檢查每個代號都有 fixture。

### fixture 用 JSON Patch

- `tests/fixtures/base/minimal.json` 是一份最小但合法的資料集。
- 每條規則的案例用 RFC 6902 的 `add`、`remove`、`replace` 描述「改了哪裡」,`expect` 只列 `rule`、`id`、`severity`,不比對訊息文字。
- 其他語言只要實作這三個操作,就能沿用同一組 fixture。

### Ajv 的 strictRequired 關閉

條件式 schema(`if/then`、`oneOf`)裡的 `required` 會引用上層定義的欄位,Ajv 的 strictRequired 會誤報。其餘嚴格檢查保留。

## 38 型推定屬性表(待使用者確認)

型 01~20 的排列、強調、圖文、文字量、互動、slots 與響應式,以及型 21~38 除響應式外的同樣欄位,都是 Claude 依型名、`docs/spec/01` 的響應式表與圖鑑推定的(資料中以 `inferred` 標記)。P09 依 `02` 的範例,只有「圖文」是推定。

「手機/電腦」欄:`grid 3` 表示 3 欄;`split 8:4` 表示左右 8:4;`carousel ×1.2` 表示一次約 1.2 張。

| 型 | 名稱 | 排列 | 強調 | 圖文 | 文字量 | 互動 | slots | 手機 | 電腦 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | 大圖疊字 | single | lead1 | overlay | summary | none | lead(1):main | full | full |
| P02 | 大圖下文 | single | none | stacked | summary | none | lead(1):main | full | full |
| P03 | 左圖右文 | list | none | side | summary | none | item(rest):main/square | list 1 | list 1 |
| P04 | 純文字清單 | list | none | none | headline | none | item(rest):none | list 1 | list 1 |
| P05 | 編號排行 | list | none | side | headline | none | item(rest):square/none | list 1 | list 1 |
| P06 | 時間軸 | list | none | none | headline | none | item(rest):none | list 1 | list 1 |
| P07 | 均分圖卡網格 | grid | none | stacked | headline | none | card(rest):main | grid 2 | grid 3 |
| P08 | 首 1 則放大,其餘小卡 | grid | lead1 | stacked | headline | none | lead(1):main、card(rest):main | stack 2 | split 8:4 |
| P09 | 首 1 則放大,其餘純文字 | list | lead1 | stacked | headline | none | lead(1):main、rest(rest):none | stack | split 8:4 |
| P10 | 首 2 則放大,其餘小卡 | grid | lead2 | stacked | headline | none | lead(2):main、card(rest):main | grid 2 | grid 4 |
| P11 | 拼貼(Bento) | bento | lead1 | overlay | headline | none | lead(1):main、tile(rest):square | bento 2 | bento 4 |
| P12 | 橫式輪播 | carousel | none | stacked | headline | carousel | card(rest):main/video | carousel ×1.2 | carousel ×4 |
| P13 | 方形輪播 | carousel | none | stacked | headline | carousel | card(rest):square | carousel ×2.2 | carousel ×6 |
| P14 | 寬幅專題 | single | lead1 | side | summary | none | item(rest):main | stack | split 7:5 |
| P15 | 分頁籤切換 | tabs | none | side | headline | tabs | item(rest):main/square/none | tabs | tabs |
| P16 | 圖片牆 | grid | none | stacked | headline | none | gallery(1):square | grid 3 | grid 6 |
| P17 | 作者卡 | grid | none | stacked | headline | none | card(rest):square | grid 2 | grid 4 |
| P18 | 大字無圖標題卡 | grid | lead1 | none | summary | none | card(rest):none | list 1 | grid 3 |
| P19 | 跑馬燈 | list | none | none | headline | marquee | item(rest):none | marquee | marquee |
| P20 | 圖表卡 | grid | none | stacked | summary | none | card(rest):main | grid 1 | grid 3 |
| P21 | 主新聞群組 | list | lead1 | stacked | headline | none | lead(1):main、link(rest):none | — | — |
| P22 | 單一影片播放器 | single | lead1 | stacked | headline | play | player(1):video | — | — |
| P23 | 音訊 / Podcast 清單 | list | none | side | headline | play | item(rest):square/none | — | — |
| P24 | 節目表 / 直播時段 | list | none | none | headline | none | slot(rest):none | — | — |
| P25 | 數字卡 | grid | lead1 | none | headline | none | card(rest):none | — | — |
| P26 | 地圖卡 | single | none | stacked | summary | none | map(1):main | — | — |
| P27 | 引言卡 | single | lead1 | none | paragraph | none | quote(1):none | — | — |
| P28 | 熱門話題標籤列 | list | none | none | headline | none | tag(rest):none | — | — |
| P29 | 分類導覽列 | list | none | none | headline | none | link(rest):none | — | — |
| P30 | 投票 / 民調 | single | none | stacked | summary | poll | poll(1):main/none | — | — |
| P31 | 摺疊問答 | list | none | none | summary | accordion | qa(rest):none | — | — |
| P32 | 訂閱 / 電子報招募 | single | none | side | summary | none | signup(1):main/none | — | — |
| P33 | 資訊小工具 | grid | none | none | headline | none | widget(rest):none | — | — |
| P34 | 無限載入動態 | list | none | side | summary | none | item(rest):main | — | — |
| P35 | 新聞簡報 | list | none | none | summary | none | item(rest):none | — | — |
| P36 | 重點整理 | list | none | none | headline | none | point(rest):none | — | — |
| P37 | 直播文字 | list | none | none | paragraph | none | entry(rest):none | — | — |
| P38 | 背景說明框 | single | none | none | paragraph | none | box(1):none | — | — |

範例範本另外覆寫了兩處:次頭條(P07,4 則)電腦改 4 欄,避免末列落單;觀點評論(P17)放在側欄,電腦改單欄清單。

## Risks / Trade-offs

- [推定屬性和設計意圖不同] → 上表逐列確認;改資料即可,不必改程式。
- [Node 20 沒有在本機測過] → CI 的矩陣會跑 Node 20。
- [`exports` 指向 `.ts`] → 目前只在本 repo 使用;要發佈時再加建置步驟。
