// 人評測試系統之三:分析。把人評(或 AI 擬人評分)和程式分數放在同一個 0~10 尺度上對齊,
// 算出一致程度,找出盲點與可能的誤判,並把有短評的評分轉成反饋草稿,交給 skill 對應評估項目。
// 用法:npm run poc:rating:analyze -- <評分集名稱> <評分檔...>

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { RatingSet } from './build.js';

const HERE = import.meta.dirname;

/** 一份評分檔(評分頁下載的格式) */
export interface RatingFile {
  set: string;
  rater: string;
  source: 'human' | 'ai-persona';
  persona?: string;
  ratings: { ref: string; code: string; score: number | null; comment: string }[];
}

/** 等級(同分取平均名次) */
function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const r = new Array<number>(xs.length);
  for (let k = 0; k < order.length; ) {
    let j = k;
    while (j + 1 < order.length && order[j + 1]!.x === order[k]!.x) j++;
    for (let m = k; m <= j; m++) r[order[m]!.i] = (k + j) / 2 + 1;
    k = j + 1;
  }
  return r;
}

/** 皮爾森相關係數;任一邊沒有變化時回傳 null */
function pearson(a: number[], b: number[]): number | null {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i]! - ma) * (b[i]! - mb);
    da += (a[i]! - ma) ** 2;
    db += (b[i]! - mb) ** 2;
  }
  return da === 0 || db === 0 ? null : num / Math.sqrt(da * db);
}

/** 斯皮爾曼等級相關:兩邊的「排名」是否一致(−1~1);少於 3 筆或沒有變化時為 null */
export function spearman(a: number[], b: number[]): number | null {
  if (a.length < 3) return null;
  return pearson(ranks(a), ranks(b));
}

/** 盲點與誤判的門檻:人評與程式差 3 分以上 */
export const GAP = 3;

/** 分析一份評分集 */
export function analyze(set: RatingSet, files: RatingFile[]) {
  const byRef = new Map(set.blocks.map((b) => [b.ref, b]));
  // 【第一步】每塊:程式分數、各評分者的分數、人評平均(只算真人)
  const rows = set.blocks.map((b) => {
    const scores = files.map((f) => ({ rater: f.rater, source: f.source, score: f.ratings.find((r) => r.ref === b.ref)?.score ?? null }));
    const human = scores.filter((s) => s.source === 'human' && s.score !== null).map((s) => s.score!);
    const ai = scores.filter((s) => s.source === 'ai-persona' && s.score !== null).map((s) => s.score!);
    const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    return { code: b.code, ref: b.ref, heading: b.heading, program: b.program.score, human: mean(human), ai: mean(ai), scores };
  });
  // 【第二步】一致程度:程式 vs 人、程式 vs AI、AI vs 人
  const pair = (pick: (r: (typeof rows)[number]) => number | null, other: (r: (typeof rows)[number]) => number | null) => {
    const ok = rows.filter((r) => pick(r) !== null && other(r) !== null);
    const a = ok.map((r) => pick(r)!);
    const b = ok.map((r) => other(r)!);
    return {
      n: ok.length,
      spearman: spearman(a, b),
      meanAbsDiff: ok.length ? a.reduce((s, x, i) => s + Math.abs(x - b[i]!), 0) / ok.length : null,
    };
  };
  const agreement = {
    programVsHuman: pair((r) => r.program, (r) => r.human),
    programVsAi: pair((r) => r.program, (r) => r.ai),
    aiVsHuman: pair((r) => r.ai, (r) => r.human),
  };
  // 【第三步】盲點(人或 AI 明顯比程式低)與可能的誤判(明顯比程式高);有真人評分時以真人為準
  const judge = (r: (typeof rows)[number]) => r.human ?? r.ai;
  const blindSpots = rows.filter((r) => judge(r) !== null && judge(r)! <= r.program - GAP).map((r) => r.code);
  const falsePositives = rows.filter((r) => judge(r) !== null && judge(r)! >= r.program + GAP).map((r) => r.code);
  // 【第四步】有短評的評分轉成反饋草稿:≤ 5 分為不喜歡、≥ 8 分為喜歡,中間不轉
  const drafts = files.map((f) => ({
    description: `由評分集 ${set.set} 的評分(${f.rater})轉來;mapped 由 skill 填寫`,
    entries: f.ratings
      .filter((r) => r.comment && r.score !== null && (r.score <= 5 || r.score >= 8))
      .map((r) => ({
        id: `${set.set}-${f.rater}-${r.code}`,
        source: f.source,
        ...(f.persona ? { persona: f.persona } : {}),
        report: `poc/generator/results/${set.set}/report.json`,
        width: null,
        ref: r.ref,
        target: r.code,
        sentiment: r.score! <= 5 ? 'dislike' : 'like',
        score: r.score!,
        text: r.comment,
      })),
  }));
  return { set: set.set, rows, agreement, blindSpots, falsePositives, drafts, block: (ref: string) => byRef.get(ref) };
}

