// POC 3 主程式:讀參數 → 搜尋 → 輸出產生的頁面、範本、實例,並跑完整評估(含渲染量測)與報表。
// 用法:npm run poc:generate -- params/default.json [--json-only]
//       npm run poc:generate -- --all            依序跑 params/ 底下全部參數

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toDataset } from '../../tests/helpers/fixture.js';
import { evaluatePage } from '../evaluate/evaluate.js';
import { renderAudit } from '../evaluate/render-audit.js';
import { renderReportHtml } from '../evaluate/report-html.js';
import { buildWorld } from '../estimate-vs-render/model.js';
import { buildNested, search } from './generate.js';
import { baseNested, checkParams } from './params.js';

const HERE = import.meta.dirname;

async function runOne(file: string, jsonOnly: boolean) {
  // 【第一步】讀參數並檢查
  const params = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  checkParams(params);
  const base = baseNested();
  // 【第二步】搜尋(只用 JSON 估算,快)
  const { best, steps, evaluated } = search(base, params);
  if (!best.evaluation) throw new Error('找不到合法的組合');
  const out = join(HERE, 'results', params.name);
  mkdirSync(out, { recursive: true });
  // 【第三步】完整評估(加上渲染量測)與截圖
  const nested = buildNested(base, params, best.choice)!;
  const world = buildWorld(toDataset(nested).files.map((f) => f.data));
  const rendered = jsonOnly ? undefined : await renderAudit(world, join(HERE, 'out', params.name), join(out, 'screenshots'));
  const ev = evaluatePage(world, rendered);
  // 【第四步】輸出:產生的資料、選擇、搜尋紀錄、報表
  const generated = {
    params,
    choices: params.blocks.map((id, i) => ({ block: id, option: best.choice[i]!.label })),
    search: { strategy: params.strategy, evaluated, steps },
    page: nested['pages']!['home'],
    templates: Object.values(nested['block-templates']!),
    instances: Object.values(nested['block-instances']!),
    violations: best.violations,
  };
  writeFileSync(join(out, 'generated.json'), JSON.stringify(generated, null, 2) + '\n');
  writeFileSync(join(out, 'report.json'), JSON.stringify(ev, null, 2) + '\n');
  writeFileSync(
    join(out, 'report.html'),
    renderReportHtml(ev, {
      title: `產生的版面:${params.title ?? params.name}`,
      subtitle: `參數 ${params.name}(${params.preset}、${params.strategy === 'beam' ? `集束搜尋 k=${params.beamWidth ?? 3}` : '貪婪法'});試算 ${evaluated} 種組合`,
      screenshots: jsonOnly ? [] : [{ label: '390px', src: 'screenshots/page-390.jpg' }, { label: '1280px', src: 'screenshots/page-1280.jpg' }],
    }),
  );
  console.log(`${params.name}:試算 ${evaluated} 種,JSON 估算總分 ${best.evaluation.total},完整評估總分 ${ev.total}(${ev.pageVerdict});第 1 層違規 ${best.violations.length} 個`);
  for (const c of generated.choices) console.log(`  ${c.block.padEnd(12)} ${c.option}`);
  return { name: params.name, total: ev.total, jsonTotal: best.evaluation.total, evaluated };
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json-only');
  const files = args.includes('--all')
    ? readdirSync(join(HERE, 'params')).filter((f) => f.endsWith('.json')).sort().map((f) => join(HERE, 'params', f))
    : args.filter((a) => !a.startsWith('--'));
  if (files.length === 0) throw new Error('請指定參數檔,或用 --all');
  const results = [];
  for (const f of files) results.push(await runOne(f, jsonOnly));
  if (args.includes('--all')) writeFileSync(join(HERE, 'results', 'summary.json'), JSON.stringify(results, null, 2) + '\n');
}

await main();
