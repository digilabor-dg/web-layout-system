# layout-generation Specification

## Purpose
版面生成:評估系統完成後,以評估分數為依據,從空白開始逐塊推薦下一個合適的區塊,自動排出合格的版面。來源:`docs/spec/04` 版面生成(第 7 階段),CLAUDE.md 第 7 階段。

## Requirements

### Requirement: 逐塊推薦

生成器 SHALL 從空白頁面開始,每一步推薦下一個區塊(範本與位置),以評估分數判斷好壞。

#### Scenario: 第一步

- **WHEN** 從空白首頁開始生成
- **THEN** 輸出依分數排序的下一塊候選

### Requirement: 集束搜尋

生成器 SHALL 先支援貪婪法(每一步選當下分數最高的下一塊),再支援集束搜尋(每一步保留前 k 種排法繼續往下長)。黏菌、蟻群、基因演算法等仿生演算法不在範圍內。

#### Scenario: k = 5

- **WHEN** 以集束寬度 5 生成首頁
- **THEN** 每一步保留分數最好的 5 種排法

### Requirement: 生成結果的限制

生成的版面 MUST 通過三層檢查,並 MUST 由人確認後才上線。生成 MUST 是確定性的:同樣的輸入與參數得到同樣的結果。

#### Scenario: 生成結果有不合格項

- **WHEN** 某個生成結果在第 3 層有不合格
- **THEN** 不列入最終推薦
