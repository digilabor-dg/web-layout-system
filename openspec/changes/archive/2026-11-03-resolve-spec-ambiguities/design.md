# Design

## Context

動機見 proposal.md 的 Why。15 個問題分兩輪問答,本文件記錄最後的決定與理由:

- 第一輪:使用者在 commit `2f64803` 填寫各題的「回答」。
- 第二輪:Claude 回應後,使用者在 commit `4a6d8b4` 回答追加的 5 題。

原始問答內容保留在這兩個 commit 中。

標「Claude 詮釋」的項目,是 Claude 依使用者的回答推論出來的做法,使用者審閱 PR 時可推翻。

## Goals / Non-Goals

**Goals:**

- 後續 change 要用到的每一個決定都有明確答案。

**Non-Goals:**

- 不寫程式,不建立 schema 或範例資料。
- 不搬移規格。搬移由下一個 change `migrate-docs-to-openspec` 負責。

## 專案方向(使用者的目標預想)

- headless、CLI 先行:用 JSON 定義一切,就能生成與評估配置。
- 之後再做前端實作工具,Vue、React、Angular 都可以。
- 後端與工具先用 Node.js,之後視需要移植到 Python、C#。
- 最後才做設計工具與 component library。

這個方向對實作的影響:

- JSON Schema 是跨語言的合約。
- 測試寫成「輸入 JSON + 預期結果 JSON」的 fixture,日後移植時直接當相容性測試。
- 核心邏輯不碰 Node 專屬的 API,CLI 只是外層。

## Decisions

### P 流程

#### P1. 規格的唯一依據改為 `openspec/specs/`

- **決定**:
  - 選 b。`openspec/specs/` 成為唯一依據;`docs/spec/` 改為發想與資料收集。
  - 第二輪選「一次全搬」:另開 change `migrate-docs-to-openspec`,把 `docs/spec/01~05` 全部改寫成 capability spec,連同本文件的決定一起寫進去。
- **過渡期**:搬移的 change archive 之前,以 `docs/spec/` 加本文件的決定為依據。
- **取捨**:一次全搬後,`specs/` 會包含第 2~7 階段還沒實作的需求。各階段 change 實作時再用 MODIFIED 調整,見 Risks。

#### P2. 一個開發階段 = 一個 change

- **決定**:選 a。一個階段對應一個 change 和一個 PR。
- **實務限制**:這個 session 只能推到一個分支。如果無法另開分支,多個 change 會放在同一個 PR 裡,每個 change 一個 commit。

### A 規格互相矛盾

- **A1 影片縮圖**:選 a。新增圖片角色 `video`,固定 16:9。影音內容的新聞則要提供 `images.video`;型 12、13、22 放影音時用 `video` 角色。
- **A2 二選一的圖片比例**:選 a。
  - 展示類型的 slot 用允許清單,例如 `image: ["main","square"]`。
  - 範本用 `imageRole` 在清單中選定一個;實例不可覆寫。
- **A3 版位 D 的警告**:選 b。把型 05 加進「新聞」的建議搭配。
- **A4 階段編號**:選 a。`docs/spec/04-evaluator.md` 的標題改為「版面生成(第 7 階段)」,已在本 change 修正。

### B 規格沒寫

#### B1. 展示類型其餘屬性

- **決定**:依建議。
  - 新增 `imageText` 欄位,值為 `stacked`、`side`、`overlay`、`none`。
  - 38 型的屬性由 Claude 推定,在第 1 階段的 PR 裡列表,標為「推定」。

#### B2. 型 21~38 的響應式設定

- **決定**:選 a。schema 允許填 `null`,表示尚未定義,第 1 層不檢查。

#### B3. 特殊則數

- **決定**:先依建議。
  - 「不限」存成 `max: null`。
  - 型 21 存 `{min:3, max:5}`。
  - 型 16 的則數算 1 則,新聞則另加 `gallery` 存 6~12 張圖。
  - 型 15 的範圍指每一頁的則數,範本另存分頁數。
  - 型 24 的每個時段當成一則新聞則。
- **使用者補充**:每種編排都不完美,還有發展空間,所以後面才有生成、評估、反饋這幾個階段。

#### B4. 圖片寬高格式與圖片角色名稱

- **決定**:先依建議。
  - 每個圖片角色存成 `{ src, width, height }`。
  - 第 1 層檢查兩件事:寬高比與該角色的比例相差不超過 1%;不得是直式。
- **角色名稱**:依用途命名,不依比例命名。
  - `main`:網站主比例。平面站是 3:2,影視站是 16:9。
  - `square`:固定 1:1。
  - `video`:固定 16:9。
  - 3:2 只是平面站 `main` 的值,所以不另取 `photograph` 之類的名字。

#### B5. 標題字數

- **決定**:選 b。不另存,需要時由程式從 `title` 算。
- **內容太多或太少**:不另訂新標準,第 2 階段用既有的兩把尺判斷:
  - 太多:看標題行數,一般 ≤ 2 行,手機 ≤ 3 行。
  - 太少:看填充率,60%~90%。

