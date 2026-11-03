## ADDED Requirements

### Requirement: 預設參數組的存放

內建的預設參數組 SHALL 以 JSON 存放在 `presets/`(`bs5.json`、`tw4.json`、`md3.json`),格式由 `schemas/preset.schema.json` 定義。每組 SHALL 有 `source` 註明數值出處與版本,並以 `notes` 註明示意值或慣例值。容器規則以 `containers` 表達:視窗寬 ≥ `minWidth` 時,容器最大寬為 `maxWidth`(`null` 表示滿版),左右內距為 `padding`(`null` 表示欄距的一半)。

#### Scenario: 範例站在 1280px 的內容寬

- **WHEN** 範例站(bs5,欄距覆寫為 1rem)在 1280px
- **THEN** 容器寬 1140px,內距左右各 8px,內容寬 1124px
