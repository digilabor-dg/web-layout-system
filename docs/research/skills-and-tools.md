# 可搭配的 Skill、MCP 與開源工具調查

> 查詢日期:2026-11-03。這份是桌面調查,只收集資料,不代表要採用;不屬於 `docs/spec/` 規格的一部分。
> 維護訊號說明:GitHub API 在這個環境被擋,所以「最後 commit 日期」大多看不到;有 npm 套件的項目改用 **npm registry 最新版號與發佈日**(直接查 registry.npmjs.org)。星數是查詢當天 GitHub 頁面上的數字。
> 契合度:高=建議近期試用或參考;中=某個階段可能用得到;低=只供參考。

## 摘要:前 5 名建議

1. **Playwright CLI + skills(`@playwright/cli`,Apache-2.0)與 Playwright MCP(`@playwright/mcp`,Apache-2.0)**:Playwright MCP 的 README 明說「coding agent 用 CLI + skills 比 MCP 省 token」。所以第 6 階段的 skill 先讓 Claude 走 CLI(本專案 CLI 加上 `playwright-cli` 截圖、改寬度)比較合適;到 MCP 階段,再參考 `@playwright/mcp` 的工具切法(`browser_resize`、`browser_take_screenshot`)。
2. **Lighthouse 的 LHR 結構與評分方式(`lighthouse`,Apache-2.0)**:`04-evaluator.md` 要的是「Lighthouse 式結構」。LHR 的 `audits` 把每項分數記成 0–1 或 null,配 `scoreDisplayMode`;`categories.auditRefs[].weight` 是加權平均。這套結構可以直接當報告格式的範本。原始量測值怎麼映射成 0–100,可以參考它的對數常態曲線(控制點細節未查證)。
3. **`@chenglou/pretext`(MIT,1.0.0,2026-10-14)搭配 `linebreak`(UAX #14,MIT)與 BudouX(Apache-2.0,支援繁體中文)**:用在標題行數估算。pretext 的 `prepare()` 加 `layout()` 會直接算出高度和行數,但需要 Canvas 2D,在 Node 裡要自己提供 `OffscreenCanvas`。要符合「確定性」的規則,必須把字型檔固定下來。
4. **pbakaus/impeccable(Apache-2.0)**:它的架構跟本專案最像:一個 skill 加上一個不用 LLM 的確定性 detector CLI(62 條規則、`--json`、用 exit code 回報),還有打分數的 `critique`。可以拿來當本專案 skill 與 CLI 分工的範本。
5. **Claude Code plugin marketplace 格式,加上 `anthropics/skills` 的 `skill-creator`**:只要在本 repo 放 `.claude-plugin/marketplace.json`(`source: "./"`)就算發佈,不需要送審。CLAUDE.md 建議的根目錄 `skills/` 剛好就是 plugin 規定的位置。

另外有兩個值得當公式和規則來源:Ngo 等人的介面美學量測(平衡、均衡、對稱的學術依據),以及 Guardian `dotcom-rendering` 的 `FlexibleGeneral` 首頁容器(真實新聞首頁的排列規則,Apache-2.0)。

## 1. Claude Agent Skills 與 skill 集合

| 名稱 | 網址 | 做什麼 | 授權 | 維護訊號 | 怎麼搭配本專案 | 契合度 |
| --- | --- | --- | --- | --- | --- | --- |
| anthropics/skills(官方) | https://github.com/anthropics/skills | Anthropic 官方 skill 範例,共 19 個資料夾,包含 `skill-creator`、`webapp-testing`、`frontend-design`、`mcp-builder`、`web-artifacts-builder` | 多數 Apache-2.0;`docx`/`pdf`/`pptx`/`xlsx` 是 source-available,不是開源 | 187k stars,61 commits | 照它的 SKILL.md 寫法寫;用 `skill-creator` 產生並評估本專案的 skill | 高 |
| `webapp-testing` skill | https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md | 用 Python Playwright 測本機網頁;附 `scripts/with_server.py`,要求先跑 `--help`、把腳本當黑箱用 | Apache-2.0(LICENSE.txt) | 隨上面的 repo | 「腳本當黑箱、只讀 `--help`」的模式,可以直接套到本專案 skill 驅動 CLI 的寫法 | 高 |
| `frontend-design` skill | https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md | 引導做出有主見、不制式的視覺設計(先擬 token 計畫、再自我批判) | Apache-2.0(已讀 LICENSE.txt) | 隨上面的 repo | 偏「生成」而不是「評估」;只能參考它的自我檢查段落 | 低 |
| anthropics/claude-plugins-official | https://github.com/anthropics/claude-plugins-official | 官方 plugin 目錄:`plugins/` 有 40 個(含 `plugin-dev`、`skill-creator`、`mcp-server-dev`、`frontend-design`、`code-review`);`external_plugins/` 有 `playwright` 等 | Apache-2.0(各 plugin 依各自 LICENSE) | 40 + 14 個目錄 | `example-plugin` 是 plugin 結構的範本;用 `plugin-dev` 和 `mcp-server-dev` 輔助打包 | 高 |
| anthropics/knowledge-work-plugins:`design` | https://github.com/anthropics/knowledge-work-plugins/tree/main/design/skills | 7 個設計 skill:`design-critique`、`accessibility-review`、`design-system`、`design-handoff`、`ux-copy` 等 | Apache-2.0 | 34.6k stars,1,128 commits | `design-critique` 的提問結構,可以參考來寫「判斷不平衡是不是刻意的」那一步 | 中 |
| pbakaus/impeccable | https://github.com/pbakaus/impeccable | 設計用詞與審查 skill,有 24 個指令(`critique` 打分、`audit`、`layout`、`polish`…),加上一個確定性 detector(`npx impeccable detect`,62 條規則,`--json`/`--github`) | Apache-2.0 | 約 101k stars | 參考它怎麼分工:確定性 CLI 抓問題、skill 判讀並提出改法 | 高 |
| addyosmani/web-quality-skills | https://github.com/addyosmani/web-quality-skills | 6 個以 Lighthouse 和 Core Web Vitals 為基礎的 skill;`web-quality-audit` 負責統籌其他幾個;自稱 unofficial | MIT | 約 3.0k stars | 「先量測、再給分數門檻」的 skill 寫法跟本專案很像;安裝說明同時寫了 plugin 和 `npx skills add` 兩種方式,可以照抄 | 中 |
| Owl-Listener/designer-skills | https://github.com/Owl-Listener/designer-skills | 設計 skill 合集;`visual-critique`(層級、構圖、資訊密度)和 `ui-design`(版面格線、`responsive-audit`) | MIT | 3.2k stars | 截圖判讀時的評語框架可以參考;它不做確定性評分 | 中 |
| vercel-labs/agent-skills:`web-design-guidelines` | https://github.com/vercel-labs/agent-skills | 用 100 多條規則審查 UI 程式碼(無障礙、焦點、動畫、字體…),執行時才抓規則 | MIT | 33.5k stars | 針對程式碼層 UI,不處理版面構圖;只能當報告附錄的參考 | 低 |
| nextlevelbuilder/ui-ux-pro-max-skill | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 把 CSV 知識庫(風格、色盤、119 條 UX 準則)搭配 BM25 `search.py` 包成 skill | MIT | 約 144.7k stars | 只能參考「資料表加檢索腳本放進 skill」的做法;內容偏生成 | 低 |

## 2. MCP 伺服器(未來 MCP 階段)

| 名稱 | 網址 | 做什麼 | 授權 | 維護訊號 | 怎麼搭配本專案 | 契合度 |
| --- | --- | --- | --- | --- | --- | --- |
| Playwright MCP | https://github.com/microsoft/playwright-mcp | 瀏覽器自動化;預設給 accessibility snapshot;有 `browser_take_screenshot`(`fullPage`)、`browser_resize`、`--viewport-size`、`--caps=vision` | Apache-2.0 | npm `@playwright/mcp` 0.0.84(2026-10-31);39.1k stars | MCP 階段讓代理在 6 種寬度下臨時看頁面;第 4 階段的量測仍用 Playwright 函式庫 | 高 |
| Playwright CLI | https://github.com/microsoft/playwright-cli | 給 coding agent 用的 CLI;`playwright-cli install --skills`、`screenshot`、`resize <w> <h>` | Apache-2.0 | npm `@playwright/cli` 0.1.23(2026-10-31) | 第 6 階段 skill 截圖比 MCP 省 token(官方 README 的建議) | 高 |
| Chrome DevTools MCP | https://github.com/ChromeDevTools/chrome-devtools-mcp | 有 `lighthouse_audit`(無障礙、SEO、最佳做法,不含效能)、performance trace、`emulate`(viewport)、`resize_page`、`evaluate_script`、`take_screenshot`;內附 7 個 skill 與 plugin 安裝指令 | Apache-2.0 | npm `chrome-devtools-mcp` 1.12.0(2026-10-22);54.7k stars | 要加效能或無障礙面向時直接借用;`evaluate_script` 可以讀 DOM 方框 | 中 |
| danielsogl/lighthouse-mcp-server | https://github.com/danielsogl/lighthouse-mcp-server | 包裝 Lighthouse 的 11 個工具(`run_audit`、`get_core_web_vitals`、`check_performance_budget`…),`device` 只能選 desktop 或 mobile | MIT | npm `@danielsogl/lighthouse-mcp` 2.0.1(2026-08-15);74 stars | 本專案的 8 個面向不是 Lighthouse 那幾類;只參考它的工具命名 | 低 |
| priyankark/lighthouse-mcp | https://github.com/priyankark/lighthouse-mcp | 精簡版的 Lighthouse MCP | MIT | npm `lighthouse-mcp` 0.1.21(2026-10-26) | 同上 | 低 |
| MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk | 官方 TS SDK,用來寫 MCP server | MIT | npm `@modelcontextprotocol/sdk` 1.32.2(2026-10-23) | 本專案 MCP server 的基礎;工具直接包現有的 CLI 函式 | 高 |
| MCP Inspector | https://github.com/modelcontextprotocol/inspector | 互動測試 MCP server 的工具 | npm 寫「SEE LICENSE IN LICENSE」(未查證) | npm 2.13.0(2026-10-28) | 開發 MCP server 時測試用,不隨產品發佈 | 中 |
| Figma-Context-MCP(Framelink) | https://github.com/GLips/Figma-Context-MCP | 把 Figma API 回應精簡成版面和樣式資訊給代理用;需要 Figma API token | MIT | npm `figma-developer-mcp` 0.13.2(2026-06-18);16.1k stars | 本專案的輸入是 JSON 不是 Figma;只有日後想從設計稿匯入時才用得到 | 低 |
| Figma 官方 MCP | (官方文件網域連不上,未查證) | 遠端 `https://mcp.figma.com/mcp` 或桌面 `127.0.0.1:3845`;有 `get_design_context` | 專有服務 | 未查證 | 同上;據搜尋摘要需要付費席位 | 低 |
| Deque Axe MCP Server | https://github.com/dequelabs/axe-mcp-server-public | 官方 axe 掃描與修正建議;據搜尋摘要需要 Axe DevTools 付費訂閱 | 未查證 | 未查證 | 無障礙不屬於本專案的 8 個面向 | 低 |

## 3. 開源版面評估、生成與資料結構

| 名稱 | 網址 | 做什麼 | 授權 | 維護訊號 | 怎麼搭配本專案 | 契合度 |
| --- | --- | --- | --- | --- | --- | --- |
| Lighthouse(LHR 結構) | https://github.com/GoogleChrome/lighthouse/blob/main/docs/understanding-results.md | LHR 的 `audits`:每項有 `id`/`title`/`description`/`score`(0–1 或 null)/`scoreDisplayMode`/`displayValue`/`details`;`categories` 有 `auditRefs[{id, weight, group}]` | Apache-2.0 | npm `lighthouse` 13.6.0(2026-10-27) | 報告 JSON 結構和加權方式幾乎可以一對一借用 | 高 |
| Lighthouse 評分文件 | https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md | 各類別怎麼加權:無障礙是加權平均、每項只有通過或不通過;效能用對數常態曲線(細節在 developer.chrome.com,未查證) | Apache-2.0 | 同上 | 參考「原始值 → 曲線 → 0–100」和「通過/不通過 → 權重」兩種計分方式 | 高 |
| Ngo、Teo、Byrne 介面美學量測 | https://www.mi.sanu.ac.rs/vismath/ngo/index.html | 把平衡、均衡、對稱、序列、凝聚、密度、規律等 13–14 項量測寫成 0–1 公式 | 論文(公式可以自己實作) | 2000–2003 年的論文 | 版面平衡、重心偏移的學術依據;可以寫成確定性的 TS 函式加單元測試 | 高 |
| Aalto Interface Metrics(AIM) | https://github.com/aalto-ui/aim | 集合多個經驗證的 GUI 指標;論文寫有 17 項(視覺雜亂、可學習性…);技術棧是 Python、Tornado、Selenium | MIT | `aim2` 分支 360 commits;66 stars;日期未顯示 | 查公式和文獻出處用;是 Python 服務,不直接引入 | 中 |
| GRIDS | https://github.com/aalto-ui/GRIDS | 用 MILP 生成格線版面(CHI 2020),目標是對齊、矩形度、偏好位置;需要 Gurobi | **頁面沒有顯示授權**,不可複製程式碼 | 53 stars | 第 7 階段集束搜尋的評分項(對齊、矩形度)可以參考論文;不要用它的程式碼 | 中 |
| guardian/dotcom-rendering | https://github.com/guardian/dotcom-rendering/blob/main/dotcom-rendering/src/components/FlexibleGeneral.tsx | Guardian 首頁容器 `flexible/general`:splash 獨佔一列、boost 等級控制標題和媒體大小、一般卡片兩兩並排、落單的卡片佔半寬 | Apache-2.0 | 36,699 commits | 真實新聞首頁的容器規則,可以跟 38 種展示類型對照;注意它的 5:3、4:5 圖片比例違反本專案規則,只借列配置的邏輯 | 高 |
| Puck | https://github.com/puckeditor/puck | React 視覺編輯器;資料是 `{content:[{type, props:{id,…}}], root, zones}`(`zones` 即將被 slot 取代) | MIT | npm `@puckeditor/core` 0.24.0(2026-10-29);13.6k stars | 日後可以把頁面 JSON 匯出成 Puck data,接上可視化編輯 | 中 |
| Payload CMS Blocks field | https://github.com/payloadcms/payload/blob/main/docs/fields/blocks.mdx | block 用 `slug` 和 `fields` 定義;存成陣列,每筆帶 `blockType`;有 `interfaceName` 和 `jsonSchema` 覆寫(用於型別生成與 MCP 驗證) | MIT | npm `payload` 3.92.1(2026-10-27) | block 實例 schema 的命名和判別欄位可以參考;未來電商或部落格案例可以對接 | 中 |
| GrapesJS / Editor.js / Craft.js | https://github.com/GrapesJS/grapesjs 、https://github.com/codex-team/editor.js 、https://github.com/prevwong/craft.js | 網頁建構器或區塊編輯器,都輸出 JSON | BSD-3-Clause / Apache-2.0 / MIT | npm 0.23.9(2026-11-03)/ 2.31.7(2026-09-17)/ 0.2.12(2025-02-14) | 只參考資料模型,定位和本專案不同 | 低 |
| Galen Framework | https://github.com/galenframework/galen | 用 spec 語言在多種裝置尺寸下斷言元素的相對位置和尺寸(底層是 Selenium) | Apache-2.0 | 1.4k stars;npm CLI 最新是 2022-05,疑似停滯 | 參考「跨寬度斷言」的規格語法;不引入 | 低 |
| CyberAgentAILab/layout-dm | https://github.com/CyberAgentAILab/layout-dm | 用離散擴散模型生成版面(CVPR 2023),有 `eval.py` | Apache-2.0 | **2026-07-04 已封存** | 學術參考;本專案不做機器學習生成 | 低 |
| LUME Kiwi(Cassowary) | https://github.com/lume/kiwi | TypeScript 寫的 Cassowary 約束求解器 | BSD-3-Clause | npm `@lume/kiwi` 0.4.4(2024-09-17);214 stars | 第 7 階段如果需要「等高、欄寬加總」之類的線性約束可以用 | 低 |
| Yoga | https://github.com/facebook/yoga | 嵌入式的 flexbox 版面引擎(頁面沒有提到 CSS Grid) | MIT | npm `yoga-layout` 3.2.1(2024-12-13);18.9k stars | 不開瀏覽器估算 flex 排列;本專案已經用公式加 Playwright,用處有限 | 低 |
| Design Lint(Figma) | https://github.com/destefanis/design-lint | Figma plugin,找出沒有套用樣式的圖層 | MIT | 521 stars,137 commits | 只參考「lint 規則可以自訂」的概念 | 低 |

## 4. 文字量測與折行估算(不開瀏覽器)

| 名稱 | 網址 | 做什麼 | 授權 | 維護訊號 | 怎麼搭配本專案 | 契合度 |
| --- | --- | --- | --- | --- | --- | --- |
| Pretext | https://github.com/chenglou/pretext | `prepare()` 做分段和量測並快取,`layout()` 用純算術算出高度和行數;依照 Chrome 的折行規則 | MIT(依 npm) | npm `@chenglou/pretext` 1.0.0(2026-10-14);51.0k stars | 標題行數估算的首選候選;Node 裡要自己定義全域 `OffscreenCanvas`;README 沒提到 CJK 避頭尾,要用 fixtures 驗證 | 高 |
| linebreak | https://github.com/devongovett/linebreaker | 實作 UAX #14,找出可以斷行的位置,寬度判斷交給呼叫端;PDFKit 也在用 | MIT | npm 2.0.0(2026-11-03 發佈);README 寫 Unicode 13 | 自己寫「字寬表加斷點」估算器時的斷點來源 | 高 |
| BudouX | https://github.com/google/budoux | 把日文、簡體中文、繁體中文、泰文切成語意片語 | Apache-2.0 | npm `budoux` 0.10.2(2026-10-29);1.8k stars | 如果渲染器採用片語換行,估算也要用同一套切分,才不會跟實測不一致 | 中 |
| @napi-rs/canvas | https://github.com/Brooooooklyn/canvas | Node 上以 Skia 實作的 Canvas | MIT | npm 1.1.0(2026-10-30) | 給 pretext 當 `OffscreenCanvas` 的墊片(需要 POC);必須載入固定的字型檔才能確定 | 中 |
| opentype.js / fontkit / harfbuzzjs | https://github.com/opentypejs/opentype.js 、https://github.com/foliojs/fontkit 、https://github.com/harfbuzz/harfbuzzjs | 解析字型、取得字寬、做 shaping | MIT / MIT / MIT | npm 2.0.0(2026-05-06)/ 2.0.4(2024-08-09)/ 1.6.4(2026-10-22) | 從固定字型檔預先算出字寬表,完全確定、不依賴系統字型 | 中 |
| string-width / get-east-asian-width | https://github.com/sindresorhus/string-width 、https://github.com/sindresorhus/get-east-asian-width | 依 East Asian Width 算字串佔幾格 | MIT | npm 8.3.0(2026-09-24)/ 1.7.0(2026-09-17) | 最便宜的基準:全形算 1em、半形約 0.5em,用來和精算結果比誤差 | 中 |
| Satori | https://github.com/vercel/satori | 把 HTML/CSS 轉成 SVG;用 Taffy 排版、自製行內文字排版、HarfBuzz 做 shaping;必須提供字型 | MPL-2.0(檔案層級 copyleft) | npm 0.63.2(2026-10-20);14.2k stars | 參考「無瀏覽器文字排版」的做法;授權不如 MIT 寬鬆 | 低 |
| tex-linebreak | https://github.com/robertknight/tex-linebreak | Knuth-Plass 最佳折行 | MIT | npm 0.9.0(2026-04-22) | 瀏覽器預設是貪婪折行,這個用不上;只有要估 `text-wrap: pretty` 時才用得到 | 低 |

補充:Node 20 內建的 `Intl.Segmenter` 可以切字素和詞,適合拿來處理 emoji、組合字元,再搭配上面的字寬表使用。

## 發佈這個專案的 skill 可以走的路

1. **放在 repo 內,讓團隊共用**:把 `.claude/skills/<name>/SKILL.md` commit 進 repo,只要在這個 repo 開 Claude Code 就會載入。各位置的範圍見 [Skills 文件](https://code.claude.com/docs/en/skills.md)。
2. **做成 plugin,在本 repo 自架 marketplace(最推薦)**:
   - 在 repo 根目錄放 `.claude-plugin/plugin.json`,skill 放 `skills/<name>/SKILL.md`。CLAUDE.md 建議的 `skills/` 目錄剛好符合這個結構。
   - 再放 `.claude-plugin/marketplace.json`,至少要有 `name`、`owner`、`plugins[{name, source: "./"}]`。entry 的 `name` 要和 `plugin.json` 的 `name` 一樣。只要這個檔案進了 repo 就算發佈,不需要表單([Publish 文件](https://code.claude.com/docs/en/plugins/publish.md)、[Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces.md))。
   - 使用者執行 `claude plugin marketplace add <owner>/<repo>`,再執行 `claude plugin install <plugin>@<marketplace>`。新版 Claude Code 也可以一行完成:`claude plugin install <plugin> --marketplace <owner>/<repo>`。
   - CI 可以跑 `claude plugin validate --strict .`。版號規則二選一:每次發佈都遞增 `version`,或者乾脆不寫 `version`,改用 commit SHA。marketplace 名稱要取不容易撞名的;`claude-plugins-official` 這類是保留名稱,不能用。
   - plugin 名稱發佈後不能改,要改顯示名稱就改 `displayName`;萬一真的要改名,用 `renames` 讓舊安裝自動遷移。
3. **送進 Anthropic 的 directory**:要有付費的 claude.ai 方案,從 https://claude.ai/directory/manage 的開發者入口送審。上架後,claude.ai、Cowork、Claude Code 的使用者都能用(在 Claude Code 會以 `<name>@synced` 載入)。送審前先看 pre-submission checklist 和各 app 的元件支援表(連結都在 Publish 文件裡)。同一個入口也可以把 MCP server 當成 connector 一起送。官方的 `claude-plugins-official` marketplace 不從這個入口收件。
4. **遵守 Agent Skills 開放標準,讓其他代理也能用**:規格 repo 是 https://github.com/agentskills/agentskills(程式碼 Apache-2.0,文件 CC-BY-4.0)。在 claude.ai 上傳或透過 Skills API 時,frontmatter 只接受 `name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools`,其他欄位會直接報錯。所以要跨平台的話,frontmatter 只用這幾個欄位;Claude Code 專用的欄位(例如 `context: fork`)只放在 Claude Code 版本裡。
5. **`npx skills add <owner>/<repo>`**:vercel-labs 的 `skills` CLI(MIT,npm 1.7.6,需要 Node 22.20 以上),支援 Claude Code、Codex、Cursor 等約 80 種代理,搭配 skills.sh 目錄。只要 repo 裡有標準的 `skills/*/SKILL.md` 就能被安裝(https://github.com/vercel-labs/skills)。
6. **社群目錄**:SkillsMP(https://www.skillsmp.com)、claudemarketplaces.com 會自動彙整 GitHub 上的 skill,都不是官方網站(收錄方式未查證)。
7. **之後的 MCP server**:用 `@modelcontextprotocol/sdk` 寫好並發佈到 npm,在 `package.json` 加上 `mcpName`,再用 `mcp-publisher` 發佈到 MCP Registry(https://github.com/modelcontextprotocol/registry,目前仍是 preview)。登入 GitHub 後可以用 `io.github.<user>/…` 命名空間。發佈不能靠對 registry repo 開 PR。同一個 plugin 也可以用 `.mcp.json` 把 MCP server 一起帶上。
8. **授權提醒**:核心是公開 repo,建議 skill 也採用寬鬆授權(例如 MIT 或 Apache-2.0),並在 `license` 欄位寫明;不要把 `anthropics/skills` 裡 source-available 的文件 skill 打包進來。

## 未查證/待確認

- **連不上的網域**:這次 session 的網路允許清單沒有 agentskills.io、developer.chrome.com、developers.figma.com、interfacemetrics.aalto.fi、userinterfaces.aalto.fi、arxiv.org、payloadcms.com。相關內容改用 GitHub 鏡像或文件原始檔查證;查不到的部分照下面各點標示。
- **Lighthouse 的曲線參數**:效能分數對數常態曲線的控制點(例如「HTTP Archive 第 25 百分位對應 50 分、第 8 百分位對應 90 分」)只來自搜尋摘要;Lighthouse 原始碼裡的實作函式也沒找到(猜的路徑回 404)。
- **AIM 的 17 項指標清單**和各指標的公式沒看到(頁面只列出 m1–m30 的目錄名稱)。
- **GRIDS 的授權**:頁面沒有顯示授權,在確認前視為保留所有權利。
- **Figma 官方 MCP、Deque Axe MCP 的付費條件**:只看到搜尋摘要,沒有讀到官方頁面。
- **MCP Inspector、MCP Registry 的授權類型**:頁面沒寫明。
- **送件方式衝突**:`claude-plugins-official` 的 README 寫第三方用 https://clau.de/plugin-directory-submission 表單送件;Claude Code 的 Publish 文件則說 `claude-plugins-official` 不從 directory 入口收件,並把一般送件導向 claude.ai/directory/manage。以官方文件為準,但兩者不一致,要再確認。
- **skills.sh 與 SkillsMP**:skills.sh 怎麼收錄、SkillsMP 收錄多少,都沒查證。
- **pretext 在 Node 的可行性**:pretext 搭配 `@napi-rs/canvas` 當 `OffscreenCanvas` 能不能在 Node 正常運作、不同平台的 Skia 是否給出相同字寬(關係到「確定性」規則)、CJK 避頭尾的行為,都需要另開 POC 驗證。
- **其他只在搜尋摘要看到、沒讀到原文的資料**:AeSlides 論文(arXiv 2604.22840,用 DOM 視覺重心偏移衡量不平衡)和美國專利 7,092,552 / 7,116,802(文件平衡分數公式)。專利是否已經失效也沒查;採用相關公式前要先確認。
- **Ngo 等人量測**:到底是 13 項還是 14 項,各來源說法不一,也沒逐條讀過原始公式。
- **GitHub 的最後 commit 日期**:大多看不到(GitHub API 被擋),維護訊號改用 npm 發佈日;沒有 npm 套件的項目(AIM、GRIDS、Galen 主 repo、dotcom-rendering)維護狀態未查證。
