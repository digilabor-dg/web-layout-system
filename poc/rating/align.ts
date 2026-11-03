// 雙評分對齊:把評分(真人的檢視工具匯出檔,或角色 agent 的評分檔)與程式分數對齊。
// - 區塊評分:每個版面算等級相關、平均差距,列出盲點與可能的誤判。
// - A/B:程式分數較高的那一版,評分者是否也選它(一致率)。
// 數字一律由程式算。用法:npm run poc:align [-- 評分檔...];不指定時讀 poc/rating/sets/*/ratings-*.json 與 poc/rating/reviews/*.json

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { GAP, spearman } from './analyze.js';
import type { Layout } from './collect.js';

const HERE = import.meta.dirname;

/** 統一後的一筆區塊評分 */
interface BlockRating { rater: string; source: string; layout: string; ref: string; code: string; score: number; comment: string }
/** 統一後的一筆 A/B */
interface AbAnswer { rater: string; source: string; a: string; b: string; winner: string; reason: string }

/** 讀評分檔:檢視工具匯出(tool = layout-review)或角色 agent 的格式(set + ratings + ab) */
export function load(file: string, key: { pair: number; A: string; B: string }[]) {
  const j = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const rater = String(j.rater ?? basename(file));
  const source = String(j.source ?? 'human');
  const ratings: BlockRating[] = [];
  const ab: AbAnswer[] = [];
  if (j.tool === 'layout-review') {
    // 檢視工具:每筆自帶 layout;A/B 的 winner 已是版面 id
    for (const r of j.ratings as { layout: string; ref: string; code: string; score: number | null; comment: string }[]) {
      if (r.score !== null) ratings.push({ rater, source, layout: r.layout, ref: r.ref, code: r.code, score: r.score, comment: r.comment });
    }
    for (const x of j.ab as { A: string; B: string; winner: string; reason: string }[]) ab.push({ rater, source, a: x.A, b: x.B, winner: x.winner, reason: x.reason });
  } else {
    // 角色 agent:評分集名稱對應到產生結果的版面;A/B 用盲測題號查對照表
    const layout = `gen-${String(j.set)}`;
    for (const r of j.ratings as { ref: string; code: string; score: number; comment: string }[]) ratings.push({ rater, source, layout, ref: r.ref, code: r.code, score: r.score, comment: r.comment });
    for (const x of (j.ab ?? []) as { pair: number; winner: string; reason: string }[]) {
      const k = key.find((y) => y.pair === x.pair);
      if (k) ab.push({ rater, source, a: k.A, b: k.B, winner: x.winner === 'tie' ? 'tie' : x.winner === 'A' ? k.A : k.B, reason: x.reason });
    }
  }
  return { ratings, ab };
}

/** 對齊分析 */
export function align(layouts: Layout[], ratings: BlockRating[], ab: AbAnswer[]) {
  const byId = new Map(layouts.map((l) => [l.id, l]));
  // 【第一步】區塊:每個版面、每位評分者,和程式分數比
  const blocks = [...new Set(ratings.map((r) => `${r.layout}|${r.rater}`))].sort().map((k) => {
    const [layout, rater] = k.split('|') as [string, string];
    const rs = ratings.filter((r) => r.layout === layout && r.rater === rater);
    const lay = byId.get(layout)!;
    const pairs = rs.map((r) => ({ r, program: lay.blocks.find((b) => b.ref === r.ref)?.program.score ?? null })).filter((x) => x.program !== null);
    const human = pairs.map((x) => x.r.score);
    const prog = pairs.map((x) => x.program!);
    return {
      layout, rater, source: rs[0]!.source, n: pairs.length,
      spearman: spearman(prog, human),
      meanAbsDiff: pairs.length ? pairs.reduce((s, x) => s + Math.abs(x.r.score - x.program!), 0) / pairs.length : null,
      mean: human.length ? human.reduce((s, x) => s + x, 0) / human.length : null,
      blindSpots: pairs.filter((x) => x.r.score <= x.program! - GAP).map((x) => ({ code: x.r.code, score: x.r.score, program: x.program!, comment: x.r.comment })),
      falsePositives: pairs.filter((x) => x.r.score >= x.program! + GAP).map((x) => ({ code: x.r.code, score: x.r.score, program: x.program!, comment: x.r.comment })),
    };
  });
  // 【第二步】A/B:程式分數較高的那一版 = 程式的選擇;同分視為程式沒有偏好
  const abRows = ab.map((x) => {
    const ta = byId.get(x.a)?.total ?? null;
    const tb = byId.get(x.b)?.total ?? null;
    const program = ta === null || tb === null || ta === tb ? 'tie' : ta > tb ? x.a : x.b;
    return { ...x, program, agree: x.winner !== 'tie' && program !== 'tie' ? x.winner === program : null };
  });
  const decided = abRows.filter((x) => x.agree !== null);
  const byRater = [...new Set(abRows.map((x) => x.rater))].sort().map((rater) => {
    const d = decided.filter((x) => x.rater === rater);
    return { rater, answered: abRows.filter((x) => x.rater === rater).length, decided: d.length, agree: d.filter((x) => x.agree).length };
  });
  // 每一題:多少評分者同意程式
  const perPair = [...new Set(abRows.map((x) => `${x.a}|${x.b}`))].map((k) => {
    const rows = abRows.filter((x) => `${x.a}|${x.b}` === k || `${x.b}|${x.a}` === k);
    const d = rows.filter((x) => x.agree !== null);
    return { pair: k, program: rows[0]!.program, votes: rows.length, agree: d.filter((x) => x.agree).length, disagree: d.filter((x) => !x.agree).length, tie: rows.filter((x) => x.winner === 'tie').length, reasons: rows.filter((x) => x.agree === false).map((x) => `${x.rater}:${x.reason}`) };
  });
  return { blocks, ab: { total: decided.length, agree: decided.filter((x) => x.agree).length, byRater, perPair } };
}

