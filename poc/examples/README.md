# 10 個頁面範例:V1 改善前 → V2 改善後

```bash
npm run poc:examples
```

```bash
npm run poc:examples -- --json-only
```

```bash
npm run poc:examples -- --case 03
```

```bash
npm run poc:greedy
```

- `--json-only`:不開瀏覽器,快速試算。觸控目標這類需要渲染的項目會看不到。
- `--case 03`:只跑一個範例。
- `npm run poc:greedy`:重新產生範例 10。

結果見 [REPORT.md](REPORT.md)(Markdown)與 `report.html`(Lighthouse 式對照,下載後用瀏覽器開啟)。

## 範例的寫法

`cases/NN-名稱.json`:

| 欄位 | 說明 |
| --- | --- |
| `problem` / `fixNote` | 問題與改法(給人看) |
| `targets` | 目標:`項目`,或 `項目@代號`(只看 V1 的那個對象,以穩定參照追到 V2) |
| `v1` | 在 `data/` 上製造問題的 JSON Patch;空陣列表示原樣 |
| `fix` | V2 = V1 + fix |
| `v2` | 或直接指定 V2 = `data/` + v2 |
| `partial` | 只能改善、無法完全解決時為 true |
| `shotWidth` | 截圖寬度 |

## 驗收條件

1. 兩版都沒有第 1 層錯誤。
2. V2 總分高於 V1。
3. 目標在 V1 有問題、V2 合格。
4. V2 沒有新的不合格(以「項目 + 穩定參照」比對)。

## 貪婪法(範例 10)

`candidates.json` 列出 8 個候選改法。`greedy.ts` 每一輪試所有剩下的候選,挑出同時符合下列條件、而且總分最高的一個:第 1 層沒有錯誤、相對 V1 沒有新的不合格。重複到沒有任何候選能再提升總分。紀錄見 [GREEDY.md](GREEDY.md)。
