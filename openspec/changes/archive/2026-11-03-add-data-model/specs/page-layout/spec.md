## MODIFIED Requirements

### Requirement: stack 排法

`mode` 為 `stack` 的 section SHALL 以 `columns` 宣告各欄,每欄為 `{ width, blocks }`:`width` 是佔 12 欄中的幾欄,`blocks` 是由上而下的實例 id。欄寬加總 MUST 等於 12,例如 `[{ width: 8, … }, { width: 4, … }]` 即 8:4。各欄高度彼此獨立。主欄與側欄的關係以此表達,「欄底對齊」「欄塊數」等版面平衡項目以 section 的欄為單位計算。

#### Scenario: 欄寬加總不是 12

- **WHEN** stack section 的兩欄 `width` 為 8 與 3
- **THEN** 第 1 層規則檢查回報錯誤
