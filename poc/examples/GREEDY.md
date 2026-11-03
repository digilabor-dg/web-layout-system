# 貪婪法紀錄

> 由 `npm run poc:greedy` 產生。

```
V1:74
  type:79
  grid:78
  title:76
  carousel:75
  touch:78
  balance:74(有新的不合格,略過)
  soc2:74
  split75:74
→ 採用 type,總分 79
  grid:83
  title:81
  carousel:80
  touch:83
  balance:76(有新的不合格,略過)
  soc2:79
  split75:79
→ 採用 grid,總分 83
  title:86
  carousel:84
  touch:86
  balance:80(有新的不合格,略過)
  soc2:83
  split75:83
→ 採用 title,總分 86
  carousel:88
  touch:90
  balance:80(有新的不合格,略過)
  soc2:86
  split75:86
→ 採用 touch,總分 90
  carousel:91
  balance:84(有新的不合格,略過)
  soc2:90
  split75:90
→ 採用 carousel,總分 91
  balance:85(有新的不合格,略過)
  soc2:91
  split75:91
```

採用:1. G 換 P03、專題移到社會之後(範例 01)(79) 2. B 改 6 則、電腦 3 欄(範例 02)(83) 3. 頭條標題縮短到 17 字(範例 03)(86) 4. 區塊標題列加高到 48px(範例 06)(90) 5. 短影音電腦一次 4 張(範例 04)(91)
