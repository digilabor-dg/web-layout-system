## Purpose

圖片比例規範:圖片只用網站主比例與 1:1,影片一律 16:9,禁止直式;圖檔在後端裁好,前端用 CSS aspect-ratio 預留圖框。本規範的目的是避免前端大量用 contain 留白,造成圖檔與圖框比例不一致。來源:`docs/spec/01` 圖片比例規範、CLAUDE.md 不可違反的規則、決策 A1、B4。

## ADDED Requirements

### Requirement: 允許的比例

圖片位置 SHALL 只使用網站主比例(平面 3:2、影視 16:9,二選一)或 1:1。影片播放器與影片縮圖(`video` 角色)SHALL 一律為 16:9,不受主比例限制。4:3、9:16 等其他比例 MUST NOT 使用。

| 角色 | 比例 |
| --- | --- |
| `main` | SiteProfile 的 `mainRatio`(1.5 或約 1.778) |
| `square` | 1.0 |
| `video` | 約 1.778 |

#### Scenario: 平面站的影片縮圖

- **WHEN** 平面站的影音新聞則提供 `images.video`
- **THEN** 該圖以 16:9 檢查,而不是 3:2

### Requirement: 禁止直式

任何圖片 MUST NOT 是直式(高大於寬)。短影音用 P13 方形輪播,專題橫幅用 P14 寬幅專題。

#### Scenario: 直式圖檔

- **WHEN** 新聞則的某份圖片寬 1080、高 1920
- **THEN** 第 1 層規則檢查回報錯誤

### Requirement: 圖檔比例誤差

每份圖檔的寬高比與該角色比例的相對誤差 MUST NOT 超過 SiteProfile 的 `ratioTolerance`(1%)。這是第 1 層用圖檔寬高做的檢查;第 2 層另外量測實際顯示的寬高比,門檻相同且不放寬。

#### Scenario: 誤差小於 1%

- **WHEN** `main` 圖檔為 1200×797(比例約 1.5056),主比例 1.5
- **THEN** 誤差約 0.38%,通過

#### Scenario: 4:3 圖檔當主圖

- **WHEN** `main` 圖檔為 1200×900(比例 1.333),主比例 1.5
- **THEN** 誤差約 11%,回報錯誤

### Requirement: 後端裁圖與 aspect-ratio

圖檔 SHALL 在後端依角色裁好。前端圖框 SHALL 用 CSS `aspect-ratio`,由寬度推算高度,MUST NOT 被版面拉伸;MUST NOT 用 `object-fit: contain` 或 `cover` 湊比例。頭像使用 1:1,可圓形裁切。

#### Scenario: 渲染後的圖框

- **WHEN** 渲染器輸出一張 `main` 圖
- **THEN** 圖框帶有 `aspect-ratio`,且沒有 `object-fit: contain` 或 `cover`
