// 範例的 before/after 對照報表:Markdown 與 HTML。

import { FACETS } from '../evaluate/evaluate.js';
import { REPORT_CSS, gauge, groupByItem } from '../evaluate/report-html.js';
import type { CaseResult } from './run.js';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const V = { pass: '合格', warn: '警告', fail: '不合格' } as const;

/** 產生 Markdown 與 HTML */
export function renderComparison(results: CaseResult[]): { md: string; html: string } {
  const passed = results.filter((r) => r.pass).length;
  // 【第一步】Markdown
  const md: string[] = ['# 範例:V1(改善前)→ V2(改善後)', ''];
  md.push('> 由 `npm run poc:examples` 產生。每個範例都以 `data/` 為基礎,V1 用 JSON Patch 製造問題(或維持原樣),V2 在 V1 上套用改法;兩版都跑第 1 層檢查與完整評估。', '');
  md.push(`**${passed} / ${results.length} 個範例通過驗收。** 驗收條件:兩版都沒有第 1 層錯誤、V2 總分高於 V1、目標項目在 V2 合格(標「部分」的範例只要求變好)、V2 沒有新的不合格項目。`, '');
  md.push('| # | 範例 | 問題 | 總分 V1 → V2 | 整頁 V1 → V2 | 驗收 |', '| --- | --- | --- | --- | --- | --- |');
  for (const r of results) {
    md.push(`| ${r.case.id} | ${r.case.title} | ${r.case.problem} | ${r.v1.evaluation.total} → **${r.v2.evaluation.total}** | ${V[r.v1.evaluation.pageVerdict]} → ${V[r.v2.evaluation.pageVerdict]} | ${r.pass ? '✅' : '❌'}${r.case.partial ? '(部分)' : ''} |`);
  }
  md.push('');
  for (const r of results) {
    md.push(`## ${r.case.id} ${r.case.title}`, '');
    md.push(`- **問題**:${r.case.problem}`, `- **改法**:${r.case.fixNote}`, '');
    md.push('| 面向 | V1 | V2 |', '| --- | --- | --- |');
    for (const f of FACETS) md.push(`| ${f} | ${r.v1.evaluation.scores[f] ?? '—'} | ${r.v2.evaluation.scores[f] ?? '—'} |`);
    md.push(`| **總分** | **${r.v1.evaluation.total}** | **${r.v2.evaluation.total}** |`, '');
    md.push('| 驗收 | 結果 | 說明 |', '| --- | --- | --- |');
    for (const c of r.checks) md.push(`| ${c.name} | ${c.pass ? '✅' : '❌'} | ${c.detail} |`);
    md.push('', `| V1 | V2 |`, '| --- | --- |', `| ![V1](screenshots/${r.case.id}-v1.jpg) | ![V2](screenshots/${r.case.id}-v2.jpg) |`, '');
  }
  // 【第二步】HTML
  const caseHtml = (r: CaseResult) => {
    const row = (label: string, ev: CaseResult['v1']['evaluation']) =>
      `<div class="ver"><h3>${label}</h3><div class="gauges">${gauge(ev.total, '總分', 88)}${FACETS.map((f) => gauge(ev.scores[f], f, 56)).join('')}</div></div>`;
    // 目標項目的變化
    const changed = groupByItem(r.v1.evaluation.findings)
      .map((g) => ({ item: g.item, a: g.verdict, b: r.v2.items[g.item] ?? 'pass' }))
      .filter((x) => x.a !== x.b);
    return `<section class="case" id="c${esc(r.case.id)}"><h2>${esc(r.case.id)} ${esc(r.case.title)} <span class="badge ${r.pass ? 'ok' : 'ng'}">${r.pass ? '通過' : '未通過'}${r.case.partial ? '(部分)' : ''}</span></h2>
<p><b>問題:</b>${esc(r.case.problem)}<br><b>改法:</b>${esc(r.case.fixNote)}</p>
<div class="pair">${row('V1 改善前', r.v1.evaluation)}${row('V2 改善後', r.v2.evaluation)}</div>
<div class="scroll"><table><thead><tr><th>項目</th><th>V1</th><th>V2</th></tr></thead><tbody>${changed.map((x) => `<tr><td>${esc(x.item)}</td><td class="${x.a}">${V[x.a]}</td><td class="${x.b}">${V[x.b]}</td></tr>`).join('') || '<tr><td colspan="3">項目判定沒有變化</td></tr>'}</tbody></table></div>
<details><summary>驗收明細</summary><ul>${r.checks.map((c) => `<li>${c.pass ? '✅' : '❌'} ${esc(c.name)}:${esc(c.detail)}</li>`).join('')}</ul></details>
<div class="shots"><figure><img src="screenshots/${esc(r.case.id)}-v1.jpg" alt="V1" loading="lazy"><figcaption>V1(${r.case.shotWidth}px)</figcaption></figure><figure><img src="screenshots/${esc(r.case.id)}-v2.jpg" alt="V2" loading="lazy"><figcaption>V2(${r.case.shotWidth}px)</figcaption></figure></div></section>`;
  };
  const summaryRows = results
    .map((r) => `<tr><td><a href="#c${esc(r.case.id)}">${esc(r.case.id)}</a></td><td>${esc(r.case.title)}</td><td>${r.v1.evaluation.total} → <b>${r.v2.evaluation.total}</b></td><td>${r.pass ? '✅' : '❌'}${r.case.partial ? '(部分)' : ''}</td></tr>`)
    .join('');
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>範例對照</title><style>${REPORT_CSS}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media (max-width:700px){.pair{grid-template-columns:1fr}}
.ver h3{font-size:15px;margin:8px 0 0;text-align:center}.ver .gauges{gap:6px 10px}
.case{margin-top:40px}.badge{font-size:12px;border-radius:10px;padding:2px 8px;vertical-align:middle}
.badge.ok{background:var(--good);color:#fff}.badge.ng{background:var(--bad);color:#fff}
td.fail{color:var(--bad)}td.warn{color:var(--mid)}td.pass{color:var(--good)}
</style></head><body><main><h1>範例:V1 改善前 → V2 改善後</h1>
<p class="sub">${passed} / ${results.length} 個範例通過驗收。每個範例以 data/ 為基礎,V1 製造(或保留)一種問題,V2 只用規格允許的改法修正;兩版都跑第 1 層檢查與完整評估(JSON 估算 + 渲染量測)。</p>
<div class="scroll"><table><thead><tr><th>#</th><th>範例</th><th>總分 V1 → V2</th><th>驗收</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
${results.map(caseHtml).join('\n')}
</main></body></html>\n`;
  return { md: md.join('\n'), html };
}
