// POC 2 的 Lighthouse 式 HTML 報表:分數圓環、依面向列出項目、改善建議、截圖。
// 單一 HTML 檔,樣式內嵌;顏色用 CSS 變數,支援深色模式。

import { FACETS, type Evaluation, type Facet, type Finding, PENALTY, RENDER_ONLY, sortFindings } from './evaluate.js';
import { RANK, type Verdict } from './checks.js';

/** 跳脫 HTML */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 分數等級:90 以上好、50~89 普通、50 以下差(同 Lighthouse) */
export function grade(score: number | null): 'good' | 'mid' | 'bad' | 'na' {
  if (score === null) return 'na';
  if (score >= 90) return 'good';
  return score >= 50 ? 'mid' : 'bad';
}

/** 分數圓環(SVG) */
export function gauge(score: number | null, label: string, size = 96): string {
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = score === null ? 0 : (score / 100) * c;
  return `<figure class="gauge ${grade(score)}" style="--size:${size}px">
<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="${r}"/><circle class="arc" cx="50" cy="50" r="${r}" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>
<span class="num">${score === null ? '—' : score}</span><figcaption>${esc(label)}</figcaption></figure>`;
}

const VERDICT = { fail: ['不合格', '▲'], warn: ['警告', '■'], pass: ['合格', '●'] } as const;

/** 依項目分組:每組的最終判定是組內最差的那個 */
export function groupByItem(fs: Finding[]): { item: string; verdict: Verdict; findings: Finding[] }[] {
  const groups = new Map<string, Finding[]>();
  for (const f of fs) groups.set(f.item, [...(groups.get(f.item) ?? []), f]);
  return [...groups].map(([item, list]) => ({
    item,
    verdict: list.reduce<Verdict>((a, f) => (RANK[f.verdict] > RANK[a] ? f.verdict : a), 'pass'),
    findings: list,
  }));
}

/** 一個項目的一列:有問題的對象逐一列出;全部合格時只列對象清單 */
function auditRow(g: { item: string; verdict: Verdict; findings: Finding[] }): string {
  const [text, icon] = VERDICT[g.verdict];
  const bad = g.findings.filter((f) => f.verdict !== 'pass');
  const poc = g.findings.some((f) => f.poc) ? '<span class="tag">POC</span>' : '';
  const source = RENDER_ONLY.includes(g.findings[0]!.facet) || ['同列對齊', '欄寬照格線'].includes(g.item) ? '<span class="tag">渲染量測</span>' : '<span class="tag">JSON 估算</span>';
  const details = bad.length
    ? `<ul class="targets">${bad
        .map((f) => `<li class="${f.verdict}"><span class="target">${esc(f.target)}</span>${f.width ? ` <span class="w">${f.width}px</span>` : ''} · ${esc(f.display)}${f.suggestion ? `<div class="sug">${esc(f.suggestion)}</div>` : ''}</li>`)
        .join('')}</ul>`
    : `<div class="val">${esc(g.findings.map((f) => f.target).join('、'))}</div>`;
  return `<li class="audit ${g.verdict}"><span class="icon" title="${text}">${icon}</span><div><div class="head"><b>${esc(g.item)}</b>${source}${poc}${bad.length ? `<span class="w">${bad.length} 個對象</span>` : ''}</div>${details}</div></li>`;
}

