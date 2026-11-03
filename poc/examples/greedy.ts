// 範例 10 的貪婪法:從候選改法中,每一輪挑「總分提升最多、第 1 層沒有錯誤、相對 V1 沒有新的不合格」的那一個,
// 重複到沒有改善為止(規格 improvement-suggestions 的貪婪法)。結果寫成 cases/10-greedy.json,可重現。
// 用法:npm run poc:greedy

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRESETS, SCHEMAS, validateDataset } from '../../src/index.js';
import { loadDataset } from '../../src/node/load.js';
import { applyPatch, toDataset, type Nested, type PatchOp } from '../../tests/helpers/fixture.js';
import { type Evaluation, evaluatePage } from '../evaluate/evaluate.js';
import { renderAudit } from '../evaluate/render-audit.js';
import { buildWorld } from '../estimate-vs-render/model.js';

const HERE = import.meta.dirname;
const REPO = join(HERE, '..', '..');

/** 一個候選改法 */
interface Candidate {
  id: string;
  note: string;
  ops: PatchOp[];
}

/** 範例資料轉成巢狀結構 */
function baseNested(): Nested {
  const nested: Nested = {};
  for (const f of loadDataset(join(REPO, 'data')).files) {
    const [folder, file] = f.path.split('/') as [string, string];
    (nested[folder] ??= {})[file.replace(/\.json$/, '')] = f.data;
  }
  return nested;
}

/** 套用改法並評估;第 1 層有錯誤時回傳 null */
async function score(base: Nested, ops: PatchOp[]): Promise<Evaluation | null> {
  let nested: Nested;
  try {
    nested = applyPatch(base, ops);
  } catch {
    return null; // 改法之間路徑衝突,視為不合法
  }
  const dataset = toDataset(nested);
  if (validateDataset(dataset, { schemas: SCHEMAS, presets: PRESETS }).some((v) => v.severity === 'error')) return null;
  const world = buildWorld(dataset.files.map((f) => f.data));
  return evaluatePage(world, await renderAudit(world, join(HERE, 'out')));
}

async function main() {
  const base = baseNested();
  const candidates = JSON.parse(readFileSync(join(HERE, 'candidates.json'), 'utf8')) as Candidate[];
  // 【第一步】V1 = 範例資料原樣
  const v1 = (await score(base, []))!;
  const failedV1 = new Set(v1.findings.filter((f) => f.verdict === 'fail').map((f) => `${f.item}|${f.ref}`));
  let current: PatchOp[] = [];
  let currentTotal = v1.total;
  const chosen: { id: string; note: string; total: number }[] = [];
  const log: string[] = [`V1:${v1.total}`];
  const remaining = [...candidates];
  // 【第二步】每一輪試所有剩下的候選,挑最好的那一個
  for (;;) {
    let best: { c: Candidate; total: number } | null = null;
    for (const c of remaining) {
      const ev = await score(base, [...current, ...c.ops]);
      if (!ev) {
        log.push(`  ${c.id}:第 1 層錯誤或路徑衝突,略過`);
        continue;
      }
      // 相對 V1 不得出現新的不合格
      const newFail = ev.findings.some((f) => f.verdict === 'fail' && !failedV1.has(`${f.item}|${f.ref}`));
      log.push(`  ${c.id}:${ev.total}${newFail ? '(有新的不合格,略過)' : ''}`);
      if (newFail) continue;
      // 只接受有提升的;同分時取清單中較前面的(確定性)
      if (ev.total > currentTotal && (!best || ev.total > best.total)) best = { c, total: ev.total };
    }
    if (!best) break;
    // 【第三步】採用這一輪最好的改法
    current = [...current, ...best.c.ops];
    currentTotal = best.total;
    chosen.push({ id: best.c.id, note: best.c.note, total: best.total });
    remaining.splice(remaining.indexOf(best.c), 1);
    log.push(`→ 採用 ${best.c.id},總分 ${best.total}`);
  }
  // 【第四步】寫成範例 10
  const steps = chosen.map((c, i) => `${i + 1}. ${c.note}(${c.total})`).join(' ');
  const targets = [...new Set(v1.findings.filter((f) => f.verdict === 'fail').map((f) => f.item))];
  const kase = {
    id: '10',
    title: '貪婪法組合改法',
    problem: `範例首頁原樣(總分 ${v1.total}):同時有同型連續、末列落單、疊字標題過長、輪播留白、欄高失衡、觸控目標太小等問題。`,
    fixNote: `由 greedy.ts 從 ${candidates.length} 個候選改法中依序選出 ${chosen.length} 個:${steps}。沒選上的候選不是不合法,就是會產生新的不合格,或沒有提升總分。`,
    targets: targets.filter((t) => chosen.length > 0 && t !== '欄高' && t !== '欄底對齊'),
    shotWidth: 1280,
    v1: [],
    fix: current,
  };
  writeFileSync(join(HERE, 'cases', '10-greedy.json'), JSON.stringify(kase, null, 2) + '\n');
  writeFileSync(join(HERE, 'GREEDY.md'), `# 貪婪法紀錄\n\n> 由 \`npm run poc:greedy\` 產生。\n\n\`\`\`\n${log.join('\n')}\n\`\`\`\n\n採用:${steps || '無'}\n`);
  console.log(log.join('\n'));
}

await main();
