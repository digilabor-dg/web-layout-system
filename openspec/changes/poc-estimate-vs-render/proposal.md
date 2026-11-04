# Proposal

## Why

第 2 階段的 JSON 評估,全靠 `height-estimation` 的公式估出區塊高度與標題行數。規格自己也承認標題行數最容易估不準。在把第 2~4 階段做完之前,先用一個簡單的 POC 回答一個問題:**公式估出來的高度,和瀏覽器實際排出來的高度差多少?**

## What Changes

- 新增 `poc/estimate-vs-render/`,只用範例首頁 13 塊:
  - **共用排法描述**:每塊在每類裝置用哪種排法(格線、清單、左右並排、輪播…)、幾欄、多寬,估算與渲染都讀同一份描述。
  - **估算**:依 `height-estimation` 的公式算區塊高度。標題行數同時用兩種方法:規格的「總寬 ÷ 欄寬」,以及「逐字排入、英文單字不拆」。
  - **渲染**:產生一份 RWD 的 HTML。圖框用 `aspect-ratio`,字型固定為文泉驛正黑。
  - **量測**:Playwright 在 6 種寬度量每塊高度與每個標題的行數,輸出對照表與截圖。
- 指令:`npm run poc:1`。
- 不改核心程式與規格;結論寫成 `poc/estimate-vs-render/RESULTS.md`,作為第 2 階段的依據。

## Capabilities

### New Capabilities

無(POC,`skip_specs: true`)。

### Modified Capabilities

無。

## Impact

- 只新增 `poc/` 與 `package.json` 的一個指令,不影響 CI。
- 依據:`openspec/specs/height-estimation`、`render-measurement`、`html-rendering`。
