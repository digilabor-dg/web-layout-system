# 資料結構

架構以 9 種 prototype 定義成 JSON。下列範例以 JSONC(允許 // 註解)撰寫,實際存成 JSON 時把註解拿掉;範例串在同一條線上:財經區塊放在首頁版位 H。

| # | Prototype | 對應 | 關係 |
| --- | --- | --- | --- |
| 1 | SiteProfile | 網站設定 | 全站唯一,其他都受它約束 |
| 2 | PatternTag | 外觀標籤 | 被展示類型引用,可多個 |
| 3 | PatternGroup | 用途分組 | 被展示類型引用,只一個 |
| 4 | LayoutPattern | 展示類型 | 引用標籤與分組 |
| 5 | ContentType | 內容類型 | 獨立 |
| 6 | BlockTemplate | 區塊範本 | 內容類型 + 展示類型 + 選稿規則 |
| 7 | Page | 頁面 | 依序列出實例 |
| 8 | BlockInstance | 區塊實例(版位) | 範本 + 頁面位置 + 覆寫 + 實際新聞 |
| 9 | ContentItem | 新聞則 | 被實例引用 |

選稿規則不另立 prototype,內嵌在範本的 selection 欄位,實例可覆寫。

## 範例

```jsonc
// 【第一步】網站設定:全站唯一,決定主比例與斷點
{
  "type": "SiteProfile",
  "id": "site-main",
  "mediaKind": "print",                  // 媒體類型:print=平面,broadcast=影視
  "mainRatio": "3:2",                    // 主比例:print→3:2,broadcast→16:9
  "squareRatioAllowed": true,            // 1:1 一律可用,固定為 true
  "ratioTolerance": 0.01,                // 比例容許誤差 1%
  "breakpoints": { "desktop": 992 },     // 主切換點
  "testWidths": [360, 390, 768, 1024, 1280, 1440],  // 驗收用的 6 種寬度
  "grid": { "columns": 12, "gutter": "1rem", "maxWidth": "1200px" }
}
```

```jsonc
// 【第二步】外觀標籤:看長相,一型可有多個
{ "type": "PatternTag", "id": "zoom", "name": "放大", "rule": "至少一則放大強調" }
```

```jsonc
// 【第三步】用途分組:看用途,每型只屬一組
{ "type": "PatternGroup", "id": "news-combo", "name": "新聞組合" }
```

```jsonc
// 【第四步】展示類型:只講怎麼排;圖片用角色(main/square/none),不寫死比例
{
  "type": "LayoutPattern",
  "id": "P09",
  "name": "首 1 則放大,其餘純文字",
  "group": "news-combo",                // 用途分組,只一個
  "tags": ["mixed", "zoom"],             // 外觀標籤,可多個
  "arrangement": "list",                 // single|list|grid|bento|carousel|tabs
  "emphasis": "lead1",                   // none|lead1|lead2
  "textAmount": "headline",              // headline|summary|paragraph 文字量
  "slots": [
    { "role": "lead", "count": 1, "image": "main" },       // 首則用主比例
    { "role": "rest", "count": "rest", "image": "none" }   // 其餘無圖
  ],
  "items": { "min": 4, "max": 6 },       // 則數範圍
  "interaction": "none",
  "responsiveDefault": {                 // 預設 RWD,範本可覆寫
    "mobile":  { "layout": "stack" },                  // 手機:大圖在上,清單在下
    "desktop": { "layout": "split", "cols": [8, 4] }   // 電腦:左 8 右 4
  }
}
```

```jsonc
// 【第五步】內容類型:只講放什麼,分類是子屬性
{
  "type": "ContentType",
  "id": "news",
  "name": "新聞",
  "categories": ["politics", "finance", "world", "society", "tech"],
  "suggestedPatterns": ["P01", "P02", "P03", "P07", "P08", "P09", "P10"]  // 建議搭配的型
}
```

```jsonc
// 【第六步】區塊範本:內容類型 + 展示類型 + 選稿規則
{
  "type": "BlockTemplate",
  "id": "tpl-finance",
  "name": "財經區塊",
  "contentType": { "ref": "news", "category": "finance" },
  "pattern": "P09",
  "itemCount": 6,                        // 必須落在 P09 的 4~6 之間
  "selection": {                         // 內嵌選稿規則
    "mode": "mixed",                     // manual|latest|popular|mixed
    "pinned": 1,                         // 前 1 則編輯手選
    "fill": { "source": "latest", "category": "finance", "withinHours": 48 }  // 其餘自動補
  },
  "responsive": null,                    // null = 沿用 P09 預設
  "heading": { "title": "財經", "moreLink": "/finance" }
}
```

```jsonc
// 【第七步】頁面:由上而下列出實例
{
  "type": "Page",
  "id": "home",
  "name": "首頁",
  "path": "/",
  "instances": ["inst-home-A", "inst-home-B", "inst-home-H"]  // 實際為 A~M 共 13 個,此處省略
}
```

```jsonc
// 【第八步】區塊實例:範本放到某頁某位置,再填入實際新聞
{
  "type": "BlockInstance",
  "id": "inst-home-H",
  "page": "home",
  "slot": "H",                           // 版位代號
  "order": 8,                            // 第 8 塊
  "template": "tpl-finance",
  "overrides": {},                       // 只允許 itemCount、selection、heading
  "items": ["art-20261103-0012", "art-20261103-0009"]  // 實際 6 則,由選稿規則產生
}
```

```jsonc
// 【第九步】新聞則:圖片依角色各存一份裁好的檔
{
  "type": "ContentItem",
  "id": "art-20261103-0012",
  "contentType": "news",
  "category": "finance",
  "title": "半導體設備出口創單月新高",   // 示意標題
  "url": "/news/0012",
  "publishedAt": "2026-11-03T09:30:00+08:00",
  "images": {                            // key 對應展示類型的圖片角色
    "main": "/img/0012_3x2.jpg",         // 主比例,後端已裁好
    "square": "/img/0012_1x1.jpg"        // 1:1,一律提供
  }
}
```

## 檢查規則

- 範本的 itemCount 必須落在所引用展示類型的 items 範圍內。
- 實例的 overrides 只能出現 itemCount、selection、heading 三個欄位,覆寫後的則數仍受範圍限制。
- 展示類型的 image: main 一律換成 SiteProfile 的 mainRatio,任何層級都不能另外指定。
- 1:1 一律可用,每則新聞都要同時提供 main 與 square 兩種裁切。

## 評估用的補充欄位

要光用 JSON 估算版面(高度、行數、左右平衡),上述 prototype 還要多存下列欄位。

| Prototype | 補充欄位 | 用途 |
| --- | --- | --- |
| SiteProfile | 各斷點的容器寬度 | 算卡片寬 |
| SiteProfile | 字級、行高、平均字寬、間距數值 | 估算標題行數與區塊高度 |
| LayoutPattern | 各斷點的欄數 | 算列數與末列餘數 |
| Page | 欄位配置,例如 8:4 | 判斷左右平衡的設計比例 |
| BlockInstance | 放在主欄或側欄 | 算各欄塊數與欄高 |
| ContentItem | 圖片原始寬高 | 檢查圖檔是否已裁成主比例 |
| ContentItem | 標題字數 | 估算標題行數 |

標題行數是最容易估不準的項目:中文一字一格較準,中英混排與數字寬度不一會有落差,最後仍以渲染量測為準。
