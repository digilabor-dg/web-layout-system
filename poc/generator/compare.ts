// 比較兩次產生結果:總分、各面向分數、項目判定的變化。給人與 skill 引用,數字一律由程式算。
// 用法:npm run poc:compare -- default default-v2 [--json]

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FACETS, type Evaluation, itemVerdicts } from '../evaluate/evaluate.js';

const HERE = import.meta.dirname;
const V = { pass: '合格', warn: '警告', fail: '不合格' } as const;

/** 讀某個結果目錄的 report.json */
function load(name: string): Evaluation {
  return JSON.parse(readFileSync(join(HERE, 'results', name, 'report.json'), 'utf8')) as Evaluation;
}

/** 比較兩份評估,回傳結構化的差異 */
export function compare(a: Evaluation, b: Evaluation) {
  const ia = new Map(itemVerdicts(a.findings));
  const ib = new Map(itemVerdicts(b.findings));
  const items = [...new Set([...ia.keys(), ...ib.keys()])].sort();
  return {
    total: [a.total, b.total] as const,
    verdict: [a.pageVerdict, b.pageVerdict] as const,
    facets: FACETS.map((f) => ({ facet: f, before: a.scores[f], after: b.scores[f] })),
    changed: items
      .map((item) => ({ item, before: ia.get(item) ?? 'pass', after: ib.get(item) ?? 'pass' }))
      .filter((x) => x.before !== x.after),
  };
}

const [before, after] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
if (!before || !after) {
  console.error('用法:npm run poc:compare -- <改善前的結果名稱> <改善後的結果名稱> [--json]');
  process.exitCode = 2;
} else {
  const d = compare(load(before), load(after));
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(d, null, 2));
  } else {
    console.log(`總分:${d.total[0]} → ${d.total[1]}(${d.total[1] - d.total[0] >= 0 ? '+' : ''}${d.total[1] - d.total[0]});整頁:${V[d.verdict[0]]} → ${V[d.verdict[1]]}`);
    console.log(`面向:${d.facets.map((f) => `${f.facet} ${f.before ?? '—'}→${f.after ?? '—'}`).join('、')}`);
    console.log(d.changed.length ? `項目變化:${d.changed.map((c) => `${c.item} ${V[c.before]}→${V[c.after]}`).join('、')}` : '項目判定沒有變化');
  }
}