/** 指令進入點 */
if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const [name, ...ratingFiles] = process.argv.slice(2);
  if (!name || ratingFiles.length === 0) throw new Error('用法:npm run poc:rating:analyze -- <評分集名稱> <評分檔...>');
  const dir = join(HERE, 'sets', name);
  const set = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as RatingSet;
  const files = ratingFiles.map((f) => JSON.parse(readFileSync(f, 'utf8')) as RatingFile);
  const a = analyze(set, files);
  const f2 = (x: number | null) => (x === null ? '—' : x.toFixed(2));
  // 報告
  const md: string[] = [`# 人評分析:${set.title}`, '', `> 由 \`npm run poc:rating:analyze\` 產生。評分檔:${ratingFiles.map((f) => `\`${basename(f)}\``).join('、')}。`, ''];
  md.push('## 一致程度', '', '| 比較 | 筆數 | 等級相關(−1~1) | 平均差距(分) |', '| --- | --- | --- | --- |');
  md.push(`| 程式 vs 真人 | ${a.agreement.programVsHuman.n} | ${f2(a.agreement.programVsHuman.spearman)} | ${f2(a.agreement.programVsHuman.meanAbsDiff)} |`);
  md.push(`| 程式 vs AI 擬人 | ${a.agreement.programVsAi.n} | ${f2(a.agreement.programVsAi.spearman)} | ${f2(a.agreement.programVsAi.meanAbsDiff)} |`);
  md.push(`| AI 擬人 vs 真人 | ${a.agreement.aiVsHuman.n} | ${f2(a.agreement.aiVsHuman.spearman)} | ${f2(a.agreement.aiVsHuman.meanAbsDiff)} |`, '');
  md.push(`- **盲點**(評分比程式低 ${GAP} 分以上,評估器可能漏了問題):${a.blindSpots.join('、') || '無'}`);
  md.push(`- **可能的誤判**(評分比程式高 ${GAP} 分以上,評估器可能太嚴):${a.falsePositives.join('、') || '無'}`, '');
  md.push('## 每塊', '', `| 版位 | 區塊 | 程式 | ${files.map((f) => `${f.rater}${f.source === 'ai-persona' ? '(AI)' : ''}`).join(' | ')} | 短評 |`, `| --- | --- | --- | ${files.map(() => '---').join(' | ')} | --- |`);
  for (const r of a.rows) {
    const comments = files.map((f) => f.ratings.find((x) => x.ref === r.ref)?.comment).filter(Boolean).join(' / ');
    md.push(`| ${r.code} | ${r.heading} | ${r.program} | ${r.scores.map((s) => s.score ?? '—').join(' | ')} | ${comments} |`);
  }
  md.push('');
  writeFileSync(join(dir, 'ANALYSIS.md'), md.join('\n'));
  a.drafts.forEach((d, i) => writeFileSync(join(dir, `feedback-draft-${files[i]!.rater}.json`), JSON.stringify(d, null, 2) + '\n'));
  console.log(md.slice(4, 12).join('\n'));
}
