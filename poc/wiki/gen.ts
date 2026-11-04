// 產生 docs/wiki 中數字最多的兩頁:範例.md(由 poc/examples/results.json 與 cases)、規格.md 的 capability 表(由 openspec/specs)。
// 用法:npm run docs:wiki

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const WIKI = join(REPO, 'docs', 'wiki');

/** 各 capability 預計實作的階段(來自 migrate-docs-to-openspec 的 proposal) */
const STAGE: Record<string, string> = {
  'site-profile': '1', 'layout-patterns': '1', 'content-model': '1', 'image-ratio-policy': '1、3~4', 'block-composition': '1',
  'page-layout': '1', 'sample-data': '1', 'rule-check': '1', 'core-library': '1', 'height-estimation': '2',
  'template-evaluation': '2、4', 'page-evaluation': '2', 'evaluation-report': '2、4', 'html-rendering': '3',
  'render-measurement': '4', 'improvement-suggestions': '5', 'ai-review': '6', 'layout-generation': '7',
};
/** 已實作(第 1 階段已 archive)或已有 POC 的 capability */
const STATUS: Record<string, string> = {
  'site-profile': '✅ 已實作', 'layout-patterns': '✅ 已實作', 'content-model': '✅ 已實作', 'image-ratio-policy': '✅ 資料部分已實作;顯示部分有 POC',
  'block-composition': '✅ 已實作', 'page-layout': '✅ 已實作', 'sample-data': '✅ 已實作', 'rule-check': '✅ 已實作', 'core-library': '✅ 已實作',
  'height-estimation': '🧪 POC 1', 'template-evaluation': '🧪 POC 2', 'page-evaluation': '🧪 POC 2', 'evaluation-report': '🧪 POC 2',
  'html-rendering': '🧪 POC 1(簡化版)', 'render-measurement': '🧪 POC 1、2', 'improvement-suggestions': '🧪 範例 10(貪婪法)',
  'ai-review': '⏳ 未開始', 'layout-generation': '⏳ 未開始',
};

