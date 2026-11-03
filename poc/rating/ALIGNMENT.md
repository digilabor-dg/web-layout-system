# 雙評分對齊

> 由 `npm run poc:align` 產生。評分檔 16 份:`ratings-persona-desktop-reader.json`、`ratings-persona-frontend-engineer.json`、`ratings-persona-mobile-commuter.json`、`ratings-persona-news-editor.json`、`ratings-persona-senior-reader.json`、`ratings-persona-skimmer.json`、`ratings-persona-ux-a11y.json`、`ratings-persona-visual-designer.json`、`ratings-persona-desktop-reader.json`、`ratings-persona-frontend-engineer.json`、`ratings-persona-mobile-commuter.json`、`ratings-persona-news-editor.json`、`ratings-persona-senior-reader.json`、`ratings-persona-skimmer.json`、`ratings-persona-ux-a11y.json`、`ratings-persona-visual-designer.json`。

來源:`human` 是真人(檢視工具匯出);`ai-persona` 是角色 agent 的擬人評分,只用來找盲點,不能取代真人。

## A/B:程式分數較高的那一版,評分者是否也選它

整體一致率:**57 / 75**(76%)(不含「差不多」與程式同分的題目)。

| 評分者 | 作答 | 有分出勝負 | 與程式一致 |
| --- | --- | --- | --- |
| persona-desktop-reader · 第 1 輪 | 10 | 9 | 6 |
| persona-frontend-engineer · 第 1 輪 | 10 | 10 | 8 |
| persona-mobile-commuter · 第 1 輪 | 10 | 10 | 6 |
| persona-news-editor · 第 1 輪 | 10 | 10 | 9 |
| persona-senior-reader · 第 1 輪 | 10 | 9 | 8 |
| persona-skimmer · 第 1 輪 | 10 | 9 | 5 |
| persona-ux-a11y · 第 1 輪 | 10 | 9 | 7 |
| persona-visual-designer · 第 1 輪 | 10 | 9 | 8 |

| 配對 | 程式選 | 同意 | 不同意 | 差不多 | 不同意的原因 |
| --- | --- | --- | --- | --- | --- |
| 範例 01 同型連續與放大型相鄰 · V1 vs 範例 01 同型連續與放大型相鄰 · V2 | 範例 01 同型連續與放大型相鄰 · V2 | 3 | 5 | 0 | persona-desktop-reader · 第 1 輪:A 的政治區塊大圖配清單比較緊湊;B 一列只一行字,右邊空很大 / persona-frontend-engineer · 第 1 輪:B 的側欄提早結束,下方兩個區塊右側空一大欄;A 空欄較短 / persona-mobile-commuter · 第 1 輪:政治區大圖加列表好掃;B 改成六張小圖一長串,右邊空白多又要多滑 / persona-skimmer · 第 1 輪:政治區用大圖加標題列表,比一排排小圖拉長好掃,整頁也比較短 / persona-ux-a11y · 第 1 輪:B 版政治改成小圖列表,每列一行字,右側大片空白,頁面也變長。 |
| 範例 02 末列落單 · V2 vs 範例 02 末列落單 · V1 | 範例 02 末列落單 · V2 | 7 | 1 | 0 | persona-skimmer · 第 1 輪:焦點區短很多,能早點滑到即時和排行;雖然第二排落單一張有點空 |
| 範例 03 疊字標題過長 · V1 vs 範例 03 疊字標題過長 · V2 | 範例 03 疊字標題過長 · V2 | 8 | 0 | 0 | — |
| 範例 04 輪播右側留白 · V2 vs 範例 04 輪播右側留白 · V1 | 範例 04 輪播右側留白 · V2 | 8 | 0 | 0 | — |
| 範例 05 手機區塊太長 · V1 vs 範例 05 手機區塊太長 · V2 | 範例 05 手機區塊太長 · V2 | 8 | 0 | 0 | — |
| 範例 06 觸控目標太小 · V2 vs 範例 06 觸控目標太小 · V1 | 範例 06 觸控目標太小 · V2 | 2 | 1 | 5 | persona-mobile-commuter · 第 1 輪:區塊標題和內容貼得較緊,整頁短一點;差異很小 |
| 範例 07 整頁則數太多 · V1 vs 範例 07 整頁則數太多 · V2 | 範例 07 整頁則數太多 · V2 | 0 | 8 | 0 | persona-desktop-reader · 第 1 輪:A 的短影音排滿整排、右邊不空,內容也比較多 / persona-frontend-engineer · 第 1 輪:A 補足則數,網格與短影音輪播都排滿整列;B 輪播右半空掉 / persona-mobile-commuter · 第 1 輪:短影音排滿、多幾則可看;不過社會區右側的空白也跟著拉長 / persona-news-editor · 第 1 輪:A 短影音補到整列排滿,不再空半排;不過社會區多一列補充稿,右側空白跟著變長 / persona-senior-reader · 第 1 輪:短影音整排排滿不空;B 右邊空一大塊,像沒做完。 / persona-skimmer · 第 1 輪:短影音一排填滿、標題多幾則;B 右半邊空著像沒排完 / persona-ux-a11y · 第 1 輪:社會、科技網格與短影音都排滿沒有空洞,雖然頁面稍長。 / persona-visual-designer · 第 1 輪:A 短影音撐滿全寬;社會、科技網格雖拉長,但沒有 B 輪播右側空一截的破綻 |
| 範例 08 頭條重複 · V2 vs 範例 08 頭條重複 · V1 | 範例 08 頭條重複 · V2 | 8 | 0 | 0 | — |
| 範例 09 區塊太多 · V1 vs 範例 09 區塊太多 · V2 | 範例 09 區塊太多 · V2 | 8 | 0 | 0 | — |
| 範例 10 貪婪法組合改法 · V2 vs 範例 10 貪婪法組合改法 · V1 | 範例 10 貪婪法組合改法 · V2 | 5 | 3 | 0 | persona-desktop-reader · 第 1 輪:A 的政治清單一行字配大片空白、整頁拉長;B 比較緊湊 / persona-mobile-commuter · 第 1 輪:整頁短很多,政治區大圖加列表好掃;A 政治改成一長串小圖要多滑 / persona-skimmer · 第 1 輪:政治區用大圖加列表比較緊湊,整頁短很多;A 小圖列表拉太長 |