#### B6. section、編號與裝置差異

- **B6-1 section 寫在 Page 裡**:不另立 prototype,維持 9 種。
- **B6-2 section 的排法(Claude 詮釋)**:每個 section 是一個 12 欄的容器,有兩種排法:
  - `stack`:宣告欄配置,例如 `[8,4]`。每欄由上而下堆疊區塊,用來表達主欄與側欄;兩欄高度各自獨立,這正是 03「版面平衡」要比的東西。
  - `flow`:每個區塊宣告自己佔幾欄(span),由左而右排,加總超過 12 就自然換列。這是使用者第二輪提出的想法。
  - section 另有 `fluid` 屬性:是否不受容器最大寬度限制。
- **B6-3 版位編號可以切換(Claude 詮釋)**:頁面用 `codeScheme` 選擇兩種編號之一:
  - `flat`:區塊在整頁唯一,用 A~Z;則用區塊代號加序數,例如 H3。
  - `sectioned`:section 字母加區塊字母,例如 AC;則例如 AC12。
  - **代號由位置推算,不存在資料裡**:區塊之間的引用一律用穩定的 `id`,所以區塊換 section 時參照不會斷。
  - 位置(在哪個 section、哪一欄、第幾塊)只寫在 Page 裡。實例不再自己存 `page`、`slot`、`order`,避免兩處不一致。
- **B6-4 各裝置的差異(Claude 詮釋)**:
  - 實例可以分別設定在手機、電腦上顯示或隱藏。
  - 實例可以設定在手機上的順序,對應 01「側欄在手機上移入主欄」。
  - 01 有一條「不在手機上藏稿」,所以整塊在某種裝置隱藏時,第 1 層列為警告。
- **B6-5 Atomic Design**:只當參考,幫助理解,不照搬它的層級。

#### B7. 斷點與預設參數組

- **裝置分 4 類**:`mobile`、`tablet-V`、`tablet-H`、`desktop`。
- **設計只針對手機與電腦**:
  - 展示類型和 section 只存 `mobile` 與 `desktop` 兩組設定。
  - 平板由程式用確定性的規則推算,介於手機與電腦之間。
  - 初版規則沿用 01 的「電腦版欄數減一欄,且不少於手機欄數」,第 2 階段再調整。
- **預設參數組**:內建 `bs5`(Bootstrap 5)、`tw4`(Tailwind CSS 4)、`md3`(Material Design 3,可選)三組,範例站用 `bs5`。
  - 每組包含斷點、容器寬、欄距、欄數,以及字級、行高等字體預設值。
  - 網站設定可以逐項覆寫。
  - 框架沒有定義平均字寬,中文預設 1em。
- **主切換點**:就是 tablet-H 的起點。`bs5` 是 992px,與原規格相同;`tw4` 是 1024px;`md3` 是 840px。
- **測試寬度不變**:三組都把 6 種測試寬度分進同樣的 4 類:
  - 360、390 是 mobile。
  - 768 是 tablet-V。
  - 1024 是 tablet-H。
  - 1280、1440 是 desktop。
- **數值出處**:實作時依各框架的官方文件填入,並註明版本。

#### B8. 第 1 層額外的檢查項目

- **決定**:暫依建議。因為 B6-3 的決定,其中「頁面與實例位置一致」改成「每個實例恰好被一個頁面引用一次」。

#### B9. `npm run validate` 的結束代碼與輸出格式

- **決定**:暫依建議。
  - 有錯誤時 exit code 1;只有警告時 exit code 0;`--strict` 時警告也回傳 1。
  - 預設輸出文字清單;`--json` 改輸出 JSON。

### 由 Claude 直接決定的細節

使用者沒有異議,照原提案:

- 英文 id 命名:
  - 內容類型:`news`、`flash`、`video`、`opinion`、`chart`、`feature`、`promo`。
  - 外觀標籤:`image`、`text`、`mixed`、`carousel`、`zoom`。
  - 用途分組:`news-combo`、`av`、`data`、`text-led`、`interactive`。
- `data/` 的檔案切法:一個 prototype 放一個資料夾,一筆資料一個 JSON 檔。
- 工具:Ajv(JSON Schema 2020-12)、tsx、ESLint flat config 加 typescript-eslint。CI 跑 Node 20 與 22。
- README 只改標題。

## Risks / Trade-offs

- [一次全搬,`specs/` 會包含尚未實作的需求] → 搬移 change 的 proposal 註明每個 capability 預計在哪個階段實作;各階段 change 實作時,用 MODIFIED 修正與實作不符的地方。
- [B6-2、B6-3、B6-4 是 Claude 的詮釋] → 在 PR 說明的「待確認」逐條列出,使用者可推翻。
- [B1 推定的 38 型屬性可能和設計意圖不同] → 第 1 階段 PR 附屬性表,確認前標為「推定」。
- [`md3` 沒有欄數與欄距的官方定值] → 實作時查證;查不到的項目標為示意值。