/** 規格.md 的 capability 表 */
function specTable(): string {
  const dir = join(REPO, 'openspec', 'specs');
  const rows = readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .sort()
    .map((cap) => {
      const md = readFileSync(join(dir, cap, 'spec.md'), 'utf8');
      // Purpose 的第一句話當說明
      const purpose = (/## Purpose\s*\n+([^\n]+)/.exec(md)?.[1] ?? '').split(/[。:]/)[0];
      const reqs = (md.match(/^### Requirement:/gm) ?? []).length;
      return `| [\`${cap}\`](../../openspec/specs/${cap}/spec.md) | ${purpose} | ${reqs} | ${STAGE[cap] ?? '—'} | ${STATUS[cap] ?? '—'} |`;
    });
  return ['| Capability | 說明 | 需求數 | 實作階段 | 狀態 |', '| --- | --- | --- | --- | --- |', ...rows].join('\n');
}

/** 範例.md */
function examplesPage(): string {
  const results = JSON.parse(readFileSync(join(REPO, 'poc', 'examples', 'results.json'), 'utf8')) as {
    id: string; title: string; pass: boolean; total: [number, number]; verdict: [string, string];
    scores: [Record<string, number | null>, Record<string, number | null>]; checks: { name: string; pass: boolean; detail: string }[];
    remaining: { item: string; verdict: string; target: string; width: number | null; value: number; display: string }[];
  }[];
  const cases = new Map(
    readdirSync(join(REPO, 'poc', 'examples', 'cases')).map((f) => {
      const c = JSON.parse(readFileSync(join(REPO, 'poc', 'examples', 'cases', f), 'utf8')) as { id: string; problem: string; fixNote: string; shotWidth: number };
      return [c.id, c];
    }),
  );
  const V: Record<string, string> = { pass: '合格', warn: '警告', fail: '不合格' };
  const md: string[] = ['# 範例:V1 改善前 → V2 改善後', ''];
  md.push('> 本頁由 `npm run docs:wiki` 依 `poc/examples/results.json` 產生。重跑範例:`npm run poc:examples`。', '');
  md.push(`**${results.filter((r) => r.pass).length} / ${results.length} 個範例通過驗收。** 每個範例以 \`data/\` 為基礎,V1 製造(或保留)一種問題,V2 只用規格允許的改法修正。兩版都跑第 1 層檢查與完整評估(JSON 估算 + Chromium 渲染量測,6 種寬度)。`, '');
  md.push('驗收條件:兩版都沒有第 1 層錯誤;V2 總分高於 V1;目標在 V2 合格;V2 沒有新的不合格(以穩定參照比對,區塊搬動也不會認錯對象)。', '');
  md.push('| # | 範例 | 總分 V1 → V2 | 整頁判定 | 驗收 |', '| --- | --- | --- | --- | --- |');
  for (const r of results) md.push(`| [${r.id}](#${r.id}) | ${r.title} | ${r.total[0]} → **${r.total[1]}** | ${V[r.verdict[0]]} → ${V[r.verdict[1]]} | ${r.pass ? '✅' : '❌'} |`);
  md.push('');
  md.push('**為什麼整頁判定都還是「不合格」?** 範例首頁有兩項在規格允許的參數內無解:P09 的欄底對齊,以及純文字側欄的欄高平衡(見[發現與型式限制](發現與型式限制.md))。只要有一項不合格,整頁就判定不合格,所以每個範例只要求「目標問題修好、沒有新的不合格、總分提升」。', '');
  for (const r of results) {
    const c = cases.get(r.id)!;
    md.push(`## ${r.id}`, '', `### ${r.title}`, '', `- **問題**:${c.problem}`, `- **改法**:${c.fixNote}`, '');
    const facets = Object.keys(r.scores[0]);
    md.push(`| | ${facets.join(' | ')} | 總分 |`, `| --- | ${facets.map(() => '---').join(' | ')} | --- |`);
    md.push(`| V1 | ${facets.map((f) => r.scores[0][f] ?? '—').join(' | ')} | ${r.total[0]} |`);
    md.push(`| V2 | ${facets.map((f) => r.scores[1][f] ?? '—').join(' | ')} | **${r.total[1]}** |`, '');
    md.push(r.checks.map((x) => `${x.pass ? '✅' : '❌'} ${x.name}:${x.detail}`).join('<br>'), '');
    // 依項目分組:一個項目一行,列出所有對象,數字取最嚴重的那一個(清單已依不合格在前排序)
    const groups = new Map<string, typeof r.remaining>();
    for (const f of r.remaining) groups.set(f.item, [...(groups.get(f.item) ?? []), f]);
    md.push(`**V2 仍有的問題(${groups.size} 個項目)**:這些不是本範例的目標,多半是[參數內無解的型式限制](發現與型式限制.md)或網站設定。`, '');
    for (const [item, fs] of groups) {
      // 最嚴重的對象:不合格優先;同樣判定時取數值最差的(觸控目標等越小越差,其餘越大越差)
      const smallerWorse = ['觸控目標', '列距', '間距節奏', '輪播填滿'].includes(item);
      const worst = [...fs].sort(
        (a, b) => (a.verdict === b.verdict ? (smallerWorse ? a.value - b.value : b.value - a.value) : a.verdict === 'fail' ? -1 : 1),
      )[0]!;
      const targets = fs.length > 3 ? `${fs.slice(0, 3).map((f) => f.target).join('、')} 等 ${fs.length} 個` : fs.map((f) => f.target).join('、');
      md.push(`- ${worst.verdict === 'fail' ? '❌' : '⚠️'} **${item}**(${targets}):${worst.display}${worst.width ? `(${worst.width}px)` : ''}`);
    }
    md.push('');
    // 用 HTML 表格讓兩張截圖頂端對齊(Markdown 表格會垂直置中)
    md.push(`<table><tr><th>V1(${c.shotWidth}px)</th><th>V2(${c.shotWidth}px)</th></tr><tr><td valign="top"><img src="../../poc/examples/screenshots/${r.id}-v1.jpg" alt="V1"></td><td valign="top"><img src="../../poc/examples/screenshots/${r.id}-v2.jpg" alt="V2"></td></tr></table>`, '');
  }
  return md.join('\n');
}

// 【第一步】範例頁整頁產生
writeFileSync(join(WIKI, '範例.md'), examplesPage());
// 【第二步】規格頁只替換標記之間的表格,其他文字保留
const specPath = join(WIKI, '規格.md');
const spec = readFileSync(specPath, 'utf8');
const begin = '<!-- capability 表:由 npm run docs:wiki 產生 -->';
const end = '<!-- /capability 表 -->';
const a = spec.indexOf(begin);
const b = spec.indexOf(end);
if (a < 0 || b < 0) throw new Error('規格.md 缺少 capability 表的標記');
writeFileSync(specPath, spec.slice(0, a + begin.length) + '\n\n' + specTable() + '\n\n' + spec.slice(b));
console.log('docs/wiki 已更新');
