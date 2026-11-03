# Tasks

## 1. Skill

- [x] 1.1 `skills/layout-tuner/SKILL.md`:步驟、對照表、已知限制、雙評分對齊。驗證:Claude Code 已把 `layout-tuner` 列入可用的 skill;`tests/skill.test.ts` 檢查引用的指令與檔案都存在。
- [x] 1.2 比較工具 `poc:compare`。驗證:`default` 對 `no-sidebar` 輸出總分、面向與項目的變化。

## 2. 雙評分系統

- [x] 2.1 檢視工具 `review.html`:預覽 + 側欄(裝置、評分、A/B、匯出)。驗證:以 Playwright 操作評分、切換裝置、A/B 鍵盤切換、選答、下載,無 JavaScript 錯誤;親自檢查 1440px、並排與手機的截圖。
- [x] 2.2 8 個角色 agent。驗證:`tests/skill.test.ts` 檢查 name、description 與 tools。
- [x] 2.3 對齊分析 `poc:align`。驗證:`rating.test.ts`(等級相關、A/B 一致率)。
- [x] 2.4 反饋覆蓋率 `poc:feedback`。驗證:範例 02 的擬人評估覆蓋率 1/3;同一塊剛好有別的問題不算覆蓋。
- [ ] 2.5 8 個角色 agent 跑完評分與 A/B,產生第一份 `ALIGNMENT.md`。

## Workflow follow-up

- 不 archive:等使用者看過、並有真人評分後再決定。確認後新增 capability `score-calibration`。