## 區塊評分:和程式分數比

盲點:評分比程式低 3 分以上(評估器可能漏了問題)。可能的誤判:評分比程式高 3 分以上(評估器可能太嚴)。

| 版面 | 評分者 | 塊數 | 平均分 | 等級相關 | 平均差距 | 盲點 | 可能誤判 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 示意首頁(預設參數) | persona-desktop-reader · 第 1 輪 | 13 | 5.31 | 0.07 | 2.00 | A、B、J、K | — |
| 示意首頁(預設參數) | persona-desktop-reader · 第 2 輪 | 13 | 5.08 | 0.07 | 2.38 | A、B、J、K | — |
| 示意首頁(預設參數) | persona-frontend-engineer · 第 1 輪 | 13 | 5.69 | 0.07 | 1.92 | B、D、K | — |
| 示意首頁(預設參數) | persona-frontend-engineer · 第 2 輪 | 13 | 5.69 | 0.03 | 2.08 | B、D、J、K | — |
| 示意首頁(預設參數) | persona-mobile-commuter · 第 1 輪 | 13 | 6.08 | 0.18 | 1.38 | A、B、D、K | — |
| 示意首頁(預設參數) | persona-mobile-commuter · 第 2 輪 | 13 | 6.46 | 0.16 | 1.62 | A、B、D、K | — |
| 示意首頁(預設參數) | persona-news-editor · 第 1 輪 | 13 | 5.23 | 0.22 | 1.92 | B、D、K | — |
| 示意首頁(預設參數) | persona-news-editor · 第 2 輪 | 13 | 5.08 | 0.23 | 2.08 | A、B、D、H、J、K | — |
| 示意首頁(預設參數) | persona-senior-reader · 第 1 輪 | 13 | 6.46 | 0.01 | 1.31 | B、K | — |
| 示意首頁(預設參數) | persona-senior-reader · 第 2 輪 | 13 | 6.31 | 0.16 | 1.46 | B、K | — |
| 示意首頁(預設參數) | persona-skimmer · 第 1 輪 | 13 | 4.85 | 0.18 | 2.62 | A、B、D、I、K | — |
| 示意首頁(預設參數) | persona-skimmer · 第 2 輪 | 13 | 4.69 | 0.28 | 2.77 | A、B、D、I、K、L | — |
| 示意首頁(預設參數) | persona-ux-a11y · 第 1 輪 | 13 | 5.54 | -0.18 | 1.77 | A、B、D、E、K | — |
| 示意首頁(預設參數) | persona-ux-a11y · 第 2 輪 | 13 | 5.85 | 0.12 | 1.62 | B、K | — |
| 示意首頁(預設參數) | persona-visual-designer · 第 1 輪 | 13 | 5.31 | 0.13 | 2.00 | B、D、J、K | — |
| 示意首頁(預設參數) | persona-visual-designer · 第 2 輪 | 13 | 5.31 | 0.16 | 1.85 | B、D、J、K | — |

