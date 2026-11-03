// POC 2 主程式:對範例首頁(或指定資料目錄)評分,輸出 REPORT.md 與 report.json。
// 用法:npm run poc:2 [-- 資料目錄] [--check-determinism]

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadWorld } from '../estimate-vs-render/model.js';
import { type Evaluation, FACETS, type Finding, evaluatePage, sortFindings } from './evaluate.js';
export { SPEC_ITEMS } from './evaluate.js';
import { renderAudit } from './render-audit.js';
import { renderReportHtml } from './report-html.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

const LABEL = { pass: '✅ 合格', warn: '⚠️ 警告', fail: '❌ 不合格' } as const;

/** 把評分結果寫成 Markdown */
export function toMarkdown(ev: Evaluation, title: string): string {
  const md: string[] = [];
  const sorted = sortFindings(ev.findings);
  const bad = sorted.filter((f) => f.verdict !== 'pass');
  md.push(`# ${title}`, '');
  md.push('> 由 `npm run poc:2` 產生。JSON 估算 + 渲染量測(Chromium、Noto Sans TC、6 種寬度)。', '');
  md.push(`## 總分 ${ev.total}(${LABEL[ev.pageVerdict]})`, '');
  md.push('| 面向 | 分數 | 不合格 | 警告 | 合格 |', '| --- | --- | --- | --- | --- |');
  for (const facet of FACETS) {
    const fs = ev.findings.filter((f) => f.facet === facet);
    const n = (v: Finding['verdict']) => fs.filter((f) => f.verdict === v).length;
    const score = ev.scores[facet];
    md.push(`| ${facet} | ${score === null ? '需渲染評估' : score} | ${n('fail')} | ${n('warn')} | ${n('pass')} |`);
  }
  md.push('', '計分:每個面向從 100 分起算,不合格一項扣 30 分、警告一項扣 10 分;總分是可評估面向的平均。權重是經驗值,之後用數據校正。', '');
  md.push(`## 要改的地方(${bad.length} 項)`, '');
  md.push('| 判定 | 面向 | 項目 | 對象 | 寬度 | 量到的數字 | 建議 |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (const f of bad) {
    md.push(`| ${LABEL[f.verdict]} | ${f.facet} | ${f.item}${f.poc ? '(POC)' : ''} | ${f.target} | ${f.width ?? '—'} | ${f.display} | ${f.suggestion} |`);
  }
  md.push('', `## 合格的項目(${sorted.length - bad.length} 項)`, '');
  const passed = sorted.filter((f) => f.verdict === 'pass');
  const byItem = new Map<string, string[]>();
  for (const f of passed) byItem.set(f.item, [...(byItem.get(f.item) ?? []), f.target]);
  for (const [item, targets] of byItem) md.push(`- ${item}:${targets.join('、')}`);
  md.push('');
  return md.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--')) ?? join(REPO, 'data');
  // 【第一步】評分
  const world = loadWorld(dir);
  const jsonOnly = args.includes('--json-only');
  const out = join(HERE, 'out');
  const rendered = jsonOnly ? undefined : await renderAudit(world, out, join(HERE, 'screenshots'));
  const ev = evaluatePage(world, rendered);
  const json = JSON.stringify({ ...ev, findings: sortFindings(ev.findings) }, null, 2) + '\n';
  // 【第二步】確定性檢查:再算一次,逐字比較
  if (args.includes('--check-determinism')) {
    const again = evaluatePage(loadWorld(dir), jsonOnly ? undefined : await renderAudit(world, out));
    const same = JSON.stringify({ ...again, findings: sortFindings(again.findings) }, null, 2) + '\n' === json;
    console.log(same ? '確定性檢查通過:兩次結果逐字相同' : '確定性檢查失敗');
    if (!same) process.exitCode = 1;
    return;
  }
  // 【第三步】寫報告
  writeFileSync(join(HERE, 'report.json'), json);
  writeFileSync(join(HERE, 'REPORT.md'), toMarkdown(ev, `POC 2 評分報告:${world.page.name}`));
  writeFileSync(
    join(HERE, 'report.html'),
    renderReportHtml(ev, {
      title: `版面評估報表:${world.page.name}`,
      subtitle: '第 2、3 層:JSON 估算 + 渲染量測(Chromium、Noto Sans TC、360~1440px 六種寬度)',
      screenshots: jsonOnly ? [] : [{ label: '390px', src: 'screenshots/page-390.jpg' }, { label: '1280px', src: 'screenshots/page-1280.jpg' }],
    }),
  );
  const bad = ev.findings.filter((f) => f.verdict !== 'pass');
  console.log(`總分 ${ev.total},整頁 ${ev.pageVerdict};有問題的對象:不合格 ${bad.filter((f) => f.verdict === "fail").length}、警告 ${bad.filter((f) => f.verdict === "warn").length}`);
  for (const f of sortFindings(bad)) console.log(`  ${f.verdict}  ${f.facet}  ${f.item}  ${f.target}  ${f.width ?? '-'}  ${f.display}`);
}

await main();
