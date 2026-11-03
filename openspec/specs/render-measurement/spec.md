# render-measurement Specification

## Purpose
渲染量測:用 Playwright 在 6 種測試寬度開啟渲染後的頁面,量測第 2 層需要渲染的項目,並驗證 JSON 估算值。架構仿 Lighthouse 的收集器與稽核。來源:`docs/spec/04` 兩段式評估、對應 Lighthouse 的結構、工具分工,CLAUDE.md 第 4 階段。

## Requirements

### Requirement: 六種寬度量測

量測 SHALL 以 Playwright 依序在 6 種測試寬度(含對應的視窗高度)開啟頁面,收集:各區塊與各欄的位置和高度、圖片顯示寬高比、同列卡片的頂端與高度、並排欄寬、觸控目標尺寸、頁面是否水平捲動、各標題的實際行數。

#### Scenario: 量到一個區塊

- **WHEN** 在 1280px 量測版位 H
- **THEN** 得到它的位置、高度,以及左右兩欄各自的高度

### Requirement: 驗證估算值

量測結果 SHALL 與 `height-estimation` 的估算值並列,輸出每個項目的估算值、量測值與誤差,作為校正公式與字體參數的依據。

#### Scenario: 標題行數估錯

- **WHEN** 某標題估算 2 行、量到 3 行
- **THEN** 報告列出這個差異

### Requirement: 量測的可重現性

為了讓同樣的輸入得到同樣的結果,量測 SHALL 固定字型(隨專案提供或明確指定)、固定 deviceScaleFactor 為 1,並停用動畫與輪播的自動播放。

#### Scenario: 重量

- **WHEN** 在同一台機器對同一份 HTML 量測兩次
- **THEN** 所有數字相同

### Requirement: 截圖與 Lighthouse

量測 SHALL 在每種寬度存一張整頁截圖,供 AI 判讀與人工審閱。另外 SHALL 執行真正的 Lighthouse,涵蓋載入效能、對比度與替代文字等無障礙檢查;它的版面位移(CLS)指標與圖片比例規範相關。

#### Scenario: 產生截圖

- **WHEN** 量測完成
- **THEN** 6 種寬度各有一張截圖