## 盲點的短評(交給 skill 對應評估項目)

| 版面 | 版位 | 評分者 | 評分 / 程式 | 短評 |
| --- | --- | --- | --- | --- |
| 示意首頁(預設參數) | A | persona-desktop-reader · 第 1 輪 | 6 / 10 | 大圖撐滿主欄只配一行標題,桌機看有點空洞;手機版還好 |
| 示意首頁(預設參數) | B | persona-desktop-reader · 第 1 輪 | 4 / 9 | 桌機三張卡只排到四分之三,右邊空一塊;手機剩一張落單 |
| 示意首頁(預設參數) | J | persona-desktop-reader · 第 1 輪 | 4 / 7 | 四則都只一行字,圖右邊大片留白,排得太鬆又沒重點 |
| 示意首頁(預設參數) | K | persona-desktop-reader · 第 1 輪 | 2 / 7 | 四張大方圖疊成一長條,每張只一行字,也看不到作者是誰 |
| 示意首頁(預設參數) | A | persona-desktop-reader · 第 2 輪 | 5 / 10 | 頭條大圖撐滿主欄,只有一行標題,沒摘要,桌機上一整片灰很空 |
| 示意首頁(預設參數) | B | persona-desktop-reader · 第 2 輪 | 3 / 9 | 桌機四欄只放三張,右邊空四分之一;手機第三張落單 |
| 示意首頁(預設參數) | J | persona-desktop-reader · 第 2 輪 | 4 / 7 | 圖高字短,每列只一行標題又沒摘要,右側大片空白 |
| 示意首頁(預設參數) | K | persona-desktop-reader · 第 2 輪 | 2 / 7 | 桌機側欄四張大方圖直排,拉得超長,比主欄長太多 |
| 示意首頁(預設參數) | B | persona-frontend-engineer · 第 1 輪 | 3 / 9 | 3 則卻排手機 2 欄、電腦 4 欄,兩個寬度都留洞,右邊空一塊 |
| 示意首頁(預設參數) | D | persona-frontend-engineer · 第 1 輪 | 4 / 7 | 排行沒有編號;手機方圖太大,文字只佔上半,下面空一截 |
| 示意首頁(預設參數) | K | persona-frontend-engineer · 第 1 輪 | 2 / 7 | 手機 2 欄、電腦反而變 1 欄巨大方圖,拉得超長,欄數邏輯顛倒 |
| 示意首頁(預設參數) | B | persona-frontend-engineer · 第 2 輪 | 3 / 9 | 3 則塞 2 欄手機落單一張,桌機 4 欄格只放 3 張右邊空一欄 |
| 示意首頁(預設參數) | D | persona-frontend-engineer · 第 2 輪 | 4 / 7 | 手機方圖縮圖太大,標題兩行下方空一截;編號欄與圖間距過寬 |
| 示意首頁(預設參數) | J | persona-frontend-engineer · 第 2 輪 | 4 / 7 | 桌機單欄每列只一行字,右側與下方三分之二都是空的,沒善用寬度 |
| 示意首頁(預設參數) | K | persona-frontend-engineer · 第 2 輪 | 2 / 7 | 手機 2 欄桌機反變 1 欄,方圖撐到近 400px 高,作者卡長到失控 |
| 示意首頁(預設參數) | A | persona-mobile-commuter · 第 1 輪 | 7 / 10 | 頭條疊字大又清楚,手機一屏還看得到下一塊;桌機圖偏大 |
| 示意首頁(預設參數) | B | persona-mobile-commuter · 第 1 輪 | 5 / 9 | 三則排兩欄,右下缺一格空空的;桌機右邊也空一塊 |
| 示意首頁(預設參數) | D | persona-mobile-commuter · 第 1 輪 | 4 / 7 | 排行看不到名次數字,每則都配大方圖,五則就滑掉一屏 |
| 示意首頁(預設參數) | K | persona-mobile-commuter · 第 1 輪 | 3 / 7 | 方圖超大,桌機側欄要一路往下拉;也看不到作者是誰 |
| 示意首頁(預設參數) | A | persona-mobile-commuter · 第 2 輪 | 7 / 10 | 頭條疊字清楚,手機一屏一則剛好;電腦版大圖高到要滑一下。 |
| 示意首頁(預設參數) | B | persona-mobile-commuter · 第 2 輪 | 5 / 9 | 手機第三張落單,右邊空一塊;電腦版右側也空著一截。 |
| 示意首頁(預設參數) | D | persona-mobile-commuter · 第 2 輪 | 3 / 7 | 方圖太大、編號和圖中間空一截,五則要滑好久才看完。 |
| 示意首頁(預設參數) | K | persona-mobile-commuter · 第 2 輪 | 4 / 7 | 手機方圖偏大還能看;電腦版單欄巨大方圖,一屏才一則。 |
| 示意首頁(預設參數) | B | persona-news-editor · 第 1 輪 | 4 / 9 | 焦點只有三則小卡,電腦版右邊空一格、手機剩一張落單,撐不起第二層 |
| 示意首頁(預設參數) | D | persona-news-editor · 第 1 輪 | 3 / 7 | 叫排行卻沒有名次數字,方形大縮圖搶版面,標題下方大片空白 |
| 示意首頁(預設參數) | K | persona-news-editor · 第 1 輪 | 2 / 7 | 作者卡卻看不到作者名與頭像;電腦版四張大方圖直疊,拉得極長 |
| 示意首頁(預設參數) | A | persona-news-editor · 第 2 輪 | 7 / 10 | 大圖疊字夠份量,手機很好;電腦版標題一行偏小,沒摘要撐不起整張大圖 |
| 示意首頁(預設參數) | B | persona-news-editor · 第 2 輪 | 3 / 9 | 焦點只有三則,電腦右邊空一格、手機落單一張;看起來跟一般分類沒兩樣 |
| 示意首頁(預設參數) | D | persona-news-editor · 第 2 輪 | 4 / 7 | 排行配大方圖太佔高度,編號與標題之間隔太開,一眼掃不完前五名 |
| 示意首頁(預設參數) | H | persona-news-editor · 第 2 輪 | 3 / 6 | 跟國際長得一模一樣,同樣四加二缺角,讀者分不出這是另一個分類 |
| 示意首頁(預設參數) | J | persona-news-editor · 第 2 輪 | 4 / 7 | 四則等重沒主稿,電腦標題只佔一行,右下大片空白,和政治重複 |
| 示意首頁(預設參數) | K | persona-news-editor · 第 2 輪 | 3 / 7 | 電腦窄欄堆四張巨型方圖,拉得超長;作者該是小頭像,不是大圖 |
| 示意首頁(預設參數) | B | persona-senior-reader · 第 1 輪 | 5 / 9 | 才三則,電腦版右邊空一大塊,手機第三則孤零零的。 |
| 示意首頁(預設參數) | K | persona-senior-reader · 第 1 輪 | 4 / 7 | 電腦版四張大方圖要一直滑,標題字小,也看不到作者是誰。 |
| 示意首頁(預設參數) | B | persona-senior-reader · 第 2 輪 | 4 / 9 | 手機第三則孤零零,電腦右邊空一大塊,看起來沒排好。 |
| 示意首頁(預設參數) | K | persona-senior-reader · 第 2 輪 | 4 / 7 | 電腦版方圖巨大一張張疊下去,要滑好久,作者名太小。 |
| 示意首頁(預設參數) | A | persona-skimmer · 第 1 輪 | 5 / 10 | 標題壓在圖上還算清楚,但電腦版一大片圖只換到一則標題 |
| 示意首頁(預設參數) | B | persona-skimmer · 第 1 輪 | 4 / 9 | 才三則,手機第三張落單、電腦右邊空一格,標題還折兩行 |
| 示意首頁(預設參數) | D | persona-skimmer · 第 1 輪 | 3 / 7 | 說是排行卻看不到名次數字,方圖又大,五則就佔滿一屏 |
| 示意首頁(預設參數) | I | persona-skimmer · 第 1 輪 | 3 / 6 | 整塊只有一個標題,大圖佔滿,電腦版右下還空一大片 |
| 示意首頁(預設參數) | K | persona-skimmer · 第 1 輪 | 2 / 7 | 電腦版一張大方圖配一行標題,四則要滑快兩屏,太浪費 |
| 示意首頁(預設參數) | A | persona-skimmer · 第 2 輪 | 6 / 10 | 疊字標題夠大好讀,但電腦版一張大圖佔滿一屏只換到一個標題 |
| 示意首頁(預設參數) | B | persona-skimmer · 第 2 輪 | 4 / 9 | 手機第三張孤零零掉到下一行,電腦版右邊空一大格 |
| 示意首頁(預設參數) | D | persona-skimmer · 第 2 輪 | 3 / 7 | 排行榜配大方圖,手機五則要滑快兩屏,號碼和圖中間還空一截 |
| 示意首頁(預設參數) | I | persona-skimmer · 第 2 輪 | 3 / 6 | 一大張圖只換一個標題,電腦版「園」字單獨掉一行,下方空一大片 |
| 示意首頁(預設參數) | K | persona-skimmer · 第 2 輪 | 2 / 7 | 電腦版單欄超大方圖,四個標題要滑三屏,圖完全壓過標題 |
| 示意首頁(預設參數) | L | persona-skimmer · 第 2 輪 | 4 / 7 | 第四次圖卡網格;電腦版標題一行好讀,但圖大到一屏只見三則 |
| 示意首頁(預設參數) | A | persona-ux-a11y · 第 1 輪 | 6 / 10 | 白字疊在漸層淺處,手機第一行對比偏弱;字級夠大但閱讀吃力。 |
| 示意首頁(預設參數) | B | persona-ux-a11y · 第 1 輪 | 5 / 9 | 手機3張排2欄最後落單,電腦右側空一欄,版面不完整。 |
| 示意首頁(預設參數) | D | persona-ux-a11y · 第 1 輪 | 4 / 7 | 排行卻看不到名次數字,大方圖把列表拉很長,文字下方空白。 |
| 示意首頁(預設參數) | E | persona-ux-a11y · 第 1 輪 | 4 / 7 | 手機只露一小條下一張且標題被截,沒點點;電腦箭頭壓在圖上。 |
| 示意首頁(預設參數) | K | persona-ux-a11y · 第 1 輪 | 3 / 7 | 作者卡看不到作者名與頭像;電腦單欄四張大方圖,捲很久。 |
| 示意首頁(預設參數) | B | persona-ux-a11y · 第 2 輪 | 4 / 9 | 三則放四欄,右邊空一大塊;手機第三張落單,看起來像缺件。 |
| 示意首頁(預設參數) | K | persona-ux-a11y · 第 2 輪 | 3 / 7 | 桌機窄欄變單欄巨大方圖,四則要捲近兩千像素,比手機還難掃。 |
| 示意首頁(預設參數) | B | persona-visual-designer · 第 1 輪 | 3 / 9 | 只有三則:手機第二列落單一張,桌機右側空出四分之一,欄底不齊 |
| 示意首頁(預設參數) | D | persona-visual-designer · 第 1 輪 | 3 / 7 | 排行卻看不到名次編號;方圖偏大,文字只佔上半,每列下方空 |
| 示意首頁(預設參數) | J | persona-visual-designer · 第 1 輪 | 4 / 7 | 又是左圖右文,桌機標題一行就結束、列間鬆散,右邊很空 |
| 示意首頁(預設參數) | K | persona-visual-designer · 第 1 輪 | 2 / 7 | 桌機窄欄四張大方圖直疊,高度失控;作者卡看不到作者資訊 |
| 示意首頁(預設參數) | B | persona-visual-designer · 第 2 輪 | 3 / 9 | 三則塞四欄,電腦版右邊空一整欄;手機版第二列落單,欄底參差 |
| 示意首頁(預設參數) | D | persona-visual-designer · 第 2 輪 | 4 / 7 | 編號和縮圖中間空一大段,方圖太大太重,文字下方大片空白,排行感被稀釋 |
| 示意首頁(預設參數) | J | persona-visual-designer · 第 2 輪 | 4 / 7 | 又一次左圖右文,電腦版一行標題配高圖,右邊三分之二空著,和政治重複 |
| 示意首頁(預設參數) | K | persona-visual-designer · 第 2 輪 | 2 / 7 | 電腦版窄欄四張大方圖直疊,高度近兩千像素,圖大得失控,作者卡不像作者卡 |
