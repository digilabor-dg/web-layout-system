# Proposal

## Why

程式或 AI 都不可能一次做到人想要的。要讓評估器快速成長,需要兩件事:

1. 一個 skill,把「產生 → 評分 → 判讀 → 調參數 → 重跑」的迴圈交給 AI 執行。
2. 一套雙評分系統:讓人(以及 AI 擬人角色)和程式各打一次分數,在同一個尺度上對齊,找出評估器的盲點與誤判。

使用者把第 2 點定為早期就要做的持續主線。MCP 排在 skill 之後。

## What Changes

- `skills/layout-tuner/SKILL.md`(透過 `.claude/skills/` 在本 repo 生效):調參迴圈的步驟、問題與參數的對照表、已知限制,以及雙評分對齊的做法。
- `agents/`(透過 `.claude/agents/` 生效):8 個擬人評分角色,包括 4 種專家與 4 種讀者,共用盲評規範。
- `poc/rating/`:
  - `review.ts` → `review.html`:檢視工具。中間是預覽,側欄有裝置切換、inspector 式的區塊評分(0~10、5 顆星、盲評),以及 A/B 比較。
  - `build.ts`:給角色 agent 用的區塊截圖與盲評版評分集;A/B 盲測圖與對照表。
  - `align.ts` → `ALIGNMENT.md`:A/B 一致率、區塊評分的等級相關、盲點與可能的誤判。
- `poc/feedback/`:反饋格式與覆蓋率。skill 把短評對應到評估項目,程式計算覆蓋率。
- `poc/generator/compare.ts`:比較兩次產生結果。
- 指令:`poc:review`、`poc:rating`、`poc:align`、`poc:feedback`、`poc:compare`。

## Capabilities

### New Capabilities

無(POC,`skip_specs: true`)。確認後再新增 `score-calibration`。

### Modified Capabilities

無。

## Impact

- 依據:`openspec/specs/ai-review`(AI 只判讀、不打分數,經人確認才修改)、`improvement-suggestions`(問題類型對照)。
- CLAUDE.md 的開發階段加上持續主線「人評對齊」。