/** 指令進入點 */
if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const { layouts } = JSON.parse(readFileSync(join(HERE, 'layouts.json'), 'utf8')) as { layouts: Layout[] };
  const key = JSON.parse(readFileSync(join(HERE, 'ab-key.json'), 'utf8')) as { pair: number; A: string; B: string }[];
  // 【第一步】找評分檔
  let files = process.argv.slice(2);
  if (files.length === 0) {
    for (const set of readdirSync(join(HERE, 'sets'))) {
      const dir = join(HERE, 'sets', set);
      files.push(...readdirSync(dir).filter((f) => f.startsWith('ratings-') && f.endsWith('.json')).sort().map((f) => join(dir, f)));
    }
    if (existsSync(join(HERE, 'reviews'))) files.push(...readdirSync(join(HERE, 'reviews')).filter((f) => f.endsWith('.json')).sort().map((f) => join(HERE, 'reviews', f)));
  }
  files = files.sort();
  const loaded = files.map((f) => load(f, key));
  const r = align(layouts, loaded.flatMap((x) => x.ratings), loaded.flatMap((x) => x.ab));
  const f2 = (x: number | null) => (x === null ? '—' : x.toFixed(2));
  const title = (id: string) => layouts.find((l) => l.id === id)?.title ?? id;
  // 【第二步】報告
  const md: string[] = ['# 雙評分對齊', '', `> 由 \`npm run poc:align\` 產生。評分檔 ${files.length} 份:${files.map((f) => `\`${basename(f)}\``).join('、')}。`, ''];
  md.push('來源:`human` 是真人(檢視工具匯出);`ai-persona` 是角色 agent 的擬人評分,只用來找盲點,不能取代真人。', '');
  md.push('## A/B:程式分數較高的那一版,評分者是否也選它', '');
  md.push(`整體一致率:**${r.ab.agree} / ${r.ab.total}**${r.ab.total ? `(${Math.round((r.ab.agree / r.ab.total) * 100)}%)` : ''}(不含「差不多」與程式同分的題目)。`, '');
  md.push('| 評分者 | 作答 | 有分出勝負 | 與程式一致 |', '| --- | --- | --- | --- |');
  for (const x of r.ab.byRater) md.push(`| ${x.rater} | ${x.answered} | ${x.decided} | ${x.agree} |`);
  md.push('', '| 配對 | 程式選 | 同意 | 不同意 | 差不多 | 不同意的原因 |', '| --- | --- | --- | --- | --- | --- |');
  for (const p of r.ab.perPair) {
    const [a, b] = p.pair.split('|') as [string, string];
    md.push(`| ${title(a)} vs ${title(b)} | ${p.program === 'tie' ? '同分' : title(p.program)} | ${p.agree} | ${p.disagree} | ${p.tie} | ${p.reasons.join(' / ') || '—'} |`);
  }
  md.push('', '## 區塊評分:和程式分數比', '');
  md.push(`盲點:評分比程式低 ${GAP} 分以上(評估器可能漏了問題)。可能的誤判:評分比程式高 ${GAP} 分以上(評估器可能太嚴)。`, '');
  md.push('| 版面 | 評分者 | 塊數 | 平均分 | 等級相關 | 平均差距 | 盲點 | 可能誤判 |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const x of r.blocks) md.push(`| ${title(x.layout)} | ${x.rater} | ${x.n} | ${f2(x.mean)} | ${f2(x.spearman)} | ${f2(x.meanAbsDiff)} | ${x.blindSpots.map((b) => b.code).join('、') || '—'} | ${x.falsePositives.map((b) => b.code).join('、') || '—'} |`);
  // 盲點的短評(給 skill 對應評估項目)
  const spots = r.blocks.flatMap((x) => x.blindSpots.map((b) => ({ ...b, rater: x.rater, layout: x.layout })));
  if (spots.length) {
    md.push('', '## 盲點的短評(交給 skill 對應評估項目)', '', '| 版面 | 版位 | 評分者 | 評分 / 程式 | 短評 |', '| --- | --- | --- | --- | --- |');
    for (const s of spots) md.push(`| ${title(s.layout)} | ${s.code} | ${s.rater} | ${s.score} / ${s.program} | ${s.comment} |`);
  }
  md.push('');
  writeFileSync(join(HERE, 'ALIGNMENT.md'), md.join('\n'));
  writeFileSync(join(HERE, 'alignment.json'), JSON.stringify(r, null, 2) + '\n');
  console.log(md.slice(4, 8).join('\n'));
}