/** 報表共用的 CSS */
export const REPORT_CSS = `
:root{--bg:#fff;--fg:#202124;--muted:#5f6368;--line:#e0e0e0;--card:#f8f9fa;--good:#0a8a3a;--mid:#c26a00;--bad:#d4311f;--na:#9aa0a6;--track:#e8eaed}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1f2023;--fg:#e8eaed;--muted:#9aa0a6;--line:#3c4043;--card:#28292c;--good:#3ccf72;--mid:#ffa94d;--bad:#ff6b5e;--na:#80868b;--track:#3c4043}}
:root[data-theme="dark"]{--bg:#1f2023;--fg:#e8eaed;--muted:#9aa0a6;--line:#3c4043;--card:#28292c;--good:#3ccf72;--mid:#ffa94d;--bad:#ff6b5e;--na:#80868b;--track:#3c4043}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,'Noto Sans TC',sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 8px;border-bottom:1px solid var(--line);padding-bottom:6px}
.sub{color:var(--muted);font-size:13px;margin:0 0 16px}
.gauges{display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:center;margin:16px 0}
.gauge{margin:0;position:relative;width:var(--size);text-align:center}
.gauge svg{width:var(--size);height:var(--size)}
.gauge .track{fill:none;stroke:var(--track);stroke-width:8}
.gauge .arc{fill:none;stroke-width:8;stroke-linecap:round}
.gauge.good .arc{stroke:var(--good)}.gauge.mid .arc{stroke:var(--mid)}.gauge.bad .arc{stroke:var(--bad)}
.gauge .num{position:absolute;left:0;right:0;top:calc(var(--size) / 2 - 0.75em);font-size:calc(var(--size) * 0.28);font-weight:600}
.gauge.good .num{color:var(--good)}.gauge.mid .num{color:var(--mid)}.gauge.bad .num{color:var(--bad)}.gauge.na .num{color:var(--na)}
.gauge figcaption{font-size:13px;color:var(--muted)}
.verdict{text-align:center;font-weight:600;margin:0}
ul.audits{list-style:none;margin:0;padding:0}
.audit{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
.audit .icon{flex:0 0 18px;font-size:13px;line-height:24px}
.audit.fail .icon{color:var(--bad)}.audit.warn .icon{color:var(--mid)}.audit.pass .icon{color:var(--good)}
.audit .head{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}
.audit .target,.audit .w{color:var(--muted);font-size:13px}
.audit .val{font-size:14px}.audit .sug{font-size:14px;color:var(--muted);margin-top:2px}
.targets{list-style:none;margin:4px 0 0;padding:0;font-size:14px}.targets li{padding:2px 0}
.targets li.fail .target{color:var(--bad)}.targets li.warn .target{color:var(--mid)}
.tag{font-size:11px;border:1px solid var(--line);border-radius:4px;padding:0 4px;color:var(--muted)}
details{margin-top:8px}summary{cursor:pointer;color:var(--muted)}
.shots{display:flex;gap:16px;flex-wrap:wrap}.shots figure{margin:0;flex:1 1 260px}.shots img{width:100%;border:1px solid var(--line)}
.shots figcaption{font-size:13px;color:var(--muted)}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left}
.scroll{overflow-x:auto}
`;

/** 單一頁面的報表 */
export function renderReportHtml(
  ev: Evaluation,
  meta: { title: string; subtitle: string; screenshots: { label: string; src: string }[] },
): string {
  const sorted = sortFindings(ev.findings);
  const verdictText = { pass: '整頁合格', warn: '整頁有警告', fail: '整頁不合格' }[ev.pageVerdict];
  // 【第一步】總分與 8 個面向的圓環
  const gauges = `<div class="gauges">${gauge(ev.total, '總分', 120)}</div><div class="gauges">${FACETS.map((f) => gauge(ev.scores[f], f, 84)).join('')}</div>`;
  // 【第二步】改善建議:有問題的項目,依扣分多寡排序
  const opps = groupByItem(sorted)
    .filter((g) => g.verdict !== 'pass')
    .sort((a, b) => PENALTY[b.verdict] - PENALTY[a.verdict]);
  // 【第三步】依面向列出項目,合格的收在 details 裡
  const facetSection = (facet: Facet) => {
    const gs = groupByItem(sorted.filter((f) => f.facet === facet));
    const bad = gs.filter((g) => g.verdict !== 'pass');
    const ok = gs.filter((g) => g.verdict === 'pass');
    return `<h2 id="${facet}">${esc(facet)} ${ev.scores[facet] === null ? '<small>(需渲染評估)</small>' : ev.scores[facet]}</h2>
${bad.length ? `<ul class="audits">${bad.map(auditRow).join('')}</ul>` : '<p class="sub">沒有要改的地方。</p>'}
${ok.length ? `<details><summary>合格 ${ok.length} 項</summary><ul class="audits">${ok.map(auditRow).join('')}</ul></details>` : ''}`;
  };
  const shots = meta.screenshots.length
    ? `<h2>截圖</h2><div class="shots">${meta.screenshots.map((s) => `<figure><img src="${esc(s.src)}" alt="${esc(s.label)}" loading="lazy"><figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</div>`
    : '';
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>版面評估報表</title><style>${REPORT_CSS}</style></head><body><main>
<h1>${esc(meta.title)}</h1><p class="sub">${esc(meta.subtitle)}</p>
${gauges}<p class="verdict">${verdictText}:${(() => {
    const gs = groupByItem(sorted);
    const n = (v: Verdict) => gs.filter((g) => g.verdict === v).length;
    return `${gs.length} 個項目中,不合格 ${n('fail')}、警告 ${n('warn')}、合格 ${n('pass')}`;
  })()}</p>
<h2>改善建議</h2>${opps.length ? `<ul class="audits">${opps.map(auditRow).join('')}</ul>` : '<p class="sub">沒有要改的地方。</p>'}
${FACETS.map(facetSection).join('\n')}
${shots}
<p class="sub">計分:每個面向 100 分起算,每個項目只扣一次(取最差的對象),不合格扣 ${PENALTY.fail}、警告扣 ${PENALTY.warn};總分是 8 個面向的平均。權重為經驗值。</p>
</main></body></html>\n`;
}
