# Design

## Context

動機見 proposal.md。來源有兩份:`docs/spec/01~05`,以及 archive 中 `2026-11-03-resolve-spec-ambiguities/design.md` 的決定。兩者衝突時,以決定為準。

## Goals / Non-Goals

**Goals:**

- `docs/spec/` 裡每一條可驗收的規則,都在某個 capability 有對應的 SHALL 條文和情境。
- 每個 capability 註明實作階段(見 proposal.md),各階段 change 以它為基準。

**Non-Goals:**

- 不搬背景說明:延伸應用、需要的知識、上線後驗證、mermaid 圖。
- 不寫範例資料的推定值,例如 38 型的排列與強調。那些屬於資料,放在第 1 階段的 `data/`。

## Decisions

### capability 的切法

- **以「會隨系統演進的行為」為界**:例如 `rule-check` 擁有所有第 1 層規則代號;`template-evaluation` 和 `page-evaluation` 分別擁有第 2、3 層的門檻。
- **`evaluation-report` 只管怎麼判、怎麼報**:各層只定義量什麼、門檻多少,判定方式與報告格式統一由它負責。
- **`image-ratio-policy` 獨立成一份**:它同時約束資料(第 1 層)、渲染(第 3 階段)與量測(第 4 階段),放在任何一份都不完整。

### 規則代號

第 1 層每條規則都有固定的 kebab-case 代號(見 `rule-check`)。CLI 輸出、測試 fixture 與日後的其他語言移植都用同一組代號。

## Claude 補充的詮釋(待使用者確認)

規格沒寫、但條文必須寫明的地方,Claude 先做了下列決定。審閱 PR 時可逐條推翻。

| # | 位置 | 詮釋 | 理由 |
| --- | --- | --- | --- |
| 1 | `layout-patterns` P13 | P13 放影音時仍用 `square`(1:1),只有 P12、P22 用 `video` | 01 一方面說「影片縮圖一律 16:9」,一方面又規定「短影音用型 13 方形輪播」,兩者衝突。這裡以後者為準,修正決策 A1 把 13 列進 `video` 的部分 |
| 2 | `site-profile` 主切換點 | tablet-V 用手機的排法結構、tablet-H 用電腦的排法結構,欄數另外推算 | 分成 4 類裝置後,「主切換點」需要明確落點 |
| 3 | `site-profile` 視窗高度 | 360×800、390×844、768×1024、1024×768、1280×800、1440×900 | 規格只給了 390×844,其他寬度沒有高度 |
| 4 | `template-evaluation` 末列不落單 | 餘數 0 合格;餘數 ≥ 欄數一半為警告;0 < 餘數 < 欄數一半為不合格 | 「上限:餘數 ≥ 欄數一半」可以有兩種讀法。這裡讀成「最後一列剩下不到一半才算落單」 |
| 5 | `template-evaluation` 填充率、列距 | 只有合格與警告,沒有不合格 | 05 只給了目標值 |
| 6 | `page-evaluation` 區塊數、整頁則數 | 區塊數 6~9 為警告、少於 6 不合格;整頁少於 30 則為警告 | 01 說精簡型網站可少到 6~10 塊,03 只給了上限 |
| 7 | `block-composition` 範本 `role` | 新增欄位 `role`(headline、popular、flash 等) | 「單塊不重複」與各用途的建議則數,都需要知道一塊是頭條還是熱門 |
| 8 | `page-evaluation` 新項目 | 「放大型不相鄰」「用途則數」各列為一項 | 來自 05 的「層級不清」與 01 的建議則數表 |
| 9 | `page-evaluation` 相鄰 | 手機看單欄順序;電腦看每一欄由上而下;兩者取較差的結果 | 有了 section 之後,「相鄰」需要定義 |
| 10 | `rule-check` | 新增 `duplicate-item-on-page` 警告:同一則新聞出現在同一頁兩個實例 | 選稿規則重疊時常見,但規格沒提 |
| 11 | `block-composition` 裝置顯示 | tablet-V 跟手機、tablet-H 跟電腦 | 只有手機與電腦兩個開關 |
| 12 | `render-measurement` | 固定字型、deviceScaleFactor 1、停用自動播放 | 量測也要符合「同樣輸入、同樣結果」 |
| 13 | `layout-patterns` 不限則數 | P34、P37 的 `min` 為 1;P34 的 `pageSize` 為 10 | 規格只寫「不限」 |
| 14 | `sample-data` 首頁位置 | C、D 放 section 1 右欄,K 放 section 3 右欄,E 與 L、M 全寬 | 照決策 B6 的建議,讓推算出的代號剛好是 A~M |
| 15 | `sample-data` 欄距 | bs5 的預設欄距是 1.5rem,範例站覆寫為 1rem | 保留 01 原本的「欄距 1rem」,也順便示範覆寫 |
| 16 | `improvement-suggestions` | 「內文等級」先列為候選改法,不定義數值範圍 | 05 用到這個詞(例如小卡上限 2 級),但沒有定義,留給第 5 階段 |

## Risks / Trade-offs

- [第 2~7 階段的需求尚未實作就進了 `specs/`] → 各階段的 change 用 MODIFIED 修正;`openspec/specs/` 是目標合約,不是實作現況。
- [詮釋可能和使用者的意圖不同] → 全部集中在上表,PR 說明另外列出。
- [搬移有遺漏] → `docs/spec/` 原樣保留,可以隨時對照。
