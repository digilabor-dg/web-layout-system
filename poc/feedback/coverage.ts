// 反饋覆蓋率:人(或 AI 角色)不喜歡的地方,評估器有沒有用「對應的項目」判為不合格或警告?
// skill 先把原話對應到評估項目(mapped);報告裡同一個對象的那一項有問題,才算有覆蓋。
// 只是同一塊剛好有別的問題(例如抱怨輪播被切掉,報告卻是「更多」連結太小),不算覆蓋。
// 覆蓋率 = 有覆蓋的「不喜歡」÷ 全部「不喜歡」;「喜歡」卻被判有問題的,列為可能的誤判。數字一律由程式算。
// 用法:npm run poc:feedback [-- 反饋檔...] [--json];不指定時跑 poc/feedback/entries/ 全部

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Evaluation, Finding } from '../evaluate/evaluate.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

/** 一筆反饋 */
export interface Entry {
  id: string;
  source: 'human' | 'ai-persona';
  persona?: string;
  likelihood?: number;
  report: string;
  width: number | null;
  score?: number;
  ref: string;
  target?: string;
  sentiment: 'like' | 'dislike';
  text: string;
  mapped?: string;
  candidate?: { item: string; metric: string; threshold?: string };
}

/** 一筆反饋的判定結果 */
export interface EntryResult {
  entry: Entry;
  /** 同一個對象在報告裡有問題的項目 */
  findings: Pick<Finding, 'item' | 'verdict' | 'display'>[];
  /** dislike:對應的項目有問題(有覆蓋);like:同一個對象沒有被判有問題 */
  agree: boolean;
  /** skill 寫的 mapped 項目,報告裡確實有這一項有問題 */
  mappedConfirmed: boolean | null;
}

/** 判定一筆反饋 */
export function judge(entry: Entry, report: Evaluation): EntryResult {
  // 【第一步】找出同一個對象(以穩定參照比對)在報告裡有問題的項目
  const findings = report.findings
    .filter((f) => f.verdict !== 'pass' && (f.ref === entry.ref || f.ref.split('+').includes(entry.ref)))
    .map((f) => ({ item: f.item, verdict: f.verdict, display: f.display }));
  // 【第二步】skill 對應的項目,報告裡同一個對象是否真的有問題
  const mappedConfirmed = entry.mapped ? findings.some((f) => f.item === entry.mapped) : null;
  // 【第三步】不喜歡 → 對應的項目有問題才算覆蓋(對不上任何項目就是未覆蓋);喜歡 → 同一個對象沒問題才算一致
  const agree = entry.sentiment === 'dislike' ? mappedConfirmed === true : findings.length === 0;
  return { entry, findings, agree, mappedConfirmed };
}

/** 彙總 */
export function summarize(results: EntryResult[]) {
  const dislikes = results.filter((r) => r.entry.sentiment === 'dislike');
  const likes = results.filter((r) => r.entry.sentiment === 'like');
  const covered = dislikes.filter((r) => r.agree);
  return {
    dislikes: dislikes.length,
    covered: covered.length,
    coverage: dislikes.length ? covered.length / dislikes.length : null,
    likes: likes.length,
    possibleFalsePositives: likes.filter((r) => !r.agree).map((r) => r.entry.id),
    uncovered: dislikes.filter((r) => !r.agree).map((r) => ({ id: r.entry.id, text: r.entry.text, candidate: r.entry.candidate ?? null })),
  };
}

/** 讀反饋檔並判定 */
export function runFiles(files: string[]): EntryResult[] {
  const results: EntryResult[] = [];
  for (const file of files) {
    const { entries } = JSON.parse(readFileSync(file, 'utf8')) as { entries: Entry[] };
    for (const e of entries) {
      const report = JSON.parse(readFileSync(join(REPO, e.report), 'utf8')) as Evaluation;
      results.push(judge(e, report));
    }
  }
  return results;
}

/** 指令進入點(被 import 時不執行) */
if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--'));
  const list = files.length ? files : readdirSync(join(HERE, 'entries')).filter((f) => f.endsWith('.json')).sort().map((f) => join(HERE, 'entries', f));
  const results = runFiles(list);
  const s = summarize(results);
  if (args.includes('--json')) {
    console.log(JSON.stringify({ summary: s, results }, null, 2));
  } else {
    for (const r of results) {
      const tag = r.entry.sentiment === 'dislike' ? (r.agree ? '✅ 有覆蓋' : '❌ 未覆蓋') : r.agree ? '✅ 一致' : '⚠️ 可能誤判';
      const found = r.findings.length ? r.findings.map((f) => `${f.item}(${f.verdict})`).join('、') : '無';
      console.log(`${tag}  ${r.entry.id}  ${r.entry.target ?? r.entry.ref}${r.entry.width ? ` @${r.entry.width}px` : ''}「${r.entry.text}」→ 報告:${found}${r.mappedConfirmed === false ? '(skill 對應的項目不在報告裡)' : ''}`);
      if (!r.agree && r.entry.candidate) console.log(`      新項目候選:${r.entry.candidate.item}(${r.entry.candidate.metric}${r.entry.candidate.threshold ? `;${r.entry.candidate.threshold}` : ''})`);
    }
    console.log(`\n覆蓋率:${s.covered} / ${s.dislikes}${s.coverage === null ? '' : `(${Math.round(s.coverage * 100)}%)`};可能誤判:${s.possibleFalsePositives.length} 筆`);
  }
}
