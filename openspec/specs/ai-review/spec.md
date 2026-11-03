# ai-review Specification

## Purpose
AI skill 負責 Node.js 做不到的判讀:讀報告與截圖,判斷不平衡是否刻意、判讀圖內文字,並把數字翻成人看得懂的建議。分數與判定仍由 Node.js 產生。來源:`docs/spec/04` 工具分工,CLAUDE.md 第 6 階段。

## Requirements

### Requirement: 分工

AI skill SHALL 只負責:判斷不平衡是否刻意、判讀圖內文字與海報式圖卡、寫成人看得懂的報告、依建議修改範本 JSON。分數、判定與候選改法 MUST 由 Node.js 工具產生,AI skill MUST NOT 自行給分或改寫判定結果。

#### Scenario: AI 認為不平衡是刻意的

- **WHEN** AI 判斷頭條區的左重右輕是編輯刻意加重
- **THEN** 報告註記「可能為刻意」,但 Node.js 的判定結果不變

### Requirement: 流程

流程 SHALL 為:Node.js 輸出 JSON 報告(分數、違規、候選改法)→ AI skill 讀報告與截圖,判斷哪些違規真的要改 → AI skill 寫出建議,經人確認後修改範本 → 再跑一次 Node.js 驗證。AI skill MUST NOT 未經人確認就修改資料。

#### Scenario: 改完重新驗證

- **WHEN** 人確認了 AI 的修改建議並套用
- **THEN** 重新執行 Node.js 評估,並以新的分數為準
