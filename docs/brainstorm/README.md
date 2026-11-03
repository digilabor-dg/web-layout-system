# 發想(pre-requirements)

這裡放**還沒成為規格**的想法:討論中的構想、要做的試驗、可以借用的理論與方法。

## 文件分層

```
docs/brainstorm/  發想(規格之前)
      │  決定要做 → 開 OpenSpec change,proposal 註明來自哪一份發想
      ▼
openspec/specs/   規格(唯一依據)
      │  change archive 後併入
      ▼
docs/wiki/        白話說明與進度(規格之後)
```

| 位置 | 是什麼 | 誰說了算 |
| --- | --- | --- |
| `docs/brainstorm/` | 發想、構想、試驗計畫 | 還沒決定,可以隨時改 |
| `docs/research/` | 資料收集:調查現成的工具與做法 | 參考用 |
| `docs/spec/` | 最初的設計說明 01~05,已全部搬進 `openspec/specs/` | 參考用,不再更新 |
| `openspec/specs/` | 規格 | **唯一依據** |
| `docs/wiki/` | 以白話描述規格,以及成果、範例、待確認 | 以規格為準 |

## 每份發想的開頭寫狀態

| 狀態 | 意思 |
| --- | --- |
| 發想 | 討論中,還沒決定要不要做 |
| 試驗中 | 有 POC 或試驗在跑,寫明在哪裡 |
| 已提案 | 已開 OpenSpec change,寫明 change 名稱 |
| 已併入規格 | change 已 archive,寫明併入哪個 capability;之後以規格為準 |
| 擱置 | 暫時不做,寫明原因 |

發想不受「同時最多 5 個 active change」的限制,可以先寫下來,等有空位再提案。

## 目前的發想

| 檔案 | 主題 | 狀態 |
| --- | --- | --- |
| [feedback-collection.md](feedback-collection.md) | 反饋收集:圈選區域、方向型量表、短評萃取、適應性提問、「這樣會不會更好」,以及對應的 UX 理論 | 發想 |
| [math.md](math.md) | 數學與演算法:已使用、將要使用、可能使用的公式與用法 | 整理(已使用的以規格為準) |
