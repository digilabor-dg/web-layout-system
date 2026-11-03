// POC 1 的報告:計算驗收指標,寫出 RESULTS.md。

import { writeFileSync } from 'node:fs';
import type { Row, TitleRow } from './run.js';

/** 驗收門檻(見 openspec/changes/poc-estimate-vs-render/tasks.md) */
export const TARGET = { median: 0.05, max: 0.15, rows: 78 };

/** 相對誤差:(估算 − 量測) ÷ 量測 */
const err = (est: number, measured: number) => (est - measured) / measured;
/** 中位數 */
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

interface Result {
  rows: Row[];
  titleRows: TitleRow[];
  checks: { width: number; scrollOverflow: number; badFrames: number; probe: { cjkEm: number; latinEm: number; fontOk: boolean } }[];
}

/** 寫報告,回傳是否通過驗收與一段摘要。sensitivity 是換字型後的結果(估算參數不變) */
export function writeReport(result: Result, path: string, sensitivity?: Result): { pass: boolean; summary: string } {
  const { rows, titleRows, checks } = result;
  // 【第一步】兩種標題方法的區塊高度誤差
  const stats = (pick: (r: Row) => number) => {
    const abs = rows.map((r) => Math.abs(err(pick(r), r.measured)));
    return { median: median(abs), max: Math.max(...abs) };
  };
  const sRatio = stats((r) => r.estRatio);
  const sGreedy = stats((r) => r.estGreedy);
  const best = sGreedy.median <= sRatio.median ? 'greedy' : 'ratio';
  const sBest = best === 'greedy' ? sGreedy : sRatio;
  const pick = (r: Row) => (best === 'greedy' ? r.estGreedy : r.estRatio);
  // 【第二步】標題行數的準確率
  const exact = (k: 'ratio' | 'greedy') => titleRows.filter((t) => t[k] === t.measured).length / titleRows.length;
  const under = (k: 'ratio' | 'greedy') => titleRows.filter((t) => t[k] < t.measured).length;
  const over = (k: 'ratio' | 'greedy') => titleRows.filter((t) => t[k] > t.measured).length;
  // 【第三步】驗收條件逐項判定
  const c1 = rows.length === TARGET.rows;
  const c2 = checks.every((c) => c.scrollOverflow <= 0 && c.badFrames === 0 && c.probe.fontOk);
  const c4 = sBest.median <= TARGET.median && sBest.max <= TARGET.max;
  const pass = c1 && c2 && c4;
  const mark = (ok: boolean) => (ok ? '✅ 通過' : '❌ 未通過');
  // 【第四步】誤差最大的 10 筆
  const worst = [...rows].sort((a, b) => Math.abs(err(pick(b), b.measured)) - Math.abs(err(pick(a), a.measured))).slice(0, 10);
  const widths = [...new Set(rows.map((r) => r.width))];
  const probe = checks[0]!.probe;

  const md: string[] = [];
  md.push('# POC 1 結果:JSON 估算 vs 實際渲染', '');
  md.push('> 由 `npm run poc:1` 產生,請勿手動編輯。量測環境:Chromium(Playwright)、字型 Noto Sans TC 400、deviceScaleFactor 1。', '');
  md.push('## 驗收', '');
  md.push('| # | 條件 | 結果 |', '| --- | --- | --- |');
  md.push(`| 1.1 | 13 塊 × 6 種寬度 = 78 筆 | ${mark(c1)}(${rows.length} 筆) |`);
  md.push(`| 1.2 | 無水平捲動、圖框皆有 aspect-ratio、字型已載入 | ${mark(c2)} |`);
  md.push('| 1.3 | 連跑兩次結果相同 | 見 `npm run poc:1 -- --check-determinism` |');
  md.push(`| 1.4 | 區塊高度誤差中位數 ≤ ${pct(TARGET.median)}、最大 ≤ ${pct(TARGET.max)}(取較好的標題方法:${best}) | ${mark(c4)}(中位數 ${pct(sBest.median)},最大 ${pct(sBest.max)}) |`);
  md.push('');
  md.push('## 兩種標題行數方法', '');
  md.push('| 方法 | 說明 | 標題行數完全正確 | 估少 | 估多 | 區塊高度誤差中位數 | 最大 |', '| --- | --- | --- | --- | --- | --- | --- |');
  md.push(`| ratio | 規格公式:⌈總寬 ÷ 欄寬⌉ | ${pct(exact('ratio'))} | ${under('ratio')} | ${over('ratio')} | ${pct(sRatio.median)} | ${pct(sRatio.max)} |`);
  md.push(`| greedy | 逐字排入,英數字不拆 | ${pct(exact('greedy'))} | ${under('greedy')} | ${over('greedy')} | ${pct(sGreedy.median)} | ${pct(sGreedy.max)} |`);
  md.push('', `共 ${titleRows.length} 個標題(疊字標題有兩行截斷,不列入)。`, '');
  md.push('## 實測字寬', '');
  md.push(`Noto Sans TC 實測:中文 ${probe.cjkEm} em、英數字平均 ${probe.latinEm} em。估算用的設定值:中文 1 em、英數字 0.55 em。`, '');
  md.push('## 誤差最大的 10 筆', '');
  md.push('| 寬度 | 版位 | 型 | 排法 | 區塊寬 | 估算 | 量測 | 誤差 |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of worst) {
    md.push(`| ${r.width} | ${r.code} | ${r.pattern} | ${r.kind} | ${r.blockWidth} | ${pick(r)} | ${r.measured} | ${pct(err(pick(r), r.measured))} |`);
  }
  md.push('', '## 每種寬度的明細', '');
  for (const w of widths) {
    const rs = rows.filter((r) => r.width === w);
    md.push(`### ${w}px(${rs[0]!.device})`, '');
    md.push('| 版位 | 型 | 排法 | 區塊寬 | 估算 ratio | 估算 greedy | 量測 | 誤差(greedy) |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of rs) {
      md.push(`| ${r.code} | ${r.pattern} | ${r.kind} | ${r.blockWidth} | ${r.estRatio} | ${r.estGreedy} | ${r.measured} | ${pct(err(r.estGreedy, r.measured))} |`);
    }
    md.push('');
  }
  if (sensitivity) {
    // 敏感度:估算參數完全不動,只把渲染字型換成文泉驛正黑
    const sr = sensitivity.rows;
    const abs = (k: 'estRatio' | 'estGreedy') => sr.map((r) => Math.abs(err(r[k], r.measured)));
    const st = sensitivity.titleRows;
    const ex = (k: 'ratio' | 'greedy') => st.filter((t) => t[k] === t.measured).length / st.length;
    const p2 = sensitivity.checks[0]!.probe;
    md.push('## 敏感度實驗:字型和設定不符時', '');
    md.push(`估算參數不變(中文 1 em、英數字 0.55 em、半形標點 0.3 em),只把渲染字型換成系統的文泉驛正黑(實測中文 ${p2.cjkEm} em、英數字 ${p2.latinEm} em)。`, '');
    md.push('| 方法 | 標題行數完全正確 | 區塊高度誤差中位數 | 最大 |', '| --- | --- | --- | --- |');
    md.push(`| ratio | ${pct(ex('ratio'))} | ${pct(median(abs('estRatio')))} | ${pct(Math.max(...abs('estRatio')))} |`);
    md.push(`| greedy | ${pct(ex('greedy'))} | ${pct(median(abs('estGreedy')))} | ${pct(Math.max(...abs('estGreedy')))} |`);
    md.push('');
  }
  md.push('## 截圖', '', '| 390px | 1280px |', '| --- | --- |', '| ![390](screenshots/home-390.jpg) | ![1280](screenshots/home-1280.jpg) |', '');
  writeFileSync(path, md.join('\n'));
  return {
    pass,
    summary: `驗收 ${pass ? '通過' : '未通過'}:${rows.length} 筆;較好的方法 ${best},區塊高度誤差中位數 ${pct(sBest.median)}、最大 ${pct(sBest.max)};標題行數正確率 ratio ${pct(exact('ratio'))}、greedy ${pct(exact('greedy'))}`,
  };
}
