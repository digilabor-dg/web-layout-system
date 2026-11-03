// 產生人評工具:把產生結果與範例的 V1、V2 打包成一個 HTML(poc/rating/review.html)。
// A/B 配對:10 個範例的 V1 vs V2,以及產生結果之間的比較。
// 用法:npm run poc:review

import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type LayoutFull, fromExample, fromGenerator } from './collect.js';
import { type ReviewData, renderReviewPage } from './page.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

// 【第一步】收集版面:產生結果 + 範例 V1、V2
const generated = ['default', 'tw4-beam', 'no-sidebar', 'from-form'].map(fromGenerator);
const cases = readdirSync(join(REPO, 'poc', 'examples', 'cases')).filter((f) => f.endsWith('.json')).sort();
const examples = cases.flatMap((f) => [fromExample(f, 'v1'), fromExample(f, 'v2')]);
const all: LayoutFull[] = [...generated, ...examples];

// 【第二步】A/B 配對
const pairs: ReviewData['pairs'] = [
  ...cases.map((f) => {
    const id = f.slice(0, 2);
    return [`ex${id}-v1`, `ex${id}-v2`, `範例 ${id}:V1 改善前 vs V2 改善後`] as [string, string, string];
  }),
  ['gen-default', 'gen-no-sidebar', '產生結果:有側欄(bs5) vs 無側欄(md3)'],
  ['gen-default', 'gen-tw4-beam', '產生結果:bs5 貪婪法 vs tw4 集束搜尋'],
  ['ex10-v1', 'gen-default', '手排首頁(範例 10 的 V1) vs 產生器的預設結果'],
];

// 【第三步】輸出
const data: ReviewData = {
  title: '版面檢視與人評',
  layouts: all.map(({ html: _h, world: _w, ...l }) => l),
  html: Object.fromEntries(all.map((l) => [l.id, l.html])),
  pairs,
};
writeFileSync(join(HERE, 'review.html'), renderReviewPage(data));
// 分析用:版面清單(不含 HTML)與 A/B 配對
writeFileSync(join(HERE, 'layouts.json'), JSON.stringify({ layouts: data.layouts, pairs }, null, 2) + '\n');

// 【第四步】給角色 agent 的 A/B 盲測圖:範例 V1、V2 的截圖改名為 A、B(單數題把 V2 放 A,與檢視工具相同),
// 對照表另存 ab-key.json,agent 不可讀
const blind = join(HERE, 'ab-blind');
mkdirSync(blind, { recursive: true });
const key: { pair: number; A: string; B: string; width: number }[] = [];
cases.forEach((f, n) => {
  const id = f.slice(0, 2);
  const [a, b] = n % 2 ? ['v2', 'v1'] : ['v1', 'v2'];
  copyFileSync(join(REPO, 'poc', 'examples', 'screenshots', `${id}-${a}.jpg`), join(blind, `pair-${String(n + 1).padStart(2, '0')}-A.jpg`));
  copyFileSync(join(REPO, 'poc', 'examples', 'screenshots', `${id}-${b}.jpg`), join(blind, `pair-${String(n + 1).padStart(2, '0')}-B.jpg`));
  const width = (JSON.parse(readFileSync(join(REPO, 'poc', 'examples', 'cases', f), 'utf8')) as { shotWidth: number }).shotWidth;
  key.push({ pair: n + 1, A: `ex${id}-${a}`, B: `ex${id}-${b}`, width });
});
writeFileSync(join(HERE, 'ab-key.json'), JSON.stringify(key, null, 2) + '\n');
writeFileSync(join(blind, 'pairs.json'), JSON.stringify(key.map((k) => ({ pair: k.pair, width: k.width, A: `pair-${String(k.pair).padStart(2, '0')}-A.jpg`, B: `pair-${String(k.pair).padStart(2, '0')}-B.jpg` })), null, 2) + '\n');
console.log(`review.html:${all.length} 個版面、${pairs.length} 題 A/B;角色 agent 用的盲測圖 ${key.length} 題`);
